import './styles/globals.scss'
import cx from 'classnames'
import { inter, lexend } from './fonts'
import { Providers } from '@/app/provider'
import Preload from '@/app/preload'
import dynamic from 'next/dynamic'
import { Analytics } from '@vercel/analytics/react'
import { ProjectSafeName } from '@/lib/utils'
import PackSwitcher from '@/components/layout/resource-switcher/pack-switcher'
import NavBar from '@/components/layout/navbar'
import { SideNav } from '@/components/layout/sidenav'
import ConnectionIssue from '@/components/modal/connection'
import localFont from 'next/font/local'

const wildbaseRemix = localFont({
    src: [
        {
            path: '../public/fonts/wildbase-regular.woff2',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../public/fonts/wildbase-medium.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../public/fonts/wildbase-bold.woff2',
            weight: '600',
            style: 'normal',
        },
    ],
    variable: '--font-wildbase',
})

export const metadata = {
    title: ProjectSafeName,
    description: 'A furry site.',
    twitter: {
        card: 'summary_large_image',
        title: ProjectSafeName,
        description: 'A furry site.',
    },
    metadataBase: new URL('https://ypnyp-dev-nextjs-ui.vercel.app/'),
    themeColor: '#FFF',
}

const PostHogPageView = dynamic(() => import('./PostHogPageView'), {
    ssr: false,
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="h-full">
            <body className={cx('h-full overflow-hidden bg-n-1 dark:bg-n-9', lexend.variable, lexend.className, inter.variable, wildbaseRemix.variable)}>
                <Providers>
                    <PostHogPageView />
                    <div id="NGContentArea" className="flex h-full overflow-hidden">
                        <PackSwitcher />
                        <div className="grow">
                            <NavBar />

                            <main className="flex h-[calc(100%-4rem)] flex-1 overflow-hidden">
                                {/* If screen size is sm, set slim to true */}
                                <SideNav slim={typeof window !== 'undefined' && window.innerWidth < 640} />

                                <div className="h-full w-full">
                                    <div id="NGRoot" className="h-full overflow-y-auto">
                                        {/*<WaitlistCheck/>*/}
                                        <Preload>{children}</Preload>
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

                <ConnectionIssue />

                <Analytics />
            </body>
        </html>
    )
}
