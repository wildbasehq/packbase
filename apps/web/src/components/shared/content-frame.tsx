/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, { createContext, ReactNode, useContext, useEffect, useState, useRef, useMemo } from 'react'
import { WorkerStore } from '@/lib/workers'
import { useSession } from '@clerk/clerk-react'
import { setToken } from '@/lib'

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_YAPOCK_URL

/**
 * Interface for ContentFrame props
 */
interface ContentFrameProps {
    /** Children components that will have access to the API response state */
    children: ReactNode
    /** Path for GET request */
    get?: string
    /** Path and data for POST request */
    post?: string
    /** Path and data for PUT request */
    put?: string
    /** Path for DELETE request */
    delete?: string
    /** Path and data for PATCH request */
    patch?: string
    /** Request body data for POST, PUT, and PATCH requests */
    data?: any
    /** Whether to cache the response in IndexedDB */
    cache?: boolean
    /** Cache TTL in seconds (default: 300) */
    cacheTTL?: number
    /** Whether to use stale-while-revalidate pattern */
    swr?: boolean
    /** Custom error handler function */
    onError?: (error: ContentFrameError) => void
    /** ID to uniquely reference this frame */
    id?: string
    /** Whether to silently fail if the request fails */
    silentFail?: boolean
    /** Refresh interval in seconds. If provided, data will be automatically refreshed at this interval */
    refreshInterval?: number
    /** Whether to enable ETag caching */
    useETag?: boolean
}

/**
 * Error type for ContentFrame
 */
interface ContentFrameError {
    message: string
    status?: number
    url?: string
    code?: string
    timestamp: number
}

/**
 * Interface for ContentFrame context
 */
interface ContentFrameContextType {
    /** API response data */
    data: any
    /** Loading state */
    loading: boolean
    /** Error state */
    error: ContentFrameError | null
    /** Function to refresh the data */
    refresh: () => void
    /** Function to mutate the data optimistically */
    mutate: (data: any) => void
    /** The request signature for this frame */
    signature: string
    /** Reference to parent frame context (if nested) */
    parent?: ContentFrameContextType
    /** Whether data is stale */
    isStale?: boolean
    /** Whether currently revalidating */
    isRevalidating?: boolean
}

/**
 * Interface for cached data
 */
interface CachedData {
    isStale: boolean
    data: any
    timestamp: number
    etag?: string
    lastModified?: string
}

/**
 * Global error boundary context
 */
interface ErrorBoundaryContextType {
    errors: Map<string, ContentFrameError>
    reportError: (signature: string, error: ContentFrameError) => void
    clearError: (signature: string) => void
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextType>({
    errors: new Map(),
    reportError: () => {},
    clearError: () => {},
})

/**
 * ContentFrame Error Boundary Provider
 */
export const ContentFrameErrorBoundary: React.FC<{ children: ReactNode; onError?: (errors: Map<string, ContentFrameError>) => void }> = ({
    children,
    onError,
}) => {
    const [errors, setErrors] = useState<Map<string, ContentFrameError>>(new Map())

    const reportError = (signature: string, error: ContentFrameError) => {
        setErrors(prev => {
            const next = new Map(prev)
            next.set(signature, error)
            return next
        })
    }

    const clearError = (signature: string) => {
        setErrors(prev => {
            const next = new Map(prev)
            next.delete(signature)
            return next
        })
    }

    useEffect(() => {
        if (onError && errors.size > 0) {
            onError(errors)
        }
    }, [errors, onError])

    return <ErrorBoundaryContext.Provider value={{ errors, reportError, clearError }}>{children}</ErrorBoundaryContext.Provider>
}

// Create context for ContentFrame
const ContentFrameContext = createContext<ContentFrameContextType | null>(null)

/**
 * Hook to access ContentFrame context
 */
export const useContentFrame = (targetSignature?: string) => {
    const context = useContext(ContentFrameContext)

    if (!context) {
        throw new Error('useContentFrame must be used within a ContentFrame')
    }

    if (!targetSignature) {
        return context
    }

    let currentContext: ContentFrameContextType | undefined = context
    while (currentContext) {
        if (currentContext.signature === targetSignature) {
            return currentContext
        }
        currentContext = currentContext.parent
    }

    throw new Error(`ContentFrame with signature "${targetSignature}" not found in parent chain`)
}

/**
 * Hook to access all ContentFrame contexts in the parent chain
 */
export const useContentFrames = () => {
    const context = useContext(ContentFrameContext)

    if (!context) {
        throw new Error('useContentFrames must be used within a ContentFrame')
    }

    let frames: {
        [key: string]: ContentFrameContextType
    } = {}
    let currentContext: ContentFrameContextType | undefined = context

    while (currentContext) {
        frames[currentContext.signature] = currentContext
        currentContext = currentContext.parent
    }

    return frames
}

/**
 * Hook to find a ContentFrame by a partial signature match
 */
export const useContentFrameByPath = (partialSignature: string) => {
    const context = useContext(ContentFrameContext)

    if (!context) {
        throw new Error('useContentFrameByPath must be used within a ContentFrame')
    }

    let currentContext: ContentFrameContextType | undefined = context
    while (currentContext) {
        if (currentContext.signature.includes(partialSignature)) {
            return currentContext
        }
        currentContext = currentContext.parent
    }

    return null
}

/**
 * In-flight request tracker for deduplication
 */
class RequestTracker {
    private inFlight = new Map<string, AbortController>()

