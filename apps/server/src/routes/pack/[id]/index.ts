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

    // Check cache with correct expiration logic
    let cached = PackCache.get(id)
    if (cached && cached.expires_after > Date.now()) {
        const {expires_after, ...packData} = cached
        return convertBigIntsToNumbers(packData)
    }

    const isIDUUID = RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).exec(id)

    if (!id) return null

    // Single optimized query with all related data
    const pack = await prisma.packs.findUnique({
        where: isIDUUID ? {id} : {slug: id},
        include: {
            memberships: userId ? {
                where: {user_id: userId},
                take: 1,
            } : false,
            pages: {
                orderBy: {order: 'asc'},
            },
            _count: {
                select: {memberships: true},
            },
        },
    })

    if (!pack) return null

    // Transform pack data
    const transformedPack: any = {
        id: pack.id,
        display_name: pack.display_name,
        slug: pack.slug,
        about: {
            bio: pack.description,
        },
        images: {
            avatar: pack.images_avatar,
            header: pack.images_header,
        },
        created_at: pack.created_at.toString(),
    }

    if (scope !== 'basic') {
        // Add membership if exists
        const currentUserMembership = pack.memberships.find(
            (m) => m.user_id === userId
        );

        if (currentUserMembership) transformedPack.membership = currentUserMembership

        // Parallel execution of independent operations
        const [heartbeat] = await Promise.all([
            packCalculateHeartbeat(pack.id),
        ])

        transformedPack.statistics = {
            members: pack._count?.memberships || -1,
            heartbeat,
        }

        // Process pages with parallel ticker queries
        if (pack.pages) {
            const yesterdayISOString = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()

            const tickerPromises = pack.pages.map(async (page: any) => {
                if (page.ticker) {
                    try {
                        const posts = await prisma.posts.findFirst({
                            where: {
                                body: {not: null},
                                channel_id: page.id,
                                created_at: {gte: yesterdayISOString},
                            },
                            orderBy: {created_at: 'desc'},
                            select: {body: true},
                        })

                        return posts ? posts.body
                            .replace(/<[^>]+>/g, '')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .slice(0, 100) : null
                    } catch {
                        return null
                    }
                }
                return page.ticker
            })

            const tickerResults = await Promise.all(tickerPromises)

            transformedPack.pages = pack.pages.map((page: any, index: number) => ({
                ...page,
                created_at: page.created_at.toString(),
                order: page.order || 0,
                ticker: tickerResults[index],
            }))
        }
    }

    // Convert any BigInt values before sending to Posthog and returning
    const safePackForJSON = convertBigIntsToNumbers(transformedPack)

    posthog.capture({
        distinctId,
        event: 'Viewed Pack',
        properties: {
            fetch_time: new Date().getTime() - timer,
            pack: safePackForJSON,
        },
    })

    // Cache for 5 minutes
    PackCache.set(pack.id, {...safePackForJSON, expires_after: Date.now() + 1000 * 60 * 5})

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
