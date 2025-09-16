import { t } from 'elysia';
import uploadFile from '@/utils/upload-file';
import { YapockType } from '@/index';
import requiresUserProfile from '@/utils/identity/requires-user-profile';
import { HowlBody } from '@/models/defs';
import { FeedController } from '@/lib/FeedController';
import { HTTPError } from '@/lib/HTTPError';
import prisma from '@/db/prisma';
import createStorage from '@/lib/storage';
import Baozi from '@/lib/events';

export default (app: YapockType) =>
    app.post(
        '',
        async ({ body: { tenant_id, channel_id, assets, body, content_type }, set, user }) => {
            await requiresUserProfile({ set, user });

            if (tenant_id === 'universe') tenant_id = '00000000-0000-0000-0000-000000000000';

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

            if (tenant_id !== '00000000-0000-0000-0000-000000000000') {
                const tenant = await prisma.packs.findUnique({ where: { id: tenant_id } });

                if (!tenant) {
                    set.status = 404;
                    throw HTTPError.notFound({
                        summary: 'Tenant not found',
                    });
                }
            }

            // If channel_id is provided, verify it exists and belongs to the specified tenant
            if (channel_id) {
                const page = await prisma.packs_pages.findUnique({
                    where: { id: channel_id },
                    select: { tenant_id: true },
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

            const dbCreate = await Baozi.trigger('HOWL_CREATE', {
                tenant_id,
                channel_id,
                content_type,
                body,
                user_id: user.sub,
            });

            console.log('dbCreate', dbCreate);

            let data;
            try {
                data = await prisma.posts.create({ data: dbCreate });
            } catch (error) {
                set.status = 400;
                throw HTTPError.fromError(error);
            }

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
                    const upload = await uploadFile('packbase-public-profiles', `${user.sub}/${data.id}/${i}.{ext}`, asset.data);
                    if (upload.error) {
                        // delete post
                        await prisma.posts.delete({ where: { id: data.id } });

                        // also delete uploaded assets
                        const storage = createStorage('packbase-public-profiles');
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
                    where: { id: data.id },
                    data: {
                        assets: uploadedAssets,
                    },
                });
            }

            FeedController.homeFeedCache.forEach((value, key) => {
                if (key.includes(user.sub)) {
                    // Soft update
                    const { data: post } = value;
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
