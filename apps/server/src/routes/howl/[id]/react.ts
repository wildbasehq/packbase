import { t } from 'elysia';
import { YapockType } from '@/index';
import requiresUserProfile from '@/utils/identity/requires-user-profile';
import { ErrorTypebox } from '@/utils/errors';
import { HTTPError } from '@/lib/HTTPError';
import prisma from '@/db/prisma';

export default (app: YapockType) =>
    app
        .post(
            '',
            async ({ params: { id }, body: { slot = 0 }, set, user }: any) => {
                await requiresUserProfile({ set, user });

                if (slot !== 0) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'Only slot 0 is supported for now.',
                    });
                }

                let postExists;
                try {
                    postExists = await prisma.posts.findUnique({ where: { id } });
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
                        },
                        select: {
                            created_at: true,
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

                try {
                    await prisma.posts_reactions.create({
                        data: {
                            post_id: id,
                            slot: slot,
                            actor_id: user.sub,
                        },
                    });
                } catch (insertError) {
                    throw HTTPError.fromError(insertError);
                }

                set.status = 201;
            },
            {
                detail: {
                    description: 'React to a post',
                    tags: ['Howl'],
                },
                body: t.Object({
                    slot: t.Number({
                        minimum: 0,
                        default: 0,
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
                        t.Number({
                            minimum: 0,
                            default: 0,
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
