/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/feed.tsx
import { useEffect, useReducer, useRef } from 'react'
import { toast } from 'sonner'
import { vg } from '@/lib/api'
import { useUIStore } from '@/lib/state'
import { WorkerStore } from '@/lib/workers'
import { FeedProps, FeedState } from './types/feed'
import FeedList from './feed-list'
import FeedLoading from './feed-loading'
import FeedEmpty from './feed-empty'
import FeedMaintenance from './feed-maintenance'
import FeedError from './feed-error'
import FloatingComposeButton from './floating-compose-button'

// Define reducer for feed state management
type FeedAction =
    | { type: 'LOADING_START' }
    | { type: 'LOADING_END' }
    | { type: 'SET_POSTS'; posts: any[]; hasMore: boolean }
    | { type: 'APPEND_POSTS'; posts: any[]; hasMore: boolean }
    | { type: 'REMOVE_POST'; postId: string }
    | { type: 'SET_PAGE'; page: number }
    | { type: 'SET_ERROR'; error: Error | null }

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
            return {
                posts: [...action.posts],
                hasMore: action.hasMore,
                currentPage: 2,
                isLoading: false,
                error: null,
            }
        case 'APPEND_POSTS':
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

export default function Feed({ packID = '00000000-0000-0000-0000-000000000000', channelID, feedQueryOverride }: FeedProps) {
    const { maintenance } = useUIStore()
    const { enqueue } = WorkerStore()

    const isMountedRef = useRef(false)
    const fetchCompletedRef = useRef(false)
    const prevPackIDRef = useRef(packID)

    const [state, dispatch] = useReducer(feedReducer, {
        posts: [],
        isLoading: true,
        hasMore: false,
        currentPage: 1,
        error: null,
    })

    useEffect(() => {
        if (isMountedRef.current && packID === prevPackIDRef.current) {
            return
        }

        isMountedRef.current = true
        prevPackIDRef.current = packID
        fetchCompletedRef.current = false

        dispatch({ type: 'LOADING_START' })
        dispatch({ type: 'SET_PAGE', page: 1 })

        fetchInitialPosts()

        return () => {}
    }, [packID])

    const fetchInitialPosts = async () => {
        if (fetchCompletedRef.current) {
            return
        }

        try {
            let data, error
            let retryCount = 0
            const maxRetries = 1

            while (retryCount <= maxRetries) {
                try {
                    let response
                    if (channelID) {
                        response = await vg.search.get({
                            query: {
                                q: feedQueryOverride || '[Where posts:channel_id ("' + channelID + '")]',
                                allowedTables: ['posts'],
                            },
                        })
                    } else {
                        response = await vg.feed({ id: packID }).get({ query: { page: 1 } })
                    }

                    data = response.data
                    error = response.error

                    if (error && (error.status === 401 || error.status === 403)) {
                        retryCount++
                        await new Promise(resolve => setTimeout(resolve, 500))
                        continue
                    }

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

            if (data.data.length > 0) {
                try {
                    enqueue(`howl-dl-${packID}`, async cache => {
                        cache.replace(data.data)
                    })
                } catch (cacheErr) {}

                const posts = [...data.data]

                dispatch({
                    type: 'SET_POSTS',
                    posts,
                    hasMore: data.has_more,
                })
            } else {
                dispatch({ type: 'LOADING_END' })
            }

            fetchCompletedRef.current = true
        } catch (err) {
            toast.error('Failed to load posts')
            dispatch({
                type: 'SET_ERROR',
                error: err instanceof Error ? err : new Error('Unknown error'),
            })
            dispatch({ type: 'LOADING_END' })

            fetchCompletedRef.current = true
        }
    }

    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (state.posts.length > 0) {
                fetchPosts('auto-refresh', true)
            }
        }, 60000)

        return () => {
            clearInterval(refreshInterval)
        }
    }, [])

    const fetchPosts = async (source = 'manual', checkForNew = false) => {
        const page = checkForNew ? 1 : state.currentPage

        try {
            const { data, error } = channelID
                ? await vg.search.get({
                      query: {
                          q: '[Where Where posts:channel_id ("' + channelID + '")]',
                          allowedTables: ['posts'],
                      },
                  })
                : await vg.feed({ id: packID }).get({ query: { page } })

            if (error) {
                toast.error(error.value ? `${error.status}: ${error.value.summary}` : 'Something went wrong loading the feed')
                return
            }

            if (!data?.data) {
                return
            }

            if (checkForNew) {
                if (data.data.length === 0) {
                    return
                }

                const newPostIds = data.data.map((post: any) => post.id)
                const existingPostIds = state.posts.map(post => post.id)
                const hasNewPosts = newPostIds.some(id => !existingPostIds.includes(id))

                if (hasNewPosts) {
                    toast.message('New threads available', {
                        action: {
                            label: 'Refresh',
                            onClick: () => {
                                dispatch({ type: 'SET_POSTS', posts: data.data, hasMore: data.has_more })

                                try {
                                    enqueue(`howl-dl-${packID}`, async cache => {
                                        cache.replace(data.data)
                                    })
                                } catch (err) {}
                            },
                        },
                    })
                }
            } else {
                if (page === 1) {
                    dispatch({ type: 'SET_POSTS', posts: data.data, hasMore: data.has_more })
                } else {
                    dispatch({ type: 'APPEND_POSTS', posts: data.data, hasMore: data.has_more })
                }

                try {
                    enqueue(`howl-dl-${packID}-${source}`, async cache => {
                        if (page === 1) {
                            cache.replace(data.data)
                        } else {
                            cache.replace([...state.posts, ...data.data])
                        }
                    })
                } catch (err) {}
            }
        } catch (err) {
            toast.error('Failed to load posts')
        }
    }

    const handleDeletePost = (postId: string) => {
        dispatch({ type: 'REMOVE_POST', postId })
    }

    if (maintenance) {
        return <FeedMaintenance message={maintenance} />
    }

    if (state.error) {
        return <FeedError error={state.error} />
    }

    const isLoading = state.isLoading
    const hasEmptyPosts = !state.isLoading && (!state.posts || state.posts.length === 0)
    const hasPosts = state.posts && state.posts.length > 0

    let content
    if (isLoading && !hasPosts) {
        content = <FeedLoading isMasonry={false} message="Loading threads..." />
    } else if (hasEmptyPosts) {
        content = <FeedEmpty message="No threads yet. Be the first to start a conversation!" />
    } else {
        content = (
            <FeedList
                posts={state.posts || []}
                hasMore={state.hasMore}
                onLoadMore={() => fetchPosts('infinite-scroll')}
                onPostDelete={handleDeletePost}
            />
        )
    }

    return (
        <div className="relative pb-20">
            {/* Main content area */}
            {content}

            {/* Floating compose button */}
            <FloatingComposeButton />
        </div>
    )
}
