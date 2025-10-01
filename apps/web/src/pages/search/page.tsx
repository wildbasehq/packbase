/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Activity, useEffect, useState} from 'react'
import {motion} from 'motion/react'
import {AlertCircle, Clock, Filter, Loader2, RefreshCw, Search as SearchIcon, X} from 'lucide-react'
import {useSearch, useUserAccountStore, vg} from '@/lib'
import {useDebounce} from 'use-debounce'
import {RawSearchApiResponse, SearchApiResponse, SearchResult} from './types'
import {PackCard, PostCard, ProfileCard} from '@/components/search'
import {Heading, Text} from '@/components/shared/text.tsx'
import {Alert, AlertDescription, AlertTitle, ExpandableTabs} from '@/src/components'
import {MagnifyingGlassCircleIcon, RectangleStackIcon, UserGroupIcon, UsersIcon} from '@heroicons/react/20/solid'
import {SearchBox} from '@/components/shared/search-box.tsx'
import {Button} from '@/components/shared'
import useWindowSize from '@/lib/hooks/use-window-size.ts'

// Helper function to normalize search data based on response format
const normalizeSearchData = (
    data: RawSearchApiResponse | undefined,
    activeCategory: string
): { profiles: SearchResult[]; packs: SearchResult[]; posts: SearchResult[] } => {
    const emptyResult = {profiles: [], packs: [], posts: []}

    if (!data?.data) {
        return emptyResult
    }

    // Single table case - data is an array of results
    const isSingleTableResponse = activeCategory !== 'Everything' && Array.isArray(data.data)
    if (isSingleTableResponse) {
        const tableKey = activeCategory.toLowerCase() as 'profiles' | 'packs' | 'posts'
        return {...emptyResult, [tableKey]: data.data}
    }

    // Multiple tables case - data is an object with table arrays
    const isMultiTableResponse = typeof data.data === 'object' && !Array.isArray(data.data)
    if (isMultiTableResponse) {
        const tableData = data.data as {
            profiles?: SearchResult[]
            packs?: SearchResult[]
            posts?: SearchResult[]
        }
        return {
            profiles: tableData.profiles || [],
            packs: tableData.packs || [],
            posts: tableData.posts || [],
        }
    }

    return emptyResult
}

// Helper function to determine result type based on category and result properties
const determineResultType = (result: SearchResult, activeCategory: string): 'profile' | 'pack' | 'post' => {
    // Category-specific tabs have explicit types
    const categoryTypeMap: Record<string, 'profile' | 'pack' | 'post'> = {
        Profiles: 'profile',
        Packs: 'pack',
        Posts: 'post',
    }

    if (categoryTypeMap[activeCategory]) {
        return categoryTypeMap[activeCategory]
    }

    // For 'Everything' category, infer type from result properties
    const hasMarkdownContent = result.content_type === 'markdown' && result.body
    const hasUserAndBody = result.user && result.body
    const hasBodyWithoutUser = result.body && !result.user

    if (hasMarkdownContent || hasUserAndBody) return 'post'
    if (hasBodyWithoutUser) return 'profile'

    return 'pack' // Default fallback
}

// Helper function to check if results are empty
const hasNoResults = (data: SearchApiResponse['data']): boolean => {
    const hasProfiles = data?.profiles && data.profiles.length > 0
    const hasPacks = data?.packs && data.packs.length > 0
    const hasPosts = data?.posts && data.posts.length > 0

    return !hasProfiles && !hasPacks && !hasPosts
}

// Helper function to get loading message
const getLoadingMessage = (query: string): string => {
    return query?.startsWith('[') ? 'Hold on while whskrd starts...' : 'Hold on...'
}

