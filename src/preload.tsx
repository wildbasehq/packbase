import Body from '@/components/layout/body'
import {LoadingDots} from '@/components/icons'
import {Heading} from '@/components/shared/text'
import {API_URL, setToken, supabase, vg} from '@/lib/api'
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/states'
import {ProjectSafeName} from '@/lib/utils'
import {HandRaisedIcon} from '@heroicons/react/20/solid'
import {useEffect, useState} from 'react'
import {getSelfProfile} from '@/lib/api/cron/profile-update.ts'

export default function Preload({children}: { children: React.ReactNode }) {
    const [serviceLoading, setServiceLoading] = useState<string>(`polling ${API_URL}`)
    const [error, setError] = useState<any | null>(null)
    const {setUser} = useUserAccountStore()
    const {setLoading, setConnecting, setBucketRoot, setMaintenance, queueWorker, completeWorker} = useUIStore()
    const {setResources} = useResourceStore()

    useEffect(() => {
        if (!serviceLoading.startsWith('polling')) return
        vg.server.describeServer
            .get()
            .then((server) => {
                setBucketRoot(server.data.bucketRoot)
                setMaintenance(server.data.maintenance)
                setStatus('auth')
                // @ts-ignore
                supabase.auth.getSession().then(async ({data: {session}}) => {
                    const {user, access_token, expires_in} = session || {}
                    if (user) {
                        setToken(access_token, expires_in)
                        setStatus('auth:@me')
                        const localUser = localStorage.getItem('user-account')
                        if (localUser) {
                            const json = JSON.parse(localUser)
                            if (json.state.user) {
                                const packs = localStorage.getItem('packs')
                                if (packs) setResources(JSON.parse(packs))
                                setUser(json.state.user)
                                proceed()
                            }
                        }

                        getSelfProfile(() => {
                            proceed()
                        })
                    } else {
                        setUser(null)
                        proceed()
                    }
                })
            })
            .catch((e) => {
                log.error('Core', e)
                if (e?.message.indexOf('Failed') > -1)
                    return setError({
                        cause: 'UI & Server could not talk together',
                        message: `${ProjectSafeName} is offline, or your network is extremely unstable.`,
                    })
                return setError(e)
            })
    }, [])

    const setStatus = (status: string) => {
        setServiceLoading((prev) => {
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
                <Body className="h-full items-center justify-center">
                    <div className="flex max-w-md flex-col">
                        {!error && (
                            <>
                                <Heading className="items-center">
                                    <img
                                        src="/img/ghost-dog-in-box.gif"
                                        alt="Animated pixel dog in box panting before falling over, then looping."
                                        className="h-6 inline-block"
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
                                    {ProjectSafeName} is asking the server for information about you &amp; the service. This will get saved in your browser{'\''}s{' '}
                                    <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage" target="_blank" rel="noopener noreferrer">
                                        session storage
                                    </a>
                                    .
                                </p>
                                <div className="mt-4 flex space-x-1">
                                    <LoadingDots className="mt-1"/>
                                    <span>{serviceLoading}</span>
                                </div>
                            </>
                        )}

                        {error && (
                            <>
                                <Heading className="items-center">
                                    <HandRaisedIcon className="text-default mr-1 inline-block h-6 w-6"/>
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
