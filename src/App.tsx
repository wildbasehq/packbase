import {Suspense} from 'react'
import PostHogPageView from './PostHogPageView.tsx'
import {Text} from '@/components/shared/text.tsx'
import {SidebarLayout} from '@/components/shared/sidebar-layout.tsx'
import NavBar from '@/components/layout/navbar.tsx'
import {PackChannels} from '@/components/layout/pack-channels.tsx'
import WaitlistCheck from '@/components/layout/waitlist-check.tsx'
import Preload from './preload.tsx'
import {Providers} from './provider.tsx'
import {Redirect, Route, Switch} from 'wouter'
import IDLayout from '@/src/pages/id/layout.tsx'
import IDLogin from '@/src/pages/id/login/page.tsx'
import IDCreate from '@/src/pages/id/create/page.tsx'
import PackLayout from '@/src/pages/pack/[slug]/layout.tsx'
import PackHome from '@/src/pages/pack/[slug]/page.tsx'
import PackCosmos from '@/src/pages/pack/[slug]/cosmos/page.tsx'
import NotFound from '@/src/not-found.tsx'
import PackAdd from '@/src/pages/pack/new/page.tsx'

function App() {
    return (
        <>
            <Providers>
                <Suspense>
                    <PostHogPageView/>
                </Suspense>
                {/* "Mobile is unsupported" notice on bottom of page at all times*/}
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
                            {/*<NavBar/>*/}

                            {/* h-[calc(100%-4rem)] */}
                            <main className="flex h-full flex-1">
                                <div className="h-full w-full">
                                    <div id="NGRoot" className="h-full overflow-y-auto">
                                        <WaitlistCheck/>
                                        <Preload>
                                            <Switch>
                                                <Route path="/">
                                                    <Redirect to="/p/universe"/>
                                                </Route>

                                                <Route path="/id" nest>
                                                    <IDLayout>
                                                        <Route path="/login"><IDLogin/></Route>
                                                        <Route path="/create"><IDCreate/></Route>
                                                    </IDLayout>
                                                </Route>

                                                <Route path="/p/new">
                                                    <PackAdd/>
                                                </Route>
                                                <Route path="/p" nest>
                                                    <Route path="/:slug" nest>
                                                        <PackLayout>
                                                            <Route path="/"><PackHome/></Route>
                                                            <Route path="/cosmos"><PackCosmos/></Route>
                                                        </PackLayout>
                                                    </Route>
                                                </Route>

                                                <Route>
                                                    <NotFound/>
                                                </Route>
                                            </Switch>
                                        </Preload>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>
                </SidebarLayout>

                {/*<div*/}
                {/*    id="snap-UniverseEntryTest"*/}
                {/*    className="absolute flex justify-center items-center bottom-0 left-0 w-full h-1/2 z-40 bg-card shadow-inner shadow-n-4">*/}
                {/*    <Alert className="w-fit">*/}
                {/*        <AlertTitle>*/}
                {/*            <LoadingCircle className="inline-flex w-5 h-5"/> Universe Entry Test*/}
                {/*        </AlertTitle>*/}
                {/*        <AlertDescription>*/}
                {/*            entrypoint "@rek"*/}
                {/*        </AlertDescription>*/}
                {/*    </Alert>*/}
                {/*</div>*/}
            </Providers>
        </>
    )
}

export default App
