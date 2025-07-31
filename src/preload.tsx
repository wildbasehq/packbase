/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Body from '@/components/layout/body'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib'
import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, useSession } from '@clerk/clerk-react'
import { LogoSpinner, useContentFrames } from '@/src/components'
import ContentFrame from '@/components/shared/content-frame'
import NUEModal, { createNUEFlow } from '@/components/seen-once/nue-modal'
import { toast } from 'sonner'

export default function Preload({ children }: { children: React.ReactNode }) {
    return (
        <>
            <ContentFrame silentFail get="server.describeServer">
                <SignedIn>
                    <ContentFrame get="user.me" cache>
                        <ContentFrame get="user.me.packs" cache>
                            {/*<WebsocketFrame*/}
                            {/*    onConnect={() => console.log('Connected to websocket')}*/}
                            {/*    onDisconnect={() => console.log('Disconnected from websocket')}*/}
                            {/*    onMessage={message => console.log('Received message:', message)}*/}
                            {/*>*/}
                            <PreloadChild>{children}</PreloadChild>
                            {/*</WebsocketFrame>*/}
                        </ContentFrame>
                    </ContentFrame>
                </SignedIn>
                <SignedOut>
                    <PreloadChild>{children}</PreloadChild>
                </SignedOut>
            </ContentFrame>
        </>
    )
}

function PreloadChild({ children }: { children: React.ReactNode }) {
    const [serviceLoading, setServiceLoading] = useState<string>(`auth`)
    const [error, setError] = useState<any | null>(null)
    const [showNUE, setShowNUE] = useState(false)

    const { setUser } = useUserAccountStore()
    const { setLoading, setConnecting, setBucketRoot, setMaintenance, setServerCapabilities } = useUIStore()
    const { setResources } = useResourceStore()
    const frames = useContentFrames()
    const { session, isSignedIn, isLoaded } = useSession()

    const { data: userMeData, loading: userMeLoading } = frames?.['get=user.me'] || { data: null, loading: isSignedIn }
    const { data: userPacksData, loading: userPacksLoading } = frames?.['get=user.me.packs'] || { data: null, loading: isSignedIn }

    // Needed to be true as this frame is sometimes pushed back
    const { data: server, loading: describeServerLoading } = frames?.['get=server.describeServer'] || { data: null, loading: true }

    useEffect(() => {
        if (userPacksData && !userPacksLoading) {
            setResources(userPacksData)
        }

        if (!isLoaded || describeServerLoading) return
        if (isSignedIn && (userMeLoading || userPacksLoading)) return
        // if (!serviceLoading.startsWith('auth')) return

        setBucketRoot(server.bucketRoot)
        setMaintenance(server.maintenance)
        setServerCapabilities(server.capabilities || [])

        if (server.maintenance) {
            return setError({
                cause: 'Server is under maintenance',
                message: server.maintenance || `Packbase is currently under maintenance. Please check back later.`,
            })
        }

        if (isSignedIn) {
            setUser(userMeData)
            setStatus('auth:@me')

            proceed()
        } else {
            setUser(null)
            proceed()
        }
    }, [session, isSignedIn, userMeLoading, userPacksData, userPacksLoading, describeServerLoading])

    const setStatus = (status: string) => {
        setServiceLoading(prev => {
            if (prev === status) return prev
            if (prev === 'proceeding') return prev
            return status
        })
    }

    const proceed = () => {
        if (error) return
        if (serviceLoading === 'proceeding') return
        setStatus('proceeding')
        setLoading(false)
        setConnecting(false)

        if (
            !userMeData.display_name ||
            !userMeData.display_name.trim().length ||
            !userMeData.about?.bio ||
            !userMeData.about?.bio.trim().length
        ) {
            setShowNUE(true)
        }
    }

    return (
        <>
            {serviceLoading === 'proceeding' ? (
                <>
                    {showNUE && (
                        <NUEModal
                            config={{
                                ...createNUEFlow(),
                                onComplete: () => {
                                    window.location.reload()
                                },
                                onCancel: () => {
                                    toast.message('Snoozed until next reload')
                                    setShowNUE(false)
                                },
                            }}
                        />
                    )}

                    {children}
                </>
            ) : (
                <Body bodyClassName="h-full" className="!h-full items-center justify-center">
                    <LogoSpinner />
                    <span className="text-sm mt-1">
                        {serviceLoading.startsWith('auth')
                            ? `Checking data...`
                            : serviceLoading.startsWith('auth:@me')
                              ? `Getting profile...`
                              : serviceLoading.startsWith('cron')
                                ? 'Welcome!'
                                : 'Get set...'}
                    </span>
                </Body>
            )}
        </>
    )
}
