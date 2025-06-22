/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Body from '@/components/layout/body'
import { setToken, vg } from '@/lib/api'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/index'
import { useEffect, useState } from 'react'
import { useSession } from '@clerk/clerk-react'
import { getSelfProfile } from '@/lib/api/cron/profile-update.ts'
import { LogoSpinner } from '@/src/components'

export default function Preload({ children }: { children: React.ReactNode }) {
    const [serviceLoading, setServiceLoading] = useState<string>(`auth`)
    const [error, setError] = useState<any | null>(null)
    const { setUser } = useUserAccountStore()
    const { setLoading, setConnecting, setBucketRoot, setMaintenance, setServerCapabilities } = useUIStore()
    const { setResources } = useResourceStore()

    const { session, isSignedIn, isLoaded } = useSession()

    useEffect(() => {
        if (!isLoaded) return
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

                if (isSignedIn) {
                    session.getToken().then(token => {
                        setToken(token, session.expireAt.getTime())
                        setStatus('auth:@me')
                        const localUser = localStorage.getItem('user-account')
                        if (localUser) {
                            const json = JSON.parse(localUser)
                            if (json.state.user) {
                                console.log('Found local user', json.state.user)
                                const packs = localStorage.getItem('packs')
                                if (packs) setResources(JSON.parse(packs))
                                setUser(json.state.user)
                                proceed()
                            }
                        }

                        getSelfProfile(() => {
                            proceed()
                        })
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
    }, [session, isSignedIn])

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
