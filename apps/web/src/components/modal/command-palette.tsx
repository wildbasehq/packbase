import {useEffect, useMemo, useState} from "react";
import {
    Combobox,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
    Dialog,
    DialogBackdrop,
    DialogPanel
} from "@headlessui/react";
import {
    ExclamationTriangleIcon,
    LifebuoyIcon,
    MagnifyingGlassIcon,
    RectangleStackIcon,
    UserCircleIcon,
    UserGroupIcon
} from "@heroicons/react/20/solid";
import {vg} from "@/lib";
import type {RawSearchApiResponse, SearchResult} from "@/pages/search/types";
import PackHeader from "@/components/shared/pack/header";
import {UserHoverCard} from "@/src/components";
import UserInfoCol from "@/components/shared/user/info-col.tsx";
import Markdown from "@/components/shared/markdown.tsx";
import PackbaseInstance from "@/lib/workers/global-event-emit.ts";

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

// Custom hook for debounced value
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

// Helper to normalize API response
const normalizeSearchData = (data: RawSearchApiResponse | undefined) => {
    if (!data?.data) return {profiles: [], packs: [], posts: []}

    if (Array.isArray(data.data)) {
        return {profiles: data.data, packs: [], posts: []}
    }

    return {
        profiles: data.data.profiles || [],
        packs: data.data.packs || [],
        posts: data.data.posts || [],
    }
}

