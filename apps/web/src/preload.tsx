/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import SadComputerIcon from '@/components/icons/sad-computer'
import Body from '@/components/layout/body'
import {AppLoading} from '@/components/ui/app-loading'
import {isVisible, resourceDefaultPackbase, useResourceStore, useUIStore, useUserAccountStore} from '@/lib'
import {useContentFrame} from '@/lib/hooks/content-frame'
import {Button, Heading, Text} from '@/src/components'
import {useSession} from '@clerk/clerk-react'
import {Activity, ReactNode, useEffect, useState} from 'react'

export default function Preload({children}: { children: ReactNode }) {
    return (
        <>
            <PreloadChild>{children}</PreloadChild>
        </>
    )
}

function PreloadChild({children}: { children: ReactNode }) {
    const [serviceLoading, setServiceLoading] = useState<string>(`auth`)
    const [error, setError] = useState<any | null>(null)

    const {setUser, setSettings} = useUserAccountStore()
    const {setLoading, setConnecting, setBucketRoot, setMaintenance, setServerCapabilities} = useUIStore()
    const {setResources, setCurrentResource, setResourceDefault} = useResourceStore()
    const {session, isSignedIn, isLoaded} = useSession()

    const hasAdditionalContext = JSON.parse(document.getElementById('__ADDITIONAL_CONTEXT')?.textContent || '{}')

    const {data: userMeData, isLoading: userMeLoading} = useContentFrame('get', 'user.me', undefined, {
        id: 'user.me',
        enabled: isSignedIn && !hasAdditionalContext?.user,
        initialData: hasAdditionalContext?.user,
    })

    const {data: userMeSettingsData, isLoading: userMeSettingsLoading} = useContentFrame('get', 'user.me.settings', undefined, {
        id: 'user.me.settings',
        enabled: isSignedIn && !hasAdditionalContext?.settings,
        initialData: hasAdditionalContext?.settings,
    })

    const {data: userPacksData, isLoading: userPacksLoading} = useContentFrame('get', 'user.me.packs', undefined, {
        id: 'user.me.packs',
        enabled: isSignedIn && !hasAdditionalContext?.packs,
        initialData: hasAdditionalContext?.packs,
    })

    const {data: server} = useContentFrame('get', 'server.describeServer', undefined, {
        id: 'server.describeServer',
    })

    useEffect(() => {
        if (userPacksData && !userPacksLoading) {
            setResources(userPacksData)
        }

        if (!isLoaded || !server) return
        if (isSignedIn && (userMeLoading || userPacksLoading || userMeSettingsLoading)) return
        // if (!serviceLoading.startsWith('auth')) return

        if (hasAdditionalContext?.user) {
            log.info('Preload', 'Server sent additional context, no need to call user/me.')
        }
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
            setSettings(userMeSettingsData)
            setResourceDefault(userMeData.default_pack || resourceDefaultPackbase)

            if (!window.location.pathname.startsWith('/p/')) {
                // Force select default pack
                setCurrentResource(userMeData.default_pack || resourceDefaultPackbase)
            }

            proceed()
        } else {
            setUser(null)
            setSettings(null)
            setResources([])
            setResourceDefault(resourceDefaultPackbase)
            setCurrentResource(resourceDefaultPackbase)
            proceed()
        }
    }, [session, isSignedIn, userMeLoading, userMeSettingsLoading, userPacksData, userPacksLoading, server])

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
            <AppLoading loaded={serviceLoading === 'proceeding'}>
                {children}
            </AppLoading>
        </>
    )
}
