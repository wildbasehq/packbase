import { create } from 'zustand'
import { fetchNotifications, markAllNotificationsAsRead, markNotificationAsRead, Notification } from '@/src/lib/api/users/inbox'

/**
 * Notifications Store
 * Manages the state of user notifications, including loading, error, and pagination
 */
interface NotificationsStore {
    // State
    notifications: Notification[]
    loading: boolean
    loadingMore: boolean
    error: string | null
    hasMore: boolean
    cursor: string | null

    // Actions
    fetchNotifications: (cursorValue?: string | null, unreadOnly?: boolean) => Promise<void>
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    reset: () => void
}

export const useNotificationsStore = create<NotificationsStore>(set => ({
    // Initial state
    notifications: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    cursor: null,

    // Actions
    fetchNotifications: async (cursorValue = null, unreadOnly = false) => {
        try {
            const options: any = { limit: 20 }

            if (cursorValue) {
                options.cursor = cursorValue
                set({ loadingMore: true })
            } else {
                set({ loading: true })
            }

            if (unreadOnly) {
                options.unread_only = true
            }

            const response = await fetchNotifications(options)

            if (cursorValue) {
                set(state => ({
                    notifications: [...state.notifications, ...response.data],
                    loadingMore: false,
                }))
            } else {
                set({
                    notifications: response.data,
                    loading: false,
                })
            }

            set({
                hasMore: response.has_more,
                cursor: response.has_more && response.data.length > 0 ? response.data[response.data.length - 1].id : null,
                error: null,
            })
        } catch (err) {
            set({
                error: 'Failed to load notifications',
                loading: false,
                loadingMore: false,
            })
            console.error('Error fetching notifications:', err)
        }
    },

    markAsRead: async (id: string) => {
        try {
            await markNotificationAsRead(id)

            // Update the local state to mark the notification as read
            set(state => ({
                notifications: state.notifications.map(notification =>
                    notification.id === id ? { ...notification, read: true, read_at: new Date().toISOString() } : notification
                ),
            }))
        } catch (err) {
            console.error('Error marking notification as read:', err)
        }
    },

    markAllAsRead: async () => {
        try {
            await markAllNotificationsAsRead()

            // Update the local state to mark all notifications as read
            set(state => ({
                notifications: state.notifications.map(notification => ({
                    ...notification,
                    read: true,
                    read_at: new Date().toISOString(),
                })),
            }))
        } catch (err) {
            console.error('Error marking all notifications as read:', err)
        }
    },

    reset: () => {
        set({
            notifications: [],
            loading: false,
            loadingMore: false,
            error: null,
            hasMore: false,
            cursor: null,
        })
    },
}))
