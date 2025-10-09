import {SignedIn, SignedOut} from "@clerk/clerk-react"
import {lazy, Suspense} from "react"
import {Redirect, Route, Switch} from "wouter"
import {LogoSpinner} from "@/src/components";
import Body from "@/components/layout/body.tsx";
import UniversePackLayout from "@/pages/pack/universe/layout.tsx";
import PackChannelThread from "@/pages/pack/[slug]/[channel]/[thread]/page.tsx";
import ChatLayout from "@/pages/c/layout.tsx";
import NotSelected from "@/pages/c/not-selected.tsx";

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
const GuestLanding = lazy(() => import('@/components/home/guestlanding.tsx'))

// Store
const StoreLayout = lazy(() => import('@/pages/store/layout.tsx'))
const StorePage = lazy(() => import('@/pages/store/page.tsx'))
const FilesPage = lazy(() => import('@/pages/files/page.tsx'))

// Loading fallback component
const LoadingFallback = () => (
    <Body bodyClassName="h-full" className="!h-full items-center justify-center">
        <LogoSpinner/>
        <span className="text-sm mt-1">Welcome!</span>
    </Body>
)

export default function Routes() {
    return (
        <Switch>
            <Route path="/">
                <SignedIn>
                    <Redirect to="/p/universe"/>
                </SignedIn>
                <SignedOut>
                    <GuestLanding/>
                </SignedOut>
            </Route>

            <Route path="/search">
                <Suspense fallback={<LoadingFallback/>}>
                    <SearchPage/>
                </Suspense>
            </Route>

            <Route path="/terms">
                <Suspense fallback={<LoadingFallback/>}>
                    <TermsPage/>
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
                                <IDWaitlist/>
                            </Suspense>
                        </Route>
                    </IDLayout>
                </Suspense>
            </Route>

            <Route path="/store" nest>
                <Suspense fallback={<LoadingFallback/>}>
                    <StoreLayout>
                        <Route path="/">
                            <Suspense fallback={<LoadingFallback/>}>
                                <StorePage/>
                            </Suspense>
                        </Route>
                    </StoreLayout>
                </Suspense>
            </Route>

            {/* Files (matches /files and any subpath) */}
            <Route path={/^\/files(\/.*)?$/}>
                <Suspense fallback={<LoadingFallback/>}>
                    <FilesPage/>
                </Suspense>
            </Route>

            <Route path="/p" nest>
                <Switch>
                    <Route path="/new">
                        <Suspense fallback={<LoadingFallback/>}>
                            <PackAdd/>
                        </Suspense>
                    </Route>

                    <Route path="/universe" nest>
                        <UniversePackLayout>
                            <Route path="/">
                                <Suspense fallback={<LoadingFallback/>}>
                                    <UniversePack/>
                                </Suspense>
                            </Route>

                            <Route path="/cosmos">
                                <SignedOut>
                                    <Redirect to="/"/>
                                </SignedOut>

                                <SignedIn>
                                    <Suspense fallback={<LoadingFallback/>}>
                                        <UniversePack useEverythingQuery/>
                                    </Suspense>
                                </SignedIn>
                            </Route>

                            <Route path="/:channel/:id" nest>
                                <Suspense fallback={<LoadingFallback/>}>
                                    <PackChannelThread/>
                                </Suspense>
                            </Route>
                        </UniversePackLayout>
                    </Route>

                    <Route path="/:slug" nest>
                        <Suspense fallback={<LoadingFallback/>}>
                            <PackLayout>
                                <Route path="/">
                                    <Suspense fallback={<LoadingFallback/>}>
                                        <PackHome/>
                                    </Suspense>
                                </Route>

                                <Route path="/:channel" nest>
                                    <Route path="/">
                                        <Suspense fallback={<LoadingFallback/>}>
                                            <PackChannel/>
                                        </Suspense>
                                    </Route>

                                    <Route path="/:id">
                                        <Suspense fallback={<LoadingFallback/>}>
                                            <PackChannelThread/>
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
                            <Suspense fallback={<LoadingFallback/>}>
                                <NotSelected/>
                            </Suspense>
                        </ChatLayout>
                    </Route>

                    <Route path="/:id">
                        <ChatLayout>
                            <Suspense fallback={<LoadingFallback/>}>
                                <ChatThreadPage/>
                            </Suspense>
                        </ChatLayout>
                    </Route>
                </Switch>
            </Route>

            <Route path={/^\/(%40|@)(?<slug>[^\/]+)\/?$/}>
                <Suspense fallback={<LoadingFallback/>}>
                    <UserProfile/>
                </Suspense>
            </Route>

            <Route path="/stuff" nest>
                <div></div>
            </Route>

            <Route path="/settings" nest>
                <div></div>
            </Route>

            <Route>
                <Suspense fallback={<LoadingFallback/>}>
                    <NotFound/>
                </Suspense>
            </Route>
        </Switch>

    )
}