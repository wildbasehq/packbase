import { Toaster } from 'sonner'
import { ModalProvider } from '@/components/modal/provider'
import { useUIStore, useUserAccountStore } from '@/lib/index'
import { lazy, Suspense, useEffect, useRef } from 'react'
import IntercomComponent from '@/components/shared/intercom'
import { Text } from '@/components/shared/text.tsx'
import { NotificationsProvider } from '@/lib/providers/notifications-provider'

// Lazy load WebSocketProvider
const WebSocketProvider = lazy(() =>
    import('@/lib/socket/WebsocketContext.tsx').then(module => ({
        default: module.WebSocketProvider,
    }))
)

export function Providers({ children }: { children: React.ReactNode }) {
    const { user } = useUserAccountStore()
    const { serverCapabilities } = useUIStore()

    // Check if realtime capability is available
    const hasRealtimeCapability = useRef<boolean>(serverCapabilities.includes('realtime'))

    useEffect(() => {
        if (serverCapabilities.includes('realtime')) {
            hasRealtimeCapability.current = true
        }
    }, [user, serverCapabilities])

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
            <NotificationsProvider>
                <ModalProvider>{children}</ModalProvider>
            </NotificationsProvider>
        </>
    )

    return (
        <IntercomComponent user={user}>
            {hasRealtimeCapability.current ? (
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center h-full">
                            <Text>Loading...</Text>
                        </div>
                    }
                >
                    <WebSocketProvider>{renderContent()}</WebSocketProvider>
                </Suspense>
            ) : (
                renderContent()
            )}
        </IntercomComponent>
    )
}
