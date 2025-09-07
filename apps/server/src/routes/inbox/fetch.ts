import { YapockType } from '@/index';
import { t } from 'elysia';
import { NotificationFetchQuery, NotificationType, Pagination } from '@/models/defs';
import { NotificationManager } from '@/utils/NotificationManager';
import { HTTPError } from '@/lib/HTTPError';

export default (app: YapockType) =>
    app.get(
        '',
        async ({ query, user, set }) => {
            if (!user) {
                set.status = 401;
                throw HTTPError.unauthorized({
                    summary: 'You must be logged in to access your inbox.',
                });
            }

            const { limit = 20, cursor, unread_only = false } = query;

            try {
                const result = await NotificationManager.getUserNotifications(user.sub, limit, cursor, unread_only);

                // Format dates to ISO strings for consistent API response
                const formattedData = result.data.map((notification) => ({
                    ...notification,
                    created_at: notification.created_at.toISOString(),
                    read_at: notification.read_at ? notification.read_at.toISOString() : null,
                }));

                return {
                    has_more: result.has_more,
                    data: formattedData,
                };
            } catch (error) {
                console.error('Error fetching notifications:', error);
                set.status = 500;
                throw HTTPError.serverError({
                    summary: 'Failed to fetch notifications.',
                });
            }
        },
        {
            query: NotificationFetchQuery,
            detail: {
                description: 'Fetch user notifications with pagination',
                tags: ['Inbox'],
            },
            response: {
                200: Pagination(NotificationType),
                401: t.Undefined(),
                500: t.Undefined(),
            },
        },
    );
