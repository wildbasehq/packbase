import {Toaster} from 'sonner'
import {ModalProvider} from '@/components/modal/provider'
import posthog from 'posthog-js'
import {PostHogProvider} from 'posthog-js/react'
import { useUserAccountStore } from '@/lib/states'
import { useEffect } from 'react'
import IntercomComponent from '@/components/shared/intercom'

if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY || '', {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        capture_pageview: false // Disable automatic pageview capture, as we capture manually
    })
}

export function Providers({ children }: { children: React.ReactNode }) {
    const { user } = useUserAccountStore()

    useEffect(() => {
        if (user) {
            posthog.identify(user.id)
        }
    }, [user])

    return (
        <PostHogProvider client={posthog}>
            <IntercomComponent user={user}>
                <Toaster className="dark:hidden" position="top-center" />
                <Toaster
                    className="hidden dark:block"
                    theme="dark"
                    position="top-center"
                    toastOptions={{
                        style: {
                            background: 'var(--color-n-7)',
                            color: '#FFF',
                        },
                    }}
                />
                <ModalProvider>{children}</ModalProvider>
            </IntercomComponent>
        </PostHogProvider>
    )
}