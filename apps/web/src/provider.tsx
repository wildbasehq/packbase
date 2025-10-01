/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {Toaster} from 'sonner'
import {ModalProvider} from '@/components/modal/provider'
import {NotificationsProvider} from '@/lib/providers/notifications-provider'
import {ReactNode} from "react";

export function Providers({children}: { children: ReactNode }) {
    return (
        <>
            <Toaster className="dark:hidden" position="top-center"/>
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
}
