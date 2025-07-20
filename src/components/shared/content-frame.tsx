/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react'
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
    /** Custom error handler function */
    onError?: (error: any) => void
    /** ID to uniquely reference this frame */
    id?: string
    /** Whether to silently fail if the request fails */
    silentFail?: boolean
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
    error: any
    /** Function to refresh the data */
    refresh: () => void
    /** The request signature for this frame */
    signature: string
    /** Reference to parent frame context (if nested) */
    parent?: ContentFrameContextType
}

// Create context for ContentFrame
const ContentFrameContext = createContext<ContentFrameContextType | null>(null)

/**
 * Hook to access ContentFrame context
 * @param targetSignature - Optional signature to target a specific frame (e.g., "get=user.me")
 * @returns ContentFrame context
 */
export const useContentFrame = (targetSignature?: string) => {
    const context = useContext(ContentFrameContext)

    if (!context) {
        throw new Error('useContentFrame must be used within a ContentFrame')
    }

    // If no target signature specified, return the nearest context
    if (!targetSignature) {
        return context
    }

    // Search up the context chain for the matching signature
    let currentContext: ContentFrameContextType | undefined = context
    while (currentContext) {
        if (currentContext.signature === targetSignature) {
            return currentContext
        }
        currentContext = currentContext.parent
    }

    // If no matching signature found, throw an error
    throw new Error(`ContentFrame with signature "${targetSignature}" not found in parent chain`)
}

/**
 * Hook to access all ContentFrame contexts in the parent chain
 * @returns Array of all ContentFrame contexts from nearest to farthest
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
 * @param partialSignature - Partial signature to match (e.g., "user.me")
 * @returns ContentFrame context or null if not found
 */
export const useContentFrameByPath = (partialSignature: string) => {
    const context = useContext(ContentFrameContext)

    if (!context) {
        throw new Error('useContentFrameByPath must be used within a ContentFrame')
    }

    // Search up the context chain for a signature containing the partial match
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
 * IndexedDB helper for caching API responses
 */
class IndexedDBCache {
    private dbName = 'contentFrameCache'
    private storeName = 'apiResponses'
    private db: IDBDatabase | null = null

    /**
     * Initialize the IndexedDB database
     */
    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1)

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

    /**
     * Get a cached response from IndexedDB
     * @param id - The unique ID for the cached response
     * @returns The cached response or null if not found
     */
    async get(id: string): Promise<any> {
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
                resolve(request.result ? request.result.data : null)
            }

            request.onerror = () => {
                resolve(null)
            }
        })
    }

    /**
     * Store a response in IndexedDB
     * @param id - The unique ID for the cached response
     * @param data - The data to cache
     */
    async set(id: string, data: any): Promise<void> {
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
            const request = store.put({ id, data, timestamp: Date.now() })

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = () => {
                reject(new Error('Failed to store data in IndexedDB'))
            }
        })
    }
}

// Create a singleton instance of IndexedDBCache
const indexedDBCache = new IndexedDBCache()

/**
 * ContentFrame component that handles API requests and provides the response as state to its children
 *
 * @example
 * ```jsx
 * <ContentFrame get="user.me" cache={true}>
 *   <ContentFrame get="user.settings">
 *     <MyComponent />
 *   </ContentFrame>
 * </ContentFrame>
 *
 * // In MyComponent:
 * const userMe = useContentFrame('get=user.me')
 * const userSettings = useContentFrame('get=user.settings')
 * const nearestFrame = useContentFrame() // gets user.settings
 * ```
 *
 * @param props - ContentFrame props
 * @returns ContentFrame component
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
    onError,
    id,
    silentFail = false,
}) => {
    const [responseData, setResponseData] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<any>(null)
    const { enqueue } = WorkerStore.getState()
    const { session, isLoaded } = useSession()

    // Get parent context to enable nesting
    const parentContext = useContext(ContentFrameContext)

    // Determine the method and path
    const method = get ? 'get' : post ? 'post' : put ? 'put' : deleteMethod ? 'delete' : patch ? 'patch' : null
    const path = get || post || put || deleteMethod || patch

    // Generate the request signature
    const signature = id || `${method}=${path}`

    // Generate a unique ID for this request if not provided
    const requestId = id || `${method}=${path}`

    // Function to make the API request
    const makeRequest = async () => {
        if (!isLoaded) return
        if (!method || !path) {
            setError(new Error('No request method or path specified'))
            setLoading(false)
            return
        }

        try {
            // If caching is enabled, try to get from IndexedDB first
            if (cache) {
                const cachedData = await indexedDBCache.get(requestId)
                if (cachedData) {
                    setResponseData(cachedData)
                    setLoading(false)
                }
            }

            // Make the API request
            enqueue(`content-frame-${requestId}`, async () => {
                try {
                    // Convert dot notation path to URL path
                    const urlPath = path.split('.').join('/')

                    // Construct the full API URL
                    const url = `${API_URL}/${urlPath}`

                    // Set up fetch options
                    const options: RequestInit = {
                        method: method?.toUpperCase(),
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                    }

                    // Add auth token if available
                    const token = await session?.getToken()
                    setToken(token)
                    if (token) {
                        options.headers = {
                            ...options.headers,
                            Authorization: `Bearer ${token}`,
                        }
                    }

                    // Add request body for methods that need it
                    if (method !== 'get' && method !== 'delete' && requestData) {
                        options.body = JSON.stringify(requestData)
                    }

                    // Make the fetch request
                    const fetchResponse = await fetch(url, options)
                    const responseData = await fetchResponse.json()

                    // Format response to match expected structure
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
                              }
                            : null,
                    }

                    // Handle the response
                    if (response.error) {
                        throw response.error
                    }

                    // Update state with the response data
                    setResponseData(response.data)
                    setLoading(false)
                    setError(null)

                    // Cache the response if caching is enabled
                    if (cache) {
                        await indexedDBCache.set(requestId, response.data)
                    }
                } catch (err) {
                    setError({
                        message: err.message,
                        url: path,
                    })
                    setLoading(false)

                    // Call the custom error handler if provided
                    if (onError) {
                        onError(err)
                    }
                }
            })
        } catch (err) {
            setError({
                message: err.message,
                url: path,
            })
            setLoading(false)

            // Call the custom error handler if provided
            if (onError) {
                onError(err)
            }
        }
    }

    // Function to refresh the data
    const refresh = async () => {
        setLoading(true)
        await makeRequest()
    }

    // Make the initial request when the component mounts or when the request parameters change
    useEffect(() => {
        makeRequest()
    }, [method, path, JSON.stringify(requestData), isLoaded])

    // Render an error page if there's an error and no custom error handler
    if (error && !onError && !silentFail) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-md">
                <h3 className="text-lg font-semibold">Error</h3>
                <p>{error.message || 'An error occurred while fetching data'}</p>
                {error.url && <p className="text-sm">URL: {error.url}</p>}
                <button onClick={refresh} className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">
                    Retry
                </button>
            </div>
        )
    }

    // Create the context value with parent reference for nesting
    const contextValue: ContentFrameContextType = {
        data: responseData,
        loading,
        error,
        refresh,
        signature,
        parent: parentContext,
    }

    // Provide the context value to children
    return <ContentFrameContext.Provider value={contextValue}>{children}</ContentFrameContext.Provider>
}

export default ContentFrame
