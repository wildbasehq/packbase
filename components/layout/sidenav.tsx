'use client'
import './sidenav.component.css'
import React from 'react'
import Image from 'next/image'
import ActiveLink from '../shared/activelink'
import { ArrowUpRightIcon, LucideIcon, Sparkles } from 'lucide-react'
import { useResourceStore, useUIStore, useUserAccountStore } from '@/lib/states'
import Tooltip from '@/components/shared/tooltip'
import { Text } from '@/components/shared/text'
import NewPost from '@/components/shared/user/new-post'

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

export const NGContentNavigatorTheming = {
    main: [],
}

export function SideNav({ ...props }: SideNavType) {
    const { hidden, navigation } = useUIStore()
    const { user } = useUserAccountStore()
    const { currentResource } = useResourceStore()
    const slimNavClass = props.slim ? 'w-20 items-center' : 'w-96'

    if (hidden) return <></>
    return (
        <>
            <nav aria-label="Sections" className={`${slimNavClass} bg-sidebar hidden h-screen flex-shrink-0 overflow-y-auto border-r md:flex md:flex-col`}>
                <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-visible p-6">
                    {user && <NewPost />}
                    {navigation.length === 0 && (
                        <div className="load-stagger">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="flex h-fit min-h-[4rem] items-center px-6">
                                    <div className="h-6 w-6 flex-shrink-0 rounded-lg bg-n-5" />
                                    <div
                                        className="my-4 ml-3 text-sm"
                                        style={{
                                            // Random between 2 and 18
                                            width: `${Math.floor(Math.random() * 16) + 2}rem`,
                                        }}
                                    >
                                        <div className="anim-sidenav-pole-entry h-4 rounded-lg border bg-card" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {navigation.map((item, i) => (
                        <ActiveLink
                            key={i}
                            href={item.href}
                            activeClassName="bg-n-1/70 dark:bg-n-6"
                            inactiveClassName="transition-all hover:ring-2 ring-default hover:bg-n-2/25 dark:hover:bg-n-6/50"
                            className="flex h-fit cursor-pointer items-center rounded px-3 py-1 !no-underline"
                        >
                            <>
                                {item.icon && (
                                    <>
                                        {typeof item.icon !== 'string' && (
                                            <item.icon
                                                className="text-default h-6 w-6 flex-shrink-0"
                                                // fill="currentColor"
                                                aria-hidden="true"
                                            />
                                        )}

                                        {typeof item.icon === 'string' && (
                                            <Image
                                                className={`h-6 w-6 flex-shrink-0 ${item.description?.startsWith('@') ? 'rounded-full' : 'rounded-lg'}`}
                                                src={item.icon}
                                                alt={`Icon for ${item.name}`}
                                            />
                                        )}
                                    </>
                                )}

                                {!props.slim && (
                                    <div className="m-2 text-sm">
                                        <div className="flex items-center">
                                            <Text>{item.name}</Text>
                                            {item.contextChange && (
                                                <Tooltip content="Changes navigator context">
                                                    <ArrowUpRightIcon className="ml-1 h-5 w-5" aria-hidden="true" />
                                                </Tooltip>
                                            )}
                                            {item.new && (
                                                <div className="ml-2 inline-flex items-center space-x-1 rounded-full bg-blue-100 px-2.5 py-0.5">
                                                    <Sparkles className="h-4 w-4 text-blue-400" aria-hidden="true" />
                                                    <span className="text-xs font-medium text-blue-800">New!</span>
                                                </div>
                                            )}
                                        </div>
                                        <Text className="text-alt">{item.description}</Text>
                                    </div>
                                )}
                            </>
                        </ActiveLink>
                    ))}
                </div>

                {props.footer && <div className="text-alt flex flex-shrink-0 items-center text-sm">{props.footer}</div>}
            </nav>

            {/* Bottom horizontal navigator */}
            <nav
                aria-label="Sections"
                className={
                    `border-default no-scrollbar fixed bottom-0 left-0 z-10 flex h-16 w-full flex-shrink-0 flex-row overflow-x-auto rounded-tl-xl rounded-tr-xl border-x-0 border-b-0 border-t border-solid bg-card md:hidden` +
                    // Dark mode
                    ` dark:border-neutral-600`
                }
            >
                {navigation.map((item, i) => (
                    <ActiveLink
                        key={i}
                        href={item.href}
                        activeClassName="bg-blue-50 bg-opacity-50 dark:bg-neutral-700"
                        inactiveClassName="hover:bg-blue-50 hover:bg-opacity-50 dark:hover:bg-neutral-700"
                        className="border-default flex cursor-pointer border-b p-6"
                    >
                        <>
                            {item.icon && (
                                <>
                                    {typeof item.icon !== 'string' && <item.icon className="text-default -mt-0.5 h-6 w-6 flex-shrink-0" aria-hidden="true" />}

                                    {typeof item.icon === 'string' && (
                                        <div className="-mt-0.5 h-6 w-6 flex-shrink-0">
                                            <img
                                                className={`h-6 w-6 ${item.description?.startsWith('@') ? 'rounded-full' : 'rounded-lg'}`}
                                                src={item.icon}
                                                alt={`Icon for ${item.name}`}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    </ActiveLink>
                ))}
            </nav>
        </>
    )
}
