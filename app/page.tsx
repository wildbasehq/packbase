'use client'
import Body from '@/components/layout/body'
import GuestLanding from '@/components/home/guestlanding'
import {useResourceUIStore, useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import {memo, useEffect, useState} from 'react'
import {Heading, Text} from '@/components/shared/text'
import girlDogBusStop from '@/datasets/lottie/girl-dog-bus-stop.json'
import dynamic from 'next/dynamic'
import FeedList from '@/components/shared/feed/list'
import {PartyPopperIcon} from 'lucide-react'
import {Button} from '@/components/shared/ui/button'
import {CheckBadgeIcon} from '@heroicons/react/24/solid'
import {Alert, AlertDescription, AlertTitle} from '@/components/shared/ui/alert'
import Modal from '@/components/modal'
import {BentoStaffBadge} from '@/lib/utils/pak'
import NewPost from '@/components/shared/user/new-post'
import Markdown from '@/components/shared/markdown'

export default function Home() {
    const {user} = useUserAccountStore()
    const {setHidden} = useResourceUIStore()
    const [notice, setNotice] = useState<any>(null)
    const Lottie = memo(dynamic(() => import('lottie-react'), {ssr: false, suspense: true}))
    const [showModal, setShowModal] = useState<boolean>(false)

    // useEffect(() => {
    //     if (!window || !user) return
    //     console.log('fetching notice')
    //     const supabase = createClient()
    //
    //     supabase.from('notice').select('*').then(({data, error}) => {
    //         if (error) {
    //             console.error(error)
    //         } else {
    //             if (data && data.length !== 0) {
    //                 setNotice(data[0])
    //             }
    //         }
    //     })
    // }, [])

    useEffect(() => {
        if (!user) setHidden(true)
    }, [user])
    return (
        <>
            <Body className="max-w-6xl">
                {!user && <GuestLanding/>}
                {notice && (
                    <div className="space-y-4 my-11 px-4 sm:px-6 lg:px-8">
                        <h2 className="text-base font-semibold leading-7 text-default">Updates from Yipnyap Team</h2>
                        <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                                <UserAvatar name={notice.author_username}/>
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <a href={`/@ttt`}
                                   className="font-medium text-default cursor-pointer hover:underline">
                                    {notice.author_username}
                                </a>
                                {/*<p className="text-sm text-default-alt cursor-pointer hover:underline">*/}
                                {/*    <ReactMarkdown>*/}
                                {/*    </ReactMarkdown>*/}
                                {/*</p>*/}
                            </div>
                        </div>
                        {notice.title && (
                            <Heading size="2xl">{notice.title}</Heading>
                        )}
                        <Markdown>
                            {notice?.content}
                        </Markdown>
                    </div>
                )}

                {user?.waitlistType === 'wait' && (
                    <>
                        <div
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mb-12 justify-center items-center">
                            <div className="flex flex-col space-y-4">
                                <Heading size="xl">
                                    So you've registered on the waitlist. Now what??
                                </Heading>
                                <div className="space-y-2">
                                    <Text className="text-sm text-default-alt">
                                        If you'd like to participate with the community, you'll need an invite from
                                        someone. As we have no "rolling invites", we allow
                                        users to gift invites to random (or specific) people in the waitlist~!
                                        <br/><br/>
                                        If you don't know anyone already in, your best bet is to wait.
                                        <span className="text-tertiary">
                                            If you've traded anything for an invite, you've been scammed.
                                        </span>
                                    </Text>
                                </div>

                                <Alert variant="success"
                                       className="select-none cursor-help hover:ring-4 ring-default transition-shadow"
                                       onClick={() => setShowModal(true)}>
                                    <CheckBadgeIcon
                                        className="h-5 w-5"/>
                                    <AlertTitle>
                                        Users created on this version are exempt from restrictions!
                                    </AlertTitle>
                                    <AlertDescription className="text-default-alt">
                                        The perks of being a test dummy. The stage's all yours, go wild! 🎉
                                    </AlertDescription>
                                </Alert>

                                <Modal showModal={showModal} setShowModal={setShowModal}>
                                    <div className="flex flex-col p-4 bg-card">
                                        <Heading size="xl">
                                            <PartyPopperIcon className="inline-flex mr-1 w-5 h-5"/>
                                            'sup volunteer
                                        </Heading>
                                        <Text className="mt-2">
                                            You work on this, nice.
                                            <br/><br/>
                                            On public release, you'll have a{' '} <BentoStaffBadge type="1" width={20} height={20} className="h-5 w-5 inline-flex"/>{' '}
                                            corgi badge next to your name (or a <BentoStaffBadge type="2" width={20} height={20} className="h-5 w-5 inline-flex"/> rainbow
                                            one if you're still with us 🫡)
                                        </Text>
                                        <Button variant="outline" className="mt-4" onClick={() => setShowModal(false)}>
                                            Got it
                                        </Button>
                                    </div>
                                </Modal>
                            </div>
                            <div className="flex items-end justify-end">
                                <Lottie className="h-80 w-auto right-0" animationData={girlDogBusStop}/>
                            </div>
                        </div>
                    </>
                )}
            </Body>

            {user && (
                <>
                    <NewPost/>
                    <div className="px-8">
                        <FeedList/>
                    </div>
                </>
            )}
        </>
    )
}
