'use client'
import Body from '@/components/layout/body'
import { useUIStore, useUserAccountStore } from '@/lib/states'
import { useEffect, useState } from 'react'
import { Heading, Text } from '@/components/shared/text'
import FeedList from '@/components/shared/feed/list'
import { Alert, AlertDescription, AlertTitle } from '@/components/shared/ui/alert'
import { CheckBadgeIcon } from '@heroicons/react/20/solid'
import Modal from '@/components/modal'
import { PartyPopperIcon } from 'lucide-react'
import { BentoStaffBadge } from '@/lib/utils/pak'
import { Button } from '@/components/shared/ui/button'
import { LoadingCircle } from '@/components/shared/icons'
import { FetchHandler } from '@/lib/api'
import PackHeader from '@/components/shared/pack/header'
import dynamic from 'next/dynamic'

const GuestLanding = dynamic(() => import('@/components/home/guestlanding'))

export default function Home({ params }: { params: { slug: string } }) {
    const { user } = useUserAccountStore()
    const { setHidden } = useUIStore()
    // const Lottie = memo(dynamic(() => import('lottie-react'), { ssr: false, suspense: true }))
    const [showModal, setShowModal] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [, setError] = useState<string | null>(null)
    const [pack, setPack] = useState()

    useEffect(() => {
        if (!user) setHidden(true)
    }, [user])

    useEffect(() => {
        FetchHandler.get(`/xrpc/app.packbase.pack.get?id=${params.slug}`)
            .then(({ data }) => {
                if (!data || data.message) return setError('failed')
                setLoading(false)
                setPack(data)
            })
            .catch((e) => {
                setError(e)
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
                    <PackHeader pack={pack} />
                    <Body className="max-w-6xl">
                        {user?.waitlistType === 'wait' && (
                            <>
                                <div className="mb-12 grid max-w-6xl grid-cols-1 items-center justify-center gap-8 lg:grid-cols-2">
                                    <div className="flex flex-col space-y-4">
                                        <Heading size="xl">So you've registered on the waitlist. Now what??</Heading>
                                        <div className="space-y-2">
                                            <Text className="text-default-alt text-sm">
                                                If you'd like to participate with the community, you'll need an invite from someone. As we have no "rolling invites", we
                                                allow users to gift invites to random (or specific) people in the waitlist~!
                                                <br />
                                                <br />
                                                If you don't know anyone already in, your best bet is to wait.{' '}
                                                <span className="text-tertiary">If you've traded anything for an invite, you've been scammed.</span>
                                            </Text>
                                        </div>

                                        <Alert
                                            variant="success"
                                            className="ring-default cursor-help select-none transition-shadow hover:ring-4"
                                            onClick={() => setShowModal(true)}
                                        >
                                            <CheckBadgeIcon className="h-5 w-5" />
                                            <AlertTitle>Users created on this version are exempt from restrictions!</AlertTitle>
                                            <AlertDescription className="text-default-alt">
                                                The perks of being a test dummy. The stage's all yours, go wild! 🎉
                                            </AlertDescription>
                                        </Alert>

                                        <Modal showModal={showModal} setShowModal={setShowModal}>
                                            <div className="flex flex-col bg-card p-4">
                                                <Heading size="xl">
                                                    <PartyPopperIcon className="mr-1 inline-flex h-5 w-5" />
                                                    'sup volunteer
                                                </Heading>
                                                <Text className="mt-2">
                                                    You work on this, nice.
                                                    <br />
                                                    <br />
                                                    On public release, you'll have a <BentoStaffBadge
                                                        type="1"
                                                        width={20}
                                                        height={20}
                                                        className="inline-flex h-5 w-5"
                                                    />{' '}
                                                    corgi badge next to your name (or a{' '}
                                                    <BentoStaffBadge type="2" width={20} height={20} className="inline-flex h-5 w-5" /> rainbow one if you're still with
                                                    us 🫡)
                                                </Text>
                                                <Button variant="outline" className="mt-4" onClick={() => setShowModal(false)}>
                                                    Got it
                                                </Button>
                                            </div>
                                        </Modal>
                                    </div>
                                    <div className="flex items-end justify-end">
                                        some dog animation
                                        {/*<Lottie className="right-0 h-80 w-auto" animationData={LottieAnimationData} />*/}
                                    </div>
                                </div>
                            </>
                        )}
                    </Body>

                    {user && (
                        <div className="px-8">
                            <FeedList packID={params.slug} />
                        </div>
                    )}
                </>
            )}
        </>
    )
}
