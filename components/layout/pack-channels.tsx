'use client'
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/states'
import {ArrowUpRightIcon, LucideIcon} from 'lucide-react'
import React from 'react'
import {Sidebar, SidebarBody, SidebarFooter, SidebarHeader, SidebarHeading, SidebarItem, SidebarLabel, SidebarSection, SidebarSpacer} from '@/components/shared/sidebar'
import {FireIcon, HomeIcon, InboxIcon, MagnifyingGlassIcon, QuestionMarkCircleIcon, SparklesIcon} from '@heroicons/react/20/solid'
import ResourceSwitcher from '@/components/layout/resource-switcher'
import HowlCreator from '@/components/shared/user/howl-creator'
import PackSwitcher from '@/components/layout/resource-switcher/pack-switcher'

const availableIcons = {
    ArrowUpRight: ArrowUpRightIcon, Sparkles: SparklesIcon, Fire: FireIcon,
}

export declare interface SideNavItemType {
    name: string | JSX.Element
    description?: string
    href: string
    target?: string
    current?: boolean
    new?: boolean
    icon: ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | LucideIcon | string
}

export declare interface SideNavType {
    slim?: boolean
    items?: SideNavItemType[]
    footer?: React.ReactNode
    heading?: string | null
    theme?: any
    children?: React.ReactNode
}

export function PackChannels({...props}: SideNavType) {
    const {hidden, navigation, loading} = useUIStore()
    const {currentResource} = useResourceStore()
    const {user} = useUserAccountStore()

    if (hidden) return <></>
    return (
        <div className="flex h-full">
            <PackSwitcher/>
            <div className="flex flex-col">
                <nav aria-label="Sections" className="min-h-16 flex flex-col w-80">
                    <div
                        className={`shimmer-template relative flex h-full items-center px-5 py-2 overflow-hidden ${loading ? 'before:animate-shimmer-fast' : ''}`}
                    >
                        <div className="w-full">
                            <ResourceSwitcher/>
                        </div>
                    </div>
                </nav>

                <Sidebar className="w-full max-w-[320px]">
                    <SidebarHeader>
                        <SidebarSection>
                            {user && <HowlCreator/>}
                            <SidebarItem href="/search">
                                <MagnifyingGlassIcon/>
                                <SidebarLabel>Search</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="/inbox">
                                <InboxIcon/>
                                <SidebarLabel>Inbox</SidebarLabel>
                            </SidebarItem>
                        </SidebarSection>
                    </SidebarHeader>
                    <SidebarBody>
                        <SidebarSection>
                            <SidebarItem href={(!currentResource.slug || currentResource.slug === 'universe') ? '/' : `/p/${currentResource.slug}`}>
                                <HomeIcon/>
                                <SidebarLabel>Home</SidebarLabel>
                            </SidebarItem>
                            {navigation?.map((item, index) => (
                                <SidebarItem key={index} href={item.href} current={item.current}>
                                    {typeof item.icon === 'string' ? <DynamicIcon name={item.icon}/> : <item.icon/>}
                                    <SidebarLabel>{item.name}</SidebarLabel>
                                </SidebarItem>
                            ))}
                        </SidebarSection>
                        <SidebarSpacer/>
                        <SidebarSection>
                            <SidebarItem href="https://discord.gg/StuuK55gYA" target="_blank">
                                <QuestionMarkCircleIcon/>
                                <SidebarLabel external>Support</SidebarLabel>
                            </SidebarItem>
                            <SidebarItem href="https://changelog.packbase.app" target="_blank">
                                <SparklesIcon/>
                                <SidebarLabel external>Changelog</SidebarLabel>
                            </SidebarItem>
                        </SidebarSection>
                    </SidebarBody>
                    <SidebarFooter>
                        <SidebarHeading>
                            (c) ✱base - Packbase is early access!
                        </SidebarHeading>
                    </SidebarFooter>
                </Sidebar>
            </div>
        </div>
    )
}

function DynamicIcon({name, ...props}) {
    // icon://IconName
    const Icon = availableIcons[name.replace('icon://', '')]
    if (!Icon) return <QuestionMarkCircleIcon {...props}/>
    return <Icon {...props} />
}
