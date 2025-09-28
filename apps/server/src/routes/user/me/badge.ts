import { YapockType } from '@/index';
import { t } from 'elysia';
import requiresToken from '@/utils/identity/requires-token';

export default (app: YapockType) =>
    app.post(
        '',
        async ({
            set,
            body,
            user,
        }: {
            set: any;
            body: {
                badge: string;
            };
            user: any;
        }) => {
            requiresToken({ set, user });

            const userBadge = await prisma.inventory.findFirst({
                where: {
                    user_id: user.sub,
                    item_id: body.badge,
                    type: 'badge',
                },
            });

            if (!userBadge) {
                set.status = 400;
                return;
            }

            // Set any `is_set` to false, set body.badge (badge_id) as true.
            await prisma.inventory.updateMany({
                where: {
                    user_id: user.sub,
                    type: 'badge',
                },
                data: {
                    is_set: false,
                },
            });

            await prisma.inventory.updateMany({
                where: {
                    user_id: user.sub,
                    item_id: body.badge,
                    type: 'badge',
                },
                data: {
                    is_set: true,
                },
            });
        },
        {
            detail: {
                description: 'Update the current user.',
                tags: ['User'],
            },
            body: t.Object({
                badge: t.String({
                    description: 'The badge to set.',
                }),
            }),
        },
    );
