import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/states'
import { ArrowUpRightIcon } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import {
    Sidebar,
    SidebarBody,
    SidebarFooter,
    SidebarHeader,
    SidebarHeading,
    SidebarItem,
    SidebarLabel,
    SidebarSection,
    SidebarSpacer,
} from '@/components/shared/sidebar'
import {
    ChevronUpIcon,
    FireIcon,
    HomeIcon,
    InboxIcon,
    MagnifyingGlassIcon,
    QuestionMarkCircleIcon,
    SparklesIcon,
} from '@heroicons/react/20/solid'
import ResourceSwitcher from '@/components/layout/resource-switcher'
import HowlCreator from '@/components/shared/user/howl-creator'
import PackSwitcher from '@/components/layout/resource-switcher/pack-switcher'
import InboxPage from '@/src/pages/inbox/page.tsx'
import { Badge } from '@/components/shared/badge.tsx'
import Tooltip from '@/components/shared/tooltip.tsx'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../shared/dropdown'
import { Avatar } from '../shared/avatar'
import UserDropdown from './user-dropdown'
import { SiDiscord } from 'react-icons/si'
import { ChatBubbleBottomCenterIcon, FaceSmileIcon } from '@heroicons/react/16/solid'
import WildbaseAsteriskIcon from '@/components/icons/wildbase-asterisk.tsx'

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
    const { hidden, navigation, loading, serverCapabilities } = useUIStore()
    const { currentResource } = useResourceStore()
    const { user } = useUserAccountStore()

    // Check if realtime capability is available
    const hasRealtimeCapability = serverCapabilities.includes('realtime')

    if (hidden || !user) return <></>
    return (
        <div className="flex h-full">
            <PackSwitcher />
            <div className="flex flex-col">
                <nav aria-label="Sections" className="flex flex-col min-h-16 w-80">
                    <div
                        className={`shimmer-template relative flex h-full items-center px-5 py-2 overflow-hidden ${loading ? 'before:animate-shimmer-fast' : ''}`}
                    >
                        <div className="w-full">
                            <ResourceSwitcher />
                        </div>
                    </div>
                </nav>

                <Sidebar className="w-full max-w-[320px]">
                    <SidebarHeader>
                        <SidebarSection>
                            {user && <HowlCreator />}
                            <SidebarItem href="/search">
                                <MagnifyingGlassIcon />
                                <SidebarLabel>Search</SidebarLabel>
                            </SidebarItem>
                            <InboxButton />
                        </SidebarSection>
                    </SidebarHeader>
                    <SidebarBody>
                        <SidebarSection>
                            <SidebarItem href={!currentResource.slug ? '/p/universe' : `/p/${currentResource.slug}`}>
                                <HomeIcon />
                                <SidebarLabel>Home</SidebarLabel>
                            </SidebarItem>
                            {navigation?.map(item => (
                                <Tooltip key={item.href} content={item.description ?? item.name} delayDuration={0}>
                                    <SidebarItem key={item.href} href={item.href} current={item.current}>
                                        {typeof item.icon === 'string' ? <DynamicIcon name={item.icon} /> : <item.icon />}
                                        <SidebarLabel>{item.name}</SidebarLabel>
                                        {item.badge && (
                                            <Badge color="indigo" className="ml-auto">
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </SidebarItem>
                                </Tooltip>
                            ))}
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
                                    <DropdownItem href="https://discord.gg/wildbase" target="_blank">
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
                        {hasRealtimeCapability && (
                            <Suspense fallback={null}>
                                <ConnectionStatus />
                            </Suspense>
                        )}
                        <Dropdown>
                            <DropdownButton as={SidebarItem}>
                                <span className="flex items-center min-w-0 gap-3">
                                    <Avatar
                                        src={user.images?.avatar ?? false}
                                        className="size-10"
                                        square
                                        alt=""
                                        initials={user.display_name.slice(0, 2)}
                                    />
                                    <span className="min-w-0">
                                        <span className="block font-medium truncate text-sm/5">{user.display_name}</span>
                                        <span className="block font-normal truncate text-xs/5 text-alt">{user.username}</span>
                                    </span>
                                </span>
                                <ChevronUpIcon />
                            </DropdownButton>
                            <DropdownMenu className="z-20 p-0!">
                                <UserDropdown showOnboardingModal={() => {}} />
                            </DropdownMenu>
                        </Dropdown>
                    </SidebarFooter>
                </Sidebar>
            </div>
        </div>
    )
}

function DynamicIcon({ name, ...props }: any) {
    // icon://IconName
    // @ts-ignore
    const Icon = availableIcons[name.replace('icon://', '')]
    if (!Icon) return <QuestionMarkCircleIcon {...props} />
    return <Icon {...props} />
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
