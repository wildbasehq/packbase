import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/states'
import {ArrowUpRightIcon} from 'lucide-react'
import {Sidebar, SidebarBody, SidebarFooter, SidebarHeader, SidebarHeading, SidebarItem, SidebarLabel, SidebarSection, SidebarSpacer} from '@/components/shared/sidebar'
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
import { useState } from 'react'
import InboxPage from '@/src/pages/inbox/page.tsx'
import { Badge } from '@/components/shared/badge.tsx'
import Tooltip from '@/components/shared/tooltip.tsx'
import { DropdownButton, DropdownMenu } from '../shared/dropdown'
import { Dropdown } from '../shared/dropdown'
import { Avatar } from '../shared/avatar'
import UserDropdown from './user-dropdown'

const availableIcons = {
    ArrowUpRight: ArrowUpRightIcon,
    Sparkles: SparklesIcon,
    Fire: FireIcon,
}

export function PackChannels() {
    const { hidden, navigation, loading } = useUIStore()
    const { currentResource } = useResourceStore()
    const { user } = useUserAccountStore()

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
                            {navigation?.map((item, index) => (
                                <Tooltip key={index} content={item.description || item.name} delayDuration={0}>
                                    <SidebarItem key={index} href={item.href} current={item.current}>
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
                            <SidebarItem href="https://discord.gg/StuuK55gYA" target="_blank">
                                <QuestionMarkCircleIcon />
                                <SidebarLabel external>Support</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="https://changelog.packbase.app" target="_blank">
                                <SparklesIcon />
                                <SidebarLabel external>Changelog</SidebarLabel>
                            </SidebarItem>
                        </SidebarSection>
                    </SidebarBody>
                    <SidebarFooter>
                        <SidebarHeading>(c) ✱base - Packbase is early access!</SidebarHeading>
                    </SidebarFooter>

                    <SidebarFooter className="max-lg:hidden">
                        <Dropdown>
                            <DropdownButton as={SidebarItem}>
                                <span className="flex items-center min-w-0 gap-3">
                                    <Avatar
                                        src={user.images?.avatar || false}
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

function DynamicIcon({name, ...props}: any) {
    // icon://IconName
    // @ts-ignore
    const Icon = availableIcons[name.replace('icon://', '')]
    if (!Icon) return <QuestionMarkCircleIcon {...props}/>
    return <Icon {...props} />
}

function InboxButton() {
    const [open, setOpen] = useState(false)
    return (
        <>
            {open && <InboxPage onClose={() => setOpen(false)}/>}
            <SidebarItem onClick={() => setOpen(true)}>
                <InboxIcon/>
                <SidebarLabel>Inbox</SidebarLabel>
            </SidebarItem>
        </>
    )
}
