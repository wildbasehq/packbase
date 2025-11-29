/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Link from '@/components/shared/link'
import {Waitlist} from '@clerk/clerk-react'
import {Text} from '@/components/shared/text.tsx'
import {Alert, AlertDescription, AlertTitle} from '@/src/components'

export default function IDWaitlist() {
    return (
        <div className="space-y-4">
            <Alert variant="destructive" className="shadow-xs mb-4">
                <AlertTitle>Age Requirement Changes</AlertTitle>
                <AlertDescription>
                    On 10th of December 2025, we will be changing the age requirement to 18+, but content you can and
                    cannot upload will be
                    the same.
                </AlertDescription>
            </Alert>

            <Alert variant="destructive" className="shadow-xs mb-4">
                <AlertTitle>Registration is closed</AlertTitle>
                <AlertDescription>
                    We open and close registration based on traffic. Those on the waitlist will be first in line when
                    registration opens. If the waitlist is too large, registration will be closed for even longer, so
                    we encourage you to ask a friend to invite you instead.
                </AlertDescription>
            </Alert>

            <div className="shadow-xs ring-1 ring-n-5/10 rounded overflow-clip">
                <Waitlist signInUrl="/id/login"/>
            </div>

            <Text>
                By continuing, you agree to our{' '}
                <Link className="text-primary" href="/terms">
                    Packbase Usage Policy & Data Handling terms &rarr;
                </Link>
            </Text>
            <Text alt>Average waitlist flow: ~14 days &mdash; Based on last 30 members.</Text>
        </div>
    )
}
