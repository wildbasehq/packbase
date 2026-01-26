import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import {ErrorTypebox} from '@/utils/errors'
import {t} from 'elysia'

export default (app: YapockType) =>
    app.get(
        '',
        async ({set, user}) => {
            let data
            try {
                // Fetch all packs with related data in one query
                data = await prisma.packs.findMany({
                    orderBy: {last_activity_at: 'desc'},
                    include: {
                        memberships: user?.sub
                            ? {
                                where: {user_id: user.sub},
                                take: 1,
                            }
                            : false,
                        _count: {
                            select: {memberships: true},
                        },
                    },
                })
            } catch (selectError) {
                set.status = 500
                throw HTTPError.fromError(selectError)
            }

            if (!data) {
                return {
                    has_more: false,
                    packs: [],
                    hidden: 0,
                }
            }

            let packs = []
            let hidden = 0

            for (let pack of data) {
                const hasMembership = pack.memberships && pack.memberships.length > 0

                if (!hasMembership) {
                    // Transform pack data to match expected format
                    const transformedPack = {
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
                        statistics: {
                            members: pack._count.memberships,
                            heartbeat: -1, // Skip heartbeat calculation for list view
                        },
                    }

                    packs.push(transformedPack)
                } else {
                    hidden++
                }
            }

            return {
                has_more: false,
                packs,
                hidden,
            }
        },
        {
            query: t.Optional(
                t.Object({
                    search: t.Optional(t.String()),
                }),
            ),
            detail: {
                description: 'Get a list of packs.',
                tags: ['Pack'],
            },
            response: {
                200: t.Object({
                    has_more: t.Boolean(),
                    // packs: t.Array(
                    //     t.Union([
                    //         PackResponse,
                    //         t.Object({
                    //             id: t.Literal('00000000-0000-0000-0000-000000000000'),
                    //             display_name: t.String({
                    //                 default: 'Universe',
                    //             }),
                    //             slug: t.Literal('universe'),
                    //         }),
                    //     ]),
                    // ),
                    packs: t.Array(t.Any()),
                    hidden: t.Number(),
                }),
                500: ErrorTypebox,
            },
        },
    );
