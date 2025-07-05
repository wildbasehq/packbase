/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {SidebarDivider, SidebarItem, SidebarLabel, SidebarSection} from '@/src/components'
import {NewspaperIcon} from '@heroicons/react/16/solid'
import {SidebarPortal} from '@/lib/context/sidebar-context.tsx'

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
                    <NewspaperIcon />
                    <div className="flex flex-col min-w-0">
                        <SidebarLabel>For You</SidebarLabel>
                    </div>
                </SidebarItem>
                {/*<SidebarItem href="/p/universe/cosmos">*/}
                {/*    <NewspaperIcon />*/}
                {/*    <div className="flex flex-col min-w-0">*/}
                {/*        <SidebarLabel>Everything</SidebarLabel>*/}
                {/*    </div>*/}
                {/*</SidebarItem>*/}
            </SidebarSection>
            <SidebarDivider />
        </>
    )
}