    register(signature: string): AbortController {
        // Abort any existing request with same signature
        const existing = this.inFlight.get(signature)
        if (existing) {
            existing.abort()
        }

        const controller = new AbortController()
        this.inFlight.set(signature, controller)
        return controller
    }

    unregister(signature: string) {
        this.inFlight.delete(signature)
    }

    abort(signature: string) {
        const controller = this.inFlight.get(signature)
        if (controller) {
            controller.abort()
            this.inFlight.delete(signature)
        }
    }
}

const requestTracker = new RequestTracker()

/**
 * IndexedDB helper for caching API responses with TTL and ETag support
 */
class IndexedDBCache {
    private dbName = 'contentFrameCache'
    private storeName = 'apiResponses'
    private db: IDBDatabase | null = null

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2)

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'))
            }

            request.onsuccess = event => {
                this.db = (event.target as IDBOpenDBRequest).result
                resolve()
            }

            request.onupgradeneeded = event => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' })
                }
            }
        })
    }

    async get(id: string, ttl?: number): Promise<CachedData | null> {
        if (!this.db) {
            await this.init()
        }

        return new Promise(resolve => {
            if (!this.db) {
                resolve(null)
                return
            }

            const transaction = this.db.transaction([this.storeName], 'readonly')
            const store = transaction.objectStore(this.storeName)
            const request = store.get(id)

            request.onsuccess = () => {
                const result = request.result
                if (!result) {
                    resolve(null)
                    return
                }

                // Check TTL if provided
                if (ttl) {
                    const age = Date.now() - result.timestamp
                    if (age > ttl * 1000) {
                        // Data is stale
                        resolve({ ...result, isStale: true })
                        return
                    }
                }

                resolve(result)
            }

            request.onerror = () => {
                resolve(null)
            }
        })
    }

    async set(id: string, data: any, etag?: string, lastModified?: string): Promise<void> {
        if (!this.db) {
            await this.init()
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'))
                return
            }

            const transaction = this.db.transaction([this.storeName], 'readwrite')
            const store = transaction.objectStore(this.storeName)
            const request = store.put({
                id,
                data,
                timestamp: Date.now(),
                etag,
                lastModified,
            })

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = () => {
                reject(new Error('Failed to store data in IndexedDB'))
            }
        })
    }
}

const indexedDBCache = new IndexedDBCache()

/**
 * ContentFrame component that handles API requests and provides the response as state to its children
 */
