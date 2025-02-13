'use client'

import {Toaster} from 'sonner'
import {ThemeProvider} from 'next-themes'
import {ModalProvider} from '@/components/modal/provider'
import posthog from 'posthog-js'
import {PostHogProvider} from 'posthog-js/react'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false // Disable automatic pageview capture, as we capture manually
    })
}

export function Providers({children}: { children: React.ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
            <ThemeProvider attribute="class">
                <Toaster className="dark:hidden" position="top-center"/>
                <Toaster className="hidden dark:block"
                         theme="dark"
                         position="top-center"
                         toastOptions={{
                             style: {
                                 background: 'var(--color-n-7)',
                                 color: '#FFF'
                             }
                         }}/>
                <ModalProvider>{children}</ModalProvider>
            </ThemeProvider>
        </PostHogProvider>
    )
}