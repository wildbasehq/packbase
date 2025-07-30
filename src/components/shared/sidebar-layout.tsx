/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import * as Headless from '@headlessui/react'
import React, { useState } from 'react'
import { useResourceStore } from '@/lib/state'
import { NavbarItem } from '@/components/layout'
import PackSwitcher from '@/components/layout/resource-switcher/pack-switcher.tsx'
import UserSidebar from '@/components/layout/user-sidebar.tsx'
import cx from 'classnames'
import { useSidebar } from '@/lib/context/sidebar-context'
import ResourceSwitcher from '@/components/layout/resource-switcher'
import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownMenu,
    Sidebar,
    SidebarBody,
    SidebarFooter,
    SidebarHeading,
    SidebarItem,
    SidebarLabel,
    SidebarSection,
    SidebarSpacer,
} from '@/src/components'
import { QuestionMarkCircleIcon, SparklesIcon } from '@heroicons/react/20/solid'
import { FaceSmileIcon } from '@heroicons/react/16/solid'
import { SiDiscord } from 'react-icons/si'
import WildbaseAsteriskIcon from '@/components/icons/wildbase-asterisk.tsx'
import { useSession } from '@clerk/clerk-react'

function OpenMenuIcon() {
    return (
        <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
        </svg>
    )
}

function CloseMenuIcon() {
    return (
        <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
        </svg>
    )
}

function MobileSidebar({ open, close, children }: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
    return (
        <Headless.Dialog open={open} onClose={close} className="lg:hidden">
            <Headless.DialogBackdrop
                transition
                className="fixed inset-0 transition bg-black/30 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
            />
            <Headless.DialogPanel
                transition
                className="fixed inset-y-0 w-full max-w-[25.5rem] p-2 transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
                <div className="flex flex-col h-full bg-white rounded-lg shadow-xs ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                    <div className="px-4 pt-3 -mb-3">
                        <Headless.CloseButton as={NavbarItem} aria-label="Close navigation">
                            <CloseMenuIcon />
                        </Headless.CloseButton>
                    </div>
                    {children}
                </div>
            </Headless.DialogPanel>
        </Headless.Dialog>
    )
}

export function SidebarLayout({ children }: React.PropsWithChildren) {
    let [showSidebar, setShowSidebar] = useState(false)
    // const [showVGSNotice, setShowVGSNotice] = useState(true)
    const { isSignedIn } = useSession()
    const { sidebarContent } = useSidebar()
    // const [location] = useLocation()
    // const isStuffPage = location === '/stuff'

    return (
        <div className="relative flex w-full bg-white isolate min-h-svh max-lg:flex-col lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950">
            {/* Sidebar on desktop */}
            {isSignedIn && (
                <div className="fixed inset-y-0 left-0 z-10 max-lg:hidden flex h-full">
                    <PackSwitcher />
                </div>
            )}

            {/* Sidebar on mobile */}
            <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
                <SidebarContentContainer>{sidebarContent}</SidebarContentContainer>
            </MobileSidebar>

            {/* Navbar on mobile */}
            <header className="flex items-center px-4 lg:hidden z-10">
                <div className="py-2.5">
                    <NavbarItem onClick={() => setShowSidebar(true)} aria-label="Open navigation">
                        <OpenMenuIcon />
                    </NavbarItem>
                </div>
            </header>

            {/* Content */}
            <div className="flex flex-col flex-1 relative">
                {/*<div className="hidden lg:block">{navbar}</div>*/}
                {/*{isStuffPage && <YourStuffPage />}*/}
                <main className={`py-2 lg:min-w-0 lg:pr-2 ${isSignedIn ? 'lg:pl-18' : 'lg:pl-2'}`}>
                    {/*<motion.main*/}
                    {/*    // key={isStuffPage ? 'settings' : 'default'}*/}
                    {/*    className={`pb-2 lg:min-w-0 lg:pr-2 ${user ? 'lg:pl-96' : 'lg:pl-2'} ${isStuffPage ? '!z-10' : 'z-0'}`}*/}
                    {/*    initial={false}*/}
                    {/*    animate="animate"*/}
                    {/*    transition={{*/}
                    {/*        type: 'spring',*/}
                    {/*        stiffness: 600,*/}
                    {/*        damping: 40,*/}
                    {/*        mass: 1,*/}
                    {/*        bounce: 0,*/}
                    {/*    }}*/}
                    {/*    custom={{ isStuffPage }}*/}
                    {/*    variants={{*/}
                    {/*        initial: {*/}
                    {/*            y: 0,*/}
                    {/*            filter: 'blur(0px)',*/}
                    {/*            opacity: 1,*/}
                    {/*        },*/}
                    {/*        animate: ({ isStuffPage }) => ({*/}
                    {/*            y: isStuffPage ? '80%' : 0,*/}
                    {/*            filter: isStuffPage ? 'blur(2px)' : 'blur(0px)',*/}
                    {/*            // opacity: isSettingsPage ? 0.5 : 1,*/}
                    {/*        }),*/}
                    {/*    }}*/}
                    {/*>*/}

                    {/*{showVGSNotice && (*/}
                    {/*    <div className="fixed top-0 z-50 mx-2 my-2">*/}
                    {/*        <div className="bg-amber-50 border-2 ring-2 ring-amber-500/10 border-amber-500 p-4 rounded-md shadow-sm dark:bg-amber-900/20 dark:border-amber-600">*/}
                    {/*            <div className="flex items-center">*/}
                    {/*                <div className="flex-shrink-0">*/}
                    {/*                    <ShieldExclamationIcon className="h-5 w-5 text-amber-500 dark:text-amber-400" aria-hidden="true" />*/}
                    {/*                </div>*/}
                    {/*                <div className="ml-3 flex-1">*/}
                    {/*                    <p className="text-sm text-amber-700 dark:text-amber-200">*/}
                    {/*                        <span className="font-medium">Notice:</span> We are currently experiencing higher than normal*/}
                    {/*                        latency due to an issue on the VGS. Some services may be temporarily slower than usual. Please*/}
                    {/*                        check back later, or go to{' '}*/}
                    {/*                        <Link href="https://vgs.packbase.app/stats" target="_blank">*/}
                    {/*                            VGS Health*/}
                    {/*                        </Link>{' '}*/}
                    {/*                        for more information.*/}
                    {/*                    </p>*/}
                    {/*                </div>*/}
                    {/*                <div>*/}
                    {/*                    <button*/}
                    {/*                        type="button"*/}
                    {/*                        className="inline-flex rounded p-1.5 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"*/}
                    {/*                        onClick={() => setShowVGSNotice(false)}*/}
                    {/*                    >*/}
                    {/*                        <span className="sr-only">Dismiss</span>*/}
                    {/*                        <XIcon className="h-5 w-5" aria-hidden="true" />*/}
                    {/*                    </button>*/}
                    {/*                </div>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*)}*/}

                    <div className="relative h-[calc(100vh-1rem)] flex overflow-hidden grow lg:rounded-lg lg:bg-white lg:ring-1 lg:shadow-xs lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
                        {isSignedIn && (
                            <div className="top-0 backdrop-blur border-r h-full flex">
                                <SidebarContentContainer>{sidebarContent}</SidebarContentContainer>
                            </div>
                        )}
                        <div className={cx('mx-auto w-full overflow-hidden h-full', isSignedIn && 'max-w-1/2')}>{children}</div>
                    </div>
                    {/*</motion.main>*/}
                </main>
            </div>
            {isSignedIn && <UserSidebar />}
        </div>
    )
}

