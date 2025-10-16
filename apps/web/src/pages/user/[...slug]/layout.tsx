/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {ReactNode} from 'react'
import {SidebarPortal} from '@/lib/context/sidebar-context'
import UserFolders from '@/components/layout/user-folders'

export default function UserLayout({children}: { children: ReactNode }) {
    return (
        <>
            <SidebarPortal>
                <UserFolders/>
            </SidebarPortal>
            {children}
        </>
    )
}
