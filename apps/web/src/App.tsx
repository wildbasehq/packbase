/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, { lazy, Suspense, useEffect } from 'react'
import { SidebarLayout } from '@/components/shared/sidebar-layout.tsx'
import { Providers } from './provider.tsx'
import { SidebarProvider } from '@/lib/context/sidebar-context'
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
import { ProjectName, ProjectSafeName } from '@/lib'
import BrowserCheck from '@/components/modal/browser-check.tsx'

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
const UserProfile = lazy(() => import('@/pages/user/[...slug]/page.tsx'))
const SearchPage = lazy(() => import('@/pages/search/page.tsx'))
const ChatThreadPage = lazy(() => import('@/pages/c/[id]/page.tsx'))

// Store
const StoreLayout = lazy(() => import('@/pages/store/layout.tsx'))
const StorePage = lazy(() => import('@/pages/store/page.tsx'))
const StoreItemPage = lazy(() => import('@/pages/store/[item]/page.tsx'))
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
            <BrowserCheck />

            <SidebarProvider>
                <div className="absolute bottom-0 left-0 z-40 w-full sm:hidden">
                    <AppTabs className="border-0 !rounded-none !rounded-t-md ring-1 ring-default items-center justify-center" />
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
                                            <div id="NGRoot" className="h-full overflow-y-auto overflow-x-hidden">
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

                                                    <Route path="/store" nest>
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <StoreLayout>
                                                                <Route path="/">
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <StorePage />
                                                                    </Suspense>
                                                                </Route>
                                                            </StoreLayout>
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
                                                        <Switch>
                                                            <Route path="/">
                                                                <ChatLayout>
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <NotSelected />
                                                                    </Suspense>
                                                                </ChatLayout>
                                                            </Route>

                                                            <Route path="/:id">
                                                                <ChatLayout>
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <ChatThreadPage />
                                                                    </Suspense>
                                                                </ChatLayout>
                                                            </Route>
                                                        </Switch>
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
