import React, { useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/lib/states'
import { AnimatePresence, motion } from 'framer-motion'
import { LoadingCircle } from '@/components/icons'
import { Text } from '@/components/shared/text.tsx'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { WorkerStore } from '@/lib/workers'

// Message display constants
const CONNECTION_MESSAGE_DISPLAY_TIME = 1000 // 1 second to show connected message
const DISCONNECTION_GRACE_PERIOD = 5000 // 5 seconds before showing disconnected message
const STATUS_UPDATE_GRACE_PERIOD = 3000 // 3 seconds grace period before showing status updates

// Message types
type ConnectionMessageType = 'connecting' | 'connected' | 'disconnected' | null

export function ConnectionStatus() {
    const { websocketStatus } = useUIStore()

    const [connectionMessage, setConnectionMessage] = useState<ConnectionMessageType>('connecting')
    const connectedMessageTimerRef = useRef<NodeJS.Timeout | null>(null) // Timer for auto-hiding connected message
    const lastStatusUpdateRef = useRef<string>(websocketStatus) // Track last status to avoid unnecessary updates
    const statusUpdateJobIdRef = useRef<string | null>(null) // Track current status update job

    // Connection state handling
    useEffect(() => {
        // If the status hasn't changed, do nothing
        if (websocketStatus === lastStatusUpdateRef.current) {
            return
        }

        // Update the last status
        lastStatusUpdateRef.current = websocketStatus

        // Cancel any existing status update job
        if (statusUpdateJobIdRef.current) {
            WorkerStore.getState().cancel(statusUpdateJobIdRef.current)
            statusUpdateJobIdRef.current = null
        }

        // Clear any existing connected message timer if the status is not 'connected'
        if (connectedMessageTimerRef.current && websocketStatus !== 'connected') {
            clearTimeout(connectedMessageTimerRef.current)
            connectedMessageTimerRef.current = null
        }

        // Always show connecting message during the grace period
        if (websocketStatus === 'connecting' || connectionMessage === null) {
            setConnectionMessage('connecting')
        }

        // Create a unique job ID for this status update
        const jobId = `status-update-${Date.now()}`
        statusUpdateJobIdRef.current = jobId

        // Enqueue a job to update the status after the grace period
        WorkerStore.getState().enqueue(
            jobId,
            async cache => {
                // Store the initial status when the job was created
                if (!cache.get()) {
                    cache.replace(websocketStatus)
                }

                // Wait for the grace period
                await new Promise(resolve => setTimeout(resolve, STATUS_UPDATE_GRACE_PERIOD))

                // Get the status that was stored when the job was created
                const statusToShow = cache.get<string>()

                // Update the connection message based on the status
                switch (statusToShow) {
                    case 'connected':
                        setConnectionMessage('connected')

                        // Auto-hide connected message after display time
                        connectedMessageTimerRef.current = setTimeout(() => {
                            setConnectionMessage(null)
                            connectedMessageTimerRef.current = null
                        }, CONNECTION_MESSAGE_DISPLAY_TIME)
                        break

                    case 'disconnected':
                        setConnectionMessage('disconnected')
                        break

                    case 'connecting':
                        setConnectionMessage('connecting')
                        break

                    default:
                        setConnectionMessage(null)
                }
            },
            { priority: 'high' }
        )

        return () => {
            // Clean up all timers and jobs on effect cleanup
            if (connectedMessageTimerRef.current) {
                clearTimeout(connectedMessageTimerRef.current)
                connectedMessageTimerRef.current = null
            }

            if (statusUpdateJobIdRef.current) {
                WorkerStore.getState().cancel(statusUpdateJobIdRef.current)
                statusUpdateJobIdRef.current = null
            }
        }
    }, [websocketStatus, connectionMessage])

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
