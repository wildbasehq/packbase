import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {createHowlJob, enqueueHowlJob, getHowlJobStatus} from '@/lib/howl-job-queue'
import {HTTPError} from '@/lib/http-error'
import {HowlBody} from '@/models/defs'
import requiresAccount from '@/utils/identity/requires-account'
import sanitizeTags from '@/utils/sanitize-tags'
import {randomUUID} from 'crypto'
import {t} from 'elysia'
import {existsSync} from 'fs'
import {readFile} from 'fs/promises'
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

            if (asset_ids?.length! > 100) {
                console.log('[HOWL_CREATE] Validation failed: too many assets', {asset_count: asset_ids?.length})
                set.status = 400
                throw HTTPError.badRequest({
                    summary: 'You can only upload up to 100 assets.',
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

            // Validate assets exist before creating job
            const UPLOAD_ROOT = path.join(process.cwd(), 'temp', 'uploads', 'pending')

            if (asset_ids && asset_ids.length > 0) {
                console.log('[HOWL_CREATE] Validating assets exist', {
                    asset_ids,
                    count: asset_ids.length,
                })

                for (const assetId of asset_ids) {
                    const jsonPath = path.join(UPLOAD_ROOT, `${assetId}.json`)

                    if (!existsSync(jsonPath)) {
                        console.log('[HOWL_CREATE] Asset not found', {assetId, jsonPath})
                        set.status = 400
                        throw HTTPError.badRequest({
                            summary: `Asset ID ${assetId} not found`,
                        })
                    }

                    const meta = JSON.parse(await readFile(jsonPath, 'utf-8'))

                    if (meta.user_id !== user.sub) {
                        console.log('[HOWL_CREATE] Asset unauthorized', {assetId, expected: user.sub, actual: meta.user_id})
                        set.status = 403
                        throw HTTPError.badRequest({
                            summary: `Asset ID ${assetId} unauthorized`,
                        })
                    }

                    if (meta.state !== 'succeeded') {
                        console.log('[HOWL_CREATE] Asset not finalized', {assetId, state: meta.state})
                        set.status = 400
                        throw HTTPError.badRequest({
                            summary: `Asset ID ${assetId} not finalized`,
                        })
                    }

                    if (meta.expires && Date.now() > meta.expires) {
                        console.log('[HOWL_CREATE] Asset expired', {assetId, expires: meta.expires})
                        set.status = 400
                        throw HTTPError.badRequest({
                            summary: `Asset ID ${assetId} has expired`,
                        })
                    }
                }

                console.log('[HOWL_CREATE] All assets validated successfully')
            }

            // Generate UUID for the howl
            const uuid = randomUUID()
            console.log('[HOWL_CREATE] Generated UUID for howl', {uuid})

            // Create job and enqueue for background processing
            createHowlJob({
                id: uuid,
                userId: user.sub,
                tenantId: tenant_id,
                channelId: channel_id,
                contentType: content_type,
                body,
                tags: sanitisedTags,
                assetIds: asset_ids || [],
            })

            // Start background processing (non-blocking)
            enqueueHowlJob(uuid)

            console.log('[HOWL_CREATE] Howl job enqueued, returning ID immediately', {
                howl_id: uuid,
                user_id: user.sub,
                tenant_id,
                channel_id,
                asset_count: asset_ids?.length || 0,
            })

            // Return immediately with the howl ID
            // Client should poll /status/:id to track progress
            return {
                id: uuid,
            }
        },
        {
            detail: {
                description: 'Creates a new howl (async - returns ID immediately, poll /status/:id for progress)',
                tags: ['Howl'],
            },
            body: HowlBody,
            response: {
                200: t.Object({
                    id: t.String(),
                }),
            },
        },
    )
        /**
         * Get status of howl creation job
         * @returns Current job status including progress and any errors
         */
        .get('/status/:id', async ({params, set}) => {
            const status = getHowlJobStatus(params.id)

            if (!status) {
                // Check if the howl exists in the database (already completed and job cleaned up)
                const existingPost = await prisma.posts.findUnique({
                    where: {id: params.id},
                    select: {id: true},
                })

                if (existingPost) {
                    return {
                        id: params.id,
                        status: 'completed' as const,
                        progress: {
                            currentAsset: 0,
                            totalAssets: 0,
                        },
                        createdAt: 0,
                        updatedAt: 0,
                    }
                }

                set.status = 404
                throw HTTPError.notFound({
                    summary: 'Job not found',
                })
            }

            return status
        }, {
            detail: {
                description: 'Get creation status for a specific howl',
                tags: ['Howl'],
            },
            params: t.Object({
                id: t.String({
                    description: 'Howl ID',
                }),
            }),
        })
