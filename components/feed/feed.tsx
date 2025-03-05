// src/components/feed/Feed.tsx
import {useEffect, useReducer, useState} from 'react'
import {toast} from 'sonner'
import {vg} from '@/lib/api'
import {useUISettingsStore, useUIStore} from '@/lib/states'
import {WorkerStore} from '@/lib/workers'
import {FeedProps, FeedState, FeedViewType} from './types/feed'
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
    | { type: 'SET_ERROR'; error: Error | null };

function feedReducer(state: FeedState, action: FeedAction): FeedState {
    switch (action.type) {
        case 'LOADING_START':
            return {...state, isLoading: true}
        case 'LOADING_END':
            return {...state, isLoading: false}
        case 'SET_POSTS':
            return {
                ...state,
                posts: action.posts,
                hasMore: action.hasMore,
                currentPage: 2, // Reset to page 2 for next fetch
                isLoading: false
            }
        case 'APPEND_POSTS':
            return {
                ...state,
                posts: [...state.posts, ...action.posts],
                hasMore: action.hasMore,
                currentPage: state.currentPage + 1,
                isLoading: false
            }
        case 'REMOVE_POST':
            return {
                ...state,
                posts: state.posts.filter(post => post.id !== action.postId)
            }
        case 'SET_PAGE':
            return {...state, currentPage: action.page}
        case 'SET_ERROR':
            return {...state, error: action.error, isLoading: false}
        default:
            return state
    }
}

export default function Feed({packID = '00000000-0000-0000-0000-000000000000'}: FeedProps) {
    const {maintenance} = useUIStore()
    const {enqueue} = WorkerStore()
    const feedView = useUISettingsStore(state => state.feedView)

    const [isViewChanging, setIsViewChanging] = useState(false)
    const [state, dispatch] = useReducer(feedReducer, {
        posts: [],
        isLoading: true,
        hasMore: false,
        currentPage: 1,
        error: null
    })

    // Initialize feed on mount and when packID changes
    useEffect(() => {
        dispatch({type: 'LOADING_START'})
        dispatch({type: 'SET_POSTS', posts: [], hasMore: false})
        dispatch({type: 'SET_PAGE', page: 1})
        fetchPosts('initial-load')

        return () => {
            // Clean up logic if needed
        }
    }, [packID])

    // Set up auto-refresh
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (state.posts.length > 0) {
                fetchPosts('auto-refresh', true)
            }
        }, 60000) // Refresh every minute

        return () => clearInterval(refreshInterval)
    }, [])

    // Fetch posts from the API
    const fetchPosts = async (source = 'manual', checkForNew = false) => {
        if (!checkForNew) {
            dispatch({type: 'LOADING_START'})
        }

        const page = checkForNew ? 1 : state.currentPage

        enqueue(`howl-dl-${packID}`, async (cache) => {
            // Try to use cached data for initial loads
            const cached = cache.get()
            if (cached && source === 'initial-load' && page === 1) {
                // @ts-ignore
                dispatch({type: 'SET_POSTS', posts: cached, hasMore: true})
            }

            try {
                const {data, error} = await vg.feed({id: packID})
                    .get({query: {page}})

                if (error) {
                    toast.error(error.value
                        ? `${error.status}: ${error.value.summary}`
                        : 'Something went wrong loading the feed'
                    )

                    dispatch({
                        type: 'SET_ERROR',
                        error: new Error(error.status || 'Failed to load feed')
                    })
                    return
                }

                if (checkForNew) {
                    // Check if there are new posts
                    if (data.data.length === 0) {
                        dispatch({type: 'SET_POSTS', posts: [], hasMore: false})
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
                                    dispatch({type: 'SET_POSTS', posts: data.data, hasMore: data.has_more})
                                    cache.replace(data.data)
                                }
                            }
                        })
                    }
                } else {
                    // Normal post loading (initial or append)
                    if (page === 1) {
                        dispatch({type: 'SET_POSTS', posts: data.data, hasMore: data.has_more})
                        cache.replace(data.data)
                    } else {
                        dispatch({type: 'APPEND_POSTS', posts: data.data, hasMore: data.has_more})
                        cache.replace([...state.posts, ...data.data])
                    }
                }
            } catch (err) {
                console.error('Error fetching posts:', err)
                toast.error('Failed to load posts')
                dispatch({
                    type: 'SET_ERROR',
                    error: err instanceof Error ? err : new Error('Unknown error')
                })
            } finally {
                dispatch({type: 'LOADING_END'})
            }
        })
    }

    // Handle post deletion
    const handleDeletePost = (postId: string) => {
        dispatch({type: 'REMOVE_POST', postId})
    }

    // Render based on application state
    if (maintenance) {
        return <FeedMaintenance message={maintenance}/>
    }

    if (state.error) {
        return <FeedError error={state.error}/>
    }

    return (
        <div className="relative">
            {/* Feed header with controls */}
            <FeedHeader
                onViewChange={() => setIsViewChanging(true)}
                postsCount={state.posts.length}
                hasMore={state.hasMore}
            />

            {/* View switching modal */}
            {isViewChanging && (
                <FeedViewControls
                    onClose={() => setIsViewChanging(false)}
                    currentView={feedView as FeedViewType}
                    onViewChange={(view) => {
                        useUISettingsStore.getState().setOptions({feedView: view})
                    }}
                />
            )}

            {/* Main content area */}
            {state.isLoading && state.posts.length === 0 ? (
                <FeedLoading isMasonry message="Speeding through the howls..."/>
            ) : state.posts.length === 0 ? (
                <FeedEmpty message="Oddly enough, there's nothing to show you here."/>
            ) : (
                <FeedList
                    posts={state.posts}
                    isLoading={state.isLoading}
                    hasMore={state.hasMore}
                    onLoadMore={() => fetchPosts('infinite-scroll')}
                    onPostDelete={handleDeletePost}
                    viewType={feedView as FeedViewType}
                />
            )}
        </div>
    )
}