/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Body from '@/components/layout/body'
import BrowserCheck from '@/components/modal/browser-check'
import CommandPalette from '@/components/modal/command-palette'
import {SidebarLayout} from '@/components/shared/sidebar-layout'
import {resourceDefaultPackbase, useResourceStore, useUserAccountStore} from '@/lib'
import {SidebarProvider} from '@/lib/context/sidebar-context'
import DefaultPackSunset from '@/pages/pack/universe/default-pack-sunset'
import {FloatingCompose, LogoSpinner} from '@/src/components'
import Preload from '@/src/preload'
import Routes from '@/src/Routes'
import {ClerkFailed, ClerkLoaded, ClerkLoading, SignedIn} from '@clerk/clerk-react'
import {ExclamationTriangleIcon} from '@heroicons/react/20/solid'
import {lazy, useEffect} from 'react'
import {Providers} from './provider'

// Lazy load components
const WaitlistCheck = lazy(() => import('@/components/layout/waitlist-check'))

function App() {
    const {currentResource, setCurrentResource, resourceDefault} = useResourceStore()
    const {settings} = useUserAccountStore()

    useEffect(() => {
        // if current resource is missing any data, reset to default
        if (
            !currentResource ||
            !currentResource?.id ||
            !currentResource?.slug ||
            !currentResource?.display_name
        ) {
            setCurrentResource(resourceDefault || resourceDefaultPackbase)
        }
    }, [currentResource])

    return (
        <Providers>
            <Preload>
                {/* Browser check */}
                <BrowserCheck/>
                <CommandPalette/>

                <SidebarProvider>
                    {(window.location.pathname === '/p/universe/sunset' || window.location.pathname === '/p/universe/sunset/') && (
                        <DefaultPackSunset/>
                    )}

                    {!(window.location.pathname === '/p/universe/sunset' || window.location.pathname === '/p/universe/sunset/') && (
                        <>
                            {!settings?.howl_creator_as_sidebar && (
                                <SignedIn>
                                    <FloatingCompose/>
                                </SignedIn>
                            )}

                            <SidebarLayout>
                                <div id="NGContentArea" className="flex h-full overflow-hidden">
                                    <div className="grow w-full">
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
            </Preload>
        </Providers>
    )
}

export default App
