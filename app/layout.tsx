import './styles/globals.scss'
import cx from 'classnames'
import {inter, lexend} from './fonts'
import {Providers} from '@/app/provider'
import Preload from '@/app/preload'
import dynamic from 'next/dynamic'
import WaitlistCheck from '@/components/layout/waitlistCheck'
import {Analytics} from '@vercel/analytics/react'
import {ProjectName} from '@/lib/utils'
import PackSwitcher from '@/components/layout/resource-switcher/pack-switcher'
import NavBar from '@/components/layout/navbar'
import {SideNav} from '@/components/layout/sidenav'

export const metadata = {
    title: ProjectName,
    description:
        'A furry site.',
    twitter: {
        card: 'summary_large_image',
        title: ProjectName,
        description:
            'A furry site.',
    },
    metadataBase: new URL('https://ypnyp-dev-nextjs-ui.vercel.app/'),
    themeColor: '#FFF',
}

declare global {
    interface Window {
        YipnyapStateCache: any;
    }
}

if (typeof window !== 'undefined') {
    window.YipnyapStateCache = {}
}

const PostHogPageView = dynamic(() => import('./PostHogPageView'), {
    ssr: false,
})

export default async function RootLayout({children}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className={cx('overflow-hidden', lexend.variable, lexend.className, inter.variable)}>
        <Providers>
            <PostHogPageView/>
            <div id="NGContentArea"
                 className="h-screen flex overflow-hidden">
                <PackSwitcher/>
                <div className="grow">
                    <NavBar/>

                    <main className="flex-1 flex overflow-hidden">
                        {/* If screen size is sm, set slim to true */}
                        <SideNav slim={typeof window !== 'undefined' && window.innerWidth < 640}/>

                        <div className="w-full h-full">
                            <div id="NGRoot" className="h-full overflow-y-auto">
                                <div id="NGContent"
                                     className="lg:mb-0 flex-1 h-full overflow-x-hidden"
                                >
                                    <div className="h-full">
                                        <WaitlistCheck/>
                                        <Preload>
                                            {children}
                                        </Preload>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

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

        {/*<ReportAbuse/>*/}

        <Analytics/>
        </body>
        </html>
    )
}
