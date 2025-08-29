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

            const userBadge = await prisma.collectibles.findFirst({
                where: {
                    user_id: user.sub,
                    badge_id: body.badge,
                },
            });

            if (!userBadge) {
                set.status = 400;
                return;
            }

            // Set any `is_set` to false, set body.badge (badge_id) as true.
            await prisma.collectibles.updateMany({
                where: {
                    user_id: user.sub,
                },
                data: {
                    is_set: false,
                },
            });

            await prisma.collectibles.updateMany({
                where: {
                    user_id: user.sub,
                    badge_id: body.badge,
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
