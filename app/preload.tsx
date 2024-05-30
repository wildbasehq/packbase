'use client'

import Image from 'next/image'
import {LoadingDots} from '@/components/shared/icons'
import {useEffect, useState} from 'react'
import {ProjectName} from '@/lib/utils'
import {Heading} from '@/components/shared/text'
import {createClient} from '@/lib/supabase/client'
import {useResourceUIStore, useUserAccountStore} from '@/lib/states'
import Body from '@/components/layout/body'
import {HandRaisedIcon} from '@heroicons/react/20/solid'

const supabase = createClient()
export default function Preload({children}: {
    children: React.ReactNode
}) {
    const [serviceLoading, setServiceLoading] = useState<string>('waiting for client')
    const [error, setError] = useState<any | null>(null)
    const [dummy] = useState<any>(null)
    const {setUser} = useUserAccountStore()
    const {setLoading} = useResourceUIStore()

    useEffect(() => {
        if (serviceLoading !== 'waiting for client') return
        setServiceLoading('auth')
        // @ts-ignore
        supabase.auth.getUser().then(async ({data: {user}}) => {
            console.log({user})
            if (user) {
                const {data, error} = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .limit(1)
                    .single()

                if (user.user_metadata.waitlistType !== 'free') {
                    // Assume they're in the waitlist
                    const waitlistType = user.user_metadata.waitlistType || 'wait'
                    setUser({
                        id: user.id,
                        username: data?.username || user.email,
                        displayName: data?.displayName || user.email,
                        waitlistType,
                        anonUser: ['wait', 'ban'].includes(waitlistType)
                    })
                } else {
                    setUser({
                        id: user.id,
                        username: data?.username || user.email,
                        displayName: data?.displayName || user.email,
                    })
                }
            }
            proceed()
        })
    }, [dummy])

    const proceed = () => {
        if (error) return
        setServiceLoading('proceeding')
        setLoading(false)
    }

    return (
        <>
            {serviceLoading === 'proceeding' ? children : (
                <Body className="justify-center items-center h-full">
                    <div className="flex flex-col max-w-md">
                        {!error && (
                            <>
                                <Heading className="items-center">
                                    <Image src="/img/ghost-dog-in-box.gif"
                                           alt="Animated pixel dog in box panting before falling over, then looping."
                                           height={32}
                                           width={38}
                                           style={{
                                               imageRendering: 'pixelated',
                                               display: 'inline-block',
                                               marginTop: '-1px',
                                               marginRight: '4px',
                                           }}
                                    />
                                    Preparing...
                                </Heading>
                                <p className="mt-1 text-sm leading-6 text-alt">
                                    {ProjectName} is asking the server for information about you &amp; the service. This
                                    will get saved in your browser{'\''}s <a
                                    href="https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage"
                                    target="_blank" rel="noopener noreferrer">session storage</a>.
                                </p>
                                <div className="flex mt-4 space-x-1">
                                    <LoadingDots className="mt-1"/>
                                    <span>{serviceLoading}</span>
                                </div>
                            </>
                        )}

                        {error && (
                            <>
                                <Heading className="items-center">
                                    <HandRaisedIcon className="h-6 w-6 mr-1 text-default inline-block"/>
                                    {ProjectName} can't continue
                                </Heading>
                                <p className="mt-1 text-sm leading-6 text-alt">
                                    {error.cause || 'Something went wrong'}: {error.message}
                                </p>
                            </>
                        )}
                    </div>
                </Body>
            )}
        </>
    )
}