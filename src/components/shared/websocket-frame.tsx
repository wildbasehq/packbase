/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useSession } from '@clerk/clerk-react'

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_YAPOCK_URL

/**
 * Interface for WebSocketFrame props
 */
interface WebSocketFrameProps {
    /** Children components that will have access to the WebSocket state */
    children: ReactNode
    /** Custom error handler function */
    onError?: (error: any) => void
    /** Custom message handler function */
    onMessage?: (data: any) => void
    /** Custom connection handler function */
    onConnect?: () => void
    /** Custom disconnect handler function */
    onDisconnect?: () => void
    /** Whether to automatically reconnect on connection loss */
    autoReconnect?: boolean
    /** Reconnection delay in milliseconds */
    reconnectDelay?: number
    /** Maximum number of reconnection attempts */
    maxReconnectAttempts?: number
    /** ID to uniquely reference this WebSocket frame */
    id?: string
}

/**
 * WebSocket connection states
 */
export enum WebSocketState {
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    RECONNECTING = 'reconnecting',
    ERROR = 'error',
}

/**
 * Interface for WebSocketFrame context
 */
interface WebSocketFrameContextType {
    /** WebSocket connection state */
    state: WebSocketState
    /** Whether the WebSocket is currently connected */
    isConnected: boolean
    /** Last error that occurred */
    error: any
    /** Function to send a message through the WebSocket */
    sendMessage: (message: any) => void
    /** Function to manually connect the WebSocket */
    connect: () => void
    /** Function to manually disconnect the WebSocket */
    disconnect: () => void
    /** Last received message */
    lastMessage: any
    /** WebSocket URL being used */
    websocketUrl: string | null
    /** Connection attempt count */
    reconnectAttempts: number
}

// Create context for WebSocketFrame
const WebSocketFrameContext = createContext<WebSocketFrameContextType | null>(null)

/**
 * Hook to access WebSocketFrame context
 * @returns WebSocketFrame context
 */
export const useWebSocket = () => {
    const context = useContext(WebSocketFrameContext)

    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketFrame')
    }

    return context
}

/**
 * WebSocketFrame component that handles WebSocket connections and provides the state to its children
 *
 * @example
 * ```jsx
 * <WebSocketFrame
 *   onMessage={(data) => console.log('Received:', data)}
 *   autoReconnect={true}
 * >
 *   <ChatComponent />
 * </WebSocketFrame>
 *
 * // In ChatComponent:
 * const { isConnected, sendMessage, lastMessage } = useWebSocket()
 * ```
 *
 * @param props - WebSocketFrame props
 * @returns WebSocketFrame component
 */
export const WebSocketFrame: React.FC<WebSocketFrameProps> = ({
    children,
    onError,
    onMessage,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
}) => {
    const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED)
    const [error, setError] = useState<any>(null)
    const [lastMessage, setLastMessage] = useState<any>(null)
    const [websocketUrl, setWebsocketUrl] = useState<string | null>(null)
    const [reconnectAttempts, setReconnectAttempts] = useState<number>(0)

    const websocketRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const { session, isLoaded } = useSession()

    // Function to get WebSocket URL from the API
    const getWebSocketUrl = async (): Promise<string | null> => {
        try {
            const url = `${API_URL}/chat`
            const options: RequestInit = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            }

            // Add auth token if available
            const token = await session?.getToken()
            if (token) {
                options.headers = {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                }
            }

            const response = await fetch(url, options)
            const data = await response.json()

            if (response.ok && data.status === 'online' && data.websocket_url) {
                return data.websocket_url
            }

            throw new Error(data.message || 'WebSocket URL not available')
        } catch (err) {
            console.error('Failed to get WebSocket URL:', err)
            throw err
        }
    }

    // Function to establish WebSocket connection
    const connect = useCallback(async () => {
        if (
            !isLoaded ||
            websocketRef.current?.readyState === WebSocket.CONNECTING ||
            websocketRef.current?.readyState === WebSocket.OPEN ||
            globalThis.WEBSOCKET
        ) {
            return
        }

        globalThis.WEBSOCKET = true

        try {
            setState(WebSocketState.CONNECTING)
            setError(null)

            // Get WebSocket URL from API
            let url = await getWebSocketUrl()
            if (!url) {
                throw new Error('No WebSocket URL received from server')
            }

            // Add token
            url = `${url}?token=${await session?.getToken()}`

            setWebsocketUrl(url)

            // Create WebSocket connection
            const ws = new WebSocket(url)
            websocketRef.current = ws

            // Handle WebSocket events
            ws.onopen = () => {
                setState(WebSocketState.CONNECTED)
                setReconnectAttempts(0)
                setError(null)

                if (onConnect) {
                    onConnect()
                }
            }

            ws.onmessage = event => {
                try {
                    const data = JSON.parse(event.data)
                    setLastMessage(data)

                    if (onMessage) {
                        onMessage(data)
                    }
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err)
                    setLastMessage(event.data)

                    if (onMessage) {
                        onMessage(event.data)
                    }
                }
            }

            ws.onclose = event => {
                globalThis.WEBSOCKET = false
                setState(WebSocketState.DISCONNECTED)
                websocketRef.current = null

                if (onDisconnect) {
                    onDisconnect()
                }

                // Handle reconnection if enabled and not manually closed
                if (autoReconnect && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                    setState(WebSocketState.RECONNECTING)
                    setReconnectAttempts(prev => prev + 1)

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect()
                    }, reconnectDelay)
                }
            }

            ws.onerror = event => {
                const errorObj = {
                    message: 'WebSocket connection error',
                    event,
                    url,
                }

                globalThis.WEBSOCKET = false
                setState(WebSocketState.ERROR)
                setError(errorObj)

                if (onError) {
                    onError(errorObj)
                }
            }
        } catch (err) {
            const errorObj = {
                message: err instanceof Error ? err.message : 'Failed to establish WebSocket connection',
                originalError: err,
            }

            globalThis.WEBSOCKET = false
            setState(WebSocketState.ERROR)
            setError(errorObj)

            if (onError) {
                onError(errorObj)
            }

            // Retry if auto-reconnect is enabled
            if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
                setState(WebSocketState.RECONNECTING)
                setReconnectAttempts(prev => prev + 1)

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect()
                }, reconnectDelay)
            }
        }
    }, [
        isLoaded,
        session,
        onConnect,
        onMessage,
        onDisconnect,
        onError,
        autoReconnect,
        reconnectDelay,
        maxReconnectAttempts,
        reconnectAttempts,
    ])

    // Function to disconnect WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }

        if (websocketRef.current) {
            websocketRef.current.close(1000, 'Manual disconnect')
            websocketRef.current = null
        }

        globalThis.WEBSOCKET = false
        setState(WebSocketState.DISCONNECTED)
        setReconnectAttempts(0)
    }, [])

    // Function to send message through WebSocket
    const sendMessage = useCallback((message: any) => {
        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
            websocketRef.current.send(messageStr)
        } else {
            console.warn('WebSocket is not connected. Cannot send message:', message)
        }
    }, [])

    // Connect when component mounts
    useEffect(() => {
        connect()
    }, [connect, disconnect])

    // Create the context value
    const contextValue: WebSocketFrameContextType = {
        state,
        isConnected: state === WebSocketState.CONNECTED,
        error,
        sendMessage,
        connect,
        disconnect,
        lastMessage,
        websocketUrl,
        reconnectAttempts,
    }

    // Provide the context value to children
    return <WebSocketFrameContext.Provider value={contextValue}>{children}</WebSocketFrameContext.Provider>
}

export default WebSocketFrame
