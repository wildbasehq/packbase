'use client'

import Body from '@/components/layout/body'
import { LoadingDots } from '@/components/shared/icons'
import { Heading } from '@/components/shared/text'
import { API_URL, setToken, vg } from '@/lib/api'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/states'
import { createClient } from '@/lib/supabase/client'
import { ProjectSafeName } from '@/lib/utils'
import { HandRaisedIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const supabase = createClient()
export default function Preload({ children }: { children: React.ReactNode }) {
    const [serviceLoading, setServiceLoading] = useState<string>(`polling ${API_URL}`)
    const [error, setError] = useState<any | null>(null)
    const { setUser } = useUserAccountStore()
    const { setLoading, setConnecting, setBucketRoot } = useUIStore()
    const { setResources } = useResourceStore()

    useEffect(() => {
        if (!serviceLoading.startsWith('polling')) return
        vg.server.describeServer
            .get()
            .then((server) => {
                setBucketRoot(server.data.bucketRoot)
                setServiceLoading('auth')
                // @ts-ignore
                supabase.auth.getUser().then(async ({ data: { user } }) => {
                    if (user) {
                        setToken(await supabase.auth.getSession().then(({ data }) => data?.session?.access_token))
                        setServiceLoading('auth:@me')
                        vg.user.me
                            .get()
                            .then(async ({ data }) => {
                                setServiceLoading('auth:@me:packs')
                                const packs = (await vg.user.me.packs.get()).data || []
                                const dipswitch = (await vg.dipswitch.get()).data || []
                                let userBuild = {
                                    id: user.id,
                                    username: data?.username || user.email,
                                    display_name: data?.display_name || user.email,
                                    reqOnboard: !data || !data?.username,
                                    dp: dipswitch,
                                    ...data,
                                }

                                setResources(packs)

                                if (user.user_metadata.waitlistType !== 'free') {
                                    // Assume they're in the waitlist
                                    const waitlistType = user.user_metadata.waitlistType || 'wait'
                                    userBuild = {
                                        ...userBuild,
                                        waitlistType,
                                        anonUser: ['wait', 'ban'].includes(waitlistType),
                                    }
                                }

                                setUser(userBuild)
                                proceed()
                            })
                            .catch((e) => {
                                supabase.auth.signOut()
                            })
                    } else {
                        setUser(null)
                        proceed()
                    }
                })
            })
            .catch((e) => {
                console.log(e)
                if (e?.message.indexOf('Failed') > -1)
                    return setError({
                        cause: 'UI & Server could not talk together',
                        message: `${ProjectSafeName} is offline, or your network is extremely unstable.`,
                    })
                return setError(e)
            })
    }, [])

    const proceed = () => {
        if (error) return
        setServiceLoading('proceeding')
        setLoading(false)
        setConnecting(false)
    }

    return (
        <>
            {serviceLoading === 'proceeding' ? (
                children
            ) : (
                <Body className="h-full items-center justify-center">
                    <div className="flex max-w-md flex-col">
                        {!error && (
                            <>
                                <Heading className="items-center">
                                    <Image
                                        src="/img/ghost-dog-in-box.gif"
                                        alt="Animated pixel dog in box panting before falling over, then looping."
                                        height={32}
                                        width={38}
                                        unoptimized
                                        style={{
                                            imageRendering: 'pixelated',
                                            display: 'inline-block',
                                            marginTop: '-1px',
                                            marginRight: '4px',
                                        }}
                                    />
                                    Preparing...
                                </Heading>
                                <p className="text-alt mt-1 text-sm leading-6">
                                    {ProjectSafeName} is asking the server for information about you &amp; the service. This will get saved in your browser{"'"}s{' '}
                                    <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage" target="_blank" rel="noopener noreferrer">
                                        session storage
                                    </a>
                                    .
                                </p>
                                <div className="mt-4 flex space-x-1">
                                    <LoadingDots className="mt-1" />
                                    <span>{serviceLoading}</span>
                                </div>
                            </>
                        )}

                        {error && (
                            <>
                                <Heading className="items-center">
                                    <HandRaisedIcon className="text-default mr-1 inline-block h-6 w-6" />
                                    {ProjectSafeName} can't continue
                                </Heading>
                                <p className="text-alt mt-1 text-sm leading-6">
                                    {error.cause || 'Something went wrong'}: {error.message || error.stack}
                                </p>
                            </>
                        )}
                    </div>
                </Body>
            )}
        </>
    )
}
