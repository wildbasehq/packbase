import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import Baozi from '@/lib/events'
import {FeedController} from '@/lib/FeedController'
import {HTTPError} from '@/lib/HTTPError'
import {clearQueryCache} from '@/lib/search/cache'
import {HowlBody} from '@/models/defs'
import requiresAccount from '@/utils/identity/requires-account'
import sanitizeTags from '@/utils/sanitize-tags'
import {uploadFileStream} from '@/utils/upload-file'
import {cleanupTempVideo, convertToAv1} from '@/utils/video-processor'
import {randomUUID} from 'crypto'
import {t} from 'elysia'
import {createReadStream, existsSync} from 'fs'
import {readFile, unlink} from 'fs/promises'
import path from 'path'

export default (app: YapockType) =>
    app.post(
        '',
        async ({body: {tenant_id, channel_id, asset_ids, body, content_type, tags}, set, user}) => {
            await requiresAccount({set, user})

            body = body?.trim() || ''
            if (body.length === 0 && (!asset_ids || asset_ids.length === 0)) {
                set.status = 400
                throw HTTPError.badRequest({
                    summary: 'You need to specify a valid body.',
                })
            }

            if (asset_ids?.length! > 20) {
                set.status = 400
                throw HTTPError.badRequest({
                    summary: 'You can only upload up to 20 assets.',
                })
            }

            const tenant = await prisma.packs.findUnique({where: {id: tenant_id}})

            if (!tenant) {
                set.status = 404
                throw HTTPError.notFound({
                    summary: 'Tenant not found',
                })
            }

            // If channel_id is provided, verify it exists and belongs to the specified tenant
            if (channel_id) {
                const page = await prisma.packs_pages.findUnique({
                    where: {id: channel_id},
                    select: {tenant_id: true},
                })

                if (!page) {
                    set.status = 404
                    throw HTTPError.notFound({
                        summary: 'Page not found',
                    })
                }

                if (page.tenant_id !== tenant_id) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'Page does not belong to the specified pack',
                    })
                }
            }

            /**
             * Tags
             * body.tags = String[],
             * trimmed, lowecase, all tags must only be alphanumeric, no spaces, no special characters (except
             * underscore and brackets). If brackets are used, they must be closed and only appear once.
             */
            let sanitisedTags: string[] = []
            const tagHasRating = tags?.some((tag) => ['rating_safe', 'rating_mature', 'rating_suggestive', 'rating_explicit'].indexOf(tag) > -1)
            if (tags && tagHasRating) {
                try {
                    sanitisedTags = sanitizeTags(tags)
                } catch (error) {
                    set.status = 400
                    throw error
                }

                // Check if only one rating tag is present
                const tagOnlyHasOneRating = sanitisedTags.filter((tag) => ['rating_safe', 'rating_mature', 'rating_suggestive', 'rating_explicit'].indexOf(tag) > -1).length === 1

                if (!tagOnlyHasOneRating) {
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'Rating tag is conflicting.',
                    })
                }
            } else {
                throw HTTPError.badRequest({
                    summary: 'Missing required tags',
                })
            }

            // Howl Asset Uploading
            // @ts-ignore
            let uploadedAssets: {
                type: 'image' | 'video';
                data: {
                    url: string;
                    name: string;
                };
            }[] = []
            let i = 0

            const handleUploadFailure = async (error: any) => {
                throw HTTPError.badRequest({
                    ...error,
                    summary: error.message || 'Upload failed',
                })
            }

            // Generate UUID
            const uuid = randomUUID()

            // @TODO move this into a utils function
            if (asset_ids && asset_ids.length > 0) {
                const UPLOAD_ROOT = path.join(process.cwd(), 'temp', 'uploads', 'pending')
                for (const assetId of asset_ids) {
                    const jsonPath = path.join(UPLOAD_ROOT, `${assetId}.json`)
                    const binPath = path.join(UPLOAD_ROOT, `${assetId}.bin`)

                    if (!existsSync(jsonPath)) {
                        await handleUploadFailure({message: `Asset ID ${assetId} not found`})
                    }

                    const meta = JSON.parse(await readFile(jsonPath, 'utf-8'))
                    if (meta.user_id !== user.sub) {
                        await handleUploadFailure({message: `Asset ID ${assetId} unauthorized`})
                    }
                    if (meta.state !== 'succeeded') {
                        await handleUploadFailure({message: `Asset ID ${assetId} not finalized`})
                    }
                    if (meta.expires && Date.now() > meta.expires) {
                        await handleUploadFailure({message: `Asset ID ${assetId} has expired`})
                    }

                    let processingPath = binPath
                    let contentType = meta.asset_type
                    let isVideo = meta.asset_type.startsWith('video/')
                    let tempVideoPath: string | null = null

                    if (isVideo) {
                        try {
                            tempVideoPath = await convertToAv1(binPath)
                            processingPath = tempVideoPath
                            contentType = 'video/webm'
                        } catch (e) {
                            console.error('Video conversion failed:', e)
                            await handleUploadFailure({message: `Video conversion failed for ${assetId}`})
                        }
                    }

                    const stream = createReadStream(processingPath)
                    const upload = await uploadFileStream(process.env.S3_PROFILES_BUCKET!, `${user.sub}/${uuid}/${i}.{ext}`, stream, contentType)

                    if (upload.error) {
                        await handleUploadFailure(upload.error)
                    } else {
                        uploadedAssets.push({
                            type: isVideo ? 'video' : 'image',
                            data: {
                                url: upload.data.path,
                                name: `${i}`,
                            },
                        })
                    }
                    i++

                    // Clean up
                    if (tempVideoPath) {
                        await cleanupTempVideo(tempVideoPath)
                    }
                    await unlink(jsonPath).catch(() => {
                    })
                    await unlink(binPath).catch(() => {
                    })
                }
            }

            const dbCreate = await Baozi.trigger('HOWL_CREATE', {
                id: uuid,
                tenant_id,
                channel_id,
                content_type,
                body,
                user_id: user.sub,
                tags: sanitisedTags,
                assets: uploadedAssets,
            })

            let data
            try {
                data = await prisma.posts.create({data: dbCreate})
            } catch (error) {
                throw HTTPError.fromError(error)
            }

            // Set profile r18 status if necessary
            if (sanitisedTags.includes('rating_suggestive') || sanitisedTags.includes('rating_explicit')) {
                await prisma.profiles.update({
                    where: {id: user.sub},
                    data: {is_r18: true},
                })
            }

            clearQueryCache(`~${dbCreate.tenant_id}`)
            clearQueryCache(`~${dbCreate.channel_id}`)
            clearQueryCache(`~${dbCreate.user_id}`)

            FeedController.homeFeedCache.forEach((value, key) => {
                if (key.includes(user.sub)) {
                    // Soft update
                    const {data: post} = value
                    post.unshift(data)
                    value.data = post
                    FeedController.homeFeedCache.set(key, value)
                }
            })

            return {
                id: data.id,
            }
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
