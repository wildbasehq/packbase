import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import Baozi from '@/lib/events'
import {FeedController} from '@/lib/FeedController'
import {HTTPError} from '@/lib/HTTPError'
import {clearQueryCache} from '@/lib/search/cache'
import createStorage from '@/lib/storage'
import {HowlBody} from '@/models/defs'
import requiresAccount from '@/utils/identity/requires-account'
import sanitizeTags from '@/utils/sanitize-tags'
import {uploadFileStream} from '@/utils/upload-file'
import {randomUUID} from 'crypto'
import {t} from 'elysia'
import {createReadStream, existsSync} from 'fs'
import {readFile, unlink} from 'fs/promises'
import path from 'path'

export default (app: YapockType) =>
    app.post(
        '',
        async ({body: {tenant_id, channel_id, asset_ids, body, content_type, tags}, set, user}) => {
            console.log('[HOWL_CREATE] Starting howl creation request', {
                user_id: user?.sub,
                tenant_id,
                channel_id,
                content_type,
                asset_count: asset_ids?.length || 0,
                tags_count: tags?.length || 0,
                body_length: body?.length || 0,
            })

            await requiresAccount({set, user})
            console.log('[HOWL_CREATE] Account validation passed')

            body = body?.trim() || ''
            if (body.length === 0 && (!asset_ids || asset_ids.length === 0)) {
                console.log('[HOWL_CREATE] Validation failed: empty body and no assets')
                set.status = 400
                throw HTTPError.badRequest({
                    summary: 'You need to specify a valid body.',
                })
            }

            if (asset_ids?.length! > 20) {
                console.log('[HOWL_CREATE] Validation failed: too many assets', {asset_count: asset_ids?.length})
                set.status = 400
                throw HTTPError.badRequest({
                    summary: 'You can only upload up to 20 assets.',
                })
            }

            console.log('[HOWL_CREATE] Fetching tenant', {tenant_id})
            const tenant = await prisma.packs.findUnique({where: {id: tenant_id}})

            if (!tenant) {
                console.log('[HOWL_CREATE] Tenant not found', {tenant_id})
                set.status = 404
                throw HTTPError.notFound({
                    summary: 'Tenant not found',
                })
            }
            console.log('[HOWL_CREATE] Tenant found', {tenant_id, tenant_name: tenant.display_name})

            // If channel_id is provided, verify it exists and belongs to the specified tenant
            if (channel_id) {
                console.log('[HOWL_CREATE] Validating channel', {channel_id, tenant_id})
                const page = await prisma.packs_pages.findUnique({
                    where: {id: channel_id},
                    select: {tenant_id: true},
                })

                if (!page) {
                    console.log('[HOWL_CREATE] Channel not found', {channel_id})
                    set.status = 404
                    throw HTTPError.notFound({
                        summary: 'Page not found',
                    })
                }

                if (page.tenant_id !== tenant_id) {
                    console.log('[HOWL_CREATE] Channel tenant mismatch', {
                        channel_id,
                        expected_tenant_id: tenant_id,
                        actual_tenant_id: page.tenant_id,
                    })
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'Page does not belong to the specified pack',
                    })
                }
                console.log('[HOWL_CREATE] Channel validation passed', {channel_id})
            }

            /**
             * Tags
             * body.tags = String[],
             * trimmed, lowecase, all tags must only be alphanumeric, no spaces, no special characters (except
             * underscore and brackets). If brackets are used, they must be closed and only appear once.
             */
            console.log('[HOWL_CREATE] Starting tag validation', {tags})
            let sanitisedTags: string[] = []
            const tagHasRating = tags?.some((tag) => ['rating_safe', 'rating_mature', 'rating_suggestive', 'rating_explicit'].indexOf(tag) > -1)
            console.log('[HOWL_CREATE] Rating tag check', {tagHasRating, tags})

            if (tags && tagHasRating) {
                try {
                    sanitisedTags = sanitizeTags(tags)
                    console.log('[HOWL_CREATE] Tags sanitized successfully', {
                        original_tags: tags,
                        sanitised_tags: sanitisedTags,
                    })
                } catch (error) {
                    console.log('[HOWL_CREATE] Tag sanitization failed', {error, tags})
                    set.status = 400
                    throw error
                }

                // Check if only one rating tag is present
                const ratingTags = sanitisedTags.filter((tag) => ['rating_safe', 'rating_mature', 'rating_suggestive', 'rating_explicit'].indexOf(tag) > -1)
                const tagOnlyHasOneRating = ratingTags.length === 1

                console.log('[HOWL_CREATE] Rating tag count validation', {
                    rating_tags: ratingTags,
                    count: ratingTags.length,
                    valid: tagOnlyHasOneRating,
                })

                if (!tagOnlyHasOneRating) {
                    console.log('[HOWL_CREATE] Validation failed: conflicting rating tags', {rating_tags: ratingTags})
                    set.status = 400
                    throw HTTPError.badRequest({
                        summary: 'Rating tag is conflicting.',
                    })
                }
            } else {
                console.log('[HOWL_CREATE] Validation failed: missing rating tags', {tags, tagHasRating})
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
                console.log('[HOWL_CREATE] Upload failure handler triggered', {error})
                throw HTTPError.badRequest({
                    ...error,
                    summary: error.message || 'Upload failed',
                })
            }

            // Generate UUID
            const uuid = randomUUID()
            console.log('[HOWL_CREATE] Generated UUID for howl', {uuid})

            // @TODO move this into a utils function
            if (asset_ids && asset_ids.length > 0) {
                console.log('[HOWL_CREATE] Starting asset upload process', {
                    asset_ids,
                    count: asset_ids.length,
                })
                const UPLOAD_ROOT = path.join(process.cwd(), 'temp', 'uploads', 'pending')
                const uploadedS3Paths: string[] = []

                try {
                    for (const assetId of asset_ids) {
                        console.log('[HOWL_CREATE] Processing asset', {
                            assetId,
                            index: i,
                            total: asset_ids.length,
                        })
                        const jsonPath = path.join(UPLOAD_ROOT, `${assetId}.json`)
                        const binPath = path.join(UPLOAD_ROOT, `${assetId}.bin`)

                        if (!existsSync(jsonPath)) {
                            console.log('[HOWL_CREATE] Asset metadata not found', {assetId, jsonPath})
                            throw new Error(`Asset ID ${assetId} not found`)
                        }

                        const meta = JSON.parse(await readFile(jsonPath, 'utf-8'))
                        console.log('[HOWL_CREATE] Asset metadata loaded', {
                            assetId,
                            meta: {
                                user_id: meta.user_id,
                                state: meta.state,
                                asset_type: meta.asset_type,
                                total_bytes: meta.total_bytes,
                                expires: meta.expires,
                            },
                        })

                        if (meta.user_id !== user.sub) {
                            console.log('[HOWL_CREATE] Asset authorization failed', {
                                assetId,
                                expected_user_id: user.sub,
                                actual_user_id: meta.user_id,
                            })
                            await handleUploadFailure({message: `Asset ID ${assetId} unauthorized`})
                        }
                        if (meta.state !== 'succeeded') {
                            console.log('[HOWL_CREATE] Asset not finalized', {
                                assetId,
                                state: meta.state,
                            })
                            await handleUploadFailure({message: `Asset ID ${assetId} not finalized`})
                        }
                        if (meta.expires && Date.now() > meta.expires) {
                            console.log('[HOWL_CREATE] Asset expired', {
                                assetId,
                                expires: meta.expires,
                                current_time: Date.now(),
                            })
                            await handleUploadFailure({message: `Asset ID ${assetId} has expired`})
                        }

                        let processingPath = binPath
                        let contentType = meta.asset_type
                        let isVideo = meta.asset_type === 'video/webm' || meta.asset_type.startsWith('video/')

                        console.log('[HOWL_CREATE] Starting S3 upload', {
                            assetId,
                            contentType,
                            isVideo,
                            size: meta.total_bytes,
                        })

                        const stream = createReadStream(processingPath)
                        const upload = await uploadFileStream(process.env.S3_PROFILES_BUCKET!, `${user.sub}/${uuid}/${i}.{ext}`, stream, contentType, meta.total_bytes)
                        stream.destroy() // Clean up stream

                        if (upload.error) {
                            console.log('[HOWL_CREATE] S3 upload failed', {
                                assetId,
                                error: upload.error,
                            })
                            throw upload.error
                        }

                        console.log('[HOWL_CREATE] S3 upload succeeded', {
                            assetId,
                            s3_path: upload.data.path,
                            index: i,
                        })

                        uploadedS3Paths.push(upload.data.path)
                        uploadedAssets.push({
                            type: isVideo ? 'video' : 'image',
                            data: {
                                url: upload.data.path,
                                name: `${i}`,
                            },
                        })
                        i++

                        console.log('[HOWL_CREATE] Cleaning up temporary files', {
                            assetId,
                            jsonPath,
                            binPath,
                        })
                        await unlink(jsonPath).catch((err) => {
                            console.log('[HOWL_CREATE] Failed to delete JSON metadata', {assetId, error: err})
                        })
                        await unlink(binPath).catch((err) => {
                            console.log('[HOWL_CREATE] Failed to delete binary file', {assetId, error: err})
                        })

                        console.log('[HOWL_CREATE] Asset upload complete', {
                            assetId,
                            s3_path: upload.data.path,
                        })
                    }
                    console.log('[HOWL_CREATE] All assets uploaded successfully', {
                        count: uploadedAssets.length,
                        paths: uploadedS3Paths,
                    })
                } catch (error) {
                    console.log('[HOWL_CREATE] Asset upload error, starting cleanup', {
                        error,
                        uploaded_count: uploadedS3Paths.length,
                        paths_to_cleanup: uploadedS3Paths,
                    })
                    // Cleanup uploaded S3 files
                    const storage = createStorage(process.env.S3_PROFILES_BUCKET!)
                    for (const s3Path of uploadedS3Paths) {
                        console.log('[HOWL_CREATE] Deleting S3 file', {s3_path: s3Path})
                        await storage.deleteFile(user.sub, s3Path.replace(`${user.sub}/`, ''))
                    }
                    console.log('[HOWL_CREATE] S3 cleanup completed')
                    await handleUploadFailure(error)
                }
            }

            console.log('[HOWL_CREATE] Triggering HOWL_CREATE event', {
                uuid,
                tenant_id,
                channel_id,
                content_type,
                user_id: user.sub,
                tags_count: sanitisedTags.length,
                assets_count: uploadedAssets.length,
            })
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
                console.log('[HOWL_CREATE] Creating post in database', {post_id: uuid})
                data = await prisma.posts.create({data: dbCreate})
                console.log('[HOWL_CREATE] Post created successfully', {post_id: data.id})
            } catch (error) {
                console.log('[HOWL_CREATE] Database creation failed', {error, uuid})
                throw HTTPError.fromError(error)
            }

            // Set profile r18 status if necessary
            if (sanitisedTags.includes('rating_suggestive') || sanitisedTags.includes('rating_explicit')) {
                console.log('[HOWL_CREATE] Updating user R18 status', {
                    user_id: user.sub,
                    tags: sanitisedTags.filter(t => t.startsWith('rating_')),
                })
                await prisma.profiles.update({
                    where: {id: user.sub},
                    data: {is_r18: true},
                })
                console.log('[HOWL_CREATE] User R18 status updated')
            }

            console.log('[HOWL_CREATE] Clearing query caches', {
                tenant_id: dbCreate.tenant_id,
                channel_id: dbCreate.channel_id,
                user_id: dbCreate.user_id,
            })
            clearQueryCache(`~${dbCreate.tenant_id}`)
            clearQueryCache(`~${dbCreate.channel_id}`)
            clearQueryCache(`~${dbCreate.user_id}`)

            console.log('[HOWL_CREATE] Updating home feed cache')
            let updatedFeedCount = 0
            FeedController.homeFeedCache.forEach((value, key) => {
                if (key.includes(user.sub)) {
                    // Soft update
                    const {data: post} = value
                    post.unshift(data)
                    value.data = post
                    FeedController.homeFeedCache.set(key, value)
                    updatedFeedCount++
                }
            })
            console.log('[HOWL_CREATE] Home feed cache updated', {updated_count: updatedFeedCount})

            console.log('[HOWL_CREATE] Howl creation completed successfully', {
                post_id: data.id,
                user_id: user.sub,
                tenant_id,
                channel_id,
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