// Helper function to get result count display text
const getResultCountText = (
    filteredCount: number,
    totalCount: number,
    isLoading: boolean,
    query: string,
    activeCategory: string
): string => {
    if (filteredCount > 0) {
        const count = totalCount || filteredCount
        const resultWord = count === 1 ? 'result' : 'results'
        const categoryText = activeCategory === 'Everything' ? '' : ` in ${activeCategory}`
        return `Found ${count} ${resultWord}${categoryText}`
    }

    if (!isLoading) {
        return `No results found for "${query}"`
    }

    return getLoadingMessage(query)
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
    const {query, setQuery} = useSearch()
    const {user} = useUserAccountStore()

    const [results, setResults] = useState<SearchApiResponse>({
        data: {profiles: [], packs: [], posts: []},
        count: 0,
        query: '',
    })
    const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isTyping, setIsTyping] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [greeting, setGreeting] = useState<string>('')
    const [activeCategory, setActiveCategory] = useState('Everything')
    const {isMobile} = useWindowSize()

    // Debounce the search query with 3 seconds delay
    const [debouncedQuery] = useDebounce<string>(query, 500)

    // Get a random greeting on component mount
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * greetings.length)
        setGreeting(greetings[randomIndex].replace('{display_name}', user?.display_name || 'stranger'))
    }, [user?.displayName])

    // Set typing state when query changes
    useEffect(() => {
        if (query) {
            document.title = 'Packbase • Searching...'
            setIsTyping(true)
        }
    }, [query])

    // Fetch search results when debounced query changes
    useEffect(() => {
        const reportFetchError = (err: any) => {
            console.error('Error fetching search results:', err)
            setError('An error occurred while fetching search results. Check console for more info.')
        }

        const fetchResults = async () => {
            document.title = 'Packbase • Searching...'
            setIsTyping(false)

            if (!debouncedQuery || debouncedQuery.trim() === '') {
                setResults({
                    data: {profiles: [], packs: [], posts: []},
                    count: 0,
                    query: '',
                })
                setFilteredResults([])
                setIsLoading(false)
                document.title = `Packbase • Search`
                return
            }

            try {
                setIsLoading(true)
                setError(null)

                const searchResults: { data?: RawSearchApiResponse; error?: string } = await vg.search.get({
                    query: {
                        q: debouncedQuery,
                        ...(activeCategory !== 'Everything' && {
                            allowedTables: [activeCategory.toLowerCase() as 'profiles' | 'packs' | 'posts'],
                        }),
                    },
                })
                if (searchResults.error) {
                    reportFetchError(searchResults.error)
                }

                document.title = `Packbase • ${activeCategory}`
                // Handle the case where there's only one allowed table and data is an array
                const normalizedData = normalizeSearchData(searchResults.data, activeCategory)

                setResults({
                    data: normalizedData,
                    count: searchResults.data?.count || 0,
                    query: debouncedQuery,
                })
            } catch (err) {
                reportFetchError(err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery, activeCategory])

    // Filter results based on active category
    useEffect(() => {
        switch (activeCategory) {
            case 'Everything': // Combine all result types
                const allResults = [...(results.data?.profiles || []), ...(results.data?.packs || []), ...(results.data?.posts || [])]
                setFilteredResults(allResults)
                break
            case 'Profiles':
                setFilteredResults(results.data?.profiles || [])
                break
            case 'Packs':
                setFilteredResults(results.data?.packs || [])
                break
            case 'Posts':
                setFilteredResults(results.data?.posts || [])
                break
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
                    <Activity mode={isMobile ? 'hidden' : 'visible'}>
                        <SearchBox/>
                    </Activity>

                    {/* Active filters/info display */}
                    <Activity mode={query ? 'visible' : 'hidden'}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    {getResultCountText(filteredResults.length, results.count, isLoading, query, activeCategory)}
                                </div>

                                {/* Clear search button */}
                                <Activity mode={query ? 'visible' : 'hidden'}>
                                    <button
                                        onClick={handleClearSearch}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-foreground/70 hover:text-foreground rounded hover:bg-accent/50 transition-colors"
                                    >
                                        <X className="h-3 w-3"/>
                                        <span>Clear</span>
                                    </button>
                                </Activity>
                            </div>

                            {/* Using whskrd warning */}
                            <Activity mode={query?.startsWith('[') ? 'visible' : 'hidden'}>
                                <Alert variant="warning">
                                    <AlertTitle>whskrd is experimental</AlertTitle>
                                    <AlertDescription>
                                        <Text>
                                            whskrd is an in-house scripting language which enables powerful and flexible
                                            search queries,
                                            soon to be powering feeds. It's currently in an experimental phase and may
                                            not work as expected.
                                        </Text>
                                    </AlertDescription>
                                </Alert>
                            </Activity>
                        </div>
                    </Activity>
                </div>
            </div>

            {/* Category tabs */}
            <div className="max-w-md w-fit mx-auto px-4 mt-2">
                <ExpandableTabs
                    tabs={[
                        {
                            title: 'Everything',
                            icon: MagnifyingGlassCircleIcon,
                        },

                        {
                            title: 'Profiles',
                            icon: UsersIcon,
                        },

                        {
                            title: 'Packs',
                            icon: UserGroupIcon,
                        },
                        {
                            title: 'Posts',
                            icon: RectangleStackIcon,
                        },
                    ]}
                    onChange={index => {
                        setActiveCategory(['Everything', 'Profiles', 'Packs', 'Posts'][index])
                    }}
                    activeTab={['Everything', 'Profiles', 'Packs', 'Posts'].indexOf(activeCategory)}
                />
            </div>

            {/* Results area */}
            <div className="flex-grow p-4 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    <Activity mode={isLoading || isTyping ? 'visible' : 'hidden'}>
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="relative">
                                <Loader2 className="h-10 w-10 text-primary animate-spin"/>
                                <div
                                    className="absolute inset-0 h-10 w-10 animate-ping rounded-full border border-primary/20"/>
                            </div>
                            <p className="mt-4 text-muted-foreground">
                                {isTyping ? 'Waiting for you to finish typing...' : 'Searching the universe...'}
                            </p>
                        </div>
                    </Activity>
                    <Activity mode={error ? 'visible' : 'hidden'}>
                        <div className="bg-destructive/10 rounded-lg p-4 flex items-start my-4">
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 mr-3 flex-shrink-0"/>
                            <div>
                                <h3 className="font-medium text-destructive">Error</h3>
                                <p className="text-destructive/90 text-sm">{error}</p>
                                <button
                                    onClick={() => setQuery(query)}
                                    className="mt-2 inline-flex items-center text-xs text-destructive/80 hover:text-destructive font-medium"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1"/> Try again
                                </button>
                            </div>
                        </div>
                    </Activity>
                    <Activity mode={query ? 'hidden' : 'visible'}>
                        <div className="py-16 flex flex-col items-center text-center">
                            <div className="bg-accent/50 p-6 rounded-full mb-4">
                                <SearchIcon className="h-8 w-8 text-muted-foreground"/>
                            </div>
                            <h2 className="text-xl font-medium mb-2">Search for anything</h2>
                            <p className="text-muted-foreground max-w-md">
                                Get typin', we'll handle the rest. Packs, users, howls, whatever Packbase has info on,
                                we got you~
                            </p>
                        </div>
                    </Activity>
                    <Activity mode={filteredResults.length === 0 && hasNoResults(results.data) ? 'visible' : 'hidden'}>
                        <div className="py-16 flex flex-col items-center text-center">
                            <div className="bg-accent/50 p-6 rounded-full mb-4">
                                <SearchIcon className="h-8 w-8 text-muted-foreground"/>
                            </div>
                            <Heading size="xl" className="mb-2">
                                This ain't on Packbase
                            </Heading>
                            <Text alt className="max-w-md">
                                Woah, we couldn't find anything for "{query}". Try searching for something else?
                            </Text>
                            <Activity mode={activeCategory === 'Everything' ? 'hidden' : 'visible'}>
                                <Button outline onClick={() => setActiveCategory('Everything')}>
                                    <Filter data-slot="icon" className="inline-flex h-4 w-4"/>
                                    <span>Clear filters</span>
                                </Button>
                            </Activity>
                        </div>
                    </Activity>
                    <Activity mode={filteredResults.length > 0 ? 'visible' : 'hidden'}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredResults?.map((result, index) => {
                                const resultType = determineResultType(result, activeCategory)

                                // Render the appropriate component based on result type
                                switch (resultType) {
                                    case 'profile':
                                        // @ts-ignore
                                        return <ProfileCard key={result.id} profile={result}/>
                                    case 'pack':
                                        return <PackCard key={result.id} pack={result}/>
                                    case 'post':
                                        return <PostCard key={result.id} post={result}/>
                                    default:
                                        // Fallback to generic card if type can't be determined
                                        // noinspection MagicNumberJS
                                        return (
                                            <motion.div
                                                key={result.id}
                                                initial={{opacity: 0, y: 10}}
                                                animate={{opacity: 1, y: 0}}
                                                transition={{duration: 0.2, delay: index * 0.03}}
                                                className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 hover:border-border/80 group"
                                            >
                                                <div className="block h-full">
                                                    <div className="p-5">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <Activity mode={result.category ? 'visible' : 'hidden'}>
                                                                <span
                                                                    className="text-xs px-2.5 py-1 rounded-full tracking-wide font-medium ml-2 flex-shrink-0 bg-accent text-accent-foreground">
                                                                    {result.category}
                                                                </span>
                                                            </Activity>
                                                        </div>
                                                        <p className="text-muted-foreground mb-3 line-clamp-2">{result.description}</p>
                                                        <Activity mode={result.timestamp ? 'visible' : 'hidden'}>
                                                            <div
                                                                className="flex items-center text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3 mr-1"/>
                                                                <span>{result.timestamp}</span>
                                                            </div>
                                                        </Activity>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                }
                            })}
                        </div>
                    </Activity>
                </div>
            </div>
        </div>
    )
}
