/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import Body from '@/components/layout/body'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    return (
        <Body>
            <div className="max-w-5xl w-full mx-auto">{children}</div>
        </Body>
    )
}
