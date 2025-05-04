import { Toaster } from 'sonner'
import { ModalProvider } from '@/components/modal/provider'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useUIStore, useUserAccountStore } from '@/lib/states'
import { lazy, Suspense, useEffect } from 'react'
import IntercomComponent from '@/components/shared/intercom'

// Lazy load WebSocketProvider
const WebSocketProvider = lazy(() => import('@/lib/socket/WebsocketContext.tsx').then(module => ({
    default: module.WebSocketProvider
})))

if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY || '', {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    })
}

export function Providers({ children }: { children: React.ReactNode }) {
    const { user } = useUserAccountStore()
    const { serverCapabilities } = useUIStore()

    // Check if realtime capability is available
    const hasRealtimeCapability = serverCapabilities.includes('realtime')

    useEffect(() => {
        if (user) {
            posthog.identify(user.id)
        }
    }, [user])

    // Render content with or without WebSocketProvider based on capabilities
    const renderContent = () => (
        <>
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
        </>
    )

    return (
        <PostHogProvider client={posthog}>
            <IntercomComponent user={user}>
                {hasRealtimeCapability ? (
                    <Suspense fallback={renderContent()}>
                        <WebSocketProvider>
                            {renderContent()}
                        </WebSocketProvider>
                    </Suspense>
                ) : (
                    renderContent()
                )}
            </IntercomComponent>
        </PostHogProvider>
    )
}
