import {SignedIn, SignedOut} from "@clerk/clerk-react"
import {lazy, Suspense} from "react"
import {Redirect, Route, Switch, useLocation} from "wouter"
import {LogoSpinner} from "@/src/components";
import Body from "@/components/layout/body.tsx";
import PackChannelThread from "@/pages/pack/[slug]/[channel]/[thread]/page.tsx";
import ChatLayout from "@/pages/c/layout.tsx";
import NotSelected from "@/pages/c/not-selected.tsx";
import UserLayout from "@/pages/user/[...slug]/layout.tsx";
import UserFolderPage from "@/pages/user/[...slug]/folders/[id]/page.tsx";
import {useResourceStore, useUserAccountStore} from "@/lib";

// Lazy load all pages
const IDLayout = lazy(() => import('@/pages/id/layout.tsx'))
const IDLogin = lazy(() => import('@/pages/id/login/page.tsx'))
const IDWaitlist = lazy(() => import('@/pages/id/waitlist/page.tsx'))
const PackChannel = lazy(() => import('@/pages/pack/[slug]/[channel]/page.tsx'))
const PackLayout = lazy(() => import('@/pages/pack/[slug]/layout.tsx'))
const PackHome = lazy(() => import('@/pages/pack/[slug]/page.tsx'))
const NotFound = lazy(() => import('@/src/not-found.tsx'))
const PackAdd = lazy(() => import('@/pages/pack/new/page.tsx'))
const TermsPage = lazy(() => import('@/pages/terms/page.tsx'))
const UserProfile = lazy(() => import('@/pages/user/[...slug]/page.tsx'))
const ChatThreadPage = lazy(() => import('@/pages/c/[id]/page.tsx'))
const GuestLanding = lazy(() => import('@/components/home/guestlanding.tsx'))
const SetupAccountPage = lazy(() => import('@/pages/me/setup/page.tsx'))

// Me
const EverythingPage = lazy(() => import('@/pages/me/everything/page.tsx'))

// Store
const StoreLayout = lazy(() => import('@/pages/store/layout.tsx'))
const StorePage = lazy(() => import('@/pages/store/page.tsx'))

// Loading fallback component
const LoadingFallback = () => (
    <Body bodyClassName="h-full" className="!h-full items-center justify-center">
        <LogoSpinner/>
        <span className="text-sm mt-1">Welcome!</span>
    </Body>
)

export default function Routes() {
    const {user} = useUserAccountStore()
    const {resourceDefault} = useResourceStore()

    return (
        <Switch>
            <Route path="/">
                <SignedIn>
                    <Redirect to="/me"/>
                </SignedIn>
                <SignedOut>
                    <GuestLanding/>
                </SignedOut>
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
                <RequiresAccount>
                    <Suspense fallback={<LoadingFallback/>}>
                        <StoreLayout>
                            <Route path="/">
                                <Suspense fallback={<LoadingFallback/>}>
                                    <StorePage/>
                                </Suspense>
                            </Route>
                        </StoreLayout>
                    </Suspense>
                </RequiresAccount>
            </Route>

            <Route path="/me" nest>
                <SignedOut>
                    <Redirect to="~/id/login"/>
                </SignedOut>

                <RequiresAccount>
                    <Switch>
                        <Route path="/setup">
                            <Suspense fallback={<LoadingFallback/>}>
                                <SetupAccountPage/>
                            </Suspense>
                        </Route>

                        <Route path="/following">
                            <Redirect to={resourceDefault ? `~/p/${resourceDefault.slug}/following` : '~/@me'}/>
                        </Route>

                        <Route path="/everything">
                            <Suspense fallback={<LoadingFallback/>}>
                                <EverythingPage/>
                            </Suspense>
                        </Route>

                        {/* Fallback */}
                        <Route>
                            <Redirect to={resourceDefault ? `~/p/${resourceDefault.slug}` : '~/@me'}/>
                        </Route>
                    </Switch>
                </RequiresAccount>
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
                <RequiresAccount>
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
                </RequiresAccount>
            </Route>

            {/* jank */}
            <Route path={/^\/(%40|@)(?<slug>[^\/]+)\/?$/}>
                <UserLayout>
                    <Suspense fallback={<LoadingFallback/>}>
                        <UserProfile/>
                    </Suspense>
                </UserLayout>
            </Route>
            <Route path={/^\/(%40|@)(?<slug>[^\/]+)(\/folders\/(?<id>[^\/]+))?\/?$/}>
                <UserLayout>
                    <UserFolderPage/>
                </UserLayout>
            </Route>

            <Route>
                <Suspense fallback={<LoadingFallback/>}>
                    <NotFound/>
                </Suspense>
            </Route>
        </Switch>

    )
}

function RequiresAccount({children}: { children?: React.ReactNode }) {
    const {user} = useUserAccountStore()
    const [location] = useLocation()

    if (!user) {
        return <Redirect to="~/id/login"/>
    }

    if (user?.requires_setup && !location.startsWith('/setup')) {
        return <Redirect to={"~/me/setup"}/>
    }

    return children
}