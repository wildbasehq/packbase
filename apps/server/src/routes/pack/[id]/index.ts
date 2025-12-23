import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import packCalculateHeartbeat from '@/lib/packs/calculate-heartbeat'
import PackMan from '@/lib/packs/PackMan'
import {PackEditBody, PackResponse} from '@/models/defs'
import requiresAccount from '@/utils/identity/requires-account'
import posthog, {distinctId} from '@/utils/posthog'
import uploadFile from '@/utils/upload-file'
import {t} from 'elysia'

export const PackCache = new Map<string, any>()
export const PackMembershipCache = new Map<string, any>()

export default (app: YapockType) =>
    app
        .get(
            '',
            async ({params: {id, scope}, user}) => {
                const pack = await getPack(id, scope, user?.sub)
                if (!pack)
                    throw HTTPError.notFound({
                        summary: 'Pack not found',
                    })
                return pack
            },
            {
                query: t.Optional(
                    t.Object({
                        scope: t.Optional(t.String()),
                    }),
                ),
                detail: {
                    description: 'Get a specific pack.',
                    tags: ['Pack'],
                },
                response: {
                    200: PackResponse,
                    404: t.Optional(t.Any()),
                },
            },
        )
        // Edit
        .post(
            '',
            async ({params: {id}, set, user, body}) => {
                await requiresAccount({set, user})

                if (!(await PackMan.hasPermission(user.sub, id, PackMan.PERMISSIONS.ManagePack))) {
                    set.status = 403
                    throw HTTPError.forbidden({
                        summary: 'You do not have permission to manage this pack',
                    })
                }

                const newBody: {
                    [key: string]: any;
                } = {...body}

                for (let key in newBody) {
                    if (newBody[key] === null) {
                        delete newBody[key]
                    }
                }

                let {display_name, slug, about, images} = body

                let data
                try {
                    data = await prisma.packs.update({
                        where: {id},
                        data: {
                            display_name,
                            slug,
                            description: about?.bio,
                        },
                    })
                } catch (error: any) {
                    if (error.code === 'P2002') {
                        // Prisma unique constraint violation error code
                        set.status = 409
                        throw HTTPError.conflict({
                            summary: 'A pack with that slug already exists, or is reserved.',
                        })
                    }

                    throw HTTPError.fromError(error)
                }

                if (images) {
                    if (images.avatar) {
                        const upload = await uploadFile(process.env.S3_PACKS_BUCKET, `${id}/avatar.{ext}`, images.avatar, true)
                        if (upload.error) {
                            throw HTTPError.fromError(upload.error)
                        }

                        try {
                            await prisma.packs.update({
                                where: {id},
                                data: {
                                    images_avatar: `${process.env.PACKS_CDN_URL_PREFIX}/${upload.data.path}?updated=${Date.now()}`,
                                },
                            })
                        } catch (error) {
                            throw HTTPError.fromError(error)
                        }
                    }

                    if (images.header) {
                        const upload = await uploadFile(process.env.S3_PACKS_BUCKET, `${id}/header.{ext}`, images.header, true)
                        if (upload.error) {
                            throw HTTPError.fromError(upload.error)
                        }

                        try {
                            await prisma.packs.update({
                                where: {id},
                                data: {
                                    images_header: `${process.env.PACKS_CDN_URL_PREFIX}/${upload.data.path}?updated=${Date.now()}`,
                                },
                            })
                        } catch (error) {
                            throw HTTPError.fromError(error)
                        }
                    }
                }

                PackCache.delete(id)

                return data
            },
            {
                body: PackEditBody,
                detail: {
                    description: 'Edit a specific pack.',
                    tags: ['Pack'],
                },
            },
        );

// Helper function to convert BigInt values to numbers for JSON serialization
function convertBigIntsToNumbers(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj
    }

    if (typeof obj === 'bigint') {
        return Number(obj)
    }

    if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            return obj.map((item) => convertBigIntsToNumbers(item))
        }

        const result: Record<string, any> = {}
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = convertBigIntsToNumbers(obj[key])
            }
        }
        return result
    }

    return obj
}

