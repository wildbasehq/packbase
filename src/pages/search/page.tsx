import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Clock, Filter, Loader2, RefreshCw, Search as SearchIcon, X } from 'lucide-react'
import clsx from 'clsx'
import { useSearch, useUserAccountStore, vg } from '@/lib'
import { useDebounce } from 'use-debounce'

// Define the structure of search results
// This should be updated to match your actual API response structure
interface SearchResult {
    id: string
    title: string
    description: string
    url: string
    category?: string
    timestamp?: string
}

// Array of greeting messages to randomly display
const greetings = [
    'Back on the grind, {display_name}.',
    'Damn {display_name}, already bored?',
    'Welcome back, {display_name}!',
    'Glad to see you, {display_name}!',
    'Looking for something, {display_name}?',
    'Curiosity never killed the {display_name}',
    'Boundless knowledge at your disposal, {display_name}.',
    'Searching the universe, {display_name}?',
    'Detective {display_name} on the case!',
    "{display_name}'s hunt continues~",
    "Ever curious {display_name}, what's next?",
    'The search wizard {display_name} returns!',
    'Back in action, {display_name}!',
    'Ready for more, {display_name}?',
    "Let's find gold, {display_name}",
    'Digging deeper, {display_name}?',
    'The search saga continues, {display_name}',
    'Seeking knowledge, {display_name}?',
    'The inquisitive {display_name} returns!',
    "What's catching your eye today, {display_name}?",
    'On a quest for answers, {display_name}?',
    "{display_name}'s search journey begins anew",
    'Hunting for treasures, {display_name}?',
    'The world awaits your discovery, {display_name}',
    "{display_name}'s Back on the prowl~",
    'Let the search begin, {display_name}!',
]

export default function Search() {
    const { query, setQuery } = useSearch()
    const { user } = useUserAccountStore()

    const [results, setResults] = useState<SearchResult[]>([])
    const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isTyping, setIsTyping] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [greeting, setGreeting] = useState<string>('')
    const [activeCategory, setActiveCategory] = useState('All')

    // Debounce the search query with 3 seconds delay
    const [debouncedQuery] = useDebounce<string>(query, 3000)

    // Get a random greeting on component mount
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * greetings.length)
        setGreeting(greetings[randomIndex].replace('{display_name}', user?.display_name || 'stranger'))
    }, [user?.displayName])

    // Set typing state when query changes
    useEffect(() => {
        if (query) {
            setIsTyping(true)
        }
    }, [query])

    // Fetch search results when debounced query changes
    useEffect(() => {
        const fetchResults = async () => {
            setIsTyping(false)

            if (!debouncedQuery || debouncedQuery.trim() === '') {
                setResults([])
                setFilteredResults([])
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)
                setError(null)

                const searchResults = await vg.search.post({ query: debouncedQuery })
                if (searchResults.error) {
                    throw new Error(searchResults.error)
                }
                setResults(searchResults?.data || [])
            } catch (err) {
                console.error('Error fetching search results:', err)
                if (err.message?.includes('NOT_FOUND')) {
                    setError("VE28004:Korat: This instance of Voyage doesn't allow searching.")
                } else {
                    setError(err instanceof Error ? err.message : 'An error occurred while fetching search results.')
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery])

    // Filter results based on active category
    useEffect(() => {
        if (activeCategory === 'All') {
            setFilteredResults(results)
        } else {
            const filtered = results.filter(result => result.category === activeCategory)
            setFilteredResults(filtered)
        }
    }, [results, activeCategory])

    // Clear search and filters
    const handleClearSearch = () => {
        setQuery('')
    }

    return (
        <div className="flex flex-col h-full">
            {/* Search header */}
            <div className="sticky top-0 z-10 backdrop-blur-sm border-b pb-4">
                <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
                    <h1 className="text-2xl font-medium mb-4">{greeting}</h1>

                    {/* Active filters/info display */}
                    {query && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                {filteredResults.length > 0 ? (
                                    <span>
                                        Found {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
                                        {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
                                    </span>
                                ) : !isLoading ? (
                                    <span>No results found for "{query}"</span>
                                ) : null}
                            </div>

                            {/* Clear search button */}
                            {query && (
                                <button
                                    onClick={handleClearSearch}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-foreground/70 hover:text-foreground rounded hover:bg-accent/50 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                    <span>Clear</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Results area */}
            <div className="flex-grow p-4 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    {isLoading || isTyping ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border border-primary/20" />
                            </div>
                            <p className="mt-4 text-muted-foreground">
                                {isTyping ? 'Waiting for you to finish typing...' : 'Searching the universe...'}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="bg-destructive/10 rounded-lg p-4 flex items-start my-4">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0" />
                            <div>
                                <h3 className="font-medium text-destructive">Error</h3>
                                <p className="text-destructive/90 text-sm">{error}</p>
                                <button
                                    onClick={() => setQuery(query)}
                                    className="mt-2 inline-flex items-center text-xs text-destructive/80 hover:text-destructive font-medium"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" /> Try again
                                </button>
                            </div>
                        </div>
                    ) : !query ? (
                        <div className="py-16 flex flex-col items-center text-center">
                            <div className="bg-accent/50 p-6 rounded-full mb-4">
                                <SearchIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-medium mb-2">Search for anything</h2>
                            <p className="text-muted-foreground max-w-md">
                                Get typin', we'll handle the rest. Packs, users, howls, whatever Packbase has info on, we got you~
                            </p>
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="bg-card border border-border rounded-lg p-8 text-center my-6">
                            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium mb-2">No results found</h3>
                            <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                We couldn't find any matches for "{query}". Try using different keywords or check your spelling.
                            </p>
                            {activeCategory !== 'All' && (
                                <button
                                    onClick={() => setActiveCategory('All')}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span>Clear filters</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredResults.map((result, index) => (
                                <motion.div
                                    key={result.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.03 }}
                                    className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 hover:border-border/80 group"
                                >
                                    <a href={result.url} className="block h-full">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                                                    {result.title}
                                                </h2>
                                                {result.category && (
                                                    <span
                                                        className={clsx(
                                                            'text-xs px-2.5 py-1 rounded-full tracking-wide font-medium ml-2 flex-shrink-0',
                                                            result.category === 'Documentation' &&
                                                                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
                                                            result.category === 'Blog Post' &&
                                                                'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                                                            result.category === 'API' &&
                                                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                                                            result.category === 'Community' &&
                                                                'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
                                                            result.category === 'Tutorial' &&
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        )}
                                                    >
                                                        {result.category}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground mb-3 line-clamp-2">{result.description}</p>
                                            {result.timestamp && (
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    <span>{result.timestamp}</span>
                                                </div>
                                            )}
                                        </div>
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
