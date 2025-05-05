import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useUIStore, useUserAccountStore } from '@/lib/states'
import { API_URL } from '@/lib/api'

// Protocol constants
const Protocol = {
    VERSION: 1,
    HEADER_SIZE: 4, // Extension ID (1) + Type (1) + Payload Length (2)
    MessageType: {
        HANDSHAKE: 0,
        HANDSHAKE_ACK: 1,
        ERROR: 4,
        EXTENSION_MSG_START: 32,
        PING: 10,
        PONG: 11,
    },
    ErrorCode: {
        INVALID_MESSAGE_FORMAT: 100,
        UNKNOWN_MESSAGE_TYPE: 101,
        UNKNOWN_EXTENSION: 102,
        PROTOCOL_VERSION_MISMATCH: 103,
        PAYLOAD_TOO_LARGE: 104,
        UNAUTHORIZED: 200,
        HEARTBEAT_TIMEOUT: 404,
        INTERNAL_SERVER_ERROR: 500,
    },
}

// Message interfaces
interface RealtimeMessage {
    extensionId: number
    type: number
    payload: Uint8Array
}

// Connection states
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

// WebSocket Context interface
interface WebSocketContextValue {
    connect: (url: string, token?: string) => void
    disconnect: () => void
    sendMessage: (extensionId: number, type: number, payload: Uint8Array) => void
    connectionState: ConnectionState
    supportedExtensions: Set<number>
    addMessageHandler: (extensionId: number, type: number, handler: (payload: Uint8Array) => void) => () => void
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextValue>({
    connect: () => {},
    disconnect: () => {},
    sendMessage: () => {},
    connectionState: 'disconnected',
    supportedExtensions: new Set<number>(),
    addMessageHandler: () => () => {},
})

interface WebSocketProviderProps {
    children: React.ReactNode
    autoReconnect?: boolean
    reconnectInterval?: number
    maxReconnectAttempts?: number
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
    children,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
}) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('connecting')
    const [supportedExtensions, setSupportedExtensions] = useState<Set<number>>(new Set())
    const { user } = useUserAccountStore()
    const { setWebsocketStatus } = useUIStore()

    const socketRef = useRef<WebSocket | null>(null)
    const socketUrlRef = useRef<string | null>(null)
    const tokenRef = useRef<string | null>(null)
    const reconnectAttemptsRef = useRef<number>(0)
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Map to store message handlers: extensionId_type -> handler[]
    const messageHandlersRef = useRef<Map<string, Array<(payload: Uint8Array) => void>>>(new Map())

    // Connect to WebSocket
    const connect = useCallback(
        (url: string, token?: string, isReconnectAttempt = false) => {
            // Store connection parameters for potential reconnect
            socketUrlRef.current = url
            tokenRef.current = token || globalThis.TOKEN || null

            if (!tokenRef.current) {
                log.error('Realtime', 'No token provided for WebSocket connection')
                setConnectionState('disconnected')
                return
            }

            // Don't connect if user isn't signed in
            if (!user) {
                log.info('Realtime', 'WebSocket connection not established: User not signed in')
                setConnectionState('disconnected')
                return
            }

            // Clear any existing connections
            if (socketRef.current) {
                log.info('Realtime', 'Closing existing WebSocket connection')
                socketRef.current.close()
                socketRef.current = null
            }

            // Reset reconnect attempts only for initial connections, not reconnect attempts
            if (!isReconnectAttempt) {
                reconnectAttemptsRef.current = 0
            }

            // Construct WebSocket URL with token if provided
            let wsUrl = url
            if (token) {
                wsUrl += (wsUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token)
            }

            try {
                setConnectionState('connecting')
                const socket = new WebSocket(wsUrl)
                socket.binaryType = 'arraybuffer'
                socketRef.current = socket

                // Setup event handlers
                socket.onopen = handleOpen
                socket.onmessage = handleMessage
                socket.onclose = handleClose
                socket.onerror = handleError
            } catch (error) {
                log.error('Realtime', 'WebSocket connection error:', error)
                toast.error('Realtime connection error: ' + error)
                setConnectionState('error')
            }
        },
        [user]
    )

    // Disconnect from WebSocket
    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close(1000, 'Normal closure')
            socketRef.current = null
        }

        // Clear reconnect timer if exists
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
            reconnectTimerRef.current = null
        }

        setConnectionState('disconnected')
        setSupportedExtensions(new Set())
    }, [])

    // Handler for when connection opens
    const handleOpen = useCallback(() => {
        reconnectAttemptsRef.current = 0

        // Send handshake automatically
        sendHandshake()

        setWebsocketStatus('connected')
    }, [])

    // Send initial handshake
    const sendHandshake = useCallback(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            sendMessage(0, Protocol.MessageType.HANDSHAKE, new Uint8Array(0))
        }
    }, [])

    // Handler for incoming messages
    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
            try {
                const dataView = new Uint8Array(event.data)
                const message = decodeMessage(dataView)

                // Special handling for handshake ACK to update supported extensions
                if (message.extensionId === 0 && message.type === Protocol.MessageType.HANDSHAKE_ACK) {
                    handleHandshakeAck(message.payload)
                }

                // Handle ping messages by responding with pong
                if (message.extensionId === 1 && message.type === Protocol.MessageType.PING) {
                    setConnectionState('connected')
                    setWebsocketStatus('connected')
                    // Respond with a pong message using the same payload
                    sendMessage(1, Protocol.MessageType.PONG, message.payload)
                    return
                }

                // Dispatch message to registered handlers
                const handlerKey = `${message.extensionId}_${message.type}`
                const handlers = messageHandlersRef.current.get(handlerKey)

                if (handlers && handlers.length > 0) {
                    handlers.forEach(handler => handler(message.payload))
                }
            } catch (error) {
                log.error('Realtime', 'Error decoding WebSocket message:', error)
            }
        }
    }, [])

    // Handle handshake acknowledge from server
    const handleHandshakeAck = useCallback((payload: Uint8Array) => {
        if (payload.length < 1) {
            log.error('Realtime', 'Invalid handshake ACK: missing protocol version')
            return
        }

        const protocolVersion = payload[0]
        log.info('Realtime', `Server protocol version: ${protocolVersion}`)

        // Extract supported extensions
        const extensions = new Set<number>()
        for (let i = 1; i < payload.length; i++) {
            extensions.add(payload[i])
        }

        log.info('Realtime', `Supported extensions: ${Array.from(extensions).join(', ')}`)

        setSupportedExtensions(extensions)
    }, [])

    // Handler for connection close
    const handleClose = useCallback(
        (event: CloseEvent) => {
            log.info('Realtime', `WebSocket closed: Code=${event.code}, Reason=${event.reason || 'None'}`)
            setConnectionState('disconnected')
            setSupportedExtensions(new Set())

            if (![1005, 1008, 1006].includes(event.code)) {
                toast.error('Disconnected from Packbase DMs: ' + event.reason)
                setWebsocketStatus('disconnected')
            }

            // Attempt reconnection if enabled
            if (autoReconnect && socketUrlRef.current && event.code !== 1005) {
                attemptReconnect()
            } else if (!autoReconnect) {
                log.info('Realtime', 'Auto-reconnect disabled')
                setWebsocketStatus('disconnected')
            }
        },
        [autoReconnect]
    )

    // Handler for connection errors
    const handleError = useCallback(() => {
        log.error('Realtime', 'WebSocket error')
        setConnectionState('error')
    }, [])

    // Attempt to reconnect
    const attemptReconnect = useCallback(() => {
        setWebsocketStatus('connecting')
        // Clear any existing reconnect timer
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current)
        }

        // Check if we've reached max reconnect attempts
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            log.info('Realtime', 'Max reconnect attempts reached')
            toast.error('Max reconnect attempts reached. Please check your connection.')

            setWebsocketStatus('disconnected')

            return
        }

        reconnectAttemptsRef.current++
        log.info('Realtime', `Scheduling reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`)

        // Set timer for reconnect
        reconnectTimerRef.current = setTimeout(() => {
            log.info('Realtime', `Executing reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`)

            if (socketUrlRef.current) {
                // Pass true to indicate this is a reconnection attempt
                connect(socketUrlRef.current, tokenRef.current || undefined, true)
            }
        }, reconnectInterval)
    }, [connect, maxReconnectAttempts, reconnectInterval])

    // Send message to server
    const sendMessage = useCallback((extensionId: number, type: number, payload: Uint8Array) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            log.error('Realtime', 'Cannot send message: WebSocket not connected')
            return
        }

        const message = encodeMessage(extensionId, type, payload)
        try {
            socketRef.current.send(message)
        } catch (error) {
            log.error('Realtime', 'Error sending WebSocket message:', error)
        }
    }, [])

    // Add message handler
    const addMessageHandler = useCallback((extensionId: number, type: number, handler: (payload: Uint8Array) => void) => {
        const handlerKey = `${extensionId}_${type}`

        const handlers = messageHandlersRef.current.get(handlerKey) || []
        handlers.push(handler)
        messageHandlersRef.current.set(handlerKey, handlers)

        // Return unsubscribe function
        return () => {
            const handlers = messageHandlersRef.current.get(handlerKey) || []
            const index = handlers.indexOf(handler)
            if (index !== -1) {
                handlers.splice(index, 1)
                messageHandlersRef.current.set(handlerKey, handlers)
            }
        }
    }, [])

    // Helper to encode messages
    const encodeMessage = (extensionId: number, type: number, payload: Uint8Array): ArrayBuffer => {
        const buffer = new ArrayBuffer(Protocol.HEADER_SIZE + payload.length)
        const view = new DataView(buffer)
        const bytes = new Uint8Array(buffer)

        // Set header fields
        view.setUint8(0, extensionId)
        view.setUint8(1, type)
        view.setUint16(2, payload.length, false) // false = big-endian

        // Copy payload
        bytes.set(payload, Protocol.HEADER_SIZE)

        return buffer
    }

    // Helper to decode messages
    const decodeMessage = (buffer: Uint8Array): RealtimeMessage => {
        if (buffer.length < Protocol.HEADER_SIZE) {
            throw new Error(`Message too short: ${buffer.length} bytes`)
        }

        // Extract header fields
        const extensionId = buffer[0]
        const type = buffer[1]
        const payloadLength = (buffer[2] << 8) | buffer[3]

        // Validate message length
        if (buffer.length !== Protocol.HEADER_SIZE + payloadLength) {
            throw new Error(`Invalid message length: expected ${Protocol.HEADER_SIZE + payloadLength}, got ${buffer.length}`)
        }

        // Extract payload
        const payload = buffer.slice(Protocol.HEADER_SIZE)

        return { extensionId, type, payload }
    }

    // Cleanup on unmount and reconnect when user changes
    useEffect(() => {
        const userId = user?.id || null

        // Connect only if we have a user and no active connection
        if (userId && !socketRef.current) {
            // Only attempt to connect if we have a URL (either stored or default)
            // If no URL is provided, use the default in API_URL by getting the domain only, stripping HTTP(S) and trailing slash
            const apiUrl = API_URL?.replace(/https?:\/\//, '').replace(/\/$/, '') || ''
            const wsType = apiUrl.startsWith('localhost') ? 'ws' : 'wss'
            const url = socketUrlRef.current || `${wsType}://${apiUrl}/ws`
            const token = tokenRef.current || globalThis.TOKEN || undefined
            connect(url, token)
        } else if (!userId && socketRef.current) {
            // Disconnect only if user is gone and we have an active connection
            disconnect()
        }

        return () => {
            // Only clean up on component unmount, not on every user change
            if (socketRef.current) {
                socketRef.current.close()
                socketRef.current = null
            }

            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current)
                reconnectTimerRef.current = null
            }
        }
    }, [user?.id, connect, disconnect]) // Only depend on user ID, not the entire user object

    const contextValue: WebSocketContextValue = {
        connect,
        disconnect,
        sendMessage,
        connectionState,
        supportedExtensions,
        addMessageHandler,
    }

    return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>
}

