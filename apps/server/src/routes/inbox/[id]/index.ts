import {YapockType} from '@/index'
import {t} from 'elysia'
import {NotificationType} from '@/models/defs'
import {NotificationManager} from '@/utils/NotificationManager'
import {HTTPError} from '@/lib/class/HTTPError'

export default (app: YapockType) =>
    app.get(
        '',
        async ({params, user, set}) => {
            if (!user) {
                set.status = 401
                throw HTTPError.unauthorized({
                    summary: 'You must be logged in to access notifications.',
                })
            }

            try {
                const notification = await NotificationManager.getNotification(params.id)

                if (!notification) {
                    set.status = 404
                    throw HTTPError.notFound({
                        summary: 'Notification not found.',
                    })
                }

                // Check if the notification belongs to the user
                if (notification.user_id !== user.sub) {
                    set.status = 403
                    throw HTTPError.forbidden({
                        summary: 'You do not have permission to view this notification.',
                    })
                }

                // Format dates to ISO strings for consistent API response
                return {
                    ...notification,
                    created_at: notification.created_at.toISOString(),
                    read_at: notification.read_at ? notification.read_at.toISOString() : null
                }
            } catch (error) {
                if (error instanceof HTTPError) {
                    throw error
                }
                
                console.error('Error fetching notification:', error)
                set.status = 500
                throw HTTPError.serverError({
                    summary: 'Failed to fetch notification.',
                })
            }
        },
        {
            params: t.Object({
                id: t.String({
                    description: 'ID of the notification to retrieve',
                }),
            }),
            detail: {
                description: 'Get a specific notification by ID',
                tags: ['Inbox'],
            },
            response: {
                200: NotificationType,
                401: t.Undefined(),
                403: t.Undefined(),
                404: t.Undefined(),
                500: t.Undefined()
            }
        },
    )