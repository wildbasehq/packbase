'use client'

import {MinusCircleIcon, MoonIcon} from '@heroicons/react/24/solid'
import {ChevronDownIcon} from '@heroicons/react/20/solid'
import {useUserAccountStore} from '@/lib/states'
import LogoutIcon from '@/components/shared/icons/logout'
import Link from 'next/link'
import {createClient} from '@/lib/supabase/client'
import {Heading, Text} from '@/components/shared/text'
import {Dropdown, DropdownDescription, DropdownHeader, DropdownItem, DropdownLabel, DropdownMenu} from '@/components/shared/dropdown'
import {MenuButton} from '@headlessui/react'
import UserAvatar from '@/components/shared/user/avatar'
import {SettingsIcon} from 'lucide-react'
import {Button} from '@/components/shared/ui/button'
import Tooltip from '@/components/shared/tooltip'

export default function UserDropdown() {
    const {user, setUser} = useUserAccountStore()

    const StatusOptions = [
        {
            id: 1,
            name: 'Online',
            description: 'Everyone will see that you\'re online.',
            className: 'bg-green-400',
        },
        {
            id: 2,
            name: 'Do not disturb',
            description: 'You won\'t receive any audible notifications.',
            icon: MinusCircleIcon,
            className: 'text-accent-1',
        },
        {
            id: 3,
            name: 'Idle',
            description: 'Automatically switches to this when you\'re not focused in the tab or browser.',
            icon: MoonIcon,
            className: 'text-accent-5',
        },
        {
            id: 0,
            name: 'Invisible',
            description: 'Disconnects from Packbase DMs. Still able to access messages, but won\'t send or receive read receipts nor receive real-time notifications.',
            className: 'border-n-5 group-hover:border-white border-dashed border-2 w-4 h-4',
        },
    ]

    const currentStatus = StatusOptions.find((option) => option.id === user.status) || StatusOptions[0]

    return (
        <DropdownHeader
            className="flex flex-col w-96 !p-0">
            {/* notice banner */}
            {/*<div className="inline-flex justify-start items-center gap-4 w-full px-4 py-2 border border-accent-1/25 bg-n-2 dark:bg-n-7 bg-opacity-50 rounded-xl">*/}
            {/*  <ExclamationTriangleIcon className="w-6 h-6 text-accent-1" />*/}
            {/*  <div className="px-4 py-3 text-alt text-opacity-75 text-sm">*/}
            {/*    Feral is still WIP. This is not a real account.*/}
            {/*  </div>*/}
            {/*</div>*/}

            <div
                className="w-full h-fit bg-white/50 dark:bg-n-6/50 shadow rounded-br rounded-bl">
                {user.reqOnboard && (
                    <div className="p-2 border-b">
                        <Link href="/settings"
                              className="flex flex-col px-4 py-2 transition-all justify-center rounded hover:ring-2 ring-default hover:bg-n-2/25 dark:hover:bg-n-6/50 !no-underline">
                            <Heading size="sm">Finish your space</Heading>
                            <Text size="xs" className="text-alt">
                                For your privacy, no one can find you and your profile is non-existent until you make
                                it.
                                <p className="mt-2">
                                    Click to get started!
                                </p>
                            </Text>
                        </Link>
                    </div>
                )}
                <div className="p-2 border-b">
                    <div className="flex px-4 py-2 transition-all items-center rounded hover:ring-2 ring-default hover:bg-n-2/25 dark:hover:bg-n-6/50">
                        <UserAvatar user={user} size="2xl"/>
                        <div className="grow ml-2">
                            <Heading>{user.display_name || user.username}</Heading>
                            <Text alt>{user.username}</Text>
                        </div>
                        <Link href="/settings">
                            {/* mt-1 to offset button */}
                            <Button variant="ghost" size="icon" className="h-5 w-5 mt-1 cursor-pointer">
                                <SettingsIcon className="h-5 w-5"/>
                            </Button>
                        </Link>
                    </div>
                </div>

                <Dropdown>
                    <Tooltip content={currentStatus.description}>
                        <MenuButton
                            className="w-full px-6 py-2 justify-between items-start inline-flex cursor-auto select-none">
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
                        </MenuButton>
                    </Tooltip>
                    <DropdownMenu className="!w-96">
                        {StatusOptions.filter((option) => option.id !== user.status).map((option, i) => (
                            <DropdownItem
                                key={i}
                                onClick={() => {
                                    setUser({
                                        ...user,
                                        status: option.id,
                                    })
                                }}
                            >
                                <DropdownLabel className="group justify-start items-center gap-3 py-1 inline-flex">
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
                                    {option.name}
                                </DropdownLabel>
                                <DropdownDescription>
                                    {option.description}
                                </DropdownDescription>
                            </DropdownItem>
                        ))}

                    </DropdownMenu>
                </Dropdown>
            </div>

            <div className="inline-flex px-3 py-2 gap-2 flex-col w-full">
                <div
                    onClick={() => {
                        const supabase = createClient()
                        supabase.auth.signOut().then(() => {
                            // clean session
                            window.localStorage.removeItem('token')
                            window.localStorage.removeItem('user-account')
                            window.location.reload()
                        })
                    }}
                    className="group px-4 py-3 justify-start items-center gap-4 inline-flex cursor-pointer w-full rounded transition-all ring-destructive/25 hover:ring-2 hover:bg-destructive/75">
                    <LogoutIcon className="w-4 h-4 fill-alt group-hover:fill-white"/> <Text alt className="group-hover:text-white">Sign out of all accounts</Text>
                </div>
            </div>
            <div className="flex flex-col w-full px-7 py-5 items-center justify-center border-t">
                <Text size="xs" alt>
                    Packbase &copy; Wolfbite Labs, 100% Volunteer. Funds feed back in.
                </Text>
            </div>
        </DropdownHeader>
    )
}
