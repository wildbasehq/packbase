'use client'

import {Dropdown, DropdownDescription, DropdownHeader, DropdownItem, DropdownLabel, DropdownMenu} from '@/components/shared/dropdown'
import LogoutIcon from '@/components/shared/icons/logout'
import {Heading, Text} from '@/components/shared/text'
import Tooltip from '@/components/shared/tooltip'
import {Button} from '@/components/shared/ui/button'
import UserAvatar from '@/components/shared/user/avatar'
import {useUserAccountStore} from '@/lib/states'
import {ProjectName, ProjectSafeName} from '@/lib/utils'
import {MenuButton} from '@headlessui/react'
import {ChevronDownIcon} from '@heroicons/react/20/solid'
import {MinusCircleIcon, MoonIcon} from '@heroicons/react/24/solid'
import {SettingsIcon} from 'lucide-react'
import Link from 'next/link'
import {Dispatch, SetStateAction} from 'react'
import {supabase} from '@/lib/api'

export default function UserDropdown({ showOnboardingModal }: { showOnboardingModal: Dispatch<SetStateAction<boolean>> | (() => void) }) {
    const { user, setUser } = useUserAccountStore()

    const StatusOptions = [
        {
            id: 1,
            name: 'Online',
            description: "Everyone will see that you're online.",
            className: 'bg-green-400',
        },
        {
            id: 2,
            name: 'Do not disturb',
            description: 'Notifications are silent, all users DMing you will see a notice that you\'ve made or a generic "currently busy" message.',
            icon: MinusCircleIcon,
            className: 'text-accent-1',
        },
        {
            id: 3,
            name: 'Idle',
            description: "Automatically switches to this when you're not focused in the tab or browser.",
            icon: MoonIcon,
            className: 'text-accent-5',
        },
        {
            id: 0,
            name: 'Invisible',
            description: "Disconnects from Packbase DMs. Still able to access messages, but won't send or receive read receipts nor receive real-time notifications.",
            className: 'border-n-5 group-hover:border-white border-dashed border-2 w-4 h-4',
        },
    ]

    const currentStatus = StatusOptions.find((option) => option.id === user.status) || StatusOptions[0]

    return (
        <DropdownHeader className="flex w-96 flex-col p-0!">
            <div className="h-fit w-full rounded-bl rounded-br bg-white/50 shadow-sm dark:bg-n-6/50">
                <div className="border-b p-2">
                    {user?.anonUser && (
                        <Link
                            href="/settings"
                            className="ring-default flex flex-col justify-center rounded px-4 py-4 no-underline! transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50"
                        >
                            <Heading size="sm">You need an invite</Heading>
                            <Text size="xs" className="text-alt">
                                You'll need an invite code to join Packbase. If you have one, click here! Otherwise, ask a friend or wait and see if you get lucky on our
                                weekly rounds.
                            </Text>
                        </Link>
                    )}
                    {user.reqOnboard && !user.anonUser && (
                        <div
                            onClick={() => showOnboardingModal(true)}
                            className="ring-default flex flex-col justify-center rounded px-4 py-4 no-underline! transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50"
                        >
                            <Heading size="sm">Finish your space</Heading>
                            <Text size="xs" className="text-alt">
                                For your privacy, no one can find you and your profile is non-existent until you make it.
                                <p className="mt-2">Click to get started!</p>
                            </Text>
                        </div>
                    )}

                    {!user.reqOnboard && (
                        <Link href={`/@${user.username}`} className="no-underline!">
                            <div className="ring-default flex items-center rounded px-4 py-4 transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50">
                                <UserAvatar user={user} size="lg" />
                                <div className="ml-3 grow">
                                    <Heading>{user.display_name || user.username}</Heading>
                                    <Text alt>{user.username}</Text>
                                </div>
                                <Link href="/settings">
                                    {/* mt-1 to offset button */}
                                    <Button variant="ghost" size="icon" className="mt-1 h-5 w-5 cursor-pointer">
                                        <SettingsIcon className="h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </Link>
                    )}
                </div>

                <Dropdown>
                    <Tooltip content={currentStatus.description}>
                        <MenuButton className="inline-flex w-full cursor-auto select-none items-start justify-between px-6 py-2">
                            <div className="flex items-center justify-center gap-4">
                                {currentStatus.icon && (
                                    <div className="h-6 w-6 items-center justify-center p-0.5">
                                        <currentStatus.icon className={`${currentStatus.className || 'fill-alt'} h-full w-full transition-colors`} />
                                    </div>
                                )}

                                {!currentStatus.icon && (
                                    <div className="h-6 w-6 items-center justify-center p-1">
                                        <div className={`h-full w-full ${currentStatus.className || 'bg-n-5'} rounded-full`} />
                                    </div>
                                )}
                                <div className="text-sm text-on-surface-variant">{currentStatus.name}</div>
                            </div>
                            <ChevronDownIcon className="AccordionChevron text-body h-5 w-5 self-center" />
                        </MenuButton>
                    </Tooltip>
                    <DropdownMenu className="z-20 w-96!">
                        {StatusOptions.filter((option) => option.id !== currentStatus.id).map((option, i) => (
                            <DropdownItem
                                key={i}
                                onClick={() => {
                                    setUser({
                                        ...user,
                                        status: option.id,
                                    })
                                }}
                            >
                                <DropdownLabel className="group inline-flex items-center justify-start gap-3 py-1 hover:text-white">
                                    {option.icon && (
                                        <div className="h-6 w-6 items-center justify-center p-0.5">
                                            <option.icon className={`${option.className || 'fill-alt'} h-full w-full transition-colors`} />
                                        </div>
                                    )}

                                    {!option.icon && (
                                        <div className="h-6 w-6 items-center justify-center p-1">
                                            <div className={`h-full w-full ${option.className || 'bg-n-5'} rounded-full`} />
                                        </div>
                                    )}
                                    {option.name}
                                </DropdownLabel>
                                <DropdownDescription>{option.description}</DropdownDescription>
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>
            </div>

            <div className="inline-flex w-full flex-col gap-2 px-3 py-2">
                <div
                    onClick={() => {
                        supabase.auth.signOut().then(() => {
                            // clean session
                            window.localStorage.removeItem('token')
                            window.localStorage.removeItem('user-account')
                            window.location.reload()
                        })
                    }}
                    className="group inline-flex w-full cursor-pointer items-center justify-start gap-4 rounded px-4 py-3 ring-destructive/25 transition-all hover:bg-destructive/75 hover:ring-2"
                >
                    <LogoutIcon className="fill-alt h-4 w-4 group-hover:!fill-white" />{' '}
                    <Text alt className="group-hover:!text-white">
                        Sign out of all accounts
                    </Text>
                </div>
            </div>
            <div className="flex w-full flex-col items-center justify-center border-t px-7 py-5">
                <Text size="xs" alt>
                    {ProjectSafeName} (Name isn't final. {ProjectName}) &copy; *base. &mdash;{' '}
                    {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || process.env.NEXT_PUBLIC_VERCEL_ENV || 'local'} - {process.env.NEXT_PUBLIC_BUILD_ID || '0000000'}
                </Text>
            </div>
        </DropdownHeader>
    )
}
