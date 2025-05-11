/**
 * Feed component for displaying posts
 *
 * Fetches and displays posts for a given packID with support for:
 * - Initial loading with caching
 * - Infinite scrolling
 * - Auto-refresh for new posts
 * - Error handling and retry logic
 */
import { useEffect, useReducer, useState, useRef } from 'react'
import { toast } from 'sonner'
import { vg } from '@/lib/api'
import { useUISettingsStore, useUIStore, useUserAccountStore } from '@/lib/state'
import { WorkerStore } from '@/lib/workers'
import { FeedProps, FeedState, FeedViewType } from './types/feed'
import FeedHeader from './feed-header'
import FeedViewControls from './feed-view-controls'
import FeedList from './feed-list'
import FeedLoading from './feed-loading'
import FeedEmpty from './feed-empty'
import FeedMaintenance from './feed-maintenance'
import FeedError from './feed-error'

// Define reducer for feed state management
type FeedAction =
    | { type: 'LOADING_START' }
    | { type: 'LOADING_END' }
    | { type: 'SET_POSTS'; posts: any[]; hasMore: boolean }
    | { type: 'APPEND_POSTS'; posts: any[]; hasMore: boolean }
    | { type: 'REMOVE_POST'; postId: string }
    | { type: 'SET_PAGE'; page: number }
    | { type: 'SET_ERROR'; error: Error | null }

/**
 * Reducer for managing feed state
 * Handles loading state, posts data, pagination, and errors
 */
function feedReducer(state: FeedState, action: FeedAction): FeedState {
    switch (action.type) {
        case 'LOADING_START':
            return { ...state, isLoading: true }
        case 'LOADING_END':
            return { ...state, isLoading: false }
        case 'SET_POSTS':
            if (!action.posts || !Array.isArray(action.posts)) {
                return {
                    ...state,
                    isLoading: false,
                    error: new Error('Invalid posts data'),
                }
            }

            // Create completely new state object to ensure React detects changes
            return {
                posts: [...action.posts],
                hasMore: action.hasMore,
                currentPage: 2, // Reset to page 2 for next fetch
                isLoading: false,
                error: null,
            }
        case 'APPEND_POSTS':
            // Validate posts before appending
            if (!action.posts || !Array.isArray(action.posts)) {
                return state
            }

            return {
                ...state,
                posts: [...state.posts, ...action.posts],
                hasMore: action.hasMore,
                currentPage: state.currentPage + 1,
                isLoading: false,
            }
        case 'REMOVE_POST':
            return {
                ...state,
                posts: state.posts.filter(post => post.id !== action.postId),
            }
        case 'SET_PAGE':
            return { ...state, currentPage: action.page }
        case 'SET_ERROR':
            return { ...state, error: action.error, isLoading: false }
        default:
            return state
    }
}

/**
 * Feed component displays posts for a given pack
 *
 * @param {string} packID - ID of the pack to fetch posts for
 */
