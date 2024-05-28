'use client'

import {Cog6ToothIcon, MinusCircleIcon, MoonIcon} from '@heroicons/react/24/solid'
import * as Accordion from '@radix-ui/react-accordion'
import {ChevronDownIcon} from '@heroicons/react/20/solid'
import {useUserAccountStore} from '@/lib/states'
import LogoutIcon from '@/components/shared/icons/logout'
import UserAvatar from '@/components/shared/user/avatar'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {createClient} from '@/lib/supabase/client'

export default function UserDropdown() {
    const {user, setUser} = useUserAccountStore()
    const router = useRouter()

    const UserOptions = [
        {
            name: 'Settings',
            icon: Cog6ToothIcon,
            onClick: () => {
                router.push('/settings')
            },
        },
        {
            name: 'Log out',
            icon: LogoutIcon,
            className: 'group-hover:text-accent-1 group-hover:fill-accent-1',
            onClick: () => {
                const supabase = createClient()
                supabase.auth.signOut().then(() => {
                    // clean session
                    window.localStorage.removeItem('token')
                    window.localStorage.removeItem('user-account')
                    window.location.reload()
                })
            },
        }
    ]

    const StatusOptions = [
        {
            id: 1,
            name: 'Online',
            className: 'bg-green-400',
        },
        {
            id: 2,
            name: 'Do not disturb',
            icon: MinusCircleIcon,
            className: 'text-accent-1',
        },
        {
            id: 3,
            name: 'Idle',
            icon: MoonIcon,
            className: 'text-accent-5',
        },
        {
            id: 0,
            name: 'Invisible',
            className: 'bg-n-5',
        },
    ]

    const currentStatus = StatusOptions.find((option) => option.id === user.status) || StatusOptions[0]

    return (
        <div
            className="flex flex-col w-96 self-center p-4 gap-3 bg-n-1 dark:bg-n-6 unicorn:bg-surface-container low-fidelity:bg-n-1 low-fidelity:dark:bg-n-6">
            <div className="w-full justify-start items-center gap-4 inline-flex">
                <div className="w-16 h-16 relative">
                    <UserAvatar user={user} size="3xl"/>
                    <div
                        className="w-6 h-6 p-1 left-10 top-10 rounded absolute justify-center items-center inline-flex bg-n-1 dark:bg-n-6">
                        {currentStatus.icon && (
                            <currentStatus.icon className={`w-full h-full ${currentStatus.className}`}/>
                        )}

                        {!currentStatus.icon && (
                            <div className={`w-3.5 h-3.5 ${currentStatus.className} rounded-full`}/>
                        )}
                    </div>
                </div>
                <Link href={`/@${user.username}/`} className="flex-col inline-flex items-center">
                    <div
                        className="self-stretch text-default text-lg font-semibold">{user.display_name || user.username}</div>
                    <div className="self-stretch text-alt text-xs font-medium leading-tight">@{user.username}</div>
                </Link>
            </div>

            {/* notice banner */}
            {/*<div className="inline-flex justify-start items-center gap-4 w-full px-4 py-2 border border-accent-1/25 bg-n-2 dark:bg-n-7 bg-opacity-50 rounded-xl">*/}
            {/*  <ExclamationTriangleIcon className="w-6 h-6 text-accent-1" />*/}
            {/*  <div className="px-4 py-3 text-alt text-opacity-75 text-sm">*/}
            {/*    Feral is still WIP. This is not a real account.*/}
            {/*  </div>*/}
            {/*</div>*/}

            <div
                className="inline-flex flex-col w-full bg-n-2 dark:bg-n-7 unicorn:bg-surface-container-low bg-opacity-95 border rounded-xl">
                <Accordion.Root
                    className="w-full"
                    type="single"
                    collapsible
                >
                    <Accordion.Item value="status">
                        <Accordion.Header asChild>
                            <Accordion.Trigger
                                className="AccordionTrigger w-full px-4 py-3 bg-n-2/50 dark:bg-n-6/50 bg-opacity-50 unicorn:bg-surface-container/50 rounded-tl-xl rounded-tr-xl justify-between items-start inline-flex">
                                <div className="justify-center items-center gap-4 flex">
                                    {currentStatus.icon && (
                                        <div className="w-6 h-6 p-0.5 justify-center items-center">
                                            <currentStatus.icon
                                                className={`${currentStatus.className || 'fill-alt'} w-full h-full transition-colors`}/>
                                        </div>
                                    )}

                                    {!currentStatus.icon && (
                                        <div className="w-6 h-6 p-1 justify-center items-center">
                                            <div
                                                className={`w-full h-full ${currentStatus.className || 'bg-n-5'} rounded-full`}/>
                                        </div>
                                    )}
                                    <div className="text-sm text-on-surface-variant">{currentStatus.name}</div>
                                </div>
                                <ChevronDownIcon className="AccordionChevron w-5 h-5 self-center text-body"/>
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="AccordionContent flex flex-col overflow-hidden">
                            {/* status options, except current one */}
                            {StatusOptions.filter((option) => option.id !== user.status).map((option, i) => (
                                <div
                                    key={i}
                                    className="group px-4 py-3 justify-start items-center gap-4 inline-flex cursor-pointer"
                                    onClick={() => {
                                        setUser({
                                            ...user,
                                            status: option.id,
                                        })
                                    }}
                                >
                                    {option.icon && (
                                        <div className="w-6 h-6 p-0.5 justify-center items-center">
                                            <option.icon
                                                className={`${option.className || 'fill-alt'} w-full h-full transition-colors`}/>
                                        </div>
                                    )}

                                    {!option.icon && (
                                        <div className="w-6 h-6 p-1 justify-center items-center">
                                            <div
                                                className={`w-full h-full ${option.className || 'bg-n-5'} rounded-full`}/>
                                        </div>
                                    )}
                                    <div
                                        className="text-on-surface-variant text-opacity-75 text-sm transition-colors group-hover:text-primary-feral">{option.name}</div>
                                </div>
                            ))}
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>

                <div className="inline-flex flex-col w-full">
                    {UserOptions.map((option, i) => (
                        <div key={i}
                             className="group px-4 py-3 justify-start items-center gap-4 inline-flex cursor-pointer"
                             onClick={option.onClick || (() => {
                             })}>
                            <option.icon
                                className={`${option.className || 'group-hover:fill-primary-feral'} w-6 h-6 fill-alt unicorn:fill-on-surface-variant/50 transition-colors`}/>
                            <div
                                className={`${option.className || 'group-hover:text-primary-feral'} text-on-surface-variant text-opacity-75 text-sm transition-colors`}>{option.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
