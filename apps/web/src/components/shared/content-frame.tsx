import React, { createContext, ReactNode, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { useSession } from '@clerk/clerk-react'
import { setToken } from '@/lib'

const API_URL = import.meta.env.VITE_YAPOCK_URL

interface ContentFrameProps {
    children: ReactNode
    get?: string
    post?: string
    put?: string
    delete?: string
    patch?: string
    data?: any
    onError?: (error: ContentFrameError) => void
    id?: string
    refreshInterval?: number
}

interface ContentFrameError {
    message: string
    status?: number
    url?: string
    code?: string
    timestamp: number
}

interface ContentFrameContextType {
    data: any
    loading: boolean
    error: ContentFrameError | null
    refresh: () => void
    mutate: (data?: any) => void
    signature: string
    parent?: ContentFrameContextType
    isRevalidating?: boolean
}

/** Context for ContentFrame hierarchy */
const ContentFrameContext = createContext<ContentFrameContextType | null>(null)

/** Hook to get current ContentFrame context */
export const useContentFrame = (targetSignature?: string) => {
    const context = useContext(ContentFrameContext)
    if (!context) throw new Error('useContentFrame must be used within a ContentFrame')

    if (!targetSignature) return context

    let current: ContentFrameContextType | undefined = context
    while (current) {
        if (current.signature === targetSignature) return current
        current = current.parent
    }
    throw new Error(`ContentFrame with signature "${targetSignature}" not found in parent chain`)
}

/** Hook to get all frames in parent chain */
export const useContentFrames = () => {
    const context = useContext(ContentFrameContext)
    if (!context) throw new Error('useContentFrames must be used within a ContentFrame')

    const frames: Record<string, ContentFrameContextType> = {}
    let current: ContentFrameContextType | undefined = context
    while (current) {
        frames[current.signature] = current
        current = current.parent
    }
    return frames
}

/** Hook to find frame by partial signature */
export const useContentFrameByPath = (partialSignature: string) => {
    const context = useContext(ContentFrameContext)
    if (!context) throw new Error('useContentFrameByPath must be used within a ContentFrame')

    let current: ContentFrameContextType | undefined = context
    while (current) {
        if (current.signature.includes(partialSignature)) return current
        current = current.parent
    }
    return null
}

/** Basic fetcher that uses session token */
const fetcher = (url: string, method: string, body?: any, token?: string) => async () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}/${url.split('.').join('/')}`, {
        method: method.toUpperCase(),
        headers,
        body: method !== 'get' && method !== 'delete' && body ? JSON.stringify(body) : undefined,
    })

    const json = await res.json()
    if (!res.ok) {
        throw {
            message: json?.summary || json?.meta?.message || 'Request failed',
            status: res.status,
            url,
            code: json?.code,
            timestamp: Date.now(),
        } as ContentFrameError
    }
    return json?.data ?? json
}

/** ContentFrame component using SWR */
export const ContentFrame: React.FC<ContentFrameProps> = ({
    children,
    get,
    post,
    put,
    delete: deleteMethod,
    patch,
    data: requestData,
    onError,
    id,
    refreshInterval,
}) => {
    const { session, isLoaded } = useSession()

    const method = get ? 'get' : post ? 'post' : put ? 'put' : deleteMethod ? 'delete' : patch ? 'patch' : null
    const path = get || post || put || deleteMethod || patch
    const signature = id || `${method}=${path}`

    const parentContext = useContext(ContentFrameContext)

    /** Fetcher that waits for session token */
    const fetcherWithToken = async () => {
        if (!method || !path) throw new Error('No method or path specified')
        if (!isLoaded || !session) return null
        const token = await session.getToken()
        if (token) setToken(token)
        return fetcher(path, method, requestData, token)()
    }

    const { data, error, mutate, isValidating } = useSWR(method && path && isLoaded ? signature : null, fetcherWithToken, {
        refreshInterval: refreshInterval ? refreshInterval * 1000 : 0,
        revalidateOnFocus: true,
        onError: (err: any) => onError?.(err),
    })

    const contextValue = useMemo(
        () => ({
            data,
            loading: !data && !error,
            error: error ?? null,
            refresh: () => mutate(),
            mutate,
            signature,
            parent: parentContext || undefined,
            isRevalidating: isValidating,
        }),
        [data, error, mutate, signature, parentContext, isValidating]
    )

    return <ContentFrameContext.Provider value={contextValue}>{children}</ContentFrameContext.Provider>
}

export default ContentFrame
