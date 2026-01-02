import { vg } from '@/lib/api'

// Notification type definition based on API documentation
export interface Notification {
    id: string
    created_at: string
    user_id: string
    type: string
    title: string
    content: string
    read: boolean
    read_at: string | null
    metadata: any | null
    related_id: string | null
}

export interface NotificationsResponse {
    has_more: boolean
    data: Notification[]
}

/**
 * Fetch notifications with pagination
 * @param options - Options for fetching notifications
 * @returns Promise with notifications response
 */
export async function fetchNotifications(
    options: {
        limit?: number
        cursor?: string
        unread_only?: boolean
    } = {}
): Promise<NotificationsResponse> {
    return (await vg.inbox.fetch.get(options)).data as NotificationsResponse
}

/**
 * Mark a single notification as read
 * @param id - ID of the notification to mark as read
 * @returns Promise with success status
 */
export async function markNotificationAsRead(id: string): Promise<{ success: boolean; count: number }> {
    return (await vg.inbox.read.post({ id })).data as { success: boolean; count: number }
}

/**
 * Mark multiple notifications as read
 * @param ids - Array of notification IDs to mark as read
 * @returns Promise with success status
 */
export async function markNotificationsAsRead(ids: string[]): Promise<{ success: boolean; count: number }> {
    return (await vg.inbox.read.post({ ids })).data as { success: boolean; count: number }
}

/**
 * Mark all notifications as read
 * @returns Promise with success status
 */
export async function markAllNotificationsAsRead(): Promise<{ success: boolean; count: number }> {
    return (await vg.inbox.read.post({ all: true })).data as { success: boolean; count: number }
}

/**
 * Get a specific notification by ID
 * @param id - ID of the notification to retrieve
 * @returns Promise with notification
 */
export async function getNotification(id: string): Promise<Notification> {
    return (await vg.inbox.get({ id })).data as Notification
}
