/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import useWindowSize from '@/src/lib/hooks/use-window-size'
import { memo, useEffect } from 'react'
import Tooltip from '../shared/tooltip'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { Heading, Text } from '@/components/shared/text.tsx'
import UserDropdown from '@/components/layout/user-dropdown.tsx'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import Link from '@/components/shared/link.tsx'
import { cn, useResourceStore } from '@/lib'
import { ButtonStyles, useContentFrame } from '@/src/components'
import ContentFrame from '@/components/shared/content-frame.tsx'
import { useDarkMode, useInterval, useLocalStorage } from 'usehooks-ts'
import UserAvatar from '@/components/shared/user/avatar.tsx'
import { useParams } from 'wouter'

const DropdownComponent = memo(UserDropdown, () => true)

export default function UserSidebar() {
    const {
        currentResource: { id: pack_id, standalone },
    } = useResourceStore()
    const [collapsed, setCollapsed] = useLocalStorage<any>('user-sidebar-collapsed', false)
    const isMobile = useWindowSize().windowSize.width! < 1280

    useEffect(() => {
        if (!collapsed) {
            setCollapsed(isMobile)
        }
    }, [isMobile])

    return (
        <div className={`h-screen relative ${collapsed ? 'w-14 min-w-[3.5rem]' : 'w-80 min-w-[20rem]'} hidden md:flex z-10`}>
            <div className="flex flex-col w-full">
                <div
                    className={`relative dark text-default flex ${collapsed ? 'flex-col justify-center items-center mt-3' : 'h-14 gap-2'}`}
                >
                    {collapsed && (
                        <div className="flex flex-col items-center gap-4">
                            <DropdownComponent />

                            {/* Collapsed search icon */}
                            {collapsed && (
                                <div className="px-3">
                                    <Tooltip content="Search" side="right" delayDuration={0}>
                                        <Link href="/search" className="text-default">
                                            <div className="inline-flex items-center justify-center h-8 w-8 rounded cursor-pointer">
                                                <MagnifyingGlassIcon className="w-4 h-4" />
                                            </div>
                                        </Link>
                                    </Tooltip>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end items-center w-full gap-2 p-3">
                        <div className="w-4"></div>
                        <div className="flex justify-start items-center gap-1">
                            {!isMobile && (
                                <Tooltip
                                    key={collapsed}
                                    content={collapsed ? 'Expand' : 'Collapse'}
                                    side={collapsed ? 'right' : 'bottom'}
                                    delayDuration={0}
                                >
                                    <div
                                        className="inline-flex items-center justify-center h-8 w-8 p-1.5 rounded cursor-pointer"
                                        onClick={() => setCollapsed(!collapsed)}
                                    >
                                        {collapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="h-6 w-6" />}
                                    </div>
                                </Tooltip>
                            )}
                        </div>

                        {!collapsed && <UserActionsContainer />}
                    </div>
                </div>

                {!collapsed && (
                    <div className="absolute bg-white dark:bg-n-8 -z-10 h-[calc(3rem+1px)] w-7 top-2 -left-4 transform skew-x-28 rounded-tr rounded-out-br after:right-[calc(var(--rounded-out-radius-br)*-1--1px)]"></div>
                )}

                <div
                    className={cn(
                        !collapsed
                            ? 'bg-white dark:bg-n-8 border-r-1 border-b-1 mr-2 rounded-tr-md rounded-br-md rounded-tl-none rounded-out-lt-xl -ml-2 flex flex-col px-4 pb-8 h-full'
                            : 'relative flex flex-col justify-center items-center mt-3',
                        'pt-8 mb-2 relative border-zinc-950/5 dark:border-white/5 dark:mb-[calc(0.5rem-1px)]'
                    )}
                >
                    {pack_id && !standalone && <PackMembersContainer collapsed={collapsed} />}
                    {(!pack_id || standalone) && <FriendsListContainer collapsed={collapsed} />}
                    <div className="flex-grow" />
                </div>
            </div>
        </div>
    )
}

export function UserActionsContainer() {
    const { isDarkMode } = useDarkMode()

    return (
        <>
            {/* Search button */}
            <Link
                href="/search"
                className={cn(
                    'relative flex flex-grow items-center py-1.5 px-2 rounded-lg border before:shadow-none isolate border-optical',
                    !isDarkMode ? ButtonStyles.colors.light : ButtonStyles.colors.dark
                )}
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
    )
}

function FriendsListContainer({ collapsed }: { collapsed: boolean }) {
    const { data: friendsResponse, refetch } = useContentFrame('get', 'user.me.friends', undefined, { id: 'user.me.friends' })

    const friends = friendsResponse?.friends || []

    useInterval(refetch, 60000)

    /*
     * Small avatars only list
     */
    if (collapsed) {
        return (
            <div className="flex flex-col space-y-4">
                {friends?.map(friend => (
                    <Tooltip content={friend.display_name || `@${friend.username}`} side="right" delayDuration={0}>
                        <Link
                            href={`/@${friend.username}`}
                            key={friend.id}
                            className="flex items-center justify-between ring-default transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50 rounded-md"
                        >
                            <div className="flex items-center gap-2">
                                <UserAvatar
                                    name={friend.display_name}
                                    size={32}
                                    icon={friend.images_avatar}
                                    showOnlineStatus={true}
                                    isOnline={friend.online}
                                />
                            </div>
                        </Link>
                    </Tooltip>
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-4">
            {/* No friends */}
            {friends?.length === 0 && (
                <div className="items-center justify-between mx-3">
                    <Heading size="sm">You have no friends. How sad :(</Heading>
                    <Text size="sm">
                        Let's go <Link href="/p/new">find you some</Link>.
                    </Text>
                </div>
            )}

            {friends?.length > 0 && (
                <div className="flex items-center justify-between mx-3">
                    <Text size="sm">Friends</Text>
                </div>
            )}

            {/* Avatar with display name */}
            <div className="flex flex-col space-y-2">
                {friends?.map(friend => (
                    <Link
                        href={`/@${friend.username}`}
                        key={friend.id}
                        className="flex items-center justify-between ring-default transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50 rounded mx-2 px-1 py-1"
                    >
                        <div className="flex items-center gap-2">
                            <UserAvatar
                                name={friend.display_name}
                                size={32}
                                icon={friend.images_avatar}
                                showOnlineStatus={true}
                                isOnline={friend.online} // Random online status for demo, replace with actual status
                            />
                            <div className="flex flex-col">
                                <Text size="sm">{friend.display_name}</Text>
                                {friend.status && (
                                    <Text size="xs" alt>
                                        {friend.status}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}

function PackMembersContainer({ collapsed }: { collapsed: boolean }) {
    const {
        currentResource: { id },
    } = useResourceStore()
    const { data: members, refetch } = useContentFrame('get', `pack.${id}.members`, undefined, { id: `pack.${id}.members` })

    useInterval(refetch, 60000)

    /*
     * Small avatars only list
     */
    if (collapsed) {
        return (
            <div className="flex flex-col space-y-4">
                {members?.map(member => (
                    <Tooltip content={member.display_name || `@${member.username}`} side="right" delayDuration={0}>
                        <Link
                            href={`/@${member.username}`}
                            key={member.id}
                            className="flex items-center justify-between ring-default transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50 rounded-md"
                        >
                            <div className="flex items-center gap-2">
                                <UserAvatar
                                    name={member.display_name}
                                    size={32}
                                    icon={member.images?.avatar}
                                    showOnlineStatus={false}
                                    isOnline={member.online}
                                />
                            </div>
                        </Link>
                    </Tooltip>
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col space-y-4">
            {/* No members */}
            {members?.length === 0 && (
                <div className="items-center justify-between mx-3">
                    <Heading size="sm">This pack has no members. You shouldn't be seeing this!</Heading>
                    <Text size="sm">pls report :(</Text>
                </div>
            )}

            {members?.length > 0 && (
                <div className="flex items-center justify-between mx-3">
                    <Text size="sm">Members</Text>
                    <Text size="xs" alt>
                        {members.length} total
                    </Text>
                </div>
            )}

            {/* Avatar with display name */}
            <div className="flex flex-col space-y-2">
                {members?.map(member => (
                    <Link
                        href={`/@${member.username}`}
                        key={member.id}
                        className="flex items-center justify-between ring-default transition-all hover:bg-n-2/25 hover:ring-2 dark:hover:bg-n-6/50 rounded mx-2 px-1 py-1"
                    >
                        <div className="flex items-center gap-2">
                            <UserAvatar
                                name={member.display_name}
                                size={32}
                                icon={member.images?.avatar}
                                showOnlineStatus={false}
                                isOnline={member.online} // Random online status for demo, replace with actual status
                            />
                            <div className="flex flex-col">
                                <Text size="sm">{member.display_name || member.username}</Text>
                                {member.status && (
                                    <Text size="xs" alt>
                                        {member.status}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
