import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/state'
import { ArrowUpRightIcon } from 'lucide-react'
import { lazy, memo, useState } from 'react'
import {
    Sidebar,
    SidebarBody,
    SidebarDivider,
    SidebarFooter,
    SidebarHeader,
    SidebarHeading,
    SidebarItem,
    SidebarLabel,
    SidebarSection,
    SidebarSpacer,
} from '@/components/shared/sidebar'
import { ChevronUpIcon, FireIcon, InboxIcon, QuestionMarkCircleIcon, SparklesIcon } from '@heroicons/react/20/solid'
import ResourceSwitcher from '@/components/layout/resource-switcher'
import PackSwitcher from '@/components/layout/resource-switcher/pack-switcher'
import InboxPage from '@/pages/inbox/page.tsx'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../shared/dropdown'
import { SiDiscord } from 'react-icons/si'
import { ChatBubbleBottomCenterIcon, FaceSmileIcon, HashtagIcon, MicrophoneIcon, NewspaperIcon } from '@heroicons/react/16/solid'
import WildbaseAsteriskIcon from '@/components/icons/wildbase-asterisk.tsx'
import UserDropdown from '@/components/layout/user-dropdown.tsx' // Lazy load ConnectionStatus component

// Lazy load ConnectionStatus component
const ConnectionStatus = lazy(() =>
    import('./ConnectionStatus').then(module => ({
        default: module.ConnectionStatus,
    }))
)

const availableIcons = {
    ArrowUpRight: ArrowUpRightIcon,
    Sparkles: SparklesIcon,
    Fire: FireIcon,
}

export function PackChannels() {
    const { hidden, navigation, serverCapabilities } = useUIStore()
    const { currentResource } = useResourceStore()
    const { user } = useUserAccountStore()

    // Check if realtime capability is available
    const hasRealtimeCapability = serverCapabilities.includes('realtime')

    if (hidden || !user) return <></>
    return (
        <div className="flex h-full">
            <PackSwitcher />
            <div className="flex flex-col w-80">
                {!currentResource.standalone && (
                    <nav aria-label="Sections" className="flex flex-col min-h-14 w-80">
                        <div className="relative flex h-full items-center px-5 py-2 overflow-hidden">
                            <div className="w-full">
                                <ResourceSwitcher />
                            </div>
                        </div>
                    </nav>
                )}

                <Sidebar className="w-full max-w-[320px]">
                    <SidebarHeader>
                        <SidebarSection>
                            {/*{user && <HowlCreator />}*/}
                            {/*<SidebarItem href="/search">*/}
                            {/*    <MagnifyingGlassIcon />*/}
                            {/*    <SidebarLabel>Search</SidebarLabel>*/}
                            {/*</SidebarItem>*/}
                            <InboxButton />
                        </SidebarSection>
                    </SidebarHeader>
                    <SidebarBody>
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
                            <SidebarHeading>CHANNELS</SidebarHeading>
                            {navigation?.map(item => (
                                <Channel
                                    key={item.href}
                                    href={item.href}
                                    name={item.name}
                                    ticker={item.ticker}
                                    badge="NEW"
                                    isVoice={item.name.toLowerCase().includes('voice') || item.name.toLowerCase().includes('call')}
                                />
                            ))}
                        </SidebarSection>
                        <SidebarSection>
                            <SidebarHeading>Things are changin'</SidebarHeading>
                            <SidebarLabel className="flex items-center gap-2 px-2 text-wrap select-none">
                                <span className="text-xs/5 text-muted-foreground">
                                    <span className="font-bold">Hold tight</span> - we're preparing final design details for Packbase,
                                    expect ultra levels of jank.
                                </span>
                            </SidebarLabel>
                        </SidebarSection>
                        <SidebarSpacer />
                        <SidebarSection>
                            <Dropdown>
                                <DropdownButton as={SidebarItem}>
                                    <QuestionMarkCircleIcon />
                                    <SidebarLabel>Help</SidebarLabel>
                                </DropdownButton>
                                <DropdownMenu anchor="top">
                                    <DropdownItem
                                        onClick={() => {
                                            window.Intercom?.('show')
                                        }}
                                    >
                                        <ChatBubbleBottomCenterIcon className="w-4 h-4 inline-flex" />
                                        <SidebarLabel>Docs & Chat</SidebarLabel>
                                    </DropdownItem>
                                    <DropdownItem href="https://packbase.wildbase.xyz" target="_blank">
                                        <FaceSmileIcon className="w-4 h-4 inline-flex" data-slot="icon" />
                                        <SidebarLabel>Feedback</SidebarLabel>
                                    </DropdownItem>
                                    <DropdownItem href="https://discord.gg/StuuK55gYA" target="_blank">
                                        <SiDiscord className="w-4 h-4 inline-flex" data-slot="icon" />
                                        <SidebarLabel>Discord</SidebarLabel>
                                    </DropdownItem>
                                    <DropdownItem href="https://wildbase.xyz/" target="_blank">
                                        <WildbaseAsteriskIcon className="w-4 h-4 inline-flex" data-slot="icon" />
                                        <SidebarLabel>Wildbase</SidebarLabel>
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                            <SidebarItem href="https://changelog.packbase.app" target="_blank">
                                <SparklesIcon />
                                <SidebarLabel external>Changelog</SidebarLabel>
                            </SidebarItem>
                        </SidebarSection>
                    </SidebarBody>
                    <SidebarFooter>
                        <SidebarHeading>(c) ✱base - Packbase is early access!</SidebarHeading>
                    </SidebarFooter>

                    <SidebarFooter className="max-lg:hidden relative">
                        {/* Conditionally render ConnectionStatus based on realtime capability */}
                        {/*{hasRealtimeCapability && (*/}
                        {/*    <Suspense fallback={null}>*/}
                        {/*        <ConnectionStatus />*/}
                        {/*    </Suspense>*/}
                        {/*)}*/}
                        <SidebarItem
                            onClick={() => {
                                if (!document.getElementsByClassName('cl-modalBackdrop')?.[0])
                                    // @ts-ignore
                                    document.getElementsByClassName('cl-userButtonTrigger')?.[0]?.click()
                            }}
                        >
                            <span className="flex items-center min-w-0 gap-3">
                                <DropdownComponent />
                                <span className="min-w-0">
                                    <span className="block font-medium truncate text-sm/5">{user.display_name}</span>
                                    <span className="block font-normal truncate text-xs/5 text-alt">{user.username}</span>
                                </span>
                            </span>
                            <ChevronUpIcon />
                        </SidebarItem>
                    </SidebarFooter>
                </Sidebar>
            </div>
        </div>
    )
}

const DropdownComponent = memo(UserDropdown, () => true)

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
