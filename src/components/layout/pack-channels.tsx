/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/state'
import { ArrowUpRightIcon } from 'lucide-react'
import { useState } from 'react'
import { SidebarDivider, SidebarHeading, SidebarItem, SidebarLabel, SidebarSection } from '@/components/shared/sidebar'
import { FireIcon, InboxIcon, QuestionMarkCircleIcon, SparklesIcon } from '@heroicons/react/20/solid'
import InboxPage from '@/pages/inbox/page.tsx'
import { HashtagIcon, MicrophoneIcon, NewspaperIcon } from '@heroicons/react/16/solid'

const availableIcons = {
    ArrowUpRight: ArrowUpRightIcon,
    Sparkles: SparklesIcon,
    Fire: FireIcon,
}

export function PackChannels() {
    const { navigation } = useUIStore()
    const { currentResource } = useResourceStore()
    const { user } = useUserAccountStore()

    if (!user) return <></>
    return (
        <>
            <SidebarSection>
                <SidebarItem href={!currentResource.slug ? '/p/universe' : `/p/${currentResource.slug}`}>
                    <NewspaperIcon />
                    <div className="flex flex-col min-w-0">
                        <SidebarLabel>For You</SidebarLabel>
                    </div>
                </SidebarItem>
            </SidebarSection>
            <SidebarDivider />
            <SidebarSection>
                <div className="flex justify-between items-center">
                    <SidebarHeading>Channels</SidebarHeading>
                    {/*<Button*/}
                    {/*    plain*/}
                    {/*    onClick={e => {*/}
                    {/*        e.preventDefault()*/}
                    {/*    }}*/}
                    {/*>*/}
                    {/*    +*/}
                    {/*</Button>*/}
                </div>
                {navigation?.map(item => (
                    <Channel
                        key={item.href}
                        href={item.href}
                        name={item.name}
                        ticker={item.ticker}
                        isVoice={item.name.toLowerCase().includes('voice') || item.name.toLowerCase().includes('call')}
                    />
                ))}
            </SidebarSection>
            <SidebarSection>
                <SidebarHeading>Things are changin'</SidebarHeading>
                <SidebarLabel className="flex items-center gap-2 px-2 text-wrap select-none">
                    <span className="text-xs/5 text-muted-foreground">
                        <span className="font-bold">Hold tight</span> - we're preparing final design details for Packbase, expect ultra
                        levels of jank.
                    </span>
                </SidebarLabel>
            </SidebarSection>
        </>
    )
}

function DynamicIcon({ name, ...props }: any) {
    // icon://IconName
    // @ts-ignore
    const Icon = availableIcons[name.replace('icon://', '')]
    if (!Icon) return <QuestionMarkCircleIcon {...props} />
    return <Icon {...props} />
}

function Channel({
    href,
    name,
    ticker,
    badge,
    isVoice = false,
}: {
    href: string
    name: string
    ticker?: string
    badge?: string
    isVoice?: boolean
}) {
    return (
        <SidebarItem href={href}>
            {isVoice ? <MicrophoneIcon /> : <HashtagIcon />}

            <div className="flex flex-col min-w-0 flex-1">
                <SidebarLabel>{name}</SidebarLabel>
                {ticker && <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">{ticker}</span>}
            </div>

            {badge && (
                <span className="ml-auto flex-shrink-0 bg-indigo-500 text-white text-xxs font-medium rounded-full px-1.5 min-w-5 h-5 flex items-center justify-center">
                    {badge}
                </span>
            )}
        </SidebarItem>
    )
}

function InboxButton() {
    const [open, setOpen] = useState(false)
    return (
        <>
            {open && <InboxPage onClose={() => setOpen(false)} />}
            <SidebarItem onClick={() => setOpen(true)}>
                <InboxIcon />
                <SidebarLabel>Inbox</SidebarLabel>
            </SidebarItem>
        </>
    )
}
