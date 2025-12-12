import React, {ReactNode} from 'react'
import {useSession} from '@clerk/clerk-react'
import {API_URL, setToken} from '@/lib'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'

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
    refetchInterval?: number
}

interface ContentFrameError {
    message: string
    status?: number
    url?: string
    code?: string
    timestamp: number
}

const createApiCall = async (method: string, path: string, requestData?: any, token?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}/${path.split('.').join('/')}`, {
        method: method.toUpperCase(),
        headers,
        body: method !== 'get' && method !== 'delete' && requestData ? JSON.stringify(requestData) : undefined,
    })

    const json = await res.json()
    if (!res.ok) {
        throw {
            message: json?.summary || json?.meta?.message || 'Request failed',
            status: res.status,
            url: path,
            code: json?.code,
            timestamp: Date.now(),
        } as ContentFrameError
    }
    return json
}

export const useContentFrame = (
    method?: string,
    path?: string,
    requestData?: any,
    options?: {
        id?: string
        refetchInterval?: number
        enabled?: boolean
        refetchOnMount?: boolean
    }
) => {
    const {session, isLoaded, isSignedIn} = useSession()

    const hasMethodAndPath = method && path
    const queryKey = options?.id || (hasMethodAndPath ? [method, path, requestData] : null)
    const enabled = isLoaded && hasMethodAndPath && options?.enabled
    const refetchInterval = (options?.refetchInterval || 0) * 1000
    const refetchOnMount = options?.refetchOnMount

    const query = useQuery({
        queryKey: queryKey ? [queryKey] : undefined,
        queryFn: async () => {
            const token = isSignedIn ? await session.getToken() : null
            if (token) setToken(token)
            return createApiCall(method, path, requestData, token)
        },
        enabled,
        refetchInterval,
        refetchOnMount,
    })

    const error = query.error
        ? {
            message: (query.error as any)?.message || 'Request failed',
            status: (query.error as any)?.status,
            url: path,
            code: (query.error as any)?.code,
            timestamp: Date.now(),
        } as ContentFrameError
        : null

    return {
        data: query.data,
        raw: query,
        error,
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        refetch: query.refetch,
    }
}

export const useContentFrameMutation = (
    method: string,
    path: string,
    options?: {
        onSuccess?: (data: any) => void
        onError?: (error: ContentFrameError) => void
    }
) => {
    const {session, isSignedIn} = useSession()
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (requestData?: any) => {
            // if (!session) throw new Error('Not authenticated')
            const token = isSignedIn ? await session.getToken() : null
            if (token) setToken(token)
            return createApiCall(method, path, requestData, token)
        },
        onSuccess: data => {
            queryClient.invalidateQueries().catch(error => {
                console.error(error)
            })
            options?.onSuccess?.(data)
        },
        onError: error => {
            const contentFrameError: ContentFrameError = {
                message: (error as any)?.message || 'Request failed',
                status: (error as any)?.status,
                url: path,
                code: (error as any)?.code,
                timestamp: Date.now(),
            }
            options?.onError?.(contentFrameError)
        },
    })
}

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
                                                              refetchInterval,
                                                          }) => {
    const method = get ? 'get' : post ? 'post' : put ? 'put' : deleteMethod ? 'delete' : patch ? 'patch' : null
    const path = get || post || put || deleteMethod || patch

    const {error} = useContentFrame(method || undefined, path || undefined, requestData, {
        id,
        refetchInterval,
    })

    if (error && onError) {
        onError(error)
    }

    return <>{children}</>
}

export default ContentFrame
