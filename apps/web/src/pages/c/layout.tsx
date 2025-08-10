/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { SidebarPortal } from '@/lib/context/sidebar-context.tsx'
import { SidebarDivider, SidebarItem, SidebarLabel, SidebarSection } from '@/src/components'
import { NewspaperIcon, UserGroupIcon } from '@heroicons/react/16/solid'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SidebarPortal>
                <ChatSidebarContent />
            </SidebarPortal>
            {children}
        </>
    )
}

function ChatSidebarContent() {
    return (
        <>
            <SidebarSection>
                <SidebarItem href="/p/universe">
                    <UserGroupIcon />
                    <div className="flex flex-col min-w-0">
                        <SidebarLabel>someone</SidebarLabel>
                        <SidebarLabel className="text-muted-foreground">someone</SidebarLabel>
                    </div>
                </SidebarItem>
                <SidebarItem href="/p/universe/cosmos">
                    <NewspaperIcon />
                    <div className="flex flex-col min-w-0">
                        <SidebarLabel>Everything</SidebarLabel>
                    </div>
                </SidebarItem>
            </SidebarSection>
            <SidebarDivider />
        </>
    )
}