// Custom hook to use WebSocket context
export const useRealtimeSocket = () => {
    const context = useContext(WebSocketContext)

    if (!context) {
        throw new Error('useRealtimeSocket must be used within a WebSocketProvider')
    }

    return context
}

// Utility functions for string encoding/decoding
export const encodeString = (str: string): Uint8Array => {
    // Convert string to UTF-8 bytes
    const encoder = new TextEncoder()
    const bytes = encoder.encode(str || '')

    // Create length prefix (2 bytes, big-endian)
    const result = new Uint8Array(2 + bytes.length)
    result[0] = (bytes.length >> 8) & 0xff // High byte
    result[1] = bytes.length & 0xff // Low byte

    // Copy string bytes
    result.set(bytes, 2)

    return result
}

export const decodeString = (buffer: Uint8Array, offset = 0): { value: string; bytesRead: number } => {
    // Read string length (2 bytes)
    const length = (buffer[offset] << 8) | buffer[offset + 1]
    const startOffset = offset + 2

    // Read string bytes
    const bytes = buffer.slice(startOffset, startOffset + length)
    const decoder = new TextDecoder()
    const value = decoder.decode(bytes)

    return {
        value,
        bytesRead: 2 + length,
    }
}

export const writeUint32 = (value: number, buffer: Uint8Array, offset = 0): void => {
    buffer[offset] = (value >> 24) & 0xff
    buffer[offset + 1] = (value >> 16) & 0xff
    buffer[offset + 2] = (value >> 8) & 0xff
    buffer[offset + 3] = value & 0xff
}

export const readUint32 = (buffer: Uint8Array, offset = 0): number => {
    return (buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3]
}
