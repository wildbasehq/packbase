/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import useWindowSize from '@/src/lib/hooks/use-window-size'
import { memo, useEffect, useState } from 'react'
import Tooltip from '../shared/tooltip'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Text } from '@/components/shared/text.tsx'
import UserDropdown from '@/components/layout/user-dropdown.tsx'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import Link from '@/components/shared/link.tsx'

const DropdownComponent = memo(UserDropdown, () => true)

export default function UserSidebar() {
    // It's a boolean, but key is stupid.
    const [collapsed, setCollapsed] = useState<any>(false)
    const isMobile = useWindowSize().windowSize.width! < 1280

    useEffect(() => {
        setCollapsed(isMobile)
    }, [isMobile])

    return (
        <div className={`h-screen border-l ${collapsed ? 'w-14 min-w-[3.5rem]' : 'w-80 min-w-[20rem]'} hidden md:flex z-10`}>
            <div className="flex flex-col w-full space-y-8">
                <div className={`relative flex ${collapsed ? 'flex-col justify-center items-center mt-3' : 'h-14 border-b gap-2'}`}>
                    {collapsed && (
                        <div className="flex items-center gap-2">
                            <DropdownComponent />
                        </div>
                    )}

                    <div className="flex justify-end items-center w-full gap-2 p-3">
                        <div className="flex justify-start items-center gap-1">
                            {!isMobile && (
                                <Tooltip key={collapsed} content={collapsed ? 'Expand' : 'Collapse'}>
                                    <div
                                        className="inline-flex items-center justify-center h-8 w-8 p-1.5 rounded cursor-pointer hover:inner-border hover:inner-border-[#e5e5e5] hover:dark:inner-border-[#2e2e2e] hover:unicorn:inner-border-outline/25"
                                        onClick={() => setCollapsed(!collapsed)}
                                    >
                                        {collapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="h-6 w-6" />}
                                    </div>
                                </Tooltip>
                            )}
                        </div>

                        {!collapsed && (
                            <>
                                {/* Search button */}
                                <Link
                                    href="/search"
                                    className="flex text-default flex-grow items-center py-1.5 px-2 rounded-lg bg-card cursor-pointer hover:!bg-n-4/25 hover:dark:inner-border hover:dark:inner-border-[#2e2e2e] hover:dark:unicorn:inner-border-outline/25"
                                >
                                    <div className="mr-1.5">
                                        <MagnifyingGlassIcon className="w-3 h-3" />
                                    </div>
                                    <Text size="sm">Search</Text>
                                </Link>

                                {/* User avatar */}
                                <div className="flex justify-end items-center">
                                    <DropdownComponent />
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {!collapsed && (
                    <div className="flex flex-col px-8 pb-8 h-full">
                        <Text size="sm" alt>
                            <b>OOPS!!</b> ContentFrame here is missing!!!!
                        </Text>
                        <div className="flex-grow" />
                    </div>
                )}
            </div>
        </div>
    )
}
