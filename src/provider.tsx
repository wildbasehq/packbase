import {Toaster} from 'sonner'
import {ModalProvider} from '@/components/modal/provider'
import posthog from 'posthog-js'
import {PostHogProvider} from 'posthog-js/react'

if (typeof window !== 'undefined' && import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '', {
        api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        capture_pageview: false // Disable automatic pageview capture, as we capture manually
    })
}

export function Providers({children}: { children: React.ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
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
        </PostHogProvider>
    )
}