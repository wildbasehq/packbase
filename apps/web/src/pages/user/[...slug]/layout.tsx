/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {Activity, ReactNode, useEffect} from 'react'
import {SidebarPortal} from '@/lib/context/sidebar-context'
import UserFolders from '@/components/layout/user-folders'
import {useParams} from "wouter";
import {useContentFrame} from "@/src/components";
import {isVisible} from "@/lib";
import PackbaseInstance from "@/lib/workers/global-event-emit.ts";

export default function UserLayout({children}: { children: ReactNode }) {
    const {slug} = useParams<{ slug: string }>()

    const {data: user, isLoading} = useContentFrame('get', `user.${slug}`)

    useEffect(() => {
        // if user.is_r18 is true, ask for verification
        if (user?.is_r18) {
            PackbaseInstance.emit('request-r18-confirmation', {})
        }
    }, [user, isLoading]);

    return (
        <Activity mode={isVisible(!!user)}>
            <SidebarPortal>
                <UserFolders user={user}/>
            </SidebarPortal>
            {children}
        </Activity>
    )
}
