/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { lazy, Suspense } from 'react'
import { Text } from '@/components/shared/text.tsx'
import { SidebarLayout } from '@/components/shared/sidebar-layout.tsx'
import { Providers } from './provider.tsx'
import { SidebarProvider } from '@/lib/context/sidebar-context'
import Console from '@/components/shared/console.tsx'
import { AppTabs, GuestLanding, LogoSpinner } from '@/src/components'
import Body from '@/components/layout/body.tsx'
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/clerk-react'
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { TbFaceId } from 'react-icons/tb'
import { Redirect, Route, Switch } from 'wouter'
import UniversePackLayout from '@/pages/pack/universe/layout.tsx'
import PackChannelThread from '@/pages/pack/[slug]/[channel]/[thread]/page.tsx'
import Preload from '@/src/preload.tsx'

// Lazy load all pages
const IDLayout = lazy(() => import('@/pages/id/layout.tsx'))
const IDLogin = lazy(() => import('@/pages/id/login/page.tsx'))
const IDWaitlist = lazy(() => import('@/pages/id/waitlist/page.tsx'))
const UniversePack = lazy(() => import('@/pages/pack/universe/page.tsx'))
const PackChannel = lazy(() => import('@/pages/pack/[slug]/[channel]/page.tsx'))
const PackLayout = lazy(() => import('@/pages/pack/[slug]/layout.tsx'))
const PackHome = lazy(() => import('@/pages/pack/[slug]/page.tsx'))
const NotFound = lazy(() => import('@/src/not-found.tsx'))
const PackAdd = lazy(() => import('@/pages/pack/new/page.tsx'))
const TermsPage = lazy(() => import('@/pages/terms/page.tsx'))
const ThankYouFriends = lazy(() => import('@/pages/thanks/page.tsx'))
const UserProfile = lazy(() => import('@/pages/user/[...slug]/page.tsx'))
const SearchPage = lazy(() => import('@/pages/search/page.tsx'))

// Playground
const Playground = lazy(() => import('@/pages/playground/page.tsx'))

// Lazy load components
const WaitlistCheck = lazy(() => import('@/components/layout/waitlist-check.tsx'))

// Loading fallback component
const LoadingFallback = () => (
    <Body bodyClassName="h-full" className="!h-full items-center justify-center">
        <LogoSpinner />
        <span className="text-sm mt-1">Welcome!</span>
    </Body>
)

function App() {
    return (
        <Providers>
            <SidebarProvider>
                <Console />

                <SidebarLayout>
                    <div id="NGContentArea" className="flex h-full overflow-hidden">
                        <div className="grow">
                            <main className="flex flex-1 h-full">
                                <div className="w-full h-full">
                                        <Body bodyClassName="h-full" className="!h-full items-center justify-center">
                                            <LogoSpinner />
                                            <span className="text-sm mt-1">Servers are currently offline. Try again later.</span>
                                        </Body>
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
