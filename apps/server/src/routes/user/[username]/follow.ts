import { YapockType } from '@/index';
import { t } from 'elysia';
import { getUser } from '@/routes/user/[username]/index';
import { ErrorTypebox } from '@/utils/errors';
import requiresUserProfile from '@/utils/identity/requires-user-profile';
import { FeedController } from '@/lib/FeedController';
import { HTTPError } from '@/lib/HTTPError';
import prisma from '@/db/prisma';

export default (app: YapockType) =>
    app
        .post(
            '',
            async ({ user, params, set, error }) => {
                await requiresUserProfile({ set, user });
                const followUser = await getUser({
                    by: 'username',
                    value: params.username,
                    user,
                });

                if (!followUser) {
                    set.status = 404;
                    return;
                }

                if (followUser.id === user.sub) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'You cannot follow yourself.',
                    });
                }

                if (followUser.following) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'You are already following this user.',
                    });
                }

                try {
                    await prisma.profiles_followers.create({
                        data: {
                            user_id: user.sub,
                            following_id: followUser.id,
                        },
                    });
                } catch (insertError) {
                    set.status = 400;
                    throw HTTPError.fromError(insertError);
                }

                FeedController.clearUserCache(user.sub);
            },
            {
                params: t.Object({
                    username: t.String({
                        description: 'Username of the user to follow.',
                    }),
                }),
                detail: {
                    description: 'Follow a specific user.',
                    tags: ['User'],
                },
                response: {
                    404: t.Undefined(),
                    400: ErrorTypebox,
                    200: t.Void(),
                },
            },
        )
        .delete(
            '',
            async ({ params, set, user, error }) => {
                await requiresUserProfile({ set, user });
                const followUser = await getUser({
                    by: 'username',
                    value: params.username,
                    user,
                });

                if (!followUser) {
                    set.status = 404;
                    return;
                }

                if (followUser.id === user.sub) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'You cannot unfollow yourself.',
                    });
                }

                if (!followUser.following) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'You are not following this user.',
                    });
                }

                try {
                    await prisma.profiles_followers.deleteMany({
                        where: {
                            user_id: user.sub,
                            following_id: followUser.id,
                        },
                    });
                } catch (deleteError) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: deleteError.message || 'unknown',
                    });
                }

                FeedController.clearUserCache(user.sub);
            },
            {
                params: t.Object({
                    username: t.String({
                        description: 'Username of the user to unfollow.',
                    }),
                }),
                detail: {
                    description: 'Unfollow a specific user.',
                    tags: ['User'],
                },
                response: {
                    404: t.Undefined(),
                    400: ErrorTypebox,
                    200: t.Void(),
                },
            },
        );
