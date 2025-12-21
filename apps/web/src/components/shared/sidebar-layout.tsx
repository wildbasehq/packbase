/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import * as Headless from '@headlessui/react'
import React, {Activity, useState} from 'react'
import {useResourceStore, useUserAccountStore} from '@/lib/state'
import {Navbar, NavbarDivider, NavbarItem, NavbarLabel, NavbarSection, NavbarSpacer} from '@/components/layout'
import UserSidebar from '@/components/layout/user-sidebar.tsx'
import {useSidebar} from '@/lib/context/sidebar-context'
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Badge,
    Button,
    Desktop,
    Dropdown,
    DropdownButton,
    DropdownItem,
    DropdownMenu,
    FloatingCallout,
    Logo,
    Sidebar,
    SidebarBody,
    SidebarFooter,
    SidebarHeading,
    SidebarLabel,
    SidebarSpacer,
} from '@/src/components'
import {ChevronDownIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon, SparklesIcon} from '@heroicons/react/20/solid'
import {FaceSmileIcon, HomeIcon} from '@heroicons/react/16/solid'
import {SiDiscord} from 'react-icons/si'
import WildbaseAsteriskIcon from '@/components/icons/wildbase-asterisk.tsx'
import {SignedIn, SignedOut, useSession} from '@clerk/clerk-react'
import {cn, isVisible, WorkerSpinner} from '@/lib'
import useWindowSize from '@/lib/hooks/use-window-size.ts'
import ResizablePanel from '@/components/shared/resizable'
import {News} from '../ui/sidebar-news'
import {useLocation} from "wouter";
import {useLocalStorage} from "usehooks-ts";
import UserDropdown from "@/components/layout/user-dropdown";
import {AlignLeft} from "@/components/icons/plump/AlignLeft.tsx";
import PackbaseInstance from "@/lib/workers/global-event-emit.ts";
import {motion} from "motion/react"
import PackSwitcher from "@/components/layout/resource/pack-switcher.tsx";
import TextTicker from "@/components/shared/text-ticker.tsx";
import {SupportHeadIcon} from "@/components/icons/plump/suppot-head.tsx";
import {EllipsisHorizontalIcon} from "@heroicons/react/24/solid";
import PackSettingsDropdown from "@/components/pack/settings-dropdown.tsx";
import {TbFaceId} from "react-icons/tb";
import {VerifiedBadge} from "@/components/layout/resource/pack-badge.tsx";
import {useModal} from "@/components/modal/provider.tsx";

