/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Link from '@/components/shared/link'
import { Waitlist } from '@clerk/clerk-react'
import { Text } from '@/components/shared/text.tsx'

export default function IDWaitlist() {
    return (
        <div className="space-y-4">
            <div className="shadow-xs ring-1 ring-n-5/10 rounded overflow-clip">
                <Waitlist signInUrl="/id/login" />
            </div>

            <Text>
                By continuing, you agree to our{' '}
                <Link className="text-primary" href="/terms">
                    Packbase Usage Policy & Data Handling terms &rarr;
                </Link>
            </Text>
        </div>
    )
}
