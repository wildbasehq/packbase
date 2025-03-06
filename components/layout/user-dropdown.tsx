import {
    Dropdown,
    DropdownDescription,
    DropdownHeader,
    DropdownItem,
    DropdownLabel,
    DropdownMenu,
    DropdownShortcut,
} from '@/components/shared/dropdown'
import LogoutIcon from '@/components/icons/logout'
import { Heading, Text } from '@/components/shared/text'
import Tooltip from '@/components/shared/tooltip'
import { Button } from '@/components/shared/button'
import UserAvatar from '@/components/shared/user/avatar'
import { useUserAccountStore } from '@/lib/states'
import { ProjectName, supabase } from '@/lib/api'
import { MenuButton } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { MinusCircleIcon, MoonIcon } from '@heroicons/react/24/solid'
import { SettingsIcon } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import Link from '@/components/shared/link.tsx'
import { useModal } from '@/components/modal/provider.tsx'
import SettingsDialog from '@/src/pages/settings/layout.tsx'
import { toast } from 'sonner'

export default function UserDropdown({ showOnboardingModal }: { showOnboardingModal: Dispatch<SetStateAction<boolean>> | (() => void) }) {
    const { user, setUser } = useUserAccountStore()
    const { show } = useModal()

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
            description:
                'Notifications are silent, all users DMing you will see a notice that you\'ve made or a generic "currently busy" message.',
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
            description:
                "Disconnects from Packbase DMs. Still able to access messages, but won't send or receive read receipts nor receive real-time notifications.",
            className: 'border-n-5 group-hover:border-white border-dashed border-2 w-4 h-4',
        },
    ]

    const currentStatus = StatusOptions.find(option => option.id === user.status) || StatusOptions[0]

    return (
        <DropdownHeader className="flex w-96 flex-col p-0!">
            <div className="w-full rounded-bl rounded-br shadow-sm h-fit bg-white/50 dark:bg-n-6/50">
                <div className="p-2 border-b">
                    {user?.anonUser && (
                        <Link
                            href="/settings"
                            className="ring-default flex flex-col justify-center rounded px-4 py-4 no-underline! transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50"
                        >
                            <Heading size="sm">You need an invite</Heading>
                            <Text size="xs" className="text-alt">
                                You'll need an invite code to join Packbase. If you have one, click here! Otherwise, ask a friend or wait
                                and see if you get lucky on our weekly rounds.
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
                            <div className="flex items-center px-4 py-4 transition-all rounded ring-default hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50">
                                <UserAvatar user={user} size="lg" />
                                <div className="ml-3 grow">
                                    <Heading>{user.display_name || user.username}</Heading>
                                    <Text alt>{user.username}</Text>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-5 h-5 mt-1 cursor-pointer"
                                    onClick={e => {
                                        e.preventDefault()
                                        show(<SettingsDialog />)
                                    }}
                                >
                                    <SettingsIcon className="w-5 h-5" />
                                </Button>
                            </div>
                        </Link>
                    )}
                </div>

                <Dropdown>
                    <Tooltip content={currentStatus.description}>
                        <MenuButton className="inline-flex items-start justify-between w-full px-6 py-2 cursor-auto select-none">
                            <div className="flex items-center justify-center gap-4">
                                {currentStatus.icon && (
                                    <div className="h-6 w-6 items-center justify-center p-0.5">
                                        <currentStatus.icon
                                            className={`${currentStatus.className || 'fill-alt'} h-full w-full transition-colors`}
                                        />
                                    </div>
                                )}

                                {!currentStatus.icon && (
                                    <div className="items-center justify-center w-6 h-6 p-1">
                                        <div className={`h-full w-full ${currentStatus.className || 'bg-n-5'} rounded-full`} />
                                    </div>
                                )}
                                <div className="text-sm text-on-surface-variant">{currentStatus.name}</div>
                            </div>
                            <ChevronDownIcon className="self-center w-5 h-5 AccordionChevron text-body" />
                        </MenuButton>
                    </Tooltip>
                    <DropdownMenu className="z-20 w-96!">
                        {StatusOptions.filter(option => option.id !== currentStatus.id).map((option, i) => (
                            <DropdownItem
                                key={i}
                                onClick={() => {
                                    if (option.id === 0) {
                                        toast.message("You're no longer connected to Packbase DMs.")
                                    }
                                    setUser({
                                        ...user,
                                        status: option.id,
                                    })
                                }}
                            >
                                <DropdownLabel className="group inline-flex items-center justify-start gap-3 py-1 group-hover:!text-white">
                                    {option.icon && (
                                        <div className="h-6 w-6 items-center justify-center p-0.5">
                                            <option.icon className={`${option.className || 'fill-alt'} h-full w-full transition-colors`} />
                                        </div>
                                    )}

                                    {!option.icon && (
                                        <div className="items-center justify-center w-6 h-6 p-1">
                                            <div className={`h-full w-full ${option.className || 'bg-n-5'} rounded-full`} />
                                        </div>
                                    )}
                                    {option.name}
                                </DropdownLabel>
                                <DropdownShortcut keys={['⌘', '⇧', option.id.toString()]} />
                                <DropdownDescription>{option.description}</DropdownDescription>
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>
            </div>

            <div className="inline-flex flex-col w-full gap-2 px-3 py-2">
                <div
                    onClick={() => {
                        supabase.auth.signOut().then(() => {
                            // clean session
                            window.localStorage.removeItem('token')
                            window.localStorage.removeItem('user-account')
                            window.location.reload()
                        })
                    }}
                    className="inline-flex items-center justify-start w-full gap-4 px-4 py-3 transition-all rounded cursor-pointer group ring-destructive/25 hover:bg-destructive/75 hover:ring-2"
                >
                    <LogoutIcon className="fill-alt h-4 w-4 group-hover:!fill-white" />{' '}
                    <Text alt className="group-hover:!text-white">
                        Sign out of all accounts
                    </Text>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full py-5 border-t px-7">
                <Text size="xs" alt>
                    Packbase (Name isn't final. {ProjectName}) &copy; ✱base. &mdash; {import.meta.env.CF_PAGES_COMMIT_SHA || '0000000'}
                </Text>
            </div>
        </DropdownHeader>
    )
}
