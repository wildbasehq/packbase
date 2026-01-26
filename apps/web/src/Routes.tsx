import Body from '@/components/layout/body'
import {useResourceStore, useUserAccountStore} from '@/lib'
import ChatLayout from '@/pages/c/layout'
import NotSelected from '@/pages/c/not-selected'
import PackChannelThread from '@/pages/pack/[slug]/[channel]/[thread]/page'
import UserFolderPage from '@/pages/user/[...slug]/folders/[id]/page'
import UserLayout from '@/pages/user/[...slug]/layout'
import {LogoSpinner} from '@/src/components'
import {SignedIn, SignedOut} from '@clerk/clerk-react'
import {lazy, ReactNode, Suspense} from 'react'
import {Redirect, Route, Switch, useLocation} from 'wouter'

// Lazy load all pages
const IDLayout = lazy(() => import('@/pages/id/layout'))
const IDLogin = lazy(() => import('@/pages/id/login/page'))
const IDWaitlist = lazy(() => import('@/pages/id/waitlist/page'))
const PackChannel = lazy(() => import('@/pages/pack/[slug]/[channel]/page'))
const PackLayout = lazy(() => import('@/pages/pack/[slug]/layout'))
const PackHome = lazy(() => import('@/pages/pack/[slug]/page'))
const NotFound = lazy(() => import('@/src/not-found'))
const PackAdd = lazy(() => import('@/pages/pack/new/page'))
const TermsPage = lazy(() => import('@/pages/terms/page'))
const LeaderboardPage = lazy(() => import('@/pages/leaderboard/page'))
const UserProfile = lazy(() => import('@/pages/user/[...slug]/page'))
const ChatThreadPage = lazy(() => import('@/pages/c/[id]/page'))
const GuestLanding = lazy(() => import('@/components/home/guestlanding'))
const SetupAccountPage = lazy(() => import('@/pages/me/setup/page'))

// Me
const MeEverythingPage = lazy(() => import('@/pages/me/everything/page'))
const MeFollowingPage = lazy(() => import('@/pages/me/following/page'))

// Store
const StoreLayout = lazy(() => import('@/pages/store/layout'))
const StorePage = lazy(() => import('@/pages/store/page'))

// Books
const BooksLayout = lazy(() => import('@/pages/books/layout'))
const BookList = lazy(() => import('@/pages/books/page'))
const BookEditor = lazy(() => import('@/pages/books/editor'))

// Loading fallback component
const LoadingFallback = () => (
    <Body bodyClassName="h-full" className="h-full! items-center justify-center">
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

            <Route path="/leaderboard">
                <Suspense fallback={<LoadingFallback/>}>
                    <LeaderboardPage/>
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

                        <PackLayout>
                            {/* Fallback */}
                            <Route path="/">
                                <Redirect to={resourceDefault ? `~/p/${resourceDefault.slug}` : '~/@me'}/>
                            </Route>

                            <Route path="/following">
                                <Suspense fallback={<LoadingFallback/>}>
                                    <MeFollowingPage/>
                                </Suspense>
                            </Route>

                            <Route path="/everything">
                                <Suspense fallback={<LoadingFallback/>}>
                                    <MeEverythingPage/>
                                </Suspense>
                            </Route>
                        </PackLayout>
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

            {/* Books */}
            <Route path="/books" nest>
                <BooksLayout>
                    <Switch>
                        <Route path="/">
                            <Suspense fallback={<LoadingFallback/>}>
                                <BookList/>
                            </Suspense>
                        </Route>
                        <Route path="/:id">
                            <Suspense fallback={<LoadingFallback/>}>
                                <BookEditor/>
                            </Suspense>
                        </Route>
                    </Switch>
                </BooksLayout>
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

function RequiresAccount({children}: { children?: ReactNode }) {
    const {user} = useUserAccountStore()
    const [location] = useLocation()

    if (!user) {
        return <SignedOut><Redirect to="~/id/login"/></SignedOut>
    }

    if (user?.requires_setup && !location.startsWith('/setup')) {
        return <Redirect to={'~/me/setup'}/>
    }

    return <SignedIn>{user ? children : null}</SignedIn>
}
