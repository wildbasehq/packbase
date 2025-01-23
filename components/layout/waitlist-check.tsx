'use client'
import './waitlist-check.component.scss'
import { useUserAccountStore } from '@/lib/states'
import { useEffect, useState } from 'react'
import { HandHeartIcon, LucideIcon, MailQuestionIcon, MailWarningIcon } from 'lucide-react'
import { LoadingCircle } from '@/components/shared/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Dog from '@/public/svg/illustrate/dog.svg'
import { usePathname } from 'next/navigation'

const ServiceStates: {
    [x: string]: {
        icon: typeof LoadingCircle | LucideIcon
        color?: string
        status: string
        text: string
    }
} = {
    free: {
        icon: HandHeartIcon,
        color: 'text-green-500',
        status: 'Welcome!',
        text: 'Someone gifted you an invite code! Complete the steps in home to get started~',
    },
    ban: {
        icon: MailWarningIcon,
        color: 'text-red-500',
        status: 'Invite Revoked',
        text: 'Your invite was revoked as you violated our guidelines.',
    },
    wait: {
        icon: MailQuestionIcon,
        color: 'text-orange-500',
        status: 'Waiting',
        text: "You're on the waitlist. You'll need an invite code from someone, or wait for us to open.",
    },
    dummy: {
        icon: LoadingCircle,
        status: 'Checking...',
        text: 'Checking...',
    },
}

export default function WaitlistCheck() {
    const location = usePathname()
    const { user } = useUserAccountStore()
    const [serviceStatus, setServiceStatus] = useState<'dummy' | 'free' | 'ban' | 'wait'>('dummy')

    useEffect(() => {
        setServiceStatus(user?.waitlistType || 'wait')
    }, [location, user])

    const CurrentServiceIcon = ServiceStates[serviceStatus].icon
    if (!user) return <></>
    return (
        <div
            className={`bg-sidebar relative flex select-none items-start justify-between gap-x-8 gap-y-4 overflow-hidden border-b px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:px-6 lg:px-8 ${
                serviceStatus === 'dummy' && 'shimmer-template before:animate-[shimmer_1s_linear_infinite]'
            }`}
        >
            <div>
                <div className="flex items-center gap-x-3">
                    <CurrentServiceIcon className={cn('h-7 w-7 flex-none rounded-md p-1', ServiceStates[serviceStatus].color || '')} />
                    <h1 className="flex gap-x-3 text-base leading-7">
                        <span className="text-default font-semibold">Status</span>
                        <span className="text-alt">:</span>
                        <span className="text-default font-semibold">{ServiceStates[serviceStatus].status}</span>
                    </h1>
                </div>
                <p className="text-alt mt-2 text-xs leading-6">{ServiceStates[serviceStatus].text}</p>
            </div>

            {location !== '/' && (
                <div className="elastic-bounce pointer-events-none h-12 w-24 flex-none sm:w-32">
                    <Image src={Dog} alt="Dog" layout="responsive" />
                </div>
            )}
        </div>
    )
}
