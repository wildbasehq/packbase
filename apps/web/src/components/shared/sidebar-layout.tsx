/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import * as Headless from '@headlessui/react'
import React, {Activity, useEffect, useState} from 'react'
import {useResourceStore} from '@/lib/state'
import {NavbarItem} from '@/components/layout'
import PackSwitcher from '@/components/layout/resource/pack-switcher.tsx'
import UserSidebar, {UserActionsContainer} from '@/components/layout/user-sidebar.tsx'
import cx from 'classnames'
import {useSidebar} from '@/lib/context/sidebar-context'
import ResourceSettings from '@/components/layout/resource'
import {
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownMenu,
    FloatingCompose,
    Sidebar,
    SidebarBody,
    SidebarDivider,
    SidebarFooter,
    SidebarHeading,
    SidebarItem,
    SidebarLabel,
    SidebarSection,
    SidebarSpacer,
} from '@/src/components'
import {QuestionMarkCircleIcon, SparklesIcon} from '@heroicons/react/20/solid'
import {FaceSmileIcon} from '@heroicons/react/16/solid'
import {SiDiscord} from 'react-icons/si'
import WildbaseAsteriskIcon from '@/components/icons/wildbase-asterisk.tsx'
import {useSession} from '@clerk/clerk-react'
import {cn, isVisible} from '@/lib'
import useWindowSize from '@/lib/hooks/use-window-size.ts'
import ResizablePanel from '@/components/shared/resizable'
import {News} from '../ui/sidebar-news'
import {useLocation} from "wouter";
import {motion} from "motion/react"
import YourStuffPage from "@/pages/stuff/page.tsx";
import {navigate} from "wouter/use-browser-location";

function OpenMenuIcon() {
    return (
        <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
            <path
                d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z"/>
        </svg>
    )
}

function CloseMenuIcon() {
    return (
        <svg data-slot="icon" viewBox="0 0 20 20" aria-hidden="true">
            <path
                d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
        </svg>
    )
}

function MobileSidebar({open, close, children}: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
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
                <div
                    className="flex flex-col h-full bg-white rounded-lg shadow-xs ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                    <div className="px-4 pt-3 -mb-3">
                        <Headless.CloseButton as={NavbarItem} aria-label="Close navigation">
                            <CloseMenuIcon/>
                        </Headless.CloseButton>
                    </div>
                    {children}
                </div>
            </Headless.DialogPanel>
        </Headless.Dialog>
    )
}

export function SidebarLayout({children}: React.PropsWithChildren) {
    let [showSidebar, setShowSidebar] = useState(false)
    const {isSignedIn} = useSession()
    const {sidebarContent} = useSidebar()
    const {isMobile} = useWindowSize()
    const [location] = useLocation()
    const isStuffPage = location.startsWith('/stuff')

    // Keeps track of the last non-stuff page we were on, so we can navigate back to it
    // @TODO Store this elsewhere so it doesn't cause a re-render?
    const [lastNonStuffPage, setLastNonStuffPage] = useState<any>(null)

    useEffect(() => {
        if (!isStuffPage) {
            setLastNonStuffPage(location)
        }
    }, [location])

    return (
        <div className="w-full isolate min-h-svh max-lg:flex-col bg-muted dark:bg-n-8">
            <div className="relative flex">
                {/* Sidebar on mobile */}
                <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
                    <SidebarContentContainer>{sidebarContent}</SidebarContentContainer>
                </MobileSidebar>

                {/* Content */}
                <div className="flex flex-col flex-1 relative">
                    {/* Navbar on mobile */}
                    <header className="flex items-center px-4 gap-4 lg:hidden z-10">
                        <div className="py-2.5">
                            <NavbarItem onClick={() => setShowSidebar(true)} aria-label="Open navigation">
                                <OpenMenuIcon/>
                            </NavbarItem>
                        </div>
                        <div className="flex gap-4 w-full">
                            <UserActionsContainer/>
                        </div>
                    </header>
                    {isStuffPage && <YourStuffPage/>}
                    <main className="lg:min-w-0 flex">
                        {isSignedIn && (
                            <div className={cn('w-fit max-lg:hidden flex h-full')}>
                                <PackSwitcher/>
                            </div>
                        )}
                        <motion.main
                            // key={isStuffPage ? 'settings' : 'default'}
                            className={`relative h-screen flex overflow-hidden grow lg:bg-white dark:lg:bg-n-8 ${isStuffPage ? '!z-10 cursor-pointer ring-1 ring-default rounded-2xl' : 'z-0'}`}
                            onClick={() => {
                                if (isStuffPage) navigate(lastNonStuffPage ?? '/')
                            }}
                            initial={false}
                            animate="animate"
                            transition={{
                                type: 'spring',
                                stiffness: 600,
                                damping: 40,
                                mass: 1,
                                bounce: 0,
                            }}
                            custom={{isStuffPage}}
                            variants={{
                                initial: {
                                    y: 0,
                                    filter: 'blur(0px)',
                                    opacity: 1,
                                },
                                animate: ({isStuffPage}) => ({
                                    y: isStuffPage ? '80%' : 0,
                                    filter: isStuffPage ? 'blur(2px)' : 'blur(0px)',
                                    // opacity: isSettingsPage ? 0.5 : 1,
                                }),
                            }}
                        >
                            {isSignedIn && !isMobile && (
                                // Sidebar content for desktop
                                <SidebarContentContainer>{sidebarContent}</SidebarContentContainer>
                            )}

                            {/* Content */}
                            <div className={cx('relative mx-auto w-full overflow-hidden h-full z-30')}>
                                <div className="max-w-3xl mx-auto absolute left-0 right-0 top-0">
                                    <FloatingCompose onShouldFeedRefresh={async () => {
                                    }}/>
                                </div>
                                {children}
                            </div>
                        </motion.main>
                    </main>
                </div>
                {isSignedIn && <UserSidebar/>}
            </div>
        </div>
    )
}

