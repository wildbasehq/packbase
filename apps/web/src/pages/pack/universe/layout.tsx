/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { SidebarDivider, SidebarHeader, SidebarHeading, SidebarItem, SidebarLabel, SidebarSection } from '@/src/components'
import { SidebarPortal } from '@/lib/context/sidebar-context.tsx'
import { NewspaperIcon, UserGroupIcon } from '@heroicons/react/16/solid'
import { Newspaper } from '@/components/icons/plump/Newspaper'
import { ChatBubbleSmileyIcon } from '@/components/icons/plump'
import { ChatSidebarContent } from '@/pages/c/layout'

export default function UniversePackLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SidebarPortal>
                <UniverseSidebarContent />
            </SidebarPortal>

            {children}
        </>
    )
}

export function UniverseSidebarContent() {
    return (
        <>
            <SidebarSection>
                <SidebarItem href="/p/universe">
                    <ChatBubbleSmileyIcon />
                    <div className="flex flex-col min-w-0">
                        <SidebarLabel>Following</SidebarLabel>
                    </div>
                </SidebarItem>
                {/*<SidebarItem href="/f/me:friends">*/}
                {/*    <UserGroupIcon />*/}
                {/*    <div className="flex flex-col min-w-0">*/}
                {/*        <SidebarLabel>Friends</SidebarLabel>*/}
                {/*    </div>*/}
                {/*</SidebarItem>*/}
                <SidebarItem href="/p/universe/cosmos">
                    <Newspaper />
                    <div className="flex flex-col min-w-0">
                        <SidebarLabel>Everything</SidebarLabel>
                    </div>
                </SidebarItem>
            </SidebarSection>
            <SidebarDivider />
            <SidebarSection>
                <SidebarHeading>Chat</SidebarHeading>
                <ChatSidebarContent />
            </SidebarSection>
        </>
    )
}
