import { useCallback, useEffect, useState } from 'react'
import { decodeString, encodeString, readUint32, useRealtimeSocket, writeUint32 } from '@/lib/socket/WebsocketContext'
import { useUserAccountStore } from '@/lib/index'

// Presence extension constants
export const PresenceExtension = {
    ID: 2,
    MessageType: {
        STATUS_UPDATE: 0,
        STATUS_QUERY: 1,
        STATUS_RESPONSE: 2,
        PRESENCE_LIST: 3,
        USER_STATUS_CHANGED: 4,
        SUBSCRIBE: 5,
        UNSUBSCRIBE: 6,
    },
    StatusType: {
        ONLINE: 0,
        AWAY: 1,
        DND: 2,
        OFFLINE: 3,
    },
    StatusTypeNames: ['Online', 'Away', 'Do Not Disturb', 'Offline'] as const,
}

export type StatusType = keyof typeof PresenceExtension.StatusType
export type StatusTypeName = (typeof PresenceExtension.StatusTypeNames)[number]

export interface UserPresence {
    userId: string
    statusType: number
    statusText?: string
    lastActive: number
    expiresAt?: number
}

export interface UpdateStatusOptions {
    statusType: number
    statusText?: string
    expiresIn?: number // seconds
}

export const usePresence = () => {
    const { sendMessage, addMessageHandler, supportedExtensions, connectionState } = useRealtimeSocket()

    const { user } = useUserAccountStore()

    const [presenceData, setPresenceData] = useState<Map<string, UserPresence>>(new Map())
    const [isSupported, setIsSupported] = useState(false)

    // Update presence support status whenever extensions list changes
    useEffect(() => {
        setIsSupported(supportedExtensions.has(PresenceExtension.ID))
    }, [supportedExtensions])

    // Handler for status response
    useEffect(() => {
        if (!isSupported) return

        const handleStatusResponse = (payload: Uint8Array) => {
            try {
                let offset = 0
                const updatedPresence = new Map(presenceData)

                while (offset < payload.length) {
                    // Read user ID
                    const userIdResult = decodeString(payload, offset)
                    offset += userIdResult.bytesRead
                    const userId = userIdResult.value

                    // Read status type
                    const statusType = payload[offset++]

                    // Read expiration
                    const expiresAt = readUint32(payload, offset)
                    offset += 4

                    // Read status text
                    const statusTextResult = decodeString(payload, offset)
                    offset += statusTextResult.bytesRead
                    const statusText = statusTextResult.value

                    // Update presence data
                    updatedPresence.set(userId, {
                        userId,
                        statusType,
                        statusText: statusText || undefined,
                        lastActive: Date.now(),
                        expiresAt: expiresAt || undefined,
                    })
                }

                setPresenceData(updatedPresence)
            } catch (error) {
                console.error('Error parsing status response:', error)
            }
        }

        const unsubscribe = addMessageHandler(PresenceExtension.ID, PresenceExtension.MessageType.STATUS_RESPONSE, handleStatusResponse)

        return () => unsubscribe()
    }, [isSupported, addMessageHandler, presenceData])

    // Handler for presence list
    useEffect(() => {
        if (!isSupported) return

        const handlePresenceList = (payload: Uint8Array) => {
            try {
                // Read user count
                const userCount = (payload[0] << 8) | payload[1]
                const updatedPresence = new Map()

                let offset = 2
                for (let i = 0; i < userCount; i++) {
                    // Read user ID
                    const userIdResult = decodeString(payload, offset)
                    offset += userIdResult.bytesRead
                    const userId = userIdResult.value

                    // Read status type
                    const statusType = payload[offset++]

                    // Read last active timestamp
                    const lastActive = readUint32(payload, offset)
                    offset += 4

                    // Read status text
                    const statusTextResult = decodeString(payload, offset)
                    offset += statusTextResult.bytesRead
                    const statusText = statusTextResult.value

                    // Update presence data
                    updatedPresence.set(userId, {
                        userId,
                        statusType,
                        statusText: statusText || undefined,
                        lastActive: lastActive * 1000, // Convert to ms
                    })
                }

                setPresenceData(updatedPresence)
            } catch (error) {
                console.error('Error parsing presence list:', error)
            }
        }

        const unsubscribe = addMessageHandler(PresenceExtension.ID, PresenceExtension.MessageType.PRESENCE_LIST, handlePresenceList)

        return () => unsubscribe()
    }, [isSupported, addMessageHandler])

    // Handler for user status changed
    useEffect(() => {
        if (!isSupported) return

        const handleUserStatusChanged = (payload: Uint8Array) => {
            try {
                // Read user ID
                let offset = 0
                const userIdResult = decodeString(payload, offset)
                offset += userIdResult.bytesRead
                const userId = userIdResult.value

                // Read status type
                const statusType = payload[offset++]

                // Read last active timestamp
                const lastActive = readUint32(payload, offset)
                offset += 4

                // Read status text
                const statusTextResult = decodeString(payload, offset)
                offset += statusTextResult.bytesRead
                const statusText = statusTextResult.value

                // Update presence data
                setPresenceData(prev => {
                    const updated = new Map(prev)
                    updated.set(userId, {
                        userId,
                        statusType,
                        statusText: statusText || undefined,
                        lastActive: lastActive * 1000, // Convert to ms
                    })
                    return updated
                })
            } catch (error) {
                console.error('Error parsing user status change:', error)
            }
        }

        const unsubscribe = addMessageHandler(
            PresenceExtension.ID,
            PresenceExtension.MessageType.USER_STATUS_CHANGED,
            handleUserStatusChanged
        )

        return () => unsubscribe()
    }, [isSupported, addMessageHandler])

    // Update user status
    const updateStatus = useCallback(
        ({ statusType, statusText, expiresIn }: UpdateStatusOptions) => {
            if (!isSupported || connectionState !== 'connected') {
                return false
            }

            // Calculate expiration timestamp
            let expiresAt = 0
            if (expiresIn && expiresIn > 0) {
                expiresAt = Math.floor(Date.now() / 1000) + expiresIn
            }

            // Create payload
            let payload: Uint8Array

            if (statusText) {
                // Status type (1 byte) + expires (4 bytes) + custom status
                const statusBytes = encodeString(statusText)

                payload = new Uint8Array(5 + statusBytes.length)
                payload[0] = statusType

                // Set expiration (4 bytes)
                writeUint32(expiresAt, payload, 1)

                // Copy custom status
                payload.set(statusBytes, 5)
            } else {
                // Just status type (1 byte) + expires (4 bytes)
                payload = new Uint8Array(5)
                payload[0] = statusType
                writeUint32(expiresAt, payload, 1)
            }

            // Send status update
            sendMessage(PresenceExtension.ID, PresenceExtension.MessageType.STATUS_UPDATE, payload)
            return true
        },
        [isSupported, connectionState, sendMessage]
    )

    // Subscribe to user presence
    const subscribe = useCallback(
        (userId?: string) => {
            if (!isSupported || connectionState !== 'connected') {
                return false
            }

            let payload: Uint8Array

            if (userId) {
                // Encode the user ID
                payload = encodeString(userId)
            } else {
                // Empty payload to subscribe to all
                payload = new Uint8Array(0)
            }

            // Send subscription request
            sendMessage(PresenceExtension.ID, PresenceExtension.MessageType.SUBSCRIBE, payload)
            return true
        },
        [isSupported, connectionState, sendMessage]
    )

    // Unsubscribe from user presence
    const unsubscribe = useCallback(
        (userId?: string) => {
            if (!isSupported || connectionState !== 'connected') {
                return false
            }

            let payload: Uint8Array

            if (userId) {
                // Encode the user ID
                payload = encodeString(userId)
            } else {
                // Empty payload to unsubscribe from all
                payload = new Uint8Array(0)
            }

            // Send unsubscription request
            sendMessage(PresenceExtension.ID, PresenceExtension.MessageType.UNSUBSCRIBE, payload)
            return true
        },
        [isSupported, connectionState, sendMessage]
    )

    // Query user status
    const queryStatus = useCallback(
        (userId: string) => {
            if (!isSupported || connectionState !== 'connected') {
                return false
            }

            // Encode the user ID
            const payload = encodeString(userId)

            // Send status query
            sendMessage(PresenceExtension.ID, PresenceExtension.MessageType.STATUS_QUERY, payload)
            return true
        },
        [isSupported, connectionState, sendMessage]
    )

    return {
        isSupported,
        presenceData: Array.from(presenceData.values()),
        getPresence: (userId: string) => presenceData.get(userId),
        updateStatus,
        subscribe,
        unsubscribe,
        queryStatus,
        subscribeAll: () => subscribe(),
        unsubscribeAll: () => unsubscribe(),
    }
}
