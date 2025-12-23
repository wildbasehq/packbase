/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {ChatBubbleSmileyIcon} from '@/components/icons/plump'
import Popover from '@/components/shared/popover'
import {SidebarDivider, SidebarHeading, SidebarItem, SidebarLabel, SidebarSection} from '@/components/shared/sidebar'
import {vg} from '@/lib'
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/state'
import {hasPackPermissionBit, PACK_PERMISSIONS} from '@/lib/utils/has-pack-permission-bit'
import {HashtagIcon, HomeIcon, MicrophoneIcon, PaperAirplaneIcon, PlusIcon} from '@heroicons/react/16/solid'
import {SparklesIcon} from '@heroicons/react/20/solid'
import {useRef} from 'react'

export function PackChannels() {
    const {navigation} = useUIStore()
    const {currentResource, resourceDefault} = useResourceStore()
    const {user} = useUserAccountStore()

    if (!user) return <></>
    return (
        <>
            <SidebarSection>
                {currentResource.slug && currentResource.slug !== 'universe' && (
                    <SidebarItem href={`/p/${currentResource.slug}`}>
                        <HomeIcon/>
                        <div className="flex flex-col min-w-0">
                            <SidebarLabel>General</SidebarLabel>
                            <span className="text-xs text-muted-foreground max-w-[200px]">
                                The main hub for {currentResource.display_name || currentResource.slug}.
                            </span>
                        </div>
                    </SidebarItem>
                )}
            </SidebarSection>
            {currentResource.id === resourceDefault.id && (
                <>
                    <SidebarDivider/>
                    <SidebarSection>
                        <SidebarHeading>
                            Your Stuff
                        </SidebarHeading>

                        <SidebarItem href="/me/following">
                            <ChatBubbleSmileyIcon/>
                            <div className="flex flex-col min-w-0">
                                <SidebarLabel>Following</SidebarLabel>
                                <span className="text-xs text-muted-foreground max-w-[200px]">
                                See posts from users you follow & Packs you're apart of.
                            </span>
                            </div>
                        </SidebarItem>

                        <SidebarItem href="/me/everything">
                            <SparklesIcon className="h-5 w-5"/>
                            <div className="flex flex-col min-w-0">
                                <SidebarLabel>Everything</SidebarLabel>
                                <span className="text-xs text-muted-foreground max-w-[200px]">
                                A stream of all public posts on Packbase.
                            </span>
                            </div>
                        </SidebarItem>
                    </SidebarSection>
                </>
            )}
            <SidebarDivider/>
            <SidebarSection>
                <div className="flex justify-between items-center">
                    <div className="flex items-center justify-between w-full">
                        <SidebarHeading>Channels</SidebarHeading>
                        {hasPackPermissionBit(currentResource.membership?.permissions, PACK_PERMISSIONS.CreateChannels) &&
                            <AddChannelButton/>}
                    </div>
                </div>
                {navigation?.map(item => (
                    <Channel
                        key={item.href}
                        href={item.href}
                        name={item.name}
                        ticker={item.ticker}
                        isVoice={item.name?.toLowerCase().includes('voice') || item.name?.toLowerCase().includes('call')}
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
            {isVoice ? <MicrophoneIcon/> : <HashtagIcon/>}

            <div className="flex flex-col min-w-0 flex-1">
                <SidebarLabel>{name}</SidebarLabel>
                {ticker &&
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">{ticker}</span>}
            </div>

            {badge && (
                <span
                    className="ml-auto shrink-0 bg-indigo-500 text-white text-xxs font-medium rounded-full px-1.5 min-w-5 h-5 flex items-center justify-center">
                    {badge}
                </span>
            )}
        </SidebarItem>
    )
}

function AddChannelButton() {
    return (
        <Popover content={<AddChannelPopover/>}>
            <PlusIcon className="h-4 w-4 -mt-0.5 text-muted-foreground"/>
        </Popover>
    )
}

/**
 * Add channel card popover with "Channel name" input
 */
function AddChannelPopover() {
    const {currentResource} = useResourceStore()
    const {navigation, setNavigation} = useUIStore()
    const formRef = useRef<HTMLFormElement>(null)

    const createNewChannel = async (channelID: string) => {
        vg.pack({id: currentResource.id})
            .pages.post({slug: channelID})
            .then(data => {
                if (data.status !== 200) {
                    alert(data.error)
                    return
                } else {
                    setNavigation([
                        ...navigation,
                        {
                            name: data.data.title,
                            href: `/p/${currentResource.slug}/${data.data.id}`,
                        },
                    ])

                    formRef.current?.reset()
                }
            })
    }

    return (
        <div className="flex flex-col gap-2 p-2 bg-sidebar">
            <div className="flex items-center gap-2">
                <HashtagIcon className="h-4 w-4 text-muted-foreground"/>

                <form
                    ref={formRef}
                    onSubmit={e => {
                        e.preventDefault()
                        const formData = new FormData(e.target as HTMLFormElement)
                        const channelName = (formData.get('channel-name') as string)?.toLowerCase()
                        if (!channelName) return
                        // a-z lowercase, and any dashes as long as a character is before and after
                        if (/@/g.test(channelName) || /[^a-z-]/g.test(channelName) || /-+$/.test(channelName)) {
                            alert('Channel names can only contain lowercase letters and dashes. No spaces or special characters.')
                        } else createNewChannel(channelName)
                    }}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        placeholder="New Channel Name"
                        name="channel-name"
                        required
                        autoFocus
                        autoComplete="off"
                        className="w-full bg-transparent border-none outline-none text-sm text-muted-foreground"
                    />
                    <button type="submit">
                        <PaperAirplaneIcon className="h-4 w-4"/>
                    </button>
                </form>
            </div>
        </div>
    )
}
