/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Body from '@/components/layout/body'
import {isVisible, useResourceStore, useUIStore, useUserAccountStore} from '@/lib'
import {Activity, ReactNode, useEffect, useState} from 'react'
import {SignedIn, SignedOut, useSession} from '@clerk/clerk-react'
import {LogoSpinner} from '@/src/components'
import {useContentFrame} from '@/components/shared/content-frame'
import NUEModal, {createNUEFlow} from '@/components/seen-once/nue-modal'
import {toast} from 'sonner'

export default function Preload({children}: { children: ReactNode }) {
    return (
        <>
            <SignedIn>
                {/*<WebsocketFrame*/}
                {/*    onConnect={() => console.log('Connected to websocket')}*/}
                {/*    onDisconnect={() => console.log('Disconnected from websocket')}*/}
                {/*    onMessage={message => console.log('Received message:', message)}*/}
                {/*>*/}
                <PreloadChild>{children}</PreloadChild>
                {/*</WebsocketFrame>*/}
            </SignedIn>
            <SignedOut>
                <PreloadChild>{children}</PreloadChild>
            </SignedOut>
        </>
    )
}

function PreloadChild({children}: { children: ReactNode }) {
    const [serviceLoading, setServiceLoading] = useState<string>(`auth`)
    const [error, setError] = useState<any | null>(null)
    const [showNUE, setShowNUE] = useState(false)

    const {setUser} = useUserAccountStore()
    const {setLoading, setConnecting, setBucketRoot, setMaintenance, setServerCapabilities} = useUIStore()
    const {setResources} = useResourceStore()
    const {session, isSignedIn, isLoaded} = useSession()

    const {data: userMeData, isLoading: userMeLoading} = useContentFrame('get', 'user.me', undefined, {
        id: 'user.me',
        enabled: isSignedIn,
    })
    const {data: userPacksData, isLoading: userPacksLoading} = useContentFrame('get', 'user.me.packs', undefined, {
        id: 'user.me.packs',
        enabled: isSignedIn,
    })
    const {data: server} = useContentFrame('get', 'server.describeServer', undefined, {
        id: 'server.describeServer',
    })

    useEffect(() => {
        if (userPacksData && !userPacksLoading) {
            setResources(userPacksData)
        }

        if (!isLoaded || !server) return
        if (isSignedIn && (userMeLoading || userPacksLoading)) return
        // if (!serviceLoading.startsWith('auth')) return

        setBucketRoot(server.bucketRoot)
        setMaintenance(server.maintenance)
        setServerCapabilities(server.capabilities || [])

        if (server.maintenance) {
            setError({
                cause: 'Server is under maintenance',
                message: server.maintenance || `Packbase is currently under maintenance. Please check back later.`,
            })
            return
        }

        if (isSignedIn) {
            setUser(userMeData)
            setStatus('auth:@me')

            proceed()
        } else {
            setUser(null)
            proceed()
        }
    }, [session, isSignedIn, userMeLoading, userPacksData, userPacksLoading, server])

    const setStatus = (status: string) => {
        setServiceLoading(prev => {
            if (prev === status) return prev
            if (prev === 'proceeding') return prev
            return status
        })
    }

    const proceed = () => {
        if (error || serviceLoading === 'proceeding') return

        setStatus('proceeding')
        setLoading(false)
        setConnecting(false)

        const shouldShowNUE = userMeData && isProfileIncomplete(userMeData)
        if (shouldShowNUE) {
            setShowNUE(true)
        }
    }

    // Helper function to check if profile is incomplete
    const isProfileIncomplete = (userData: any) => {
        const hasValidDisplayName = userData?.display_name?.trim().length > 0
        const hasValidBio = userData?.about?.bio?.trim().length > 0

        return !hasValidDisplayName || !hasValidBio
    }
    return (
        <>
            {serviceLoading === 'proceeding' ? (
                <>
                    <Activity mode={isVisible(showNUE)}>
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
                    </Activity>

                    {children}
                </>
            ) : (
                <Body bodyClassName="h-full" className="!h-full items-center justify-center">
                    <LogoSpinner/>
                    <span className="text-sm mt-1">
                        <Activity
                            mode={isVisible(serviceLoading.startsWith('auth'))}>
                            Checking data...
                        </Activity>
                        <Activity
                            mode={isVisible(serviceLoading.startsWith('auth:@me'))}>
                            Getting profile...
                        </Activity>
                        <Activity mode={isVisible(serviceLoading.startsWith('cron'))}>Welcome!</Activity>
                        <Activity
                            mode={isVisible(!serviceLoading.startsWith('auth') && !serviceLoading.startsWith('cron'))}>
                            Get set...
                        </Activity>
                    </span>
                </Body>
            )}
        </>
    )
}
