/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {isVisible} from "@/lib";
import {Activity, StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import MaintenancePage from './_maintenance.tsx'
import {ClerkProvider} from '@clerk/clerk-react'
import {dark} from '@clerk/themes'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {ReactQueryDevtools} from '@tanstack/react-query-devtools'
import {ConfidentialOverlay} from "@/components/shared/confidential-overlay.tsx";
import ErrorBoundary from "@/components/ui/error.tsx";

declare global {
    interface String {
        toTitleCase(): string

        fromSnakeCase(): string
    }
}

String.prototype.toTitleCase = function () {
    return this.fromSnakeCase().replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    })
}

String.prototype.fromSnakeCase = function () {
    return this.replaceAll('_', ' ')
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_live_Y2xlcmsucGFja2Jhc2UuYXBwJA'

if (!PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env file')
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
                if (error?.status === 404 || error?.status === 401) return false
                return failureCount < 3
            },
        },
    },
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <ClerkProvider
                publishableKey={PUBLISHABLE_KEY}
                afterSignOutUrl="/"
                experimental={{
                    persistClient: true,
                }}
                localization={{
                    userProfile: {
                        start: {
                            headerTitle__account: 'Account Info',
                            profileSection: {
                                title: 'Avatar',
                                primaryButton: 'Update avatar',
                            },
                        },
                        navbar: {
                            account: 'Account',
                        },
                        profilePage: {
                            title: 'Update Avatar',
                        },
                        billingPage: {
                            title: 'Billing (Managed by Stripe / Clerk)',
                        },
                    },
                }}
                appearance={{
                    theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? dark : null,
                    elements: {
                        cardBox: {
                            boxShadow: 'none',
                        },
                        logoBox: {
                            display: 'none',
                        },
                    },
                }}
            >
                <Activity mode={isVisible(!import.meta.env.PROD)}>
                    <ConfidentialOverlay/>
                </Activity>

                <QueryClientProvider client={queryClient}>
                    {import.meta.env.MAINTENANCE ? <MaintenancePage/> : <App/>}
                    <ReactQueryDevtools initialIsOpen={false}/>
                </QueryClientProvider>
            </ClerkProvider>
        </ErrorBoundary>
    </StrictMode>
)
