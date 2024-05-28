'use client'
import Body from '@/components/layout/body'
import GuestLanding from '@/components/home/guestlanding'
import {useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import ReactMarkdown from 'react-markdown'
import {useState} from 'react'
import {Heading, Text} from '@/components/shared/text'
import GirlDogImg from '@/public/img/illustrations/girl-dog-rain.gif'
import Image from 'next/image'

export default function Home() {
    const {user} = useUserAccountStore()
    const [notice, setNotice] = useState<any>(null)

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
                        <ReactMarkdown>
                            {notice?.content}
                        </ReactMarkdown>
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
                                        someone. As we have no "rolling invites", we allow users to gift invites to
                                        random (or specific) people in the waitlist~!
                                        <br/><br/>
                                        If you don't know anyone already in, your best bet is to wait. <span
                                        className="text-tertiary">
                                        If you've traded anything for an invite, you've been scammed.
                                    </span>
                                    </Text>
                                </div>
                            </div>
                            <div className="flex items-end justify-end">
                                <Image src={GirlDogImg} alt="tt"
                                       className="w-auto right-0"/>
                            </div>
                        </div>
                    </>
                )}
            </Body>
        </>
    )
}
