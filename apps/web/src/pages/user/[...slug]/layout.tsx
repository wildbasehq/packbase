/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {Activity, ReactNode} from 'react'
import {SidebarPortal} from '@/lib/context/sidebar-context'
import UserFolders from '@/components/layout/user-folders'
import {useParams} from "wouter";
import {useContentFrame} from "@/src/components";
import {isVisible} from "@/lib";

export default function UserLayout({children}: { children: ReactNode }) {
    const {slug} = useParams<{ slug: string }>()

    const {data: user, isLoading} = useContentFrame('get', `user.${slug}`)

    return (
        <Activity mode={isVisible(!!user)}>
            <SidebarPortal>
                <UserFolders user={user}/>
            </SidebarPortal>
            {children}
        </Activity>
    )
}
