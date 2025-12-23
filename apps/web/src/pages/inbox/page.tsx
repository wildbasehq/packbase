/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {LoadingCircle} from '@/components/icons'
import PlaceholderNotification from '@/components/icons/placeholder-notification'
import {Button} from '@/components/shared'
import {Heading, Text} from '@/components/shared/text'
import UserAvatar from '@/components/shared/user/avatar'
import {useNotifications} from '@/lib/providers/notifications-provider'
import {cn} from '@/lib/utils'
import {formatRelativeTime} from '@/lib/utils/date'
import {Notification} from '@/src/lib/api/users/inbox'
import {useEffect, useMemo} from 'react'
import {useLocation} from 'wouter'

export default function InboxPage() {
    const {
        notifications,
        loading,
        loadingMore,
        error,
        hasMore,
        cursor,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        reset
    } =
        useNotifications()
    const [, navigate] = useLocation()

    // Load more notifications
    const loadMore = () => {
        if (cursor && hasMore && !loadingMore) {
            fetchNotifications(cursor)
        }
    }

    // Initial fetch & cleanup
    useEffect(() => {
        fetchNotifications()
        markAllAsRead()

        return () => {
            reset()
        }
    }, [])

    // Derived counts for header
    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

    // Dedicated click handler to mark a single notification as read
    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id)
        }

        if (notification.metadata) {
            // Switch between type
            switch (notification.type) {
                case 'howl_comment':
                    navigate(`/p/universe/all/${notification.metadata.post_id}`)
                    break
                default:
                    break
            }
        }
    }

    // Twitter-style notification row
    const NotificationItem = ({notification}: { notification: Notification }) => {
        const actor = (notification.metadata && (notification.metadata.actor || notification.metadata.user)) as any
        const primary = notification.title
        const secondary = notification.content
        const isUnread = !notification.read

        return (
            <div
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleNotificationClick(notification)
                }}
                className={cn('w-full px-4 py-3 flex gap-3 items-start transition-colors cursor-pointer', 'hover:bg-muted outline-none')}
            >
                <div className="shrink-0">
                    <UserAvatar user={actor} size={40} className="!rounded-full"/>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <div className={cn('text-sm', isUnread ? 'font-semibold' : 'font-medium')}>{primary}</div>
                            {secondary && <div className="text-sm text-muted-foreground">{secondary}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatRelativeTime(notification.created_at)}
                            </time>
                            {isUnread && <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"/>}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <Heading size="md">Notifications</Heading>
                    <Text className="text-muted-foreground text-sm">{unreadCount} unread</Text>
                </div>
            </div>

            {/* Body */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <LoadingCircle className="mb-4 h-8 w-8"/>
                    <Text>Loading notifications...</Text>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <Text className="text-red-500 mb-2">{error}</Text>
                    <Button onClick={() => fetchNotifications(undefined)}>Try Again</Button>
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <PlaceholderNotification className="mb-4 text-card w-full"/>
                    <Heading>You're all caught up!</Heading>
                    <Text className="text-center text-muted-foreground">Nothing to see here yet.</Text>
                </div>
            ) : (
                <div className="flex flex-col rounded-2xl overflow-hidden border bg-card">
                    <div className="divide-y divide-border">
                        {notifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification}/>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="flex justify-center p-3">
                            <Button outline onClick={loadMore} disabled={loadingMore}>
                                {loadingMore ? (
                                    <>
                                        <LoadingCircle className="mr-2 h-4 w-4"/>
                                        Loading...
                                    </>
                                ) : (
                                    'Load more'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
