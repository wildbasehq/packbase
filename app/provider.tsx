'use client'

import {Toaster} from 'sonner'
import {ThemeProvider} from 'next-themes'
import {ModalProvider} from '@/components/modal/provider'
import colors from 'tailwindcss/colors'
import posthog from 'posthog-js'
import {PostHogProvider} from 'posthog-js/react'

if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false // Disable automatic pageview capture, as we capture manually
    })
}

export function Providers({children}: { children: React.ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
            <ThemeProvider attribute="class">
                <Toaster className="dark:hidden"/>
                <Toaster theme="dark" toastOptions={{
                    style: {
                        background: colors.neutral['800'],
                        color: '#FFF'
                    }
                }}/>
                <ModalProvider>{children}</ModalProvider>
            </ThemeProvider>
        </PostHogProvider>
    )
}