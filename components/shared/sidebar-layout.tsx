'use client'

import * as Headless from '@headlessui/react'
import React, {useState} from 'react'
import {NavbarItem} from './navbar'
import {useUIStore, useUserAccountStore} from '@/lib/states'

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
                className="fixed inset-0 bg-black/30 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
            />
            <Headless.DialogPanel
                transition
                className="fixed inset-y-0 w-full max-w-[25.5rem] p-2 transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
                <div className="flex h-full flex-col rounded-lg bg-white ring-1 shadow-xs ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                    <div className="-mb-3 px-4 pt-3">
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

export function SidebarLayout({
                                  navbar,
                                  sidebar,
                                  children,
                              }: React.PropsWithChildren<{ navbar: React.ReactNode; sidebar: React.ReactNode }>) {
    let [showSidebar, setShowSidebar] = useState(false)
    const {user} = useUserAccountStore()
    const {hidden} = useUIStore()

    return (
        <div className="relative isolate flex min-h-svh w-full bg-white max-lg:flex-col lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950">
            {/* Sidebar on desktop */}
            {!hidden && <div className="fixed inset-y-0 left-0 w-98 max-lg:hidden">{sidebar}</div>}

            {/* Sidebar on mobile */}
            <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
                {sidebar}
            </MobileSidebar>

            {/* Navbar on mobile */}
            <header className="flex items-center px-4 lg:hidden">
                <div className="py-2.5">
                    <NavbarItem onClick={() => setShowSidebar(true)} aria-label="Open navigation">
                        <OpenMenuIcon/>
                    </NavbarItem>
                </div>
                <div className="min-w-0 flex-1">{navbar}</div>
            </header>

            {/* Content */}
            <div className="flex flex-col flex-1">
                <div className="hidden lg:flex">
                    {navbar}
                </div>
                <main className={`pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 ${!hidden ? 'lg:pl-98' : 'lg:pl-2'}`}>
                    <div
                        className="grow lg:rounded-lg lg:bg-white h-screen lg:ring-1 lg:shadow-xs lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10 overflow-hidden">
                        <div className="mx-auto overflow-hidden h-[calc(100%-4.5rem)]">{children}</div>
                    </div>
                </main>
            </div>
        </div>
    )
}
