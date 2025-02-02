'use client'
import FeedList from '@/components/shared/feed/list'
import { LoadingCircle } from '@/components/shared/icons'
import { vg } from '@/lib/api'
import { useUIStore, useUserAccountStore } from '@/lib/states'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const GuestLanding = dynamic(() => import('@/components/home/guestlanding'))
const PackHeader = dynamic(() => import('@/components/shared/pack/header'))

export default function Home({ params }: { params: { slug: string } }) {
    const { user } = useUserAccountStore()
    const { setHidden } = useUIStore()
    // const Lottie = memo(dynamic(() => import('lottie-react'), { ssr: false, suspense: true }))
    const [showModal, setShowModal] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [, setError] = useState<string | null>(null)
    const [pack, setPack] = useState<any>()

    useEffect(() => {
        if (!user) setHidden(true)
    }, [user])

    useEffect(() => {
        vg.pack({ id: params.slug })
            .get()
            .then(({ data }) => {
                if (!data || data?.message) {
                    setLoading(false)
                    return setError('failed')
                }
                setLoading(false)
                setPack(data)
            })
            .catch((e) => {
                setError(e)
                setLoading(false)
            })
    }, [])

    return (
        <>
            {!user && <GuestLanding />}

            {loading && (
                <div className="flex h-full items-center justify-center">
                    <LoadingCircle />
                </div>
            )}

            {!loading && (
                <>
                    {pack && pack?.slug !== 'universe' && <PackHeader pack={pack} />}

                    {user && (
                        <div className="p-8">
                            <FeedList packID={pack.id} />
                        </div>
                    )}
                </>
            )}
        </>
    )
}
