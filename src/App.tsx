import { lazy, Suspense } from 'react'
import { Text } from '@/components/shared/text.tsx'
import { SidebarLayout } from '@/components/shared/sidebar-layout.tsx'
import NavBar from '@/components/layout/navbar.tsx'
import { PackChannels } from '@/components/layout/pack-channels.tsx'
import Preload from './preload.tsx'
import { Providers } from './provider.tsx'
import { Redirect, Route, Switch } from 'wouter'
import Console from '@/components/shared/console.tsx'

// Lazy load all pages
const IDLayout = lazy(() => import('@/pages/id/layout.tsx'))
const IDLogin = lazy(() => import('@/pages/id/login/page.tsx'))
const IDCreate = lazy(() => import('@/pages/id/create/page.tsx'))
const IDWaitlist = lazy(() => import('@/pages/id/waitlist/page.tsx'))
const PackLayout = lazy(() => import('@/pages/pack/[slug]/layout.tsx'))
const PackHome = lazy(() => import('@/pages/pack/[slug]/page.tsx'))
const PackCosmos = lazy(() => import('@/pages/pack/[slug]/cosmos/page.tsx'))
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
    <div className="flex items-center justify-center h-full">
        <Text>Loading...</Text>
    </div>
)

function App() {
    return (
        <Providers>
            <Console />

            <div className="absolute bottom-0 left-0 z-40 w-full h-12 bg-sidebar sm:hidden">
                <div className="flex items-center justify-center h-full">
                    <Text size="xs" className="text-center">
                        Mobile is unsupported! We won't take bug reports for mobile during the alpha. A mobile app is being worked on and
                        coming soon.
                    </Text>
                </div>
            </div>

            <SidebarLayout navbar={<NavBar />} sidebar={<PackChannels />}>
                <div id="NGContentArea" className="flex h-full overflow-hidden">
                    <div className="grow">
                        <main className="flex flex-1 h-full">
                            <div className="w-full h-full">
                                <div id="NGRoot" className="h-full overflow-y-auto">
                                    <WaitlistCheck />
                                    <Preload>
                                        <Switch>
                                            <Route path="/">
                                                <Redirect to="/p/universe" />
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
                                                                {/*<IDCreate />*/}
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

                                                    <Route path="/:slug" nest>
                                                        <Suspense fallback={<LoadingFallback />}>
                                                            <PackLayout>
                                                                <Route path="/">
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <PackHome />
                                                                    </Suspense>
                                                                </Route>
                                                                <Route path="/cosmos">
                                                                    <Suspense fallback={<LoadingFallback />}>
                                                                        <PackCosmos />
                                                                    </Suspense>
                                                                </Route>
                                                            </PackLayout>
                                                        </Suspense>
                                                    </Route>
                                                </Switch>
                                            </Route>

                                            <Route path={/^\/@(?<slug>[^\/]+)\/?$/}>
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
                                    </Preload>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </SidebarLayout>
        </Providers>
    )
}

export default App
