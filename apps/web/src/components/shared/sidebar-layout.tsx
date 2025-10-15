/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import * as Headless from '@headlessui/react'
import React, {Activity, useState} from 'react'
import {useResourceStore} from '@/lib/state'
import {Navbar, NavbarDivider, NavbarItem, NavbarLabel, NavbarSection, NavbarSpacer} from '@/components/layout'
import UserSidebar, {UserActionsContainer} from '@/components/layout/user-sidebar.tsx'
import {useSidebar} from '@/lib/context/sidebar-context'
import ResourceSettings from '@/components/layout/resource'
import {
    Badge,
    Button,
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownMenu,
    FloatingCompose,
    Heading,
    Logo,
    Sidebar,
    SidebarBody,
    SidebarDivider,
    SidebarFooter,
    SidebarHeading,
    SidebarLabel,
    SidebarSpacer,
} from '@/src/components'
import {MagnifyingGlassIcon, QuestionMarkCircleIcon, SparklesIcon} from '@heroicons/react/20/solid'
import {ChevronDownIcon, FaceSmileIcon} from '@heroicons/react/16/solid'
import {SiDiscord} from 'react-icons/si'
import WildbaseAsteriskIcon from '@/components/icons/wildbase-asterisk.tsx'
import {SignedIn, useSession} from '@clerk/clerk-react'
import {isVisible, WorkerSpinner} from '@/lib'
import useWindowSize from '@/lib/hooks/use-window-size.ts'
import ResizablePanel from '@/components/shared/resizable'
import {News} from '../ui/sidebar-news'
import {useLocation} from "wouter";
import AppDropdownMenu from "@/components/layout/AppDropdownMenu.tsx";
import TextTicker from "@/components/shared/text-ticker.tsx";
import {useLocalStorage} from "usehooks-ts";
import {Text} from "@/components/shared/text.tsx";
import UserDropdown from "@/components/layout/user-dropdown";
import {AlignLeft} from "@/components/icons/plump/AlignLeft.tsx";
import PackbaseInstance from "@/lib/workers/global-event-emit.ts";

const NavbarItems = [
    {
        label: 'Home',
        currentHref: '/p/universe',
        href: '/'
    },
    {
        label: 'Badges',
        limitedEvent: true,
        href: '/store'
    }
]

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
    const [seenPackTour, setSeenPackTour] = useLocalStorage('seen-pack-tour', false)
    const [userSidebarCollapsed, setUserSidebarCollapsed] = useLocalStorage<any>('user-sidebar-collapsed', false)

    return (
        <div className="relative isolate flex min-h-svh h-screen w-full flex-col bg-muted">
            <SignedIn>
                <Activity mode={isVisible(!seenPackTour)}>
                    {/* Floating callout for Packs feature */}
                    <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-start">
                        <div className="relative mt-16 ml-6 max-w-sm pointer-events-auto">
                            {/* Pointer triangle */}
                            <div
                                className="absolute -top-2 left-8 h-0 w-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-zinc-900"/>

                            {/* Card */}
                            <div
                                className="rounded-lg border bg-card p-4 shadow-xl">
                                <Heading>Packs live up here!</Heading>
                                <Text>
                                    All your packs, pack creation, settings, and other pack-specific actions have moved
                                    into
                                    the header.
                                </Text>
                                <div className="mt-3 flex gap-2">
                                    <Button onClick={() => setSeenPackTour(true)}>
                                        Got it
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Activity>
            </SignedIn>
            {/* Content */}
            <div
                className="min-w-0 bg-sidebar px-4">
                <Navbar>
                    <Dropdown>
                        <DropdownButton as={NavbarItem}
                                        className="max-lg:hidden flex w-2xs h-8 [&>*]:w-full">
                            <div
                                data-slot="avatar"
                                className="rounded-sm w-6 h-6 border overflow-hidden bg-primary-cosmos flex justify-center items-center">
                                <Logo noStyle fullSize
                                      className="w-4 h-4 invert"/>
                            </div>
                            <div className="flex flex-col -space-y-1 relative">
                                <NavbarLabel>Packbase</NavbarLabel>
                                <NavbarLabel className="text-muted-foreground text-xs">
                                    <TextTicker
                                        texts={['CommInt ticker 1', 'CommInt ticker two', 'long interaction that should cut off']}
                                        interval={5000}/>
                                </NavbarLabel>
                            </div>
                            <ChevronDownIcon/>
                        </DropdownButton>
                        <AppDropdownMenu/>
                    </Dropdown>
                    <NavbarDivider/>
                    <NavbarSection className="max-lg:hidden">
                        {NavbarItems.map((item) => (
                            <NavbarItem href={item.href} current={location.startsWith(item.currentHref || item.href)}
                                        key={item.href}>
                                {item.label}
                                {item.limitedEvent && <Badge className="!py-0" color="indigo">Limited</Badge>}
                            </NavbarItem>
                        ))}
                    </NavbarSection>
                    <NavbarSpacer/>

                    <WorkerSpinner/>

                    <NavbarSection>
                        <NavbarItem onClick={() => PackbaseInstance.emit('search-open', {})} aria-label="Open search">
                            <MagnifyingGlassIcon/>
                        </NavbarItem>
                        <Dropdown>
                            <DropdownButton as={NavbarItem}>
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
                        <NavbarItem href="https://blog.packbase.app" target="_blank">
                            <SparklesIcon/>
                            <NavbarLabel>Blog</NavbarLabel>
                        </NavbarItem>
                    </NavbarSection>

                    <AlignLeft className="w-7 h-7 fill-indigo-600"
                               onClick={() => setUserSidebarCollapsed(!userSidebarCollapsed)}/>
                    <UserDropdown/>
                </Navbar>
            </div>

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

            {/* Content */}
            <div
                className="relative flex overflow-hidden grow lg:rounded-lg lg:bg-white lg:ring-1 lg:shadow-xs lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
                {/* Sidebar on mobile */}
                <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
                    <SidebarContentContainer>{sidebarContent}</SidebarContentContainer>
                </MobileSidebar>

                {isSignedIn && !isMobile && (
                    // Sidebar content for desktop
                    <SidebarContentContainer>{sidebarContent}</SidebarContentContainer>
                )}
                <div className="max-w-3xl mx-auto absolute left-0 right-0 top-0">
                    <FloatingCompose/>
                </div>
                <div className="mx-auto h-full w-full max-w-6xl">{children}</div>
                {isSignedIn && <UserSidebar/>}
            </div>
            {/*</main>*/}
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
                className="h-fill inset-y-0 max-lg:hidden flex z-30"
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
