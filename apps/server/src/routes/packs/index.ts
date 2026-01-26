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
            let userMemberships: Set<string> = new Set()

            try {
                // Fetch all packs sorted by image priority using database view
                const packsData = await prisma.packs_sorted.findMany()

                // If user is logged in, fetch their memberships
                if (user?.sub) {
                    const memberships = await prisma.packs_memberships.findMany({
                        where: {user_id: user.sub},
                        select: {tenant_id: true},
                    })
                    memberships.forEach((m) => userMemberships.add(m.tenant_id))
                }

                data = packsData
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
                const hasMembership = userMemberships.has(pack.id)

                if (hasMembership) {
                    hidden++
                } else {
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
                            members: Number(pack.member_count),
                            heartbeat: -1, // Skip heartbeat calculation for list view
                        },
                    }

                    packs.push(transformedPack)
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