function SidebarContentContainer({ children }: { children: React.ReactNode }) {
    const { currentResource } = useResourceStore()
    return (
        <div className="flex flex-col w-80">
            {!currentResource.standalone && (
                <nav aria-label="Sections" className="flex flex-col min-h-14 w-80">
                    <div className="relative flex h-full items-center px-5 py-2 overflow-hidden">
                        <div className="w-full">
                            <ResourceSwitcher />
                        </div>
                    </div>
                </nav>
            )}
            <Sidebar className="w-full max-w-[320px]">
                <SidebarBody>
                    {!children &&
                        // Skeleton
                        Array(10)
                            .fill(null)
                            .map((_, i) => (
                                <div key={i} className="flex items-center py-3 px-2">
                                    <SidebarLabel className="flex items-center space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-n-7" />
                                        <div className="w-24 h-4 rounded-full bg-white dark:bg-n-7" />
                                    </SidebarLabel>
                                </div>
                            ))}
                    {children}
                    <SidebarSpacer />
                    <SidebarSection>
                        <Dropdown>
                            <DropdownButton as={SidebarItem}>
                                <QuestionMarkCircleIcon />
                                <SidebarLabel>Help</SidebarLabel>
                            </DropdownButton>
                            <DropdownMenu anchor="top">
                                <DropdownItem href="https://packbase.wildbase.xyz" target="_blank">
                                    <FaceSmileIcon className="w-4 h-4 inline-flex" data-slot="icon" />
                                    <SidebarLabel>Feedback</SidebarLabel>
                                </DropdownItem>
                                <DropdownItem href="https://discord.gg/StuuK55gYA" target="_blank">
                                    <SiDiscord className="w-4 h-4 inline-flex" data-slot="icon" />
                                    <SidebarLabel>Discord</SidebarLabel>
                                </DropdownItem>
                                <DropdownItem href="https://wildbase.xyz/" target="_blank">
                                    <WildbaseAsteriskIcon className="w-4 h-4 inline-flex" data-slot="icon" />
                                    <SidebarLabel>Wildbase</SidebarLabel>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                        <SidebarItem href="https://changelog.packbase.app" target="_blank">
                            <SparklesIcon />
                            <SidebarLabel external>Changelog</SidebarLabel>
                        </SidebarItem>
                    </SidebarSection>
                </SidebarBody>

                <SidebarFooter>
                    <SidebarHeading>(c) ✱base - Private alpha, things break!</SidebarHeading>
                </SidebarFooter>
            </Sidebar>
        </div>
    )
}
