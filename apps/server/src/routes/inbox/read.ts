import {YapockType} from '@/index'
import {t} from 'elysia'
import {NotificationReadBody} from '@/models/defs'
import {NotificationManager} from '@/utils/NotificationManager'
import {HTTPError} from '@/lib/class/HTTPError'

export default (app: YapockType) =>
    app.post(
        '',
        async ({body, user, set}) => {
            if (!user) {
                set.status = 401
                throw HTTPError.unauthorized({
                    summary: 'You must be logged in to mark notifications as read.',
                })
            }

            const {id, ids, all} = body

            // Validate that at least one option is provided
            if (!id && !ids && !all) {
                set.status = 400
                throw HTTPError.badRequest({
                    summary: 'You must provide either id, ids, or all=true.',
                })
            }

            try {
                // If a single ID is provided, verify it belongs to the user
                if (id) {
                    const notification = await NotificationManager.getNotification(id)
                    
                    if (!notification) {
                        set.status = 404
                        throw HTTPError.notFound({
                            summary: 'Notification not found.',
                        })
                    }
                    
                    if (notification.user_id !== user.sub) {
                        set.status = 403
                        throw HTTPError.forbidden({
                            summary: 'You do not have permission to mark this notification as read.',
                        })
                    }
                }
                
                // If multiple IDs are provided, we'll let the database handle permissions
                // by including the user_id in the query
                
                const count = await NotificationManager.markAsRead({
                    id,
                    ids,
                    userId: user.sub,
                    all
                })
                
                return {
                    success: true,
                    count
                }
            } catch (error) {
                if (error instanceof HTTPError) {
                    throw error
                }
                
                console.error('Error marking notifications as read:', error)
                set.status = 500
                throw HTTPError.serverError({
                    summary: 'Failed to mark notifications as read.',
                })
            }
        },
        {
            body: NotificationReadBody,
            detail: {
                description: 'Mark notifications as read',
                tags: ['Inbox'],
            },
            response: {
                200: t.Object({
                    success: t.Boolean(),
                    count: t.Number()
                }),
                400: t.Undefined(),
                401: t.Undefined(),
                403: t.Undefined(),
                404: t.Undefined(),
                500: t.Undefined()
            }
        },
    )