/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {lazy, useEffect} from 'react'
import {SidebarLayout} from '@/components/shared/sidebar-layout.tsx'
import {Providers} from './provider.tsx'
import {SidebarProvider} from '@/lib/context/sidebar-context'
import {
    AppTabs,
    Dropdown,
    DropdownButton,
    Logo,
    LogoSpinner,
    Navbar,
    NavbarDivider,
    NavbarItem,
    NavbarLabel
} from '@/src/components'
import Body from '@/components/layout/body.tsx'
import {ClerkLoaded, ClerkLoading, SignedOut} from '@clerk/clerk-react'
import Preload from '@/src/preload.tsx'
import {ProjectName, ProjectSafeName} from '@/lib'
import BrowserCheck from '@/components/modal/browser-check.tsx'
import {ChevronDownIcon} from "@heroicons/react/16/solid";
import AppDropdownMenu from "@/components/layout/AppDropdownMenu.tsx";
import Routes from "@/src/Routes.tsx";

// Lazy load components
const WaitlistCheck = lazy(() => import('@/components/layout/waitlist-check.tsx'))

function App() {
    useEffect(() => {
        const styles = {
            subtitle: 'color: #4a90e2; font-size: 14px; font-weight: bold;',
            info: 'color: #666; font-size: 12px;',
            accent: 'color: #ff6b35; font-weight: bold;',
            success: 'color: #27ae60; font-weight: bold;',
        }

        console.log(
            `%c      _                    
__/\\_| |__   __ _ ___  ___ 
\\    / '_ \\ / _\` / __|/ _ \\
/_  _\\ |_) | (_| \\__ \\  __/
  \\/ |_.__/ \\__,_|___/\\___|
  
  (c) Wildbase 2025
`,
            'color: #ff6b35;'
        )

        console.log('')
        console.log("Welcome. Don't run random scripts people send to you. That'd be fucking stupid as shit.")
        console.log('')

        console.log(`%cℹ️  ${ProjectName}:`, styles.accent)
        console.log(`%c   • Framework: Vite, React ${React.version}`, styles.info)
        console.log(`%c   • Language: TypeScript`, styles.info)
        console.log(`%c   • Build: ${process.env.NODE_ENV || 'development'}`, styles.info)
        console.log(`%c   • Advert. CN: ${ProjectSafeName}`, styles.info)
        console.log('')

        console.log('%c`base()`', 'color: #9b59b6; font-style: italic;')
        ;(window as any).base = () =>
            console.log(`Dear user,

Big tech doesn't work for you. They don't know what a creative site is, they don't even know what being creative truly means. Every little byte of code to them is money - nothing more.

On the Internet, you have the power to make whatever the hell you want. Make a site with just basic <a>links</a>, a bio about yourself, whatever it may be; it's art. It's **your** art.

"But a site can't be art" some say. "It's just a website."

If you spend hours making a page that embodies you, that's art.

What i'm trying to say is, do what you want, make what you want.
At the end of the day,
only you know what's good
for you.

Thanks for being a crucial part of the internet.
        `)
    }, [])

    return (
        <Providers>
            {/* Browser check */}
            <BrowserCheck/>

            <SidebarProvider>
                <div className="absolute bottom-0 left-0 z-40 w-full sm:hidden">
                    <AppTabs
                        className="border-0 !rounded-none !rounded-t-md ring-1 ring-default items-center justify-center"/>
                </div>

                <SidebarLayout>
                    <div id="NGContentArea" className="flex h-full overflow-hidden">
                        <div className="grow">
                            <main className="flex flex-1 h-full">
                                <div className="w-full h-full">
                                    <ClerkLoading>
                                        <Body bodyClassName="h-full" className="!h-full items-center justify-center">
                                            <LogoSpinner/>
                                            <span className="text-sm mt-1">Checking Wild ID</span>
                                        </Body>
                                    </ClerkLoading>

                                    <ClerkLoaded>
                                        <Preload>
                                            <div id="NGRoot"
                                                 className="h-full overflow-y-auto overflow-x-hidden">
                                                <WaitlistCheck/>
                                                <SignedOut>
                                                    <div
                                                        className="fixed w-full top-0 z-50 bg-sidebar px-4 border-b border-default">
                                                        <Navbar>
                                                            <Dropdown>
                                                                <DropdownButton as={NavbarItem}
                                                                                className="max-lg:hidden">
                                                                    <div
                                                                        className="rounded-sm w-6 h-6 border overflow-hidden bg-primary-cosmos flex justify-center items-center">
                                                                        <Logo noStyle fullSize
                                                                              className="w-4 h-4 invert"/>
                                                                    </div>
                                                                    <NavbarLabel>Packbase</NavbarLabel>
                                                                    <ChevronDownIcon/>
                                                                </DropdownButton>
                                                                <AppDropdownMenu/>
                                                            </Dropdown>
                                                            <NavbarDivider/>
                                                        </Navbar>
                                                    </div>
                                                </SignedOut>

                                                <Routes/>
                                            </div>
                                        </Preload>
                                    </ClerkLoaded>
                                </div>
                            </main>
                        </div>
                    </div>
                </SidebarLayout>
            </SidebarProvider>
        </Providers>
    )
}

export default App
