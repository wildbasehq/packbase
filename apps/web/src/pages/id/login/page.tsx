/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useUserAccountStore} from '@/lib/state'
import {Alert, AlertDescription, AlertTitle} from '@/src/components'
import {SignIn} from '@clerk/clerk-react'

export default function IDLogin() {
    const {user} = useUserAccountStore()

    if (user) return (window.location.href = '/')

    return (
        <>
            <Alert variant="destructive" className="shadow-xs mb-4">
                <AlertTitle>Age Requirement Changes</AlertTitle>
                <AlertDescription>
                    On 10th of December 2025, we will be changing the age requirement to 18+, but content you can and cannot upload will be
                    the same.
                </AlertDescription>
            </Alert>
            <div className="shadow-xs ring-1 ring-n-5/10 rounded overflow-clip">
                <SignIn
                    waitlistUrl="/id/create"
                    appearance={{
                        elements: {
                            cardBox: {
                                boxShadow: 'none',
                            },
                            logoBox: {
                                display: 'none',
                            },
                        },
                    }}
                />
            </div>
        </>
    )
}
