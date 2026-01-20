/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {InboxContent, UserMultipleAccounts} from '@/components/icons/plump'
import Link from '@/components/shared/link'
import {Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import {isVisible, useResourceStore} from '@/lib'
import InboxPage from '@/pages/inbox/page'
import {Desktop, LoadingSpinner, Tab, TabsLayout, useContentFrame} from '@/src/components'
import useWindowSize from '@/src/lib/hooks/use-window-size'
import {PlusIcon} from '@heroicons/react/20/solid'
import {Activity, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, useCallback, useEffect, useRef, useState} from 'react'
import {useInterval, useLocalStorage} from 'usehooks-ts'

export default function UserSidebar() {
    const {
        currentResource: {id: pack_id, standalone},
    } = useResourceStore()
    const [collapsed, setCollapsed] = useLocalStorage<any>('user-sidebar-collapsed', false)
    const [sidebarWidth, setSidebarWidth] = useLocalStorage<number>('user-sidebar-width', 320)
    const isMobile = useWindowSize().windowSize.width! < 1280
    const [isResizing, setIsResizing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const minExpandedPx = 320 // was min-w-[20rem]
    const maxExpandedPx = 640

    useEffect(() => {
        if (!collapsed) {
            setCollapsed(isMobile)
        }
    }, [isMobile])

    const startResize = useCallback(() => {
        if (!containerRef.current) return
        setIsResizing(true)

        const {right} = containerRef.current.getBoundingClientRect()

        const onMove = (x: number) => {
            // Dragging the LEFT edge: width is the distance from the cursor to the container's right edge
            const rawWidth = Math.max(0, right - x)

            const clamped = Math.min(maxExpandedPx, Math.max(minExpandedPx, rawWidth))
            setSidebarWidth(clamped)
        }

        const onMouseMove = (e: MouseEvent) => onMove(e.clientX)
        const onTouchMove = (e: TouchEvent) => onMove(e.touches[0]?.clientX ?? 0)
        const stop = () => {
            setIsResizing(false)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', stop)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', stop)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', stop)
        window.addEventListener('touchmove', onTouchMove, {passive: false})
        window.addEventListener('touchend', stop)
    }, [collapsed])

    const onHandleMouseDown = useCallback(
        (e: ReactMouseEvent<HTMLDivElement>) => {
            e.preventDefault()
            startResize()
        },
        [startResize]
    )

    const onHandleTouchStart = useCallback(
        (e: ReactTouchEvent<HTMLDivElement>) => {
            e.preventDefault()
            startResize()
        },
        [startResize]
    )

    return (
        <div
            ref={containerRef}
            className={`h-fill relative transition-all md:flex ${
                collapsed ? 'translate-x-full p-0 hidden' : 'py-1 pr-1'
            } ${isResizing ? 'select-none cursor-col-resize transition-none!' : ''}`}
            style={{
                minWidth: collapsed ? 0 : (sidebarWidth ?? minExpandedPx),
                maxWidth: collapsed ? 0 : (sidebarWidth ?? maxExpandedPx),
                flex: '0 0 auto',
                overflow: 'hidden',
            }}
        >
            {collapsed ? null : (
                <>
                    <div className="absolute bg-sidebar w-full h-12 left-0 top-0"/>
                    <div className="flex flex-col w-full">
                        <TabsLayout
                            defaultIndex={0}
                            className="h-full"
                            contentClassName="relative pt-4 bg-white border-[0.1rem] shadow-xs dark:bg-n-8 rounded-tr-2xl rounded-b-2xl flex flex-col overflow-y-auto px-4 pb-4 h-full"
                            headerClassName="rounded-tr-2xl rounded-out-lt-2xl"
                        >
                            <Tab title="People" icon={UserMultipleAccounts}>
                                {pack_id && !standalone && <PackMembersContainer/>}
                                <div className="flex-grow"/>
                            </Tab>
                            <Tab title="Notifications" icon={InboxContent}>
                                <InboxPage/>
                            </Tab>
                        </TabsLayout>
                    </div>
                    {/* Resize handle on the left edge */}
                    <Desktop>
                        <div
                            className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize z-20 bg-transparent transition-[background-color] hover:bg-muted-foreground"
                            onMouseDown={onHandleMouseDown}
                            onTouchStart={onHandleTouchStart}
                        />
                    </Desktop>
                </>
            )}
        </div>
    )
}

export function UserActionsContainer() {
    return (
        <>
            {/* + New */}
            <div className="flex mr-2 items-center animate-scale-in">
                <PlusIcon className="h-5 w-5 text-white"/>
            </div>
        </>
    )
}

function PackMembersContainer() {
    const {
        currentResource: {id},
    } = useResourceStore()

    const {
        data: membersResponse,
        refetch: refetchMembers
    } = useContentFrame('get', `pack.${id}.members`, undefined, {id: `pack.${id}.members`})

    const {
        data: friendsResponse,
        refetch: refetchFriends
    } = useContentFrame('get', 'user.me.friends', undefined, {id: 'user.me.friends'})

    const friends = friendsResponse?.friends || []
    const members = (membersResponse || []).map((member: any) => {
        const friend = friends.find((f: any) => f.id === member.id)
        return {
            ...member,
            ...(friend ? {
                is_friend: true,
                status: friend.status,
                isOnline: friend.isOnline,
            } : {}),
        }
    })
    const friendIds = new Set(friends.map((f: any) => f.id))

    const sortedMembersByFriends = [...members].sort((a: any, b: any) => {
        const aIsFriend = friendIds.has(a.id)
        const bIsFriend = friendIds.has(b.id)

        if (aIsFriend === bIsFriend) return 0
        return aIsFriend ? -1 : 1
    })

    useInterval(() => {
        refetchMembers()
        refetchFriends()
    }, 30000)

    return (
        <div className="flex flex-col space-y-4">
            <Activity mode={isVisible(members && members?.length > 0)}>
                <div className="flex items-center justify-between mx-3">
                    <Text size="sm">Members</Text>
                    <Text size="xs" alt>
                        {members?.length} total
                    </Text>
                </div>
            </Activity>

            <Activity mode={isVisible(!members?.length)}>
                <div className="flex items-center gap-4 mx-3">
                    <LoadingSpinner className="h-5 w-5"/>
                    <Text size="sm" alt loading>Loading member list...</Text>
                </div>
            </Activity>

            {/* Avatar with display name */}
            <div className="flex flex-col space-y-2">
                {sortedMembersByFriends?.map(member => (
                    <Link
                        href={`/@${member.username}`}
                        key={member.id}
                        className="flex text-foreground! items-center justify-between ring-default transition-all hover:transition-shadow hover:bg-muted hover:ring-2 rounded mx-2 px-2 py-1"
                    >
                        <div className="flex items-center gap-2">
                            <UserAvatar user={member} size={32} showOnlineStatus={true}/>
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