export default function Feed({ packID = '00000000-0000-0000-0000-000000000000' }: FeedProps) {
    const { maintenance } = useUIStore()
    const { enqueue } = WorkerStore()
    const feedView = useUISettingsStore(state => state.feedView)
    const user = useUserAccountStore(state => state.user)

    // Refs to prevent duplicate API calls and track component lifecycle
    const isMountedRef = useRef(false)
    const fetchCompletedRef = useRef(false)
    const prevPackIDRef = useRef(packID)

    const [isViewChanging, setIsViewChanging] = useState(false)
    const [state, dispatch] = useReducer(feedReducer, {
        posts: [],
        isLoading: true,
        hasMore: false,
        currentPage: 1,
        error: null,
    })

    // Initialize feed on mount and when packID changes
    useEffect(() => {
        // Prevent double execution in React StrictMode
        if (isMountedRef.current && packID === prevPackIDRef.current) {
            return
        }

        // Mark as mounted and store current packID
        isMountedRef.current = true
        prevPackIDRef.current = packID
        fetchCompletedRef.current = false

        // Reset to initial state
        dispatch({ type: 'LOADING_START' })
        dispatch({ type: 'SET_PAGE', page: 1 })

        // Fetch data immediately
        fetchInitialPosts()

        return () => {
            // Cleanup logic if needed
        }
    }, [packID])

    /**
     * Fetches initial posts for the feed
     * Handles retries for auth errors and caches successful responses
     */
    const fetchInitialPosts = async () => {
        // Prevent duplicate fetches in React StrictMode or remounts
        if (fetchCompletedRef.current) {
            return
        }

        try {
            // Try direct API call with retry logic
            let data, error
            let retryCount = 0
            const maxRetries = 1

            while (retryCount <= maxRetries) {
                try {
                    const response = await vg.feed({ id: packID }).get({ query: { page: 1 } })
                    data = response.data
                    error = response.error

                    // If we get an unauthorized error, retry
                    if (error && (error.status === 401 || error.status === 403)) {
                        retryCount++
                        // Short delay before retry
                        await new Promise(resolve => setTimeout(resolve, 500))
                        continue
                    }

                    // If no auth error or we have data, break out of retry loop
                    break
                } catch (requestErr) {
                    retryCount++
                    if (retryCount <= maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 500))
                        continue
                    }
                    throw requestErr
                }
            }

            if (error) {
                // Only show the error toast if we've exhausted retries or it's not an auth error
                if (retryCount > maxRetries || (error.status !== 401 && error.status !== 403)) {
                    toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong loading the feed')
                    dispatch({
                        type: 'SET_ERROR',
                        error: new Error(error.status || 'Failed to load feed'),
                    })
                }
                dispatch({ type: 'LOADING_END' })
                fetchCompletedRef.current = true
                return
            }

            if (!data || !data.data) {
                dispatch({ type: 'LOADING_END' })
                fetchCompletedRef.current = true
                return
            }

            // Process successful API response
            if (data.data.length > 0) {
                // Store in cache using enqueue
                try {
                    enqueue(`howl-dl-${packID}`, async cache => {
                        cache.replace(data.data)
                    })
                } catch (cacheErr) {
                    // Continue even if caching fails
                }

                // Create a completely new array to ensure React state updates properly
                const posts = [...data.data]

                // Update state with posts
                dispatch({
                    type: 'SET_POSTS',
                    posts,
                    hasMore: data.has_more,
                })
            } else {
                dispatch({ type: 'LOADING_END' })
            }

            // Mark fetch as completed successfully
            fetchCompletedRef.current = true
        } catch (err) {
            toast.error('Failed to load posts')
            dispatch({
                type: 'SET_ERROR',
                error: err instanceof Error ? err : new Error('Unknown error'),
            })
            dispatch({ type: 'LOADING_END' })

            // Mark fetch as completed even in error case
            fetchCompletedRef.current = true
        }
    }

    // Set up auto-refresh
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (state.posts.length > 0) {
                fetchPosts('auto-refresh', true)
            }
        }, 60000) // Refresh every minute

        return () => {
            clearInterval(refreshInterval)
        }
    }, [])

    /**
     * Fetches posts from the API with pagination support
     * Used for infinite scrolling and auto-refresh
     *
     * @param source - Source of the fetch request ('manual', 'infinite-scroll', 'auto-refresh')
     * @param checkForNew - Whether to check for new posts (resets to page 1)
     */
    const fetchPosts = async (source = 'manual', checkForNew = false) => {
        const page = checkForNew ? 1 : state.currentPage

        try {
            const { data, error } = await vg.feed({ id: packID }).get({ query: { page } })

            if (error) {
                toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong loading the feed')
                return
            }

            if (!data?.data) {
                return
            }

            // For checking new posts, compare with existing posts
            if (checkForNew) {
                if (data.data.length === 0) {
                    return
                }

                const newPostIds = data.data.map((post: any) => post.id)
                const existingPostIds = state.posts.map(post => post.id)
                const hasNewPosts = newPostIds.some(id => !existingPostIds.includes(id))

                if (hasNewPosts) {
                    toast.message('New posts available', {
                        action: {
                            label: 'Refresh',
                            onClick: () => {
                                dispatch({ type: 'SET_POSTS', posts: data.data, hasMore: data.has_more })

                                // Update cache
                                try {
                                    enqueue(`howl-dl-${packID}`, async cache => {
                                        cache.replace(data.data)
                                    })
                                } catch (err) {
                                    // Continue even if cache fails
                                }
                            },
                        },
                    })
                }
            } else {
                // Normal post loading (initial or infinite scroll)
                if (page === 1) {
                    dispatch({ type: 'SET_POSTS', posts: data.data, hasMore: data.has_more })
                } else {
                    dispatch({ type: 'APPEND_POSTS', posts: data.data, hasMore: data.has_more })
                }

                // Update cache
                try {
                    enqueue(`howl-dl-${packID}-${source}`, async cache => {
                        if (page === 1) {
                            cache.replace(data.data)
                        } else {
                            cache.replace([...state.posts, ...data.data])
                        }
                    })
                } catch (err) {
                    // Continue even if cache fails
                }
            }
        } catch (err) {
            toast.error('Failed to load posts')
        }
    }

    // Handle post deletion
    const handleDeletePost = (postId: string) => {
        dispatch({ type: 'REMOVE_POST', postId })
    }

    // Monitor state changes for debugging in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            // Log state changes in development only
        }
    }, [state])

    // Handle maintenance mode
    if (maintenance) {
        return <FeedMaintenance message={maintenance} />
    }

    // Handle error state
    if (state.error) {
        return <FeedError error={state.error} />
    }

    // Determine what to render based on component state
    const isLoading = state.isLoading
    const hasEmptyPosts = !state.isLoading && (!state.posts || state.posts.length === 0)
    const hasPosts = state.posts && state.posts.length > 0

    // Choose what to render based on state
    let content
    if (isLoading && !hasPosts) {
        content = <FeedLoading isMasonry message={<>Speeding through the howls...</>} />
    } else if (hasEmptyPosts) {
        content = <FeedEmpty message="Oddly enough, there's nothing to show you here." />
    } else {
        content = (
            <FeedList
                posts={state.posts || []}
                isLoading={state.isLoading}
                hasMore={state.hasMore}
                onLoadMore={() => fetchPosts('infinite-scroll')}
                onPostDelete={handleDeletePost}
                viewType={feedView as FeedViewType}
            />
        )
    }

    return (
        <div className="relative">
            {/* Feed header with controls */}
            <FeedHeader onViewChange={() => setIsViewChanging(true)} postsCount={state.posts?.length || 0} hasMore={state.hasMore} />

            {/* View switching modal */}
            {isViewChanging && (
                <FeedViewControls
                    onClose={() => setIsViewChanging(false)}
                    currentView={feedView as FeedViewType}
                    onViewChange={view => {
                        useUISettingsStore.getState().setOptions({ feedView: view })
                    }}
                />
            )}

            {/* Main content area */}
            {content}
        </div>
    )
}
