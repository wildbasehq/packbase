import { Toaster } from 'sonner'
import { ModalProvider } from '@/components/modal/provider'
import { useUserAccountStore } from '@/lib/index'
import IntercomComponent from '@/components/shared/intercom'
import { NotificationsProvider } from '@/lib/providers/notifications-provider'

export function Providers({ children }: { children: React.ReactNode }) {
    const { user } = useUserAccountStore()

    return (
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
            <NotificationsProvider>
                <ModalProvider>{children}</ModalProvider>
            </NotificationsProvider>
        </IntercomComponent>
    )
}
