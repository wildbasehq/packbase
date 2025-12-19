/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import useWindowSize from '@/src/lib/hooks/use-window-size'
import React, {
    Activity,
    MouseEvent as ReactMouseEvent,
    TouchEvent as ReactTouchEvent,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react'
import {Heading, Text} from '@/components/shared/text.tsx'
import Link from '@/components/shared/link.tsx'
import {isVisible, useResourceStore} from '@/lib'
import {Code, CodeGroup, Desktop, Tab, TabsLayout, useContentFrame} from '@/src/components'
import {useInterval, useLocalStorage} from 'usehooks-ts'
import UserAvatar from '@/components/shared/user/avatar.tsx'
import {InboxContent, UserMultipleAccounts} from '@/components/icons/plump'
import InboxPage from '@/pages/inbox/page'

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
                collapsed ? 'translate-x-full p-0 hidden' : 'p-1'
            } ${isResizing ? 'select-none cursor-col-resize !transition-none' : ''}`}
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
                            suffix={<UserActionsContainer/>}
                            className="h-full"
                            contentClassName="relative pt-8 bg-white border-[0.1rem] shadow-xs dark:bg-n-8 rounded-tr rounded-b-3xl flex flex-col overflow-y-auto px-4 pb-8 h-full"
                            headerClassName="rounded-tr rounded-out-lt-3xl"
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
                {/*<PlusIcon className="h-5 w-5 text-muted-foreground dark:text-muted-foreground"/>*/}
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
                <div className="items-center justify-between mx-3">
                    <Heading size="sm">This pack has no members. You shouldn't be seeing this!</Heading>
                    <Text size="sm">pls report :(</Text>
                    <CodeGroup title={`GET pack.${id}.members`}
                               code={JSON.stringify(members, null, 2)}>
                        <Code
                            title="String">{JSON.stringify(members, null, 2)}</Code>
                    </CodeGroup>
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
