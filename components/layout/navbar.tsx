import UserDropdown from '@/components/layout/user-dropdown'
import {Dropdown, DropdownMenu} from '@/components/shared/dropdown'
import {ThemeToggle} from '@/components/shared/theme-toggle'
import {Button} from '@/components/shared/experimental-button-rework'
import UserAvatar from '@/components/shared/user/avatar'
import {useUIStore, useUserAccountStore} from '@/lib/states'
import {MenuButton} from '@headlessui/react'
import {ScanFaceIcon} from 'lucide-react'
import React, {useState} from 'react'
import UserOnboardingModal from '../modal/user-onboarding-modal'
import {FaDiscord} from 'react-icons/fa6'
import {Logo} from '@/components/shared/logo'
import Link from '@/components/shared/link'
import Tooltip from '@/components/shared/tooltip.tsx'
import {Badge} from '@/components/shared/badge.tsx'
import {WorkerStore} from '@/lib/workers.ts'
import {WorkerSpinner} from '@/lib/use-worker-status.tsx'

export default function NavBar() {
    const {user} = useUserAccountStore()
    const {hidden, updateAvailable, maintenance} = useUIStore()
    const {jobs, getRunningJobs} = WorkerStore()

    const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(true)

    return (
        <>
            {user && !user?.metadata?.dp_uod && !user.anonUser && !maintenance && <UserOnboardingModal state={[showOnboardingModal, setShowOnboardingModal]}/>}

            <div className={`${hidden ? '' : 'sm:!pl-[24.5rem]'} flex h-16 w-full items-center justify-items-stretch px-2 sm:px-4`}>
                {hidden ? (
                    <Link className="flex-1" href="/">
                        <Logo className="h-8"/>
                    </Link>
                ) : (
                    <div className="flex-1"/>
                )}

                <div className="justify-self-end h-16 w-full max-w-7xl">
                    <div className="relative flex h-full justify-end lg:items-center xl:justify-between">
                        {/*{user && !user.anonUser && <Search/>}*/}
                        <div className="relative"></div>

                        <div className="flex items-center gap-5">
                            {jobs.size > 0 && <>
                                <WorkerSpinner/>
                            </>}
                            {updateAvailable && (
                                <>
                                    <Tooltip content="Click to update Packbase">
                                        <div className="flex scale-80 cursor-pointer" onClick={() => window.location.reload()}>
                                            <Badge color="amber" className="flex items-center justify-center">
                                                <span className="text-xs">Update available</span>
                                            </Badge>
                                        </div>
                                    </Tooltip>

                                    <div className="md:dark:bg-white/15 hidden md:block md:h-5 md:w-px md:bg-n-8/10"/>
                                </>
                            )}
                            <div className="flex gap-4">
                                <ThemeToggle/>
                            </div>
                            <div className="flex gap-4">
                                <Button href="https://discord.gg/StuuK55gYA" target="_blank" plain className="flex items-center justify-center">
                                    <FaDiscord className="mr-1 h-4 w-4"/> Discord
                                </Button>
                            </div>

                            <div className="md:dark:bg-white/15 hidden md:block md:h-5 md:w-px md:bg-n-8/10"/>

                            <div className="hidden min-[416px]:contents">
                                {user && (
                                    <Dropdown>
                                        <MenuButton>
                                            <UserAvatar user={user} size="md" className={`${user.reqOnboard && 'animate-pulse'}`}/>
                                        </MenuButton>
                                        <DropdownMenu className="z-20 mt-4 p-0!">
                                            <UserDropdown showOnboardingModal={setShowOnboardingModal}/>
                                        </DropdownMenu>
                                    </Dropdown>
                                )}

                                {!user && (
                                    <>
                                        <Link href="/id/login" className="no-underline!">
                                            <Button color="indigo" className="flex items-center justify-center">
                                                <ScanFaceIcon className="mr-1 h-4 w-4"/> Sign In
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
