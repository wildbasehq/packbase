'use client'

import ResourceSwitcher from '@/components/layout/resource-switcher'
import { Search } from '@/components/layout/search'
import UserDropdown from '@/components/layout/user-dropdown'
import { Dropdown, DropdownMenu } from '@/components/shared/dropdown'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/shared/ui/button'
import UserAvatar from '@/components/shared/user/avatar'
import { useUIStore, useUserAccountStore } from '@/lib/states'
import { MenuButton } from '@headlessui/react'
import { ScanFaceIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import UserOnboardingModal from '../modal/user-onboarding-modal'
import { FaDiscord } from 'react-icons/fa6'

export default function NavBar() {
    const { user } = useUserAccountStore()
    const { loading } = useUIStore()

    const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false)

    useEffect(() => {
        setShowOnboardingModal(!user?.dp.uod)
    }, [user])

    return (
        <>
            {user && <UserOnboardingModal state={[showOnboardingModal, setShowOnboardingModal]} />}

            <div className="bg-sidebar border-default sticky top-0 z-30 flex h-16 border-0 border-b border-solid shadow-sm">
                <nav aria-label="Sections" className="hidden h-16 lg:flex lg:flex-col">
                    <div
                        className={`border-default shimmer-template relative flex h-full w-96 items-center border-r px-5 py-2 ${
                            loading ? 'overflow-hidden before:animate-shimmer-fast' : ''
                        }`}
                    >
                        <div className="w-full">
                            <ResourceSwitcher />
                        </div>
                    </div>
                </nav>

                <div className="mx-auto h-16 w-full max-w-7xl px-2 sm:px-4">
                    <div className="relative flex h-full items-center justify-between">
                        <div className="relative"></div>

                        <Search />

                        <div className="flex items-center gap-5">
                            <div className="flex gap-4">
                                <ThemeToggle />
                            </div>
                            <div className="flex gap-4">
                                <Link href="https://discord.gg/StuuK55gYA" target="_blank" className="!no-underline">
                                    <Button variant="ghost" className="flex items-center justify-center">
                                        <FaDiscord className="mr-1 h-4 w-4" /> Discord
                                    </Button>
                                </Link>
                            </div>

                            <div className="md:dark:bg-white/15 hidden md:block md:h-5 md:w-px md:bg-n-8/10" />

                            <div className="hidden min-[416px]:contents">
                                {user && (
                                    <Dropdown>
                                        <MenuButton>
                                            <UserAvatar user={user} size="md" className={`${user.reqOnboard && 'animate-pulse'}`} />
                                        </MenuButton>
                                        <DropdownMenu className="mt-4 !p-0">
                                            <UserDropdown showOnboardingModal={setShowOnboardingModal} />
                                        </DropdownMenu>
                                    </Dropdown>
                                )}

                                {!user && (
                                    <>
                                        <Link href="/id/login" className="!no-underline">
                                            <Button variant="ghost" className="flex items-center justify-center">
                                                <ScanFaceIcon className="mr-1 h-4 w-4" /> Sign In
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
