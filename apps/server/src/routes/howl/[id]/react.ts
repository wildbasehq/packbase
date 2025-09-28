import { t } from 'elysia';
import { YapockType } from '@/index';
import requiresUserProfile from '@/utils/identity/requires-user-profile';
import { ErrorTypebox } from '@/utils/errors';
import { HTTPError } from '@/lib/HTTPError';
import prisma from '@/db/prisma';
import clerkClient from '@/db/auth';
import { NotificationManager } from '@/utils/NotificationManager';
import { getUserClerkByID } from '@/utils/clerk';

export default (app: YapockType) =>
    app
        .post(
            '',
            async ({ params: { id }, body: { slot = '👍' }, set, user }: any) => {
                await requiresUserProfile({ set, user });

                let postExists;
                try {
                    postExists = await prisma.posts.findUnique({ where: { id }, select: { user_id: true, body: true } });
                } catch (postError) {
                    set.status = 500;
                    throw HTTPError.fromError(postError);
                }
                if (!postExists) {
                    set.status = 404;
                    return;
                }

                let reactionExists;
                try {
                    reactionExists = await prisma.posts_reactions.findMany({
                        where: {
                            post_id: id,
                            actor_id: user.sub,
                            slot,
                        },
                        select: {
                            created_at: true,
                            slot: true,
                        },
                    });
                } catch (reactionError) {
                    set.status = 500;
                    throw HTTPError.fromError(reactionError);
                }
                if (reactionExists && reactionExists.length > 0) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'You have already reacted to this post.',
                    });
                }

                // Count all reactions for this post
                const reactionCount = await prisma.posts_reactions.count({
                    where: {
                        post_id: id,
                    },
                });

                if (reactionCount >= 10) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'Too many reactions.',
                    });
                }

                try {
                    await prisma.posts_reactions.create({
                        data: {
                            post_id: id,
                            slot,
                            actor_id: user.sub,
                        },
                    });
                } catch (insertError) {
                    throw HTTPError.fromError(insertError);
                }

                await NotificationManager.createNotification(postExists.user_id, 'howl_react', `${user.sessionClaims.nickname} reacted :${slot}:`, postExists.body, {
                    post_id: id,
                    user: {
                        id: user.sub,
                        username: user.sessionClaims.nickname,
                        images_avatar: (await getUserClerkByID(user.userId).then((user) => user?.imageUrl)) || null,
                    },
                });

                set.status = 201;
            },
            {
                detail: {
                    description: 'React to a post',
                    tags: ['Howl'],
                },
                body: t.Object({
                    slot: t.String({
                        minimum: 1,
                        default: '👍',
                    }),
                }),
                response: {
                    201: t.Undefined(),
                    400: t.Optional(ErrorTypebox),
                    401: t.Undefined(),
                    404: t.Undefined(),
                    500: ErrorTypebox,
                },
            },
        )
        .delete(
            '',
            async ({ params: { id }, set, user }) => {
                await requiresUserProfile({ set, user });

                try {
                    await prisma.posts_reactions.deleteMany({
                        where: {
                            post_id: id,
                            actor_id: user.sub,
                        },
                    });
                } catch (deleteError) {
                    throw HTTPError.fromError(deleteError);
                }

                set.status = 204;
            },
            {
                detail: {
                    description: 'Remove reaction from a post',
                    tags: ['Howl'],
                },
                body: t.Object({
                    slot: t.Optional(
                        t.String({
                            minimum: 1,
                            default: '👍',
                        }),
                    ),
                }),
                response: {
                    204: t.Undefined(),
                    400: t.Optional(ErrorTypebox),
                    401: t.Undefined(),
                    404: t.Undefined(),
                    500: ErrorTypebox,
                },
            },
        );
