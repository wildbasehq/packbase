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
import ChatLayout from '@/pages/c/layout.tsx'
import NotSelected from '@/pages/c/not-selected.tsx'

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
const ChatThreadPage = lazy(() => import('@/pages/c/[id]/page.tsx'))

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

                <div className="absolute bottom-0 left-0 z-40 w-full h-12 bg-sidebar sm:hidden">
                    <div className="flex items-center justify-center h-full">
                        <Text size="xs" className="text-center">
                            Mobile is unsupported! We won't take bug reports for mobile during the alpha. A mobile app is being worked on
                            and coming soon.
                        </Text>
                    </div>
                </div>

                <SidebarLayout>
                    <div id="NGContentArea" className="flex h-full overflow-hidden">
                        <div className="grow">
                            <main className="flex flex-1 h-full">
                                <div className="w-full h-full">
                                    <ClerkLoading>
                                        <Body bodyClassName="h-full" className="!h-full items-center justify-center">
                                            <LogoSpinner />
                                            <span className="text-sm mt-1">Checking Wild ID</span>
                                        </Body>
                                    </ClerkLoading>

                                    <ClerkLoaded>
                                        <Preload>
                                            <div id="NGRoot" className="h-full overflow-y-auto">
                                                <WaitlistCheck />
                                                <SignedOut>
                                                    <div className="flex fixed top-4 z-40 w-full">
                                                        <AppTabs
                                                            tabs={[
                                                                { title: 'Your Nest', icon: HomeIcon, href: ['/', ''] },
                                                                { type: 'search', icon: MagnifyingGlassIcon, href: '/search' },
                                                                { type: 'separator' },
                                                                // @ts-ignore
                                                                { title: 'Login', icon: TbFaceId, href: '/id/login' },
                                                            ]}
                                                        />
                                                    </div>
                                                </SignedOut>
                                                <Switch>
                                                    <Route path="/">
                                                        <SignedIn>
                                                            <Redirect to="/p/universe" />
                                                        </SignedIn>
                                                        <SignedOut>
                                                            <GuestLanding />
                                                        </SignedOut>
                                                    </Route>

                                                    <Route path="/search">
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <SearchPage />
                                                        </Suspense>
                                                    </Route>

                                                    <Route path="/terms">
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <TermsPage />
                                                        </Suspense>
                                                    </Route>

                                                    <Route path="/thanks">
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <ThankYouFriends />
                                                        </Suspense>
                                                    </Route>

                                                    <Route path="/playground">
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <Playground />
                                                        </Suspense>
                                                    </Route>

                                                    <Route path="/id" nest>
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <IDLayout>
                                                                <Route path="/login">
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <IDLogin />
                                                                    </Suspense>
                                                                </Route>
                                                                <Route path="/create">
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <IDWaitlist />
                                                                    </Suspense>
                                                                </Route>
                                                            </IDLayout>
                                                        </Suspense>
                                                    </Route>

                                                    <Route path="/p" nest>
                                                        <Switch>
                                                            <Route path="/new">
                                                                <Suspense fallback={<LoadingFallback />}>
                                                                    <PackAdd />
                                                                </Suspense>
                                                            </Route>

                                                            <Route path="/universe" nest>
                                                                <UniversePackLayout>
                                                                    <Route path="/">
                                                                        <Suspense fallback={<LoadingFallback />}>
                                                                            <UniversePack />
                                                                        </Suspense>
                                                                    </Route>

                                                                    <Route path="/cosmos">
                                                                        <SignedOut>
                                                                            <Redirect to="/" />
                                                                        </SignedOut>

                                                                        <SignedIn>
                                                                            <Suspense fallback={<LoadingFallback />}>
                                                                                <UniversePack useEverythingQuery />
                                                                            </Suspense>
                                                                        </SignedIn>
                                                                    </Route>

                                                                    <Route path="/:channel/:id" nest>
                                                                        <Suspense fallback={<LoadingFallback />}>
                                                                            <PackChannelThread />
                                                                        </Suspense>
                                                                    </Route>
                                                                </UniversePackLayout>
                                                            </Route>

                                                            <Route path="/:slug" nest>
                                                                <Suspense fallback={<LoadingFallback />}>
                                                                    <PackLayout>
                                                                        <Route path="/">
                                                                            <Suspense fallback={<LoadingFallback />}>
                                                                                <PackHome />
                                                                            </Suspense>
                                                                        </Route>

                                                                        <Route path="/:channel" nest>
                                                                            <Route path="/">
                                                                                <Suspense fallback={<LoadingFallback />}>
                                                                                    <PackChannel />
                                                                                </Suspense>
                                                                            </Route>

                                                                            <Route path="/:id">
                                                                                <Suspense fallback={<LoadingFallback />}>
                                                                                    <PackChannelThread />
                                                                                </Suspense>
                                                                            </Route>
                                                                        </Route>
                                                                    </PackLayout>
                                                                </Suspense>
                                                            </Route>
                                                        </Switch>
                                                    </Route>

                                                    <Route path="/c" nest>
                                                        <ChatLayout>
                                                            <Switch>
                                                                <Route path="/">
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <NotSelected />
                                                                    </Suspense>
                                                                </Route>

                                                                <Route path="/:id">
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <ChatThreadPage />
                                                                    </Suspense>
                                                                </Route>
                                                            </Switch>
                                                        </ChatLayout>
                                                    </Route>

                                                    <Route path={/^\/(%40|@)(?<slug>[^\/]+)\/?$/}>
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <UserProfile />
                                                        </Suspense>
                                                    </Route>

                                                    <Route path="/stuff" nest>
                                                        <div></div>
                                                    </Route>

                                                    <Route path="/settings" nest>
                                                        <div></div>
                                                    </Route>

                                                    <Route>
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <NotFound />
                                                        </Suspense>
                                                    </Route>
                                                </Switch>
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
