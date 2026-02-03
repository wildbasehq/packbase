import prisma from '@/db/prisma'

/**
 * NotificationManager class for managing user notifications
 * Provides methods to create, retrieve, and update notifications
 */
export class NotificationManager {
    /**
     * Create a new notification
     * @param userId The ID of the user to notify
     * @param type The type of notification
     * @param title The notification title
     * @param content The notification content
     * @param metadata Optional additional data
     * @param relatedId Optional ID of a related entity
     * @returns The created notification
     */
    static async createNotification(
        userId: string,
        type: string,
        title: string,
        content: string,
        metadata?: any,
        relatedId?: string
    ) {
        try {
            return await prisma.notifications.create({
                data: {
                    user: {connect: {id: userId}},
                    type,
                    title,
                    content,
                    metadata,
                    related_id: relatedId,
                },
            })
        } catch (error) {
            console.error('Error creating notification:', error)
            throw error
        }
    }

    /**
     * Get a notification by ID
     * @param id The notification ID
     * @returns The notification or null if not found
     */
    static async getNotification(id: string) {
        try {
            return await prisma.notifications.findUnique({
                where: {id},
            })
        } catch (error) {
            console.error('Error getting notification:', error)
            throw error
        }
    }

    /**
     * Get notifications for a user with pagination
     * @param userId The user ID
     * @param limit Maximum number of notifications to return
     * @param cursor Cursor for pagination
     * @param unreadOnly Whether to return only unread notifications
     * @returns Paginated notifications
     */
    static async getUserNotifications(
        userId: string,
        limit: number = 20,
        cursor?: string,
        unreadOnly: boolean = false
    ) {
        try {
            // Build the where condition
            const where: any = {
                user_id: userId,
            }

            if (unreadOnly) {
                where.read = false
            }

            // Get one more item than requested to determine if there are more items
            const notifications = await prisma.notifications.findMany({
                where,
                take: limit + 1,
                ...(cursor ? {cursor: {id: cursor}, skip: 1} : {}),
                orderBy: {
                    created_at: 'desc',
                },
            })

            const hasMore = notifications.length > limit
            const data = hasMore ? notifications.slice(0, limit) : notifications

            return {
                data,
                has_more: hasMore,
                next_cursor: data.length > 0 ? data[data.length - 1].id : null,
            }
        } catch (error) {
            console.error('Error getting user notifications:', error)
            throw error
        }
    }

    /**
     * Mark notifications as read
     * @param options Options for marking notifications as read
     * @returns The number of notifications marked as read
     */
    static async markAsRead(options: {
        id?: string
        ids?: string[]
        userId?: string
        all?: boolean
    }) {
        try {
            const {id, ids, userId, all} = options

            if (!id && !ids && !all) {
                throw new Error('Must provide id, ids, or all=true')
            }

            if (!userId && !id && !ids) {
                throw new Error('Must provide userId when using all=true')
            }

            // Build the where condition
            let where: any = {}

            if (id) {
                where.id = id
            } else if (ids && ids.length > 0) {
                where.id = {in: ids}
            } else if (all && userId) {
                where.user_id = userId
                where.read = false
            }

            // Update the notifications
            const result = await prisma.notifications.updateMany({
                where,
                data: {
                    read: true,
                    read_at: new Date(),
                },
            })

            return result.count
        } catch (error) {
            console.error('Error marking notifications as read:', error)
            throw error
        }
    }

    /**
     * Get unread notification count for a user
     * @param userId The user ID
     * @returns The number of unread notifications
     */
    static async getUnreadCount(userId: string) {
        try {
            return await prisma.notifications.count({
                where: {
                    user_id: userId,
                    read: false,
                },
            })
        } catch (error) {
            console.error('Error getting unread count:', error)
            throw error
        }
    }
}