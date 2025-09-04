/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { SidebarDivider, SidebarItem, SidebarLabel, SidebarSection } from '@/src/components'
import { SidebarPortal } from '@/lib/context/sidebar-context.tsx'
import { NewspaperIcon, UserGroupIcon } from '@heroicons/react/16/solid'

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

function UniverseSidebarContent() {
    return (
        <>
            <SidebarSection>
                <SidebarItem href="/p/universe">
                    <UserGroupIcon />
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
