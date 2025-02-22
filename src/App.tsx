import {lazy, Suspense} from 'react'
import {Text} from '@/components/shared/text.tsx'
import {SidebarLayout} from '@/components/shared/sidebar-layout.tsx'
import NavBar from '@/components/layout/navbar.tsx'
import {PackChannels} from '@/components/layout/pack-channels.tsx'
import Preload from './preload.tsx'
import {Providers} from './provider.tsx'
import {Redirect, Route, Switch} from 'wouter'

// Lazy load all pages
const IDLayout = lazy(() => import('@/src/pages/id/layout.tsx'))
const IDLogin = lazy(() => import('@/src/pages/id/login/page.tsx'))
const IDCreate = lazy(() => import('@/src/pages/id/create/page.tsx'))
const PackLayout = lazy(() => import('@/src/pages/pack/[slug]/layout.tsx'))
const PackHome = lazy(() => import('@/src/pages/pack/[slug]/page.tsx'))
const PackCosmos = lazy(() => import('@/src/pages/pack/[slug]/cosmos/page.tsx'))
const NotFound = lazy(() => import('@/src/not-found.tsx'))
const PackAdd = lazy(() => import('@/src/pages/pack/new/page.tsx'))
const SettingsLayout = lazy(() => import('@/src/pages/settings/layout.tsx'))
const SettingsGeneral = lazy(() => import('@/src/pages/settings/page.tsx'))
const SettingsInvite = lazy(() => import('@/src/pages/settings/invite/page.tsx'))
const TermsPage = lazy(() => import('@/src/pages/terms/page.tsx'))
const ThankYouFriends = lazy(() => import('@/src/pages/thanks/page.tsx'))
const UserProfile = lazy(() => import('@/src/pages/user/[...slug]/page.tsx'))
const SettingsTemplate = lazy(() => import('@/src/pages/settings/template/page.tsx'))

// Lazy load components
const WaitlistCheck = lazy(() => import('@/components/layout/waitlist-check.tsx'))
const PostHogPageview = lazy(() => import('@/src/posthog-pageview.tsx'))

// Loading fallback component
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full">
        <Text>Loading...</Text>
    </div>
)

function App() {
    return (
        <>
            <Providers>
                <Suspense>
                    <PostHogPageview/>
                </Suspense>

                <div className="absolute bottom-0 left-0 w-full h-12 z-40 bg-sidebar sm:hidden">
                    <div className="flex justify-center items-center h-full">
                        <Text size="xs" className="text-center">
                            Mobile is unsupported! We won't take bug reports for mobile during the alpha. A mobile app is being worked on and coming soon.
                        </Text>
                    </div>
                </div>

                <SidebarLayout navbar={<NavBar/>} sidebar={<PackChannels/>}>
                    <div id="NGContentArea" className="h-full overflow-hidden flex">
                        <div className="grow">
                            <main className="flex h-full flex-1">
                                <div className="h-full w-full">
                                    <div id="NGRoot" className="h-full overflow-y-auto">
                                        <WaitlistCheck/>
                                        <Preload>
                                            <Switch>
                                                <Route path="/">
                                                    <Redirect to="/p/universe"/>
                                                </Route>

                                                <Route path="/terms">
                                                    <Suspense fallback={<LoadingFallback/>}>
                                                        <TermsPage/>
                                                    </Suspense>
                                                </Route>

                                                <Route path="/thanks">
                                                    <Suspense fallback={<LoadingFallback/>}>
                                                        <ThankYouFriends/>
                                                    </Suspense>
                                                </Route>

                                                <Route path="/id" nest>
                                                    <Suspense fallback={<LoadingFallback/>}>
                                                        <IDLayout>
                                                            <Route path="/login">
                                                                <Suspense fallback={<LoadingFallback/>}>
                                                                    <IDLogin/>
                                                                </Suspense>
                                                            </Route>
                                                            <Route path="/create">
                                                                <Suspense fallback={<LoadingFallback/>}>
                                                                    <IDCreate/>
                                                                </Suspense>
                                                            </Route>
                                                        </IDLayout>
                                                    </Suspense>
                                                </Route>

                                                <Route path="/p" nest>
                                                    <Switch>
                                                        <Route path="/new">
                                                            <Suspense fallback={<LoadingFallback/>}>
                                                                <PackAdd/>
                                                            </Suspense>
                                                        </Route>

                                                        <Route path="/:slug" nest>
                                                            <Suspense fallback={<LoadingFallback/>}>
                                                                <PackLayout>
                                                                    <Route path="/">
                                                                        <Suspense fallback={<LoadingFallback/>}>
                                                                            <PackHome/>
                                                                        </Suspense>
                                                                    </Route>
                                                                    <Route path="/cosmos">
                                                                        <Suspense fallback={<LoadingFallback/>}>
                                                                            <PackCosmos/>
                                                                        </Suspense>
                                                                    </Route>
                                                                </PackLayout>
                                                            </Suspense>
                                                        </Route>
                                                    </Switch>
                                                </Route>

                                                <Route path={/^\/@(?<slug>[^\/]+)\/?$/}>
                                                    <Suspense fallback={<LoadingFallback/>}>
                                                        <UserProfile/>
                                                    </Suspense>
                                                </Route>

                                                <Route path="/settings" nest>
                                                    <Suspense fallback={<LoadingFallback/>}>
                                                        <SettingsLayout>
                                                            <Switch>
                                                                <Route path="/template">
                                                                    <Suspense fallback={<LoadingFallback/>}>
                                                                        <SettingsTemplate/>
                                                                    </Suspense>
                                                                </Route>

                                                                <Route path="/invite">
                                                                    <Suspense fallback={<LoadingFallback/>}>
                                                                        <SettingsInvite/>
                                                                    </Suspense>
                                                                </Route>

                                                                <Route path="/">
                                                                    <Suspense fallback={<LoadingFallback/>}>
                                                                        <SettingsGeneral/>
                                                                    </Suspense>
                                                                </Route>

                                                                <Route>
                                                                    <Suspense fallback={<LoadingFallback/>}>
                                                                        <NotFound/>
                                                                    </Suspense>
                                                                </Route>
                                                            </Switch>
                                                        </SettingsLayout>
                                                    </Suspense>
                                                </Route>

                                                <Route>
                                                    <Suspense fallback={<LoadingFallback/>}>
                                                        <NotFound/>
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
        </>
    )
}

export default App