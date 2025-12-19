import {YapockType} from '@/index';
import {t} from 'elysia';
import {UserProfile} from '@/models/defs';
import posthog, {distinctId} from '@/utils/posthog';
import {HTTPError} from '@/lib/HTTPError';
import prisma from '@/db/prisma';
import clerkClient from '@/db/auth';

export const UserCache = new Map<
    string,
    typeof UserProfile & {
    expires_after: number;
}
>();

export default (app: YapockType) =>
    app.get(
        '',
        async ({params, user, set}) => {
            const userRes = await getUser({
                by: 'username',
                value: params.username,
                user,
            });

            if (!userRes) {
                set.status = 404;
                throw HTTPError.notFound({
                    summary: 'The user was not found.',
                });
            }

            return userRes;
        },
        {
            params: t.Object({
                username: t.String({
                    description: 'Username of the user to get.',
                }),
            }),
            detail: {
                description: 'Get a specific user.',
                tags: ['User'],
            },
            response: {
                404: t.Undefined(),
                200: UserProfile,
            },
        },
    );

export async function getUser({by, value, user, scope}: { by: string; value: string; user?: any; scope?: string }) {
    const timer = new Date().getTime();

    let data;
    let clerkUser;

    try {
        // Create a dynamic where condition based on the 'by' parameter
        const whereCondition = {[by]: value};

        if (by === 'username') {
            const userFind = await clerkClient.users.getUserList({
                username: [value],
            });

            clerkUser = userFind.data?.find((u) => u.username === value);

            whereCondition.owner_id = clerkUser?.id;
        }

        const userData = await prisma.profiles.findFirst({
            where: whereCondition,
            ...(scope === 'basic'
                ? {
                    select: {
                        id: true,
                        owner_id: true,
                        display_name: true,
                        bio: true,
                    },
                }
                : {}),
        });

        if (!userData) {
            return null;
        }

        if (by !== 'username') {
            clerkUser = await clerkClient.users.getUser(userData.owner_id);
        }

        data = userData;
        data.username = clerkUser.username;
    } catch (error: any) {
        // Handle specific Prisma errors if needed
        throw error;
    }

    if (!data) return;

    data.about = {
        bio: data.bio,
    };
    delete data.bio;

    data.images = {
        avatar: `${process.env.HOSTNAME}/user/${data.id}/avatar`,
        header: data.images_header,
    };

    delete data.images_avatar;
    delete data.images_header;

    if (user) {
        // Check if following
        try {
            const followingData = await prisma.profiles_followers.findFirst({
                where: {
                    user_id: user.sub,
                    following_id: data.id,
                },
            });

            if (followingData) {
                data.following = true;
            }

            // Set online status
            if (scope === 'pack_member') {
                data.online = data.last_online && Date.now() - new Date(data.last_online).getTime() < 5 * 60 * 1000;
                if (!data.online) {
                    const timeDiff = Date.now() - new Date(data.last_online).getTime();
                    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));

                    if (hoursAgo < 24) {
                        if (hoursAgo === 0) {
                            const minutesAgo = Math.floor(timeDiff / (1000 * 60));
                            user.status = `seen ${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
                        } else {
                            user.status = `seen ${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
                        }
                    }
                }
            }
        } catch (error) {
            // If there's an error, we'll just continue without setting following status
        }
    }

    const userBadges = await prisma.inventory.findFirst({
        where: {
            user_id: data.owner_id,
            type: 'badge',
            is_set: true,
        },
    });

    if (userBadges) {
        data.badge = userBadges.item_id;
    }

    if (data.is_r18) {
        // Get unique adult content tags from their posts
        const adultTags = await prisma.posts.findMany({
            where: {
                user_id: data.id,
                tags: {
                    hasSome: ['rating_suggestive', 'rating_explicit'],
                },
            },
            select: {
                tags: true,
            },
        });

        const uniqueTags = new Set<string>();
        adultTags.forEach((post) => {
            post.tags.forEach(tag => uniqueTags.add(tag))
        });

        data.r18_tags = Array.from(uniqueTags);
    }

    posthog.capture({
        distinctId,
        event: 'Viewed User',
        properties: {
            // cached: !!cached,
            fetch_time: new Date().getTime() - timer,
            username: data.username,
            user_id: data.id,
        },
    });

    return data;
}
