import React, { useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/lib/states'
import { AnimatePresence, motion } from 'framer-motion'
import { LoadingCircle } from '@/components/icons'
import { Text } from '@/components/shared/text.tsx'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

// Message display constants
const CONNECTION_MESSAGE_DISPLAY_TIME = 1000 // 1 second to show connected message
const DISCONNECTION_GRACE_PERIOD = 5000 // 5 seconds before showing disconnected message

// Message types
type ConnectionMessageType = 'connecting' | 'connected' | 'disconnected' | null

export function ConnectionStatus() {
    const { websocketStatus } = useUIStore()

    const [connectionMessage, setConnectionMessage] = useState<ConnectionMessageType>('connecting')
    const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
    const disconnectTimeRef = useRef<number | null>(null)
    const connectedMessageTimerRef = useRef<NodeJS.Timeout | null>(null) // New ref for connected message timer

    // Connection state handling
    useEffect(() => {
        // Clear any existing disconnect timer
        if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current)
            disconnectTimerRef.current = null
        }

        // Clear any existing connected message timer
        if (connectedMessageTimerRef.current) {
            clearTimeout(connectedMessageTimerRef.current)
            connectedMessageTimerRef.current = null
        }

        switch (websocketStatus) {
            case 'connected':
                // On connected: clear disconnect time and show connected message
                disconnectTimeRef.current = null
                setConnectionMessage('connected')

                // Auto-hide connected message after display time - store timeout ID in ref
                connectedMessageTimerRef.current = setTimeout(() => {
                    setConnectionMessage(null)
                    connectedMessageTimerRef.current = null // Clear ref after timeout completes
                }, CONNECTION_MESSAGE_DISPLAY_TIME)
                break

            case 'connecting':
                // On connecting: show connecting message
                setConnectionMessage('connecting')
                break

            case 'disconnected':
                setConnectionMessage('disconnected')
                break

            default:
                setConnectionMessage(null)
        }

        return () => {
            // Clean up all timers on effect cleanup
            if (disconnectTimerRef.current) {
                clearTimeout(disconnectTimerRef.current)
                disconnectTimerRef.current = null
            }

            if (connectedMessageTimerRef.current) {
                clearTimeout(connectedMessageTimerRef.current)
                connectedMessageTimerRef.current = null
            }
        }
    }, [websocketStatus])

    return (
        <>
            {/* Connection message animations */}
            <AnimatePresence>
                {connectionMessage === 'connecting' && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 w-full h-[170%] rounded-tl pb-20 rounded-tr border ring-default bg-card flex items-center px-4 py-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                                y: { type: 'spring', stiffness: 500, damping: 25 },
                            },
                        }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <LoadingCircle className="w-5 h-5 animate-spin mr-2" />
                        <Text alt className="text-sm/5">
                            Connecting to Packbase DM...
                        </Text>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {connectionMessage === 'connected' && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 w-full h-[170%] rounded-tl pb-20 rounded-tr border ring-default bg-card flex items-center px-4 py-2 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                                y: { type: 'spring', stiffness: 500, damping: 20 },
                            },
                        }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <div className="absolute z-10 inset-0 bg-radial w-[135%] h-52 -top-24 -left-26 from-indigo-500/25 to-transparent via-orange-300/5 blur-md opacity-70 animate-logo-hue"></div>
                        <Text alt className="text-sm/5 font-medium relative z-10">
                            Connected!
                        </Text>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {connectionMessage === 'disconnected' && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 w-full h-[170%] rounded-tl pb-20 rounded-tr border ring-default bg-card flex items-center px-4 py-2 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                                y: { type: 'spring', stiffness: 500, damping: 20 },
                            },
                        }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <ExclamationTriangleIcon className="absolute text-red-400/25 w-32 h-32 -right-5 -top-5 transform rotate-12" />
                        <Text alt className="text-sm/5 font-medium relative z-10">
                            Disconnected...
                        </Text>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}