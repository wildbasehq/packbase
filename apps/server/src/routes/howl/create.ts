import {t} from 'elysia';
import uploadFile from '@/utils/upload-file';
import {YapockType} from '@/index';
import {HowlBody} from '@/models/defs';
import {FeedController} from '@/lib/FeedController';
import {HTTPError} from '@/lib/HTTPError';
import prisma from '@/db/prisma';
import createStorage from '@/lib/storage';
import Baozi from '@/lib/events';
import sanitizeTags from '@/utils/sanitize-tags';
import requiresAccount from "@/utils/identity/requires-account";
import {clearQueryCache} from "@/lib/search/cache";

export default (app: YapockType) =>
    app.post(
        '',
        async ({body: {tenant_id, channel_id, assets, body, content_type, tags}, set, user}) => {
            await requiresAccount({set, user});

            body = body?.trim() || '';
            if (body.length === 0 && (!assets || assets.length === 0)) {
                set.status = 400;
                throw HTTPError.badRequest({
                    summary: 'You need to specify a valid body.',
                });
            }

            if (assets?.length! > 20) {
                set.status = 400;
                throw HTTPError.badRequest({
                    summary: 'You can only upload up to 20 assets.',
                });
            }

            const tenant = await prisma.packs.findUnique({where: {id: tenant_id}});

            if (!tenant) {
                set.status = 404;
                throw HTTPError.notFound({
                    summary: 'Tenant not found',
                });
            }

            // If channel_id is provided, verify it exists and belongs to the specified tenant
            if (channel_id) {
                const page = await prisma.packs_pages.findUnique({
                    where: {id: channel_id},
                    select: {tenant_id: true},
                });

                if (!page) {
                    set.status = 404;
                    throw HTTPError.notFound({
                        summary: 'Page not found',
                    });
                }

                if (page.tenant_id !== tenant_id) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'Page does not belong to the specified pack',
                    });
                }
            }

            /**
             * Tags
             * body.tags = String[],
             * trimmed, lowecase, all tags must only be alphanumeric, no spaces, no special characters (except
             * underscore and brackets). If brackets are used, they must be closed and only appear once.
             */
            let sanitisedTags: string[] = []
            const tagHasRating = tags?.some((tag) => ['rating_safe', 'rating_mature', 'rating_suggestive', 'rating_explicit'].indexOf(tag) > -1);
            if (tags && tagHasRating) {
                try {
                    sanitisedTags = sanitizeTags(tags);
                } catch (error) {
                    set.status = 400;
                    throw error;
                }

                // Check if only one rating tag is present
                const tagOnlyHasOneRating = sanitisedTags.filter((tag) => ['rating_safe', 'rating_mature', 'rating_suggestive', 'rating_explicit'].indexOf(tag) > -1).length === 1;

                if (!tagOnlyHasOneRating) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'Rating tag is conflicting.',
                    });
                }
            } else {
                throw HTTPError.badRequest({
                    summary: 'Missing required tags',
                });
            }

            const dbCreate = await Baozi.trigger('HOWL_CREATE', {
                tenant_id,
                channel_id,
                content_type,
                body,
                user_id: user.sub,
                tags: sanitisedTags,
            });

            console.log('dbCreate', dbCreate);

            let data;
            try {
                data = await prisma.posts.create({data: dbCreate});
            } catch (error) {
                set.status = 400;
                throw HTTPError.fromError(error);
            }

            clearQueryCache(`~${dbCreate.tenant_id}`)
            clearQueryCache(`~${dbCreate.channel_id}`)
            clearQueryCache(`~${dbCreate.user_id}`)

            if (assets && assets.length > 0) {
                // @ts-ignore
                let uploadedAssets: {
                    type: 'image';
                    data: {
                        url: string;
                        name: string;
                    };
                }[] = [];
                let i = 0;
                for (const asset of assets) {
                    const upload = await uploadFile(process.env.S3_PROFILES_BUCKET, `${user.sub}/${data.id}/${i}.{ext}`, asset.data);
                    if (upload.error) {
                        // delete post
                        await prisma.posts.delete({where: {id: data.id}});

                        // also delete uploaded assets
                        const storage = createStorage(process.env.S3_PROFILES_BUCKET);
                        for (const asset of uploadedAssets) {
                            await storage.deleteFile(user.sub, `${data.id}/${asset.data.name}`);
                        }

                        set.status = 400;
                        throw HTTPError.badRequest({
                            ...upload.error,
                            summary: upload.error.message,
                        });
                    } else {
                        uploadedAssets.push({
                            type: 'image',
                            data: {
                                url: upload.data.path,
                                name: asset.name,
                            },
                        });
                    }
                    i++;
                }

                await prisma.posts.update({
                    where: {id: data.id},
                    data: {
                        assets: uploadedAssets,
                    },
                });
            }

            FeedController.homeFeedCache.forEach((value, key) => {
                if (key.includes(user.sub)) {
                    // Soft update
                    const {data: post} = value;
                    post.unshift(data);
                    value.data = post;
                    FeedController.homeFeedCache.set(key, value);
                }
            });

            set.status = 201;
            return {
                id: data.id,
            };
        },
        {
            detail: {
                description: 'Creates a new howl',
                tags: ['Howl'],
            },
            body: HowlBody,
            response: {
                200: t.Object({
                    id: t.String(),
                }),
            },
        },
    );