function SidebarContentContainer({children}: { children: React.ReactNode }) {
    const {currentResource} = useResourceStore()
    const [articlesUnread, setArticlesUnread] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState<number>(320)

    return (
        <Activity mode={isVisible(!!children)}>
            <ResizablePanel
                className="relative top-0 border-r h-full flex z-30"
                width={sidebarWidth}
                onResize={setSidebarWidth}
                minWidth={240}
                maxWidth={560}
            >
                <div className="flex flex-col" style={{width: sidebarWidth ?? 320}}>
                    {!currentResource.standalone && (
                        <nav aria-label="Sections" className="flex flex-col min-h-14"
                             style={{width: sidebarWidth ?? 320}}>
                            <div className="relative flex h-full items-center px-5 py-2 overflow-hidden">
                                <div className="w-full">
                                    <ResourceSettings/>
                                </div>
                            </div>
                        </nav>
                    )}
                    <Sidebar className="w-full">
                        <SidebarBody>
                            {children}
                            <SidebarSpacer/>
                            <SidebarDivider/>
                            <SidebarSection>
                                <Dropdown>
                                    <DropdownButton as={SidebarItem}>
                                        <QuestionMarkCircleIcon/>
                                        <SidebarLabel>Help</SidebarLabel>
                                    </DropdownButton>
                                    <DropdownMenu anchor="top">
                                        <DropdownItem href="https://work.wildbase.xyz/maniphest/query/all/"
                                                      target="_blank">
                                            <FaceSmileIcon className="w-4 h-4 inline-flex" data-slot="icon"/>
                                            <SidebarLabel>Feedback</SidebarLabel>
                                        </DropdownItem>
                                        <DropdownItem href="https://discord.gg/StuuK55gYA" target="_blank">
                                            <SiDiscord className="w-4 h-4 inline-flex" data-slot="icon"/>
                                            <SidebarLabel>Discord</SidebarLabel>
                                        </DropdownItem>
                                        <DropdownItem href="https://wildbase.xyz/" target="_blank">
                                            <WildbaseAsteriskIcon className="w-4 h-4 inline-flex" data-slot="icon"/>
                                            <SidebarLabel>Wildbase</SidebarLabel>
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                                <SidebarItem href="https://blog.packbase.app" target="_blank">
                                    <SparklesIcon/>
                                    <SidebarLabel external>Blog</SidebarLabel>
                                </SidebarItem>
                            </SidebarSection>
                        </SidebarBody>

                        <SidebarFooter
                            className={articlesUnread ? 'bg-gradient-to-b from-transparent to-muted/50' : ''}>
                            <SidebarHeading>(c) ✱base - Private alpha, things break!</SidebarHeading>
                            <div className="bottom-0 w-full">
                                <News toggleUnread={setArticlesUnread}/>
                            </div>
                        </SidebarFooter>
                    </Sidebar>
                </div>
            </ResizablePanel>
        </Activity>
    )
}
