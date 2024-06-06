'use client'
import './waitlist-check.component.scss'
import {useUserAccountStore} from '@/lib/states'
import {useEffect, useState} from 'react'
import {HandHeartIcon, LucideIcon, MailQuestionIcon, MailWarningIcon} from 'lucide-react'
import {LoadingCircle} from '@/components/shared/icons'
import {cn} from '@/lib/utils'
import Image from 'next/image'
import Dog from '@/public/svg/illustrate/dog.svg'
import {usePathname} from 'next/navigation'

const ServiceStates: {
    [x: string]: {
        icon: typeof LoadingCircle | LucideIcon,
        color?: string
        status: string
        text: string
    }
} = {
    free: {
        icon: HandHeartIcon,
        color: 'text-green-500',
        status: 'Welcome!',
        text: 'Someone gifted you an invite code! Complete the steps in home to get started~'
    },
    ban: {
        icon: MailWarningIcon,
        color: 'text-red-500',
        status: 'Invite Revoked',
        text: 'Your invite was revoked as you violated our guidelines.'
    },
    wait: {
        icon: MailQuestionIcon,
        color: 'text-orange-500',
        status: 'Waiting',
        text: 'You\'re on the waitlist. You\'ll need an invite code from someone, or wait for us to open.'
    },
    dummy: {
        icon: LoadingCircle,
        status: 'Checking...',
        text: 'Checking...'
    }
}

export default function WaitlistCheck() {
    const location = usePathname()
    const {user} = useUserAccountStore()
    const [serviceStatus, setServiceStatus] = useState<'dummy' | 'free' | 'ban' | 'wait'>('dummy')

    useEffect(() => {
        setServiceStatus(user?.waitlistType || 'wait')
    }, [location, user])

    const CurrentServiceIcon = ServiceStates[serviceStatus].icon
    if (!user) return (<></>)
    return (
        <div
            className={`relative select-none shadow-sm flex items-start justify-between gap-x-8 gap-y-4 border-b bg-sidebar px-4 py-4 overflow-hidden sm:flex-row sm:items-center sm:px-6 lg:px-8 ${serviceStatus === 'dummy' && 'before:animate-[shimmer_1s_linear_infinite] shimmer-template'}`}>
            <div>
                <div className="flex items-center gap-x-3">
                    <CurrentServiceIcon
                        className={cn('flex-none w-7 h-7 rounded-md p-1', ServiceStates[serviceStatus].color || '')}/>
                    <h1 className="flex gap-x-3 text-base leading-7">
                        <span className="font-semibold text-default">Status</span>
                        <span className="text-default-alt">:</span>
                        <span className="font-semibold text-default">{ServiceStates[serviceStatus].status}</span>
                    </h1>
                </div>
                <p className="mt-2 text-xs leading-6 text-default-alt">
                    {ServiceStates[serviceStatus].text}
                </p>
            </div>

            {location !== '/' && (
                <div className="flex-none w-24 h-12 sm:w-32 elastic-bounce pointer-events-none">
                    <Image src={Dog} alt="Dog" layout="responsive"/>
                </div>
            )}
        </div>
    )
}