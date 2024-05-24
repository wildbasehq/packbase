'use client'
import Body from '@/components/layout/body'
import GuestLanding from '@/components/home/guestlanding'
import {useUserAccountStore} from '@/lib/states'
import UserAvatar from '@/components/shared/user/avatar'
import ReactMarkdown from 'react-markdown'
import {useEffect, useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import {Heading} from '@/components/shared/text'
import Image from 'next/image'

export default function Home() {
    const {user} = useUserAccountStore()
    const [notice, setNotice] = useState<any>(null)
    const [serviceStatus, setServiceStatus] = useState<'dummy' | 'on' | 'warn' | 'error'>('dummy')

    const ServiceStates = {
        on: {
            dot: 'bg-green-400/20 text-green-400',
            status: 'Alive',
            text: 'Service is running normally'
        },
        warn: {
            dot: 'bg-yellow-400/20 text-yellow-400',
            status: 'Issues',
            text: 'Service is experiencing issues'
        },
        error: {
            dot: 'bg-red-400/20 text-red-400',
            status: 'Down',
            text: 'Service is down'
        },
        dummy: {
            dot: 'bg-neutral-400/20 text-neutral-400',
            status: 'Checking...',
            text: 'Checking...'
        }
    }

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
            <div
                className={`relative shadow-inner flex flex-col items-start justify-between gap-x-8 gap-y-4 border-b bg-sidebar px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8 ${serviceStatus === 'dummy' && 'before:animate-[shimmer_1s_linear_infinite] shimmer-template'}`}>
                <div>
                    <div className="flex items-center gap-x-3">
                        <div className={`flex-none rounded-md p-1 ${ServiceStates[serviceStatus].dot}`}>
                            {serviceStatus !== 'dummy' &&
                                <Image src={`/img/symbolic/net${serviceStatus}.symbolic.png`} width={24} height={24}
                                       alt="Service status"/>}
                            {serviceStatus === 'dummy' &&
                                <div className="w-6 h-6 bg-neutral-400/50 rounded-md animate-pulse"/>}
                        </div>
                        <h1 className="flex gap-x-3 text-base leading-7">
                            <span className="font-semibold text-default">Status</span>
                            <span className="text-default-alt">:</span>
                            <span className="font-semibold text-default">{ServiceStates[serviceStatus].status}</span>
                        </h1>
                    </div>
                    <p className="mt-2 text-xs leading-6 text-neutral-400">
                        {ServiceStates[serviceStatus].text}
                    </p>
                </div>
            </div>

            <Body>
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