export const ContentFrame: React.FC<ContentFrameProps> = ({
    children,
    get,
    post,
    put,
    delete: deleteMethod,
    patch,
    data: requestData,
    cache = false,
    cacheTTL = 300,
    swr = false,
    onError,
    id,
    silentFail = false,
    refreshInterval,
    useETag = false,
}) => {
    const [responseData, setResponseData] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<ContentFrameError | null>(null)
    const [isStale, setIsStale] = useState<boolean>(false)
    const [isRevalidating, setIsRevalidating] = useState<boolean>(false)

    const { session, isLoaded } = useSession()
    const errorBoundary = useContext(ErrorBoundaryContext)
    const parentContext = useContext(ContentFrameContext)

    const intervalIdRef = useRef<NodeJS.Timeout | null>(null)
    const cachedETagRef = useRef<string | undefined>(undefined)
    const cachedLastModifiedRef = useRef<string | undefined>(undefined)

    const method = get ? 'get' : post ? 'post' : put ? 'put' : deleteMethod ? 'delete' : patch ? 'patch' : null
    const path = get || post || put || deleteMethod || patch
    const signature = id || `${method}=${path}`
    const requestId = id || `${method}=${path}`

    // Memoize the mutate function
    const mutate = useMemo(
        () => (data: any) => {
            setResponseData(data)
            if (cache) {
                indexedDBCache.set(requestId, data)
            }
        },
        [cache, requestId]
    )

    const makeRequest = async (revalidate = false) => {
        if (!isLoaded) return
        if (!method || !path) {
            const err: ContentFrameError = {
                message: 'No request method or path specified',
                timestamp: Date.now(),
            }
            setError(err)
            setLoading(false)
            errorBoundary.reportError(signature, err)
            return
        }

        try {
            // Handle SWR pattern
            if (cache && !revalidate) {
                const cachedData = await indexedDBCache.get(requestId, cacheTTL)
                if (cachedData) {
                    setResponseData(cachedData.data)
                    cachedETagRef.current = cachedData.etag
                    cachedLastModifiedRef.current = cachedData.lastModified

                    if (swr && cachedData.isStale) {
                        setIsStale(true)
                        setLoading(false)
                        // Trigger background revalidation
                        makeRequest(true)
                        return
                    } else if (!cachedData.isStale) {
                        setLoading(false)
                        return
                    }
                }
            }

            if (revalidate) {
                setIsRevalidating(true)
            }

            // Register and get abort controller
            const abortController = requestTracker.register(signature)

            try {
                const urlPath = path.split('.').join('/')
                const url = `${API_URL}/${urlPath}`

                const options: RequestInit = {
                    method: method?.toUpperCase(),
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    signal: abortController.signal,
                }

                // Add ETag headers if available and enabled
                if (useETag && method === 'get') {
                    if (cachedETagRef.current) {
                        options.headers = {
                            ...options.headers,
                            'If-None-Match': cachedETagRef.current,
                        }
                    }
                    if (cachedLastModifiedRef.current) {
                        options.headers = {
                            ...options.headers,
                            'If-Modified-Since': cachedLastModifiedRef.current,
                        }
                    }
                }

                const token = await session?.getToken()
                setToken(token)
                if (token) {
                    options.headers = {
                        ...options.headers,
                        Authorization: `Bearer ${token}`,
                    }
                }

                if (method !== 'get' && method !== 'delete' && requestData) {
                    options.body = JSON.stringify(requestData)
                }

                const fetchResponse = await fetch(url, options)

                // Handle 304 Not Modified
                if (fetchResponse.status === 304) {
                    setIsRevalidating(false)
                    setIsStale(false)
                    requestTracker.unregister(signature)
                    return
                }

                const responseData = await fetchResponse.json()

                const response = {
                    data: responseData.data || responseData,
                    error: !fetchResponse.ok
                        ? {
                              status: fetchResponse.status,
                              message:
                                  responseData.summary ||
                                  responseData.meta?.message ||
                                  responseData.code ||
                                  'Request failed with no error from server',
                              url: path,
                              code: responseData.code,
                              timestamp: Date.now(),
                          }
                        : null,
                }

                if (response.error) {
                    throw response.error
                }

                // Store ETag and Last-Modified headers
                const etag = fetchResponse.headers.get('ETag') || undefined
                const lastModified = fetchResponse.headers.get('Last-Modified') || undefined
                cachedETagRef.current = etag
                cachedLastModifiedRef.current = lastModified

                setResponseData(response.data)
                setLoading(false)
                setError(null)
                setIsStale(false)
                setIsRevalidating(false)
                errorBoundary.clearError(signature)

                if (cache) {
                    await indexedDBCache.set(requestId, response.data, etag, lastModified)
                }

                requestTracker.unregister(signature)
            } catch (err: any) {
                // Don't update state if request was aborted
                if (err.name === 'AbortError') {
                    return
                }

                const contentFrameError: ContentFrameError = {
                    message: err.message || 'Unknown error',
                    status: err.status,
                    url: path,
                    code: err.code,
                    timestamp: Date.now(),
                }

                setError(contentFrameError)
                setLoading(false)
                setIsRevalidating(false)
                errorBoundary.reportError(signature, contentFrameError)
                requestTracker.unregister(signature)

                if (onError) {
                    onError(contentFrameError)
                }
            }
        } catch (err: any) {
            const contentFrameError: ContentFrameError = {
                message: err.message || 'Unknown error',
                url: path,
                timestamp: Date.now(),
            }

            setError(contentFrameError)
            setLoading(false)
            setIsRevalidating(false)
            errorBoundary.reportError(signature, contentFrameError)

            if (onError) {
                onError(contentFrameError)
            }
        }
    }

    const refresh = async () => {
        setLoading(true)
        await makeRequest()
    }

    // Initial request and cleanup
    useEffect(() => {
        makeRequest()

        return () => {
            // Abort in-flight request on unmount
            requestTracker.abort(signature)
        }
    }, [method, path, JSON.stringify(requestData), isLoaded])

    // Handle refresh interval
    useEffect(() => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current)
            intervalIdRef.current = null
        }

        if (refreshInterval && refreshInterval > 0 && isLoaded && method && path) {
            intervalIdRef.current = setInterval(() => {
                makeRequest(true)
            }, refreshInterval * 1000)
        }

        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current)
            }
        }
    }, [refreshInterval, isLoaded, method, path, JSON.stringify(requestData)])

    if (error && !onError && !silentFail) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
                <h3 className="text-lg font-semibold">Error</h3>
                <p>{error.message || 'An error occurred while fetching data'}</p>
                {error.url && <p className="text-sm">URL: {error.url}</p>}
                {error.status && <p className="text-sm">Status: {error.status}</p>}
                <button onClick={refresh} className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">
                    Retry
                </button>
            </div>
        )
    }

    const contextValue: ContentFrameContextType = {
        data: responseData,
        loading,
        error,
        refresh,
        mutate,
        signature,
        parent: parentContext,
        isStale,
        isRevalidating,
    }

    return <ContentFrameContext.Provider value={contextValue}>{children}</ContentFrameContext.Provider>
}

export default ContentFrame