const NavbarItems: {
    icon?: React.ComponentType<{ className?: string; 'data-slot'?: string }>;

    // Prefix with ! to indicate no label, only icon
    label: string;

    href: string;
    currentHref?: string;
    limitedEvent?: boolean;
    onlySignedIn?: boolean;
}[] = [
    {
        icon: HomeIcon,
        label: '!Home',
        currentHref: '/',
        href: '/'
    },
    {
        label: 'Badges',
        limitedEvent: true,
        href: '/store',
        onlySignedIn: true
    }
]

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
    const {user} = useUserAccountStore()
    const {sidebarContent} = useSidebar()
    const {isMobile} = useWindowSize()
    const [location] = useLocation()

    const [seenPackTour, setSeenPackTour] = useLocalStorage('seen-pack-tour', false)
    const [seenPackOptionsTour, setSeenPackOptionsTour] = useLocalStorage('seen-pack-options-tour', false)
    const [userSidebarCollapsed, setUserSidebarCollapsed] = useLocalStorage<any>('user-sidebar-collapsed', false)
    const [isWHOpen, setIsWHOpen] = useLocalStorage<any>('wh-open', false)
    const {currentResource} = useResourceStore()
    const {show} = useModal()

    const shouldSeePackTour = user && !user?.requires_setup && !seenPackTour
    const shouldSeePackOptionsTour = seenPackTour && !seenPackOptionsTour

    return (
        <div className="flex min-h-svh h-screen w-full relative bg-muted">
            <div className="relative isolate flex min-h-svh h-screen w-full flex-col bg-muted">
                <SignedIn>
                    <Desktop>
                        <Activity mode={isVisible(shouldSeePackTour)}>
                            <FloatingCallout open={shouldSeePackTour}>
                                <Alert className="rounded-2xl border bg-sidebar p-4 shadow-xl">
                                    <AlertTitle>Packs live up here!</AlertTitle>
                                    <AlertDescription className="text-muted-foreground">
                                        All your packs, pack creation, settings, and other pack-specific actions have
                                        moved into the header.
                                    </AlertDescription>
                                    <div className="mt-3 flex gap-2">
                                        <Button onClick={() => setSeenPackTour(true)}>Got it</Button>
                                    </div>
                                </Alert>
                            </FloatingCallout>
                        </Activity>
                    </Desktop>
                </SignedIn>

                {/* Content */}
                <div
                    className="min-w-0 bg-sidebar px-4">
                    {user?.images?.header && (
                        <img src={user?.images.header} alt="Header image"
                             className="absolute inset-0 h-18 w-full object-cover opacity-25 mask-b-to-95% mask-r-from-80% pointer-events-none select-none"/>
                    )}

                    <Activity mode={isVisible(!!currentResource?.images?.header)}>
                        <motion.img
                            data-slot="banner"
                            className="absolute inset-0 w-1/3 h-18 object-cover mask-radial-to-70% mask-radial-at-top-left pointer-events-none select-none"
                            src={currentResource?.images?.header}
                            alt={`${currentResource?.display_name} banner`}
                            initial={{opacity: 0.5}}
                            animate={{opacity: [0.5, 1, 0.85]}}
                            transition={{duration: 0.5, times: [0, 0.35, 1], ease: "easeOut"}}
                        />

                        <div
                            className="backdrop-blur-md bg-card/50 h-18 w-1/6 opacity-80 absolute inset-0 pointer-events-none mask-r-from-70%"/>
                    </Activity>

                    <Navbar className="z-10">
                        <Activity mode={isVisible(((isSignedIn && !user?.requires_setup) || !isSignedIn))}>
                            <NavbarItem
                                className={cn(
                                    "flex rounded w-full md:w-2xs h-8 *:w-full",
                                    shouldSeePackTour && 'md:animate-shadow-pulse'
                                )}
                                onClick={() => {
                                    if (!isSignedIn) return
                                    if (!seenPackTour) setSeenPackTour(true)
                                    setIsWHOpen(!isWHOpen)
                                }}
                            >
                                <Activity mode={isVisible(currentResource?.standalone)}>
                                    <div
                                        data-slot="avatar"
                                        className="rounded-sm w-6 h-6 border overflow-hidden shrink-0 bg-primary-cosmos flex justify-center items-center">
                                        <Logo className="w-4 h-4 fill-white"/>
                                    </div>
                                </Activity>

                                <Activity
                                    mode={isVisible(!currentResource?.standalone)}>
                                    <img
                                        data-slot="avatar"
                                        className="rounded-sm w-6 h-6 border shrink-0 overflow-hidden z-1"
                                        src={currentResource?.images?.avatar || '/img/default-avatar.png'}
                                        alt={`${currentResource?.display_name} avatar`}
                                    />
                                </Activity>

                                <div
                                    className="flex flex-col -space-y-1 flex-1 relative rounded px-2 z-1">
                                    <NavbarLabel>
                                        {currentResource?.display_name || 'dummy'}
                                    </NavbarLabel>

                                    <NavbarLabel className="text-muted-foreground text-xs">
                                        <Activity mode={isVisible(!!currentResource?.ticker?.length)}>
                                            <TextTicker
                                                texts={currentResource?.ticker}
                                                interval={2000}/>
                                        </Activity>

                                        <Activity mode={isVisible(!currentResource?.ticker?.length)}>
                                            #{currentResource?.slug || 'dummy'}
                                        </Activity>
                                    </NavbarLabel>
                                </div>
                                <Activity
                                    mode={isVisible((currentResource?.verified || currentResource?.standalone || currentResource?.slug === 'support'))}>
                                    <VerifiedBadge
                                        tooltipText="This is an official pack which represents the creator or organisation behind it."/>
                                </Activity>

                                <NavbarSpacer/>

                                <ChevronDownIcon className="z-1"/>
                            </NavbarItem>

                            <SignedIn>
                                <Dropdown>
                                    <DropdownButton as={NavbarItem} aria-label="More options"
                                                    id="pack-options-trigger"
                                                    className={shouldSeePackOptionsTour && 'rounded md:animate-shadow-pulse'}
                                                    onClick={() => {
                                                        if (!seenPackOptionsTour) setSeenPackOptionsTour(true)
                                                    }}
                                    >
                                        <EllipsisHorizontalIcon/>
                                    </DropdownButton>
                                    <PackSettingsDropdown show={show}/>
                                </Dropdown>

                                <SignedIn>
                                    <Desktop>
                                        <Activity mode={isVisible(shouldSeePackOptionsTour)}>
                                            <FloatingCallout
                                                open={shouldSeePackOptionsTour}
                                                trigger={document.getElementById('pack-options-trigger')}
                                                anchorSide="bottom"
                                                pointerAlign="center"
                                            >
                                                <Alert className="rounded-2xl border bg-sidebar p-4 shadow-xl">
                                                    <AlertTitle>Pack options are here!</AlertTitle>
                                                    <AlertDescription className="text-muted-foreground">
                                                        All pack-specific settings and actions can be found in this
                                                        menu.
                                                    </AlertDescription>
                                                    <div className="mt-3 flex gap-2">
                                                        <Button onClick={() => setSeenPackOptionsTour(true)}>Got
                                                            it</Button>
                                                    </div>
                                                </Alert>
                                            </FloatingCallout>
                                        </Activity>

                                    </Desktop>
                                </SignedIn>
                            </SignedIn>

                            <Desktop>
                                <NavbarDivider/>
                            </Desktop>
                        </Activity>

                        <Desktop>
                            <NavbarSection>
                                {NavbarItems
                                    .filter(item => !item.onlySignedIn || (item.onlySignedIn && isSignedIn))
                                    .map((item) => (
                                        <NavbarItem href={item.href}
                                                    current={location.startsWith(item.currentHref || item.href)}
                                                    key={item.href}>
                                            {item.icon && (
                                                <item.icon className="w-4 h-4 inline-flex" data-slot="icon"/>
                                            )}

                                            {!item.label.startsWith('!') && item.label}

                                            {item.limitedEvent &&
                                                <Badge className="py-0!" color="indigo">Limited</Badge>}
                                        </NavbarItem>
                                    ))}
                            </NavbarSection>

                            <NavbarSpacer/>

                            <WorkerSpinner/>

                            <NavbarSection>
                                <SignedIn>
                                    <NavbarItem onClick={() => PackbaseInstance.emit('search-open', {})}
                                                aria-label="Open search">
                                        <MagnifyingGlassIcon/>
                                    </NavbarItem>
                                </SignedIn>

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
                                        <DropdownItem href="https://help.wildhq.org" target="_blank">
                                            <SupportHeadIcon className="w-4 h-4 inline-flex"/>
                                            <SidebarLabel>Support</SidebarLabel>
                                        </DropdownItem>
                                        <DropdownItem href="https://discord.gg/StuuK55gYA" target="_blank">
                                            <SiDiscord className="w-4 h-4 inline-flex" data-slot="icon"/>
                                            <SidebarLabel>Discord</SidebarLabel>
                                        </DropdownItem>
                                        <DropdownItem href="https://wildhq.org/" target="_blank">
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
                        </Desktop>

                        <SignedOut>
                            <NavbarDivider/>
                            <Button href="/id/login" aria-label="Login">
                                <TbFaceId data-slot="icon"/>
                                Login
                            </Button>
                        </SignedOut>
                        <SignedIn>
                            <Desktop>
                                <AlignLeft className="w-7 h-7 fill-indigo-600"
                                           onClick={() => setUserSidebarCollapsed(!userSidebarCollapsed)}/>

                                <UserDropdown/>
                            </Desktop>
                        </SignedIn>
                    </Navbar>
                </div>

                {/* Dropdown content, moves below content down */}
                <Activity mode={isVisible(isWHOpen)}>
                    <WhatsHappeningDropdown close={() => setIsWHOpen(false)}/>
                </Activity>

                {/* Content */}
                <motion.div
                    initial={true}
                    animate={isWHOpen ? 'open' : 'closed'}
                    variants={{
                        open: {
                            marginTop: '12rem',
                            opacity: 0.85,
                            filter: 'blur(1px)'
                        },
                        closed: {
                            marginTop: 0,
                        },
                        interactEntry: {
                            marginTop: '11.5rem'
                        }
                    }}
                    transition={{
                        type: 'spring',
                        stiffness: 1000,
                        damping: 50,
                        mass: 1
                    }}
                    whileHover={isWHOpen ? 'interactEntry' : undefined}
                    onClick={() => isWHOpen && setIsWHOpen(false)}
                    className={cn(isWHOpen && '*:pointer-events-none!', 'relative flex overflow-hidden grow m-1 lg:rounded-2xl lg:bg-white lg:border-[0.1rem] ring-default lg:shadow-xs dark:lg:bg-n-8')}
                >
                    {/* Sidebar on mobile */}
                    <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
                        <SidebarContentContainer>{sidebarContent}</SidebarContentContainer>
                    </MobileSidebar>

                    {isSignedIn && !isMobile && (
                        // Sidebar content for desktop
                        <SidebarContentContainer>{sidebarContent}</SidebarContentContainer>
                    )}

                    <div
                        className={`mx-auto h-full w-full overflow-y-auto ${(isSignedIn && !location.includes('/c/')) ? 'max-w-6xl' : ''}`}>
                        {children}
                    </div>
                </motion.div>
                {/*</main>*/}
            </div>

            <SignedIn>
                <Desktop>
                    <UserSidebar/>
                </Desktop>
            </SignedIn>
        </div>
    )
}

function WhatsHappeningDropdown({close}: { close: () => void }) {
    return (
        <div className="absolute top-16 w-full px-4">
            {/* Scroll container */}
            <PackSwitcher onChange={close}/>
        </div>
    )
}

function SidebarContentContainer({children}: { children: React.ReactNode }) {
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
                <div className="pt-4 flex flex-col" style={{width: sidebarWidth ?? 320}}>
                    <Sidebar className="w-full">
                        <SidebarBody>
                            {children}
                            <SidebarSpacer/>
                        </SidebarBody>

                        <SidebarFooter
                            className={articlesUnread ? 'bg-linear-to-b from-transparent to-muted/50' : ''}>
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
