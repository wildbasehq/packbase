import {YapockType} from '@/index';
import {t} from 'elysia';
import {getUser} from '@/routes/user/[username]/index';
import {HTTPError} from '@/lib/HTTPError';
import prisma from '@/db/prisma';
import {RSSGenerator} from '@/lib/rss';
import {checkUserBillingPermission} from "@/utils/clerk/check-user-permission";

export default (app: YapockType) =>
    app.get(
        '',
        async ({params, user, set, request}) => {
            // Get the user profile
            const profile = await getUser({
                by: 'username',
                value: params.username,
            });

            if (!profile) {
                throw HTTPError.notFound({
                    summary: 'User not found.',
                });
            }

            const postLimit = await checkUserBillingPermission(profile.owner_id, 'extended_rss') ? 100 : 5;
            const posts = await prisma.posts.findMany({
                where: {
                    user_id: profile.id,
                    parent: null, // Only top-level posts, not replies
                },
                orderBy: {
                    created_at: 'desc',
                },
                take: postLimit,
                select: {
                    id: true,
                    created_at: true,
                    body: true,
                    content_type: true,
                    assets: true,
                },
            });

            // Get base URL from request
            const url = new URL(request.url);
            const baseUrl = `${url.protocol}//${url.host}`;

            // Generate RSS feed
            const rssXml = RSSGenerator.generateUserFeed(
                {
                    id: profile.id,
                    username: profile.username,
                    display_name: profile.display_name,
                    bio: profile.bio,
                },
                posts,
                baseUrl
            );

            // Set proper headers for RSS feed
            set.headers['Content-Type'] = 'application/rss+xml; charset=utf-8';

            return rssXml;
        },
        {
            params: t.Object({
                username: t.String({
                    description: 'Username of the user whose RSS feed to get.',
                }),
            }),
            detail: {
                description: 'Get RSS feed for a user\'s posts',
                tags: ['User', 'RSS'],
            },
            response: {
                200: t.String({
                    description: 'RSS XML feed',
                }),
                404: t.Undefined(),
                500: t.Optional(t.Object({
                    error: t.String(),
                    message: t.String(),
                })),
            },
        },
    );

