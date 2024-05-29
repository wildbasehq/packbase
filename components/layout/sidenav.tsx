'use client'
import './sidenav.component.css'
import React from 'react'
import Image from 'next/image'
import ActiveLink from '../shared/activelink'
import {ArrowUpRightIcon, LucideIcon, Sparkles} from 'lucide-react'
import {useResourceUIStore} from '@/lib/states'
import Tooltip from '@/components/shared/tooltip'

export declare interface SideNavItemType {
    name: string | JSX.Element;
    description?: string;
    href: string;
    target?: string;
    current?: boolean;
    new?: boolean;
    icon: ((props: React.SVGProps<SVGSVGElement>) => JSX.Element) | LucideIcon | string;
}

export declare interface SideNavType {
    slim?: boolean;
    items?: SideNavItemType[];
    footer?: React.ReactNode;
    heading?: string | null;
    theme?: any;
    children?: React.ReactNode;
}

export const NGContentNavigatorTheming = {
    main: [],
}

export function SideNav({...props}: SideNavType) {
    const {navigation} = useResourceUIStore()
    const slimNavClass = props.slim ? 'w-20' : 'w-96'

    let navItems: any[] = navigation || []

    return (
        <>
            <nav aria-label="Sections"
                 className={`${slimNavClass} hidden md:flex md:flex-col flex-shrink-0 border-r bg-sidebar/90 backdrop-blur-lg overflow-y-auto`}>
                <div className="flex-1 min-h-0 divide-y divide-default overflow-y-auto no-scrollbar">
                    {navItems.length === 0 && (
                        <div className="load-stagger">
                            {Array.from({length: 20}).map((_, i) => (
                                <div key={i} className="flex min-h-[4rem] h-fit items-center px-6">
                                    {i === 12 ? (
                                        <>
                                            <Image src="/logo/unicorn-1-min.png" width={24} height={22} alt="Loading..."
                                                   className="flex-shrink-0 w-6 rounded-lg"/>
                                            <div className="ml-3 my-4 text-sm">
                                                <p className="font-medium text-default dark:text-neutral-50">
                                                    Originally for Yipnyap
                                                </p>
                                                <p className="mt-1 text-default dark:text-neutral-500">
                                                    Reduce, Reuse, Recycle, kids.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-shrink-0 h-6 w-6 bg-n-5 rounded-lg"/>
                                            <div className="ml-3 my-4 text-sm" style={{
                                                // Random between 2 and 18
                                                width: `${Math.floor(Math.random() * 16) + 2}rem`,
                                            }}>
                                                <div className="h-4 bg-card border rounded-lg anim-sidenav-pole-entry"/>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {navItems.map((item, i) => (
                        <ActiveLink
                            key={i}
                            href={item.href}
                            activeClassName="bg-blue-50 bg-opacity-50 dark:bg-neutral-700"
                            inactiveClassName="hover:bg-blue-50 hover:bg-opacity-50 dark:hover:bg-neutral-700"
                            className="flex min-h-[4rem] h-fit items-center px-6 cursor-pointer"
                        >
                            <>
                                {item.icon && (
                                    <>
                                        {typeof item.icon !== 'string' && (
                                            <item.icon className="flex-shrink-0 h-6 w-6 text-default"
                                                // fill="currentColor"
                                                       aria-hidden="true"/>
                                        )}

                                        {typeof item.icon === 'string' && (
                                            <Image
                                                className={`flex-shrink-0 h-6 w-6 ${item.description?.startsWith('@') ? 'rounded-full' : 'rounded-lg'}`}
                                                src={item.icon}
                                                alt={`Icon for ${item.name}`}
                                            />
                                        )}
                                    </>
                                )}

                                {!props.slim && (
                                    <div className="ml-3 my-4 text-sm">
                                        <div className="flex items-center">
                                            <p className="font-medium text-default dark:text-neutral-50">{item.name}</p>
                                            {item.contextChange && (
                                                <Tooltip content="Changes navigator context">
                                                    <ArrowUpRightIcon className="h-5 w-5 ml-1"
                                                                      aria-hidden="true"/>
                                                </Tooltip>
                                            )}
                                            {item.new && (
                                                <div
                                                    className="ml-2 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-100">
                                                    <Sparkles className="h-4 w-4 text-blue-400"
                                                              aria-hidden="true"/>
                                                    <span className="text-xs font-medium text-blue-800">
                                                        New!
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-1 text-default dark:text-neutral-500">{item.description}</p>
                                    </div>
                                )}
                            </>
                        </ActiveLink>
                    ))}
                </div>

                {props.footer && (
                    <div
                        className="flex-shrink-0 text-sm text-alt flex items-center">
                        {props.footer}
                    </div>
                )}
            </nav>

            {/* Bottom horizontal navigator */}
            <nav
                aria-label="Sections"
                className={`h-16 fixed md:hidden flex flex-row flex-shrink-0 bg-card w-full z-10 bottom-0 left-0 border-t border-x-0 border-b-0 border-solid border-default rounded-tl-xl rounded-tr-xl overflow-x-auto no-scrollbar`
                    // Dark mode
                    + ` dark:border-neutral-600`}>
                {navItems.map((item, i) => (
                    <ActiveLink
                        key={i}
                        href={item.href}
                        activeClassName="bg-blue-50 bg-opacity-50 dark:bg-neutral-700"
                        inactiveClassName="hover:bg-blue-50 hover:bg-opacity-50 dark:hover:bg-neutral-700"
                        className="flex p-6 border-b border-default cursor-pointer"
                    >
                        <>
                            {item.icon && (
                                <>
                                    {typeof item.icon !== 'string' && (
                                        <item.icon className="flex-shrink-0 -mt-0.5 h-6 w-6 text-default"
                                                   aria-hidden="true"/>
                                    )}

                                    {typeof item.icon === 'string' && (
                                        <div className="flex-shrink-0 -mt-0.5 h-6 w-6">
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
