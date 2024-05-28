'use client'
import {useUserAccountStore} from '@/lib/states'
import {useEffect, useState} from 'react'
import {HandHeartIcon, ShieldAlertIcon} from 'lucide-react'
import {LoadingCircle} from '@/components/shared/icons'

const ServiceStates = {
    free: {
        icon: HandHeartIcon,
        status: 'Welcome!',
        text: 'If you\'re reading this, congrats~! Someone gifted you an invite code!'
    },
    ban: {
        icon: ShieldAlertIcon,
        status: 'Invite Revoked',
        text: 'Your invite was revoked as you violated our guidelines.'
    },
    wait: {
        icon: LoadingCircle,
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
    const {user} = useUserAccountStore()
    const [serviceStatus, setServiceStatus] = useState<'dummy' | 'free' | 'ban' | 'wait'>('dummy')

    useEffect(() => {
        setServiceStatus(user?.waitlistType || 'wait')
    }, [])

    const CurrentServiceIcon = ServiceStates[serviceStatus].icon
    if (!user) return
    return (
        <div
            className={`relative shadow-inner flex flex-col items-start justify-between gap-x-8 gap-y-4 border-b bg-sidebar px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8 ${serviceStatus === 'dummy' && 'before:animate-[shimmer_1s_linear_infinite] shimmer-template'}`}>
            <div>
                <div className="flex items-center gap-x-3">
                    <CurrentServiceIcon className="flex-none w-7 h-7 rounded-md p-1"/>
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
    )
}