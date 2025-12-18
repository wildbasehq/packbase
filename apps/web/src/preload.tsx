/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Body from '@/components/layout/body'
import {isVisible, resourceDefaultPackbase, useResourceStore, useUIStore, useUserAccountStore} from '@/lib'
import React, {Activity, ReactNode, useEffect, useState} from 'react'
import {SignedIn, SignedOut, useSession} from '@clerk/clerk-react'
import {Button, Heading, LogoSpinner, Text} from '@/src/components'
import {useContentFrame} from '@/lib/hooks/content-frame.tsx'
import SadComputerIcon from "@/components/icons/sad-computer.tsx";

export default function Preload({children}: { children: ReactNode }) {
    return (
        <>
            <SignedIn>
                <PreloadChild>{children}</PreloadChild>
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

    const {setUser} = useUserAccountStore()
    const {setLoading, setConnecting, setBucketRoot, setMaintenance, setServerCapabilities} = useUIStore()
    const {setResources, setCurrentResource, setResourceDefault} = useResourceStore()
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
            setStatus('auth:@me')

            if (!userMeData) {
                // Already has failed mechanism?
                if (window.location.search.includes('failed_mechanism=auth_profile')) {
                    setError({
                        cause: 'Failed to load user profile',
                        message: 'There was an issue loading your profile. Packbase already attempted to resolve this automatically and failed. Please contact support.\n\nThe servers are online.',
                    })

                    return
                }

                // Redirect with query param `falied_mechanism=auth_profile`
                window.location.href = `/me?failed_mechanism=auth_profile`
                return
            }

            if (userMeData.requires_switch && !window.location.pathname.startsWith('/p/universe/sunset')) {
                window.location.pathname = '/p/universe/sunset'
                return
            }

            setUser(userMeData)
            setResourceDefault(userMeData.default_pack || resourceDefaultPackbase)

            if (!window.location.pathname.startsWith('/p/')) {
                // Force select default pack
                setCurrentResource(userMeData.default_pack)
            }

            proceed()
        } else {
            setUser(null)
            setResources([])
            setResourceDefault(resourceDefaultPackbase)
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
    }

    return (
        <>
            <Activity mode={isVisible(error)}>
                <Body bodyClassName="h-full" className="h-full! items-center justify-center">
                    <div className="max-w-md">
                        <SadComputerIcon className="h-12 w-fit mx-auto"/>
                        <Heading className="mb-4 text-2xl">
                            {error?.cause}
                        </Heading>
                        <Text className="mb-4">{error?.message || 'An unknown error occurred.'}</Text>
                        <Button
                            onClick={() => window.location.href = '/'}
                        >
                            Hard Reset
                        </Button>
                    </div>
                </Body>
            </Activity>

            {serviceLoading === 'proceeding' ? (
                <>
                    {children}
                </>
            ) : (
                <Body bodyClassName="h-full" className="h-full! items-center justify-center">
                    <LogoSpinner/>
                    <span className="text-sm mt-1">
                        <Activity
                            mode={isVisible(serviceLoading === 'auth')}>
                            Checking data...
                        </Activity>
                        <Activity
                            mode={isVisible(serviceLoading === 'auth:@me')}>
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
