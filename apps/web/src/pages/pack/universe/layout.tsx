/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {SidebarDivider, SidebarHeading, SidebarItem, SidebarLabel, SidebarSection,} from '@/src/components'
import {SidebarPortal} from '@/lib/context/sidebar-context.tsx'
import {Newspaper} from '@/components/icons/plump/Newspaper'
import {ChatBubbleSmileyIcon} from '@/components/icons/plump'
import {ChatSidebarContent} from '@/pages/c/layout'
import {ReactNode, useEffect} from "react";
import {useResourceStore} from "@/lib";
// import {motion} from "motion/react"
// import {XIcon} from "lucide-react";
import {useLocalStorage} from "usehooks-ts";
// import {ExclamationCircleIcon} from "@heroicons/react/24/outline";

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

            {/*<Alert className="max-w-3xl mx-auto mt-8 overflow-visible" variant="destructive">*/}
            {/*    <AlertTitle>*/}
            {/*        <ExclamationTriangleIcon className="inline-flex w-5 h-5"/> The "Universe" is being sunset*/}
            {/*    </AlertTitle>*/}
            {/*    <AlertDescription>*/}
            {/*        The Universe is the current Default Pack you howl into, and see content from all over Packbase.*/}
            {/*        We're wanting to focus more on Packs themselves, and give you the control on setting the Default*/}
            {/*        Pack - either your own or an already existing one. "Default Pack" is the Pack that shows when you go*/}
            {/*        to the Home page.*/}
            {/*        <br/><br/>*/}
            {/*        You can switch right now if you'd like, but the moment you switch you cannot go back. You'll be*/}
            {/*        forced to do*/}
            {/*        this soon.*/}
            {/*    </AlertDescription>*/}

            {/*    <div className="flex justify-end mt-4">*/}
            {/*        <BubblePopover*/}
            {/*            id="cdp-modal"*/}
            {/*            trigger={({setOpen}) => (*/}
            {/*                <Button color="amber" onClick={() => setOpen(true)}>*/}
            {/*                    Change Default Pack Now*/}
            {/*                </Button>*/}
            {/*            )}*/}
            {/*        >*/}
            {/*            <PopoverHeader*/}
            {/*                variant="destructive"*/}
            {/*                title="Change Default Pack"*/}
            {/*                description="Switching from the Universe is permanent, this can never be undone."*/}
            {/*            />*/}

            {/*            <div className="flex gap-4 [&>*]:w-full mt-3">*/}
            {/*                <Button outline>*/}
            {/*                    Continue*/}
            {/*                </Button>*/}
            {/*            </div>*/}
            {/*        </BubblePopover>*/}
            {/*    </div>*/}
            {/*</Alert>*/}

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
