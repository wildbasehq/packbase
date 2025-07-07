/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Body from '@/components/layout/body'
import { setToken, vg } from '@/lib/api'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib'
import { useEffect, useState } from 'react'
import { useSession } from '@clerk/clerk-react'
import { LogoSpinner, useContentFrame } from '@/src/components'
import ContentFrame from '@/components/shared/content-frame.tsx'

export default function Preload({ children }: { children: React.ReactNode }) {
    return (
        <ContentFrame get="user.me" cache silentFail>
            <PreloadChild>{children}</PreloadChild>
        </ContentFrame>
    )
}

function PreloadChild({ children }: { children: React.ReactNode }) {
    const [serviceLoading, setServiceLoading] = useState<string>(`auth`)
    const [error, setError] = useState<any | null>(null)
    const { setUser } = useUserAccountStore()
    const { setLoading, setConnecting, setBucketRoot, setMaintenance, setServerCapabilities } = useUIStore()
    const { setResources } = useResourceStore()
    const { data: userMeData, loading } = useContentFrame('get=user.me')

    const { session, isSignedIn, isLoaded } = useSession()

    useEffect(() => {
        if (!isLoaded || loading) return
        // if (!serviceLoading.startsWith('auth')) return
        vg.server.describeServer
            .get()
            .then(server => {
                setBucketRoot(server.data.bucketRoot)
                setMaintenance(server.data.maintenance)
                setServerCapabilities(server.data.capabilities || [])

                if (server.data.maintenance) {
                    return setError({
                        cause: 'Server is under maintenance',
                        message: server.data.maintenance || `Packbase is currently under maintenance. Please check back later.`,
                    })
                }

                setUser(userMeData)

                if (isSignedIn) {
                    session.getToken().then(token => {
                        setToken(token)
                        setStatus('auth:@me')

                        proceed()
                    })
                } else {
                    setUser(null)
                    proceed()
                }
            })
            .catch(e => {
                log.error('Core', e)
                setStatus('proceeding')
                if (e?.message.indexOf('Failed') > -1)
                    return setError({
                        cause: 'UI & Server could not talk together',
                        message: `Packbase is offline, or your network is extremely unstable.`,
                    })
                return setError(e)
            })
    }, [session, isSignedIn, loading])

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
    }

    return (
        <>
            {serviceLoading === 'proceeding' ? (
                children
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
