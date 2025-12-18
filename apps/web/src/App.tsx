/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {lazy, useEffect} from 'react'
import {SidebarLayout} from '@/components/shared/sidebar-layout.tsx'
import {Providers} from './provider.tsx'
import {SidebarProvider} from '@/lib/context/sidebar-context'
import {AppTabs, FloatingCompose, LogoSpinner} from '@/src/components'
import Body from '@/components/layout/body.tsx'
import {ClerkFailed, ClerkLoaded, ClerkLoading, SignedIn} from '@clerk/clerk-react'
import Preload from '@/src/preload.tsx'
import {ProjectName, ProjectSafeName, resourceDefaultPackbase, useResourceStore} from '@/lib'
import BrowserCheck from '@/components/modal/browser-check.tsx'
import Routes from '@/src/Routes.tsx'
import CommandPalette from '@/components/modal/command-palette.tsx'
import {ExclamationTriangleIcon} from "@heroicons/react/20/solid";
import DefaultPackSunset from "@/pages/pack/universe/default-pack-sunset.tsx";

// Lazy load components
const WaitlistCheck = lazy(() => import('@/components/layout/waitlist-check.tsx'))

function App() {
    const {currentResource, setCurrentResource, resourceDefault} = useResourceStore()

    useEffect(() => {
        // if current resource is missing any data, reset to default
        if (
            !currentResource ||
            !currentResource.id ||
            !currentResource.slug ||
            !currentResource.display_name
        ) {
            setCurrentResource(resourceDefault || resourceDefaultPackbase)
        }
    }, [currentResource]);

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
    }, [])

    return (
        <Providers>
            {/* Browser check */}
            <BrowserCheck/>
            <CommandPalette/>

            <SidebarProvider>
                {(window.location.pathname === '/p/universe/sunset' || window.location.pathname === '/p/universe/sunset/') && (
                    <Preload>
                        <DefaultPackSunset/>
                    </Preload>
                )}

                {!(window.location.pathname === '/p/universe/sunset' || window.location.pathname === '/p/universe/sunset/') && (
                    <>
                        <SignedIn>
                            <FloatingCompose/>
                        </SignedIn>

                        <div className="absolute bottom-0 left-0 z-40 w-full sm:hidden">
                            <AppTabs/>
                        </div>

                        <SidebarLayout>
                            <div id="NGContentArea" className="flex h-full overflow-hidden">
                                <div className="grow w-full">
                                    {/* top white shadow */}
                                    <div
                                        className="pointer-events-none absolute top-0 left-0 z-50 h-12 w-full bg-linear-to-b from-white/80 to-white/0 dark:from-zinc-900/80 dark:to-zinc-900/0"/>
                                    <main className="flex flex-1 h-full">
                                        <div className="w-full h-full">
                                            <ClerkLoading>
                                                <Body bodyClassName="h-full"
                                                      className="!h-full items-center justify-center">
                                                    <LogoSpinner/>
                                                    <span className="text-sm mt-1">Checking Wild ID</span>
                                                </Body>
                                            </ClerkLoading>
                                            <ClerkFailed>
                                                <Body bodyClassName="h-full"
                                                      className="h-full! items-center justify-center">
                                                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500"/>
                                                    <span className="mt-1 text-red-500">Wild ID is DOWN.</span>
                                                </Body>
                                            </ClerkFailed>

                                            <ClerkLoaded>
                                                <Preload>
                                                    <div id="NGRoot"
                                                         className="h-full overflow-y-auto overflow-x-hidden">
                                                        <WaitlistCheck/>

                                                        <Routes/>
                                                    </div>
                                                </Preload>
                                            </ClerkLoaded>
                                        </div>
                                    </main>
                                </div>
                            </div>
                        </SidebarLayout>
                    </>
                )}
            </SidebarProvider>
        </Providers>
    )
}

export default App
