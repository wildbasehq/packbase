/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import PlaceholderNotification from '@/components/icons/placeholder-notification.tsx'
import { Heading, Text } from '@/components/shared/text.tsx'
import { Slideover } from '@/components/modal/slideover.tsx'
import { useEffect, useState } from 'react'
import { DialogTitle } from '@/components/shared/dialog.tsx'
import Card from '@/components/shared/card.tsx'
import { LoadingCircle } from '@/components/icons'
import { Button } from '@/components/shared/experimental-button-rework'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils/date'
import { useNotifications } from '@/lib/providers/notifications-provider'
import { Notification } from '@/lib/api/inbox'
import { Badge } from '@/components/shared/badge'

export default function InboxPage({ onClose }) {
    const [open, setOpen] = useState(false)
    const { notifications, loading, loadingMore, error, hasMore, cursor, fetchNotifications, markAsRead, markAllAsRead, reset } =
        useNotifications()

    // Load more notifications
    const loadMore = () => {
        if (cursor && hasMore && !loadingMore) {
            fetchNotifications(cursor)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchNotifications()

        // Reset store when component unmounts
        return () => {
            reset()
        }
    }, [])

    useEffect(() => {
        setOpen(true)
    }, [])

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!open) {
                onClose()
            }
        }, 250)
        return () => clearTimeout(timeout)
    }, [open, onClose])

    // Notification item component
    const NotificationItem = ({ notification }: { notification: Notification }) => {
        return (
            <Card
                className={cn(
                    'mb-2 cursor-pointer transition-all hover:bg-n-1 dark:hover:bg-n-7 overflow-hidden',
                    !notification.read ? 'border-l-4 border-l-primary' : 'pl-4'
                )}
                onClick={() => markAsRead(notification.id)}
            >
                <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center">
                            <Heading size="sm" className="font-medium">
                                {notification.title}
                            </Heading>
                            {!notification.read && (
                                <Badge color="indigo" className="ml-2 text-xs">
                                    New
                                </Badge>
                            )}
                        </div>
                        <Text alt className="text-xs">
                            {formatRelativeTime(notification.created_at)}
                        </Text>
                    </div>
                    <Text className="text-sm mb-2">{notification.content}</Text>
                    <div className="flex justify-between items-center">
                        {notification.type && (
                            <Badge color="indigo" className="text-xs">
                                {notification.type}
                            </Badge>
                        )}
                        {notification.related_id && (
                            <Text alt className="text-xs">
                                ID: {notification.related_id.substring(0, 8)}...
                            </Text>
                        )}
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Slideover
            open={[open, setOpen]}
            className="w-full sm:w-[400px]"
            navbar={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center">
                        <DialogTitle>Inbox</DialogTitle>
                        {notifications?.filter(n => !n.read).length > 0 && (
                            <Badge color="indigo" className="ml-2">
                                {notifications.filter(n => !n.read).length}
                            </Badge>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <Button outline onClick={markAllAsRead} className="text-xs mr-2">
                            Mark all as read
                        </Button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col h-full">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <LoadingCircle className="mb-4 h-8 w-8" />
                        <Text>Loading notifications...</Text>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <Text className="text-red-500 mb-2">{error}</Text>
                        <Button onClick={() => fetchNotifications()}>Try Again</Button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <PlaceholderNotification className="mb-4 text-neutral-50 dark:text-n-8" />
                        <Heading size="xl">Nothing here, bud!</Heading>
                        <Text className="text-center">You don't have any notifications yet.</Text>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="flex justify-between mb-4">
                            <Button outline onClick={() => fetchNotifications(null, false)}>
                                All
                            </Button>
                            <Button outline onClick={() => fetchNotifications(null, true)}>
                                Unread
                            </Button>
                        </div>

                        <div className="space-y-2 mb-4">
                            {notifications.map(notification => (
                                <NotificationItem key={notification.id} notification={notification} />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center mb-4">
                                <Button outline onClick={loadMore} disabled={loadingMore}>
                                    {loadingMore ? (
                                        <>
                                            <LoadingCircle className="mr-2 h-4 w-4" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Slideover>
    )
}