export async function getPack(id: string, scope?: string, userId?: string) {
    const timer = new Date().getTime()
    let cached = PackCache.get(id)
    if (cached && cached.expires_after < Date.now()) {
        PackCache.delete(id)
        cached = undefined
    }

    const isIDUUID = RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).exec(id)

    if (!id) return null

    let pack
    if (isIDUUID) {
        pack = cached || (await prisma.packs.findUnique({where: {id}}))
    } else {
        pack = cached || (await prisma.packs.findUnique({where: {slug: id}}))
    }

    if (!pack) return null

    // Cache for 5 minutes
    PackCache.set(pack.id, {...pack, expires_after: Date.now() + 1000 * 60 * 5})

    pack.about = {
        bio: pack.description,
    }
    delete pack.description

    pack.created_at = pack.created_at.toString()

    pack.images = {
        avatar: pack.images_avatar,
        header: pack.images_header,
    }
    delete pack.images_avatar
    delete pack.images_header

    if (scope !== 'basic') {
        if (userId) {
            const membership = await getPackMembership(pack.id, userId)
            if (membership) {
                pack.membership = membership
            }
        }

        // Count all members
        const membersCount = await prisma.packs_memberships.count({
            where: {tenant_id: pack.id},
        })

        pack.statistics = {
            members: membersCount || -1,
            heartbeat: await packCalculateHeartbeat(pack.id),
        }

        // Get custom pages
        const pages = await prisma.packs_pages.findMany({
            where: {tenant_id: pack.id},
            orderBy: {order: 'asc'},
        })
        if (pages) {
            pack.pages = pages

            for (const page of pack.pages) {
                page.created_at = page.created_at.toString()
                page.order = page.order || 0

                if (page.ticker) {
                    console.log('Ticker:', page.ticker)
                    // ticker is ID of feed. Get first post within the last 24 hours in the feed
                    const now = new Date()
                    const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24)

                    // Convert date to ISO string for Prisma comparison
                    const yesterdayISOString = yesterday.toISOString()

                    // For now, just get anything from the last 24 hours
                    // Note: Removed the 'gt' filter on body as it might not be working as expected
                    try {
                        const posts = await prisma.posts.findMany({
                            where: {
                                // Use appropriate string comparison for body (if needed)
                                body: {
                                    not: null,
                                },
                                channel_id: page.id,
                                created_at: {gte: yesterdayISOString}, // Use ISO string format for date comparison
                            },
                            orderBy: {
                                created_at: 'desc',
                            },
                            take: 1,
                        })

                        // replace page.ticker with the first post content, stripped of markdown. if no posts, set to null
                        if (posts && posts.length > 0) {
                            const post = posts[0]
                            page.ticker = post.body
                                .replace(/<[^>]+>/g, '')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
                                .slice(0, 100)
                        } else {
                            page.ticker = null
                        }
                    } catch (error) {
                        page.ticker = null
                    }
                }
            }
        }
    }

    // Convert any BigInt values before sending to Posthog and returning
    const safePackForJSON = convertBigIntsToNumbers(pack)

    posthog.capture({
        distinctId,
        event: 'Viewed Pack',
        properties: {
            fetch_time: new Date().getTime() - timer,
            pack: safePackForJSON,
        },
    })

    return safePackForJSON
}

export async function getPackMembership(packId: string, userId: string) {
    const timer = new Date().getTime()
    let cached: { expires_after: number; [k: string]: any } | undefined
    PackMembershipCache.forEach((v) => {
        if (v.tenant_id === packId && v.user_id === userId) {
            cached = v
        }
    })

    if (cached) {
        if (cached.expires_after < Date.now()) {
            PackMembershipCache.delete(cached.id)
        } else {
            const {expires_after, ...membership} = cached

            posthog.capture({
                distinctId,
                event: 'Viewed Pack Membership',
                properties: {
                    cached: true,
                    fetch_time: new Date().getTime() - timer,
                    membership,
                },
            })

            return membership
        }
    }

    let membership
    try {
        const memberships = await prisma.packs_memberships.findMany({
            where: {
                tenant_id: packId,
                user_id: userId,
            },
        })
        membership = memberships[0]
    } catch (error) {
        return null
    }
    if (!membership) return null

    // Cache for 5 minutes
    PackMembershipCache.set(membership.id, {...membership, expires_after: Date.now() + 1000 * 60 * 5})

    posthog.capture({
        distinctId,
        event: 'Viewed Pack Membership',
        properties: {
            fetch_time: new Date().getTime() - timer,
            membership,
        },
    })
    return membership
}
