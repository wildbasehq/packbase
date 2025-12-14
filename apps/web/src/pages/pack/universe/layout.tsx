/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {
    Alert,
    AlertDescription,
    AlertTitle,
    BubblePopover,
    Button,
    PopoverHeader,
    SidebarDivider,
    SidebarHeading,
    SidebarItem,
    SidebarLabel,
    SidebarSection,
} from '@/src/components'
import {SidebarPortal} from '@/lib/context/sidebar-context.tsx'
import {Newspaper} from '@/components/icons/plump/Newspaper'
import {ChatBubbleSmileyIcon} from '@/components/icons/plump'
import {ChatSidebarContent} from '@/pages/c/layout'
import {ReactNode, useEffect} from "react";
import {useResourceStore} from "@/lib";
import {useLocalStorage} from "usehooks-ts";
import {ExclamationTriangleIcon} from "@heroicons/react/20/solid";

function UniverseSunset() {
    return (
        <Alert className="max-w-3xl mx-auto mt-8 overflow-visible" variant="destructive">
            <AlertTitle>
                <ExclamationTriangleIcon className="inline-flex w-5 h-5"/> The "Universe" is being sunset
            </AlertTitle>
            <AlertDescription>
                "Default Pack" is the Pack that shows when you go to the Home page. The Universe is the current
                Default Pack you howl into, and see content from all over Packbase. We're wanting to go back to our
                roots and focus more on Packs themselves, so we'll be sunsetting the global Universe pack for now.
                <br/><br/>
                You can switch right now if you'd like, but the moment you switch you cannot go back. You'll be
                forced to do this soon.
                <br/><br/>
                Don't get used to this - this is a one-off migration for those who have content on the Universe.
                <br/><br/>
                <b>You must complete this before Alpha 10 (currently Alpha 9).</b>
            </AlertDescription>

            <div className="flex justify-end mt-4">
                <BubblePopover
                    id="cdp-modal"
                    trigger={({setOpen}) => (
                        <Button color="red" onClick={() => setOpen(true)}>
                            Change Default Pack Now
                        </Button>
                    )}
                >
                    <PopoverHeader
                        variant="destructive"
                        title="Change Default Pack"
                        description="Switching from the Universe is permanent and can never be undone."
                    />

                    <div className="flex gap-4 [&>*]:w-full mt-3">
                        <Button color="red" onClick={() => window.location.href = '/p/universe/sunset'}>
                            I Understand, Change Anyway
                        </Button>
                    </div>
                </BubblePopover>
            </div>
        </Alert>
    )
}

export default function UniversePackLayout({children}: { children: ReactNode }) {
    const {setCurrentResource, resourceDefault} = useResourceStore()
    const [isWHOpen] = useLocalStorage<any>('wh-open', false)

    useEffect(() => {
        setCurrentResource(resourceDefault)
    }, [setCurrentResource])

    return (
        <>
            <SidebarPortal>
                <UniverseSidebarContent/>
            </SidebarPortal>

            <UniverseSunset/>
            {children}
        </>
    )
}

export function UniverseSidebarContent() {
    return (
        <>
            <SidebarSection>
                <SidebarItem href="/p/universe">
                    <ChatBubbleSmileyIcon/>
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
                    <Newspaper/>
                    <div className="flex flex-col min-w-0">
                        <SidebarLabel>Everything</SidebarLabel>
                    </div>
                </SidebarItem>
            </SidebarSection>
            <SidebarDivider/>
            <SidebarSection>
                <SidebarHeading>Chat</SidebarHeading>
                <ChatSidebarContent/>
            </SidebarSection>
        </>
    )
}
