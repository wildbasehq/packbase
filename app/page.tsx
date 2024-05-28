'use client'
import Body from '@/components/layout/body'
import GuestLanding from '@/components/home/guestlanding'
import {useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import ReactMarkdown from 'react-markdown'
import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {Heading} from '@/components/shared/text'

export default function Home() {
    const {user} = useUserAccountStore()
    const [notice, setNotice] = useState<any>(null)

    useEffect(() => {
        if (!window || !user) return
        console.log('fetching notice')
        const supabase = createClient()

        supabase.from('notice').select('*').then(({data, error}) => {
            if (error) {
                console.error(error)
            } else {
                if (data && data.length !== 0) {
                    setNotice(data[0])
                }
            }
        })
    }, [])

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
            </Body>
        </>
    )
}