export default function CommandPalette() {
    const [open, setOpen] = useState(false)
    const [rawQuery, setRawQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [apiResults, setApiResults] = useState<{
        profiles: SearchResult[]
        packs: SearchResult[]
        posts: SearchResult[]
    }>({profiles: [], packs: [], posts: []})

    // Helper to determine item type
    const getItemType = (item: any): 'profile' | 'pack' | 'post' | null => {
        if (!item) return null
        if (item.body && item.user) return 'post'
        if (item.username || item.about) return 'profile'
        if (item.display_name && item.slug) return 'pack'
        return null
    }

    // Debounce the query to avoid excessive filtering
    const debouncedRawQuery = useDebouncedValue(rawQuery, 300)
    const query = debouncedRawQuery.toLowerCase().replace(/^[#@]/, '')

    // Fetch API results when debounced query changes
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedRawQuery || debouncedRawQuery.trim() === '' || debouncedRawQuery === '?') {
                setApiResults({profiles: [], packs: [], posts: []})
                setIsLoading(false)
                return
            }

            try {
                setIsLoading(true)

                // Determine allowed tables based on prefix
                let allowedTables: ('profiles' | 'packs' | 'posts')[] | undefined
                if (debouncedRawQuery.startsWith('@')) {
                    allowedTables = ['profiles']
                } else if (debouncedRawQuery.startsWith('#')) {
                    allowedTables = ['packs']
                }

                const searchResults = await vg.search.get({
                    query: {
                        q: query,
                        ...(allowedTables && {allowedTables}),
                    },
                })

                if (searchResults.error) {
                    console.error('Search error:', searchResults.error)
                    setApiResults({profiles: [], packs: [], posts: []})
                } else {
                    const normalizedData = normalizeSearchData(searchResults.data)
                    setApiResults(normalizedData)
                }
            } catch (err) {
                console.error('Error fetching search results:', err)
                setApiResults({profiles: [], packs: [], posts: []})
            } finally {
                setIsLoading(false)
            }
        }

        fetchResults()

        const cancelInstance = PackbaseInstance.on('search-open', () => {
            setOpen(true)
        })

        return () => {
            cancelInstance()
        }
    }, [debouncedRawQuery, query])

    // Memoized filtered results using fuzzy search on API data
    const filteredProfiles = useMemo(() => {
        if (debouncedRawQuery.startsWith('#')) return []
        if (query === '') return apiResults.profiles.slice(0, 5)

        return apiResults.profiles.slice(0, 5)
    }, [query, debouncedRawQuery, apiResults.profiles])

    const filteredPacks = useMemo(() => {
        if (debouncedRawQuery.startsWith('@')) return []
        if (query === '') return apiResults.packs.slice(0, 5)

        return apiResults.packs.slice(0, 5)
    }, [query, debouncedRawQuery, apiResults.packs])

    const filteredPosts = useMemo(() => {
        if (debouncedRawQuery.startsWith('#') || debouncedRawQuery.startsWith('@')) return []
        if (query === '') return apiResults.posts.slice(0, 3)

        return apiResults.posts.slice(0, 3)
    }, [query, debouncedRawQuery, apiResults.posts])

    // Keyboard shortcut handler for Ctrl/CMD + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(prev => !prev)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const hasResults = filteredProfiles.length > 0 || filteredPacks.length > 0 || filteredPosts.length > 0

    return (
        <Dialog
            className="relative z-10"
            open={open}
            onClose={() => {
                setOpen(false)
                setRawQuery('')
            }}
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/25 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                <DialogPanel
                    transition
                    className="mx-auto max-w-4xl transform overflow-hidden rounded-xl bg-card ring-1 shadow-2xl ring-default transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-snapper data-leave:duration-200 data-leave:ease-in"
                >
                    <Combobox
                        onChange={(item: any) => {
                            if (item) {
                                // Navigate based on item type
                                if (item.slug) {
                                    window.location.href = `/${item.slug}`
                                } else if (item.id) {
                                    window.location.href = `/post/${item.id}`
                                }
                            }
                        }}
                    >
                        {({activeOption}) => (
                            <>
                                <div className="grid grid-cols-1">
                                    <ComboboxInput
                                        autoFocus
                                        className="col-start-1 row-start-1 h-12 w-full pr-4 pl-11 text-base text-foreground outline-hidden placeholder:text-muted-foreground sm:text-sm"
                                        placeholder="Search..."
                                        onChange={(event) => setRawQuery(event.target.value)}
                                        onKeyDown={(event) => {
                                            // There's an actual solution to this, but this needs to release now.
                                            if (event.key === 'Escape') {
                                                setRawQuery('')
                                            }
                                        }}
                                        value={rawQuery}
                                    />
                                    <MagnifyingGlassIcon
                                        className="pointer-events-none col-start-1 row-start-1 ml-4 size-5 self-center text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                </div>

                                {(isLoading || hasResults || rawQuery === '?' || (query !== '' && !hasResults)) && (
                                    <ComboboxOptions
                                        as="div"
                                        static
                                        hold
                                        className="flex transform-gpu divide-x divide-gray-100"
                                    >
                                        <div className={classNames(
                                            'max-h-96 min-w-0 flex-auto scroll-py-4 overflow-y-auto px-6 py-4',
                                            activeOption && 'sm:h-96'
                                        )}>
                                            {isLoading && (
                                                <div className="px-6 py-14 text-center text-sm">
                                                    <MagnifyingGlassIcon
                                                        className="mx-auto size-6 text-muted-foreground animate-pulse"
                                                        aria-hidden="true"/>
                                                    <p className="mt-4 text-muted-foreground">Searching...</p>
                                                </div>
                                            )}

                                            {!isLoading && hasResults && (
                                                <div className="-mx-2 text-sm text-gray-700 space-y-4">
                                                    {filteredProfiles.length > 0 && (
                                                        <div>
                                                            <h2 className="mb-2 text-xs font-semibold text-foreground">Profiles</h2>
                                                            <div>
                                                                {filteredProfiles.map((profile) => (
                                                                    <ComboboxOption
                                                                        as="div"
                                                                        key={profile.id}
                                                                        value={profile}
                                                                        className="group flex cursor-default items-center rounded-md p-2 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                                                                    >
                                                                        {profile.images?.avatar ? (
                                                                            <img
                                                                                src={profile.images.avatar}
                                                                                alt=""
                                                                                className="size-6 flex-none rounded-full"
                                                                            />
                                                                        ) : (
                                                                            <UserCircleIcon
                                                                                className="size-6 flex-none text-muted-foreground group-data-focus:text-white"
                                                                                aria-hidden="true"
                                                                            />
                                                                        )}
                                                                        <div className="ml-3 flex-auto truncate">
                                                                            <div
                                                                                className="truncate">{profile.display_name}</div>
                                                                            {profile.description && (
                                                                                <div
                                                                                    className="text-xs text-muted-foreground group-data-focus:text-gray-200 truncate">
                                                                                    {profile.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </ComboboxOption>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {filteredPacks.length > 0 && (
                                                        <div>
                                                            <h2 className="mb-2 text-xs font-semibold text-foreground">Packs</h2>
                                                            <div>
                                                                {filteredPacks.map((pack) => (
                                                                    <ComboboxOption
                                                                        as="div"
                                                                        key={pack.id}
                                                                        value={pack}
                                                                        className="group flex cursor-default items-center rounded-md p-2 select-none data-focus:bg-indigo-600 data-focus:text-white"
                                                                    >
                                                                        {pack.images?.avatar ? (
                                                                            <img
                                                                                src={pack.images.avatar}
                                                                                alt=""
                                                                                className="size-6 flex-none rounded-full"
                                                                            />
                                                                        ) : (
                                                                            <UserGroupIcon
                                                                                className="size-6 flex-none text-muted-foreground group-data-focus:text-white"
                                                                                aria-hidden="true"
                                                                            />
                                                                        )}
                                                                        <div className="ml-3 flex-auto truncate">
                                                                            <div
                                                                                className="truncate">{pack.display_name}</div>
                                                                            {pack.description && (
                                                                                <div
                                                                                    className="text-xs text-muted-foreground group-data-focus:text-gray-200 truncate">
                                                                                    {pack.description}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </ComboboxOption>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {filteredPosts.length > 0 && (
                                                        <div>
                                                            <h2 className="mb-2 text-xs font-semibold text-foreground">Posts</h2>
                                                            <div>
                                                                {filteredPosts.map((post) => (
                                                                    <ComboboxOption
                                                                        as="div"
                                                                        key={post.id}
                                                                        value={post}
                                                                        className="group flex cursor-default items-center rounded-md p-2 select-none data-focus:bg-indigo-600 data-focus:text-white"
                                                                    >
                                                                        <RectangleStackIcon
                                                                            className="size-6 flex-none text-muted-foreground group-data-focus:text-white"
                                                                            aria-hidden="true"
                                                                        />
                                                                        <div className="ml-3 flex-auto truncate">
                                                                            {post.user && (
                                                                                <div
                                                                                    className="text-xs text-muted-foreground group-data-focus:text-gray-200">
                                                                                    {post.user.display_name}
                                                                                </div>
                                                                            )}
                                                                            <div className="truncate">
                                                                                {post.body?.substring(0, 60)}
                                                                                {post.body && post.body.length > 60 ? '...' : ''}
                                                                            </div>
                                                                        </div>
                                                                    </ComboboxOption>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {rawQuery === '?' && (
                                                <div className="px-6 py-14 text-center text-sm sm:px-14">
                                                    <LifebuoyIcon className="mx-auto size-6 text-muted-foreground"
                                                                  aria-hidden="true"/>
                                                    <p className="mt-4 font-semibold text-foreground">Help with
                                                        searching</p>
                                                    <p className="mt-2 text-muted-foreground">
                                                        Use this tool to quickly search for profiles, packs, and posts
                                                        across Packbase.
                                                        Type <kbd
                                                        className="px-1 py-0.5 text-xs border rounded">@</kbd> to search
                                                        profiles only,
                                                        or <kbd
                                                        className="px-1 py-0.5 text-xs border rounded">#</kbd> to search
                                                        packs only.
                                                    </p>
                                                </div>
                                            )}

                                            {!isLoading && query !== '' && rawQuery !== '?' && !hasResults && (
                                                <div className="px-6 py-14 text-center text-sm sm:px-14">
                                                    <ExclamationTriangleIcon className="mx-auto size-6 text-muted-foreground"
                                                                             aria-hidden="true"/>
                                                    <p className="mt-4 font-semibold text-foreground">No results found</p>
                                                    <p className="mt-2 text-muted-foreground">We couldn't find anything with
                                                        that term. Please try again.</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Preview */}
                                        {activeOption && (
                                            <div
                                                className="hidden h-96 w-1/2 flex-none flex-col divide-y divide-gray-100 overflow-y-auto sm:flex">
                                                {getItemType(activeOption) === 'profile' && (
                                                    <div className="p-6">
                                                        <UserHoverCard user={activeOption}/>
                                                    </div>
                                                )}
                                                {getItemType(activeOption) === 'pack' && (
                                                    <div className="p-6">
                                                        <PackHeader pack={activeOption}/>
                                                    </div>
                                                )}
                                                {getItemType(activeOption) === 'post' && (
                                                    <div className="p-6">
                                                        <UserInfoCol user={activeOption.user}/>
                                                        <div className="mt-4">
                                                            <Markdown>{activeOption.body}</Markdown>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ComboboxOptions>
                                )}

                                <div
                                    className="flex flex-wrap items-center bg-muted px-4 py-2.5 text-xs text-foreground">
                                    Type{' '}
                                    <kbd
                                        className={classNames(
                                            'mx-1 flex size-5 items-center justify-center rounded-sm border bg-white font-semibold sm:mx-2',
                                            rawQuery.startsWith('@') ? 'border-indigo-600 text-indigo-600' : 'border-gray-400 text-foreground',
                                        )}
                                    >
                                        @
                                    </kbd>{' '}
                                    <span className="sm:hidden">for profiles,</span>
                                    <span className="hidden sm:inline">to search profiles,</span>
                                    <kbd
                                        className={classNames(
                                            'mx-1 flex size-5 items-center justify-center rounded-sm border bg-white font-semibold sm:mx-2',
                                            rawQuery.startsWith('#') ? 'border-indigo-600 text-indigo-600' : 'border-gray-400 text-foreground',
                                        )}
                                    >
                                        #
                                    </kbd>{' '}
                                    for packs, and{' '}
                                    <kbd
                                        className={classNames(
                                            'mx-1 flex size-5 items-center justify-center rounded-sm border bg-white font-semibold sm:mx-2',
                                            rawQuery === '?' ? 'border-indigo-600 text-indigo-600' : 'border-gray-400 text-foreground',
                                        )}
                                    >
                                        ?
                                    </kbd>{' '}
                                    for help.
                                </div>
                            </>
                        )}
                    </Combobox>
                </DialogPanel>
            </div>
        </Dialog>
    )
}
