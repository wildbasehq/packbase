/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Body from '@/components/layout/body'
import {ReactNode} from 'react'

export default function StoreLayout({children}: { children: ReactNode }) {
    return (
        <Body>
            <div className="max-w-5xl w-full mx-auto">{children}</div>
        </Body>
    )
}
