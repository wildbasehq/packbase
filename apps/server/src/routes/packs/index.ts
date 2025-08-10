import {t} from 'elysia'
import {YapockType} from '@/index'
import {getPack} from '@/routes/pack/[id]'
import {ErrorTypebox} from '@/utils/errors'
import {PackResponse} from '@/models/defs'
import {HTTPError} from '@/lib/class/HTTPError'
import prisma from '@/db/prisma'

export default (app: YapockType) => app
    .get('', async ({params, set, user, error}) => {
        let data;
        try {
            data = await prisma.packs.findMany({
                select: { id: true }
            });
        } catch (selectError) {
            set.status = 500
            throw HTTPError.fromError(selectError)
        }

        if (!data) {
            return {
                has_more: false,
                packs: [],
                hidden: 0
            }
        }

        let packs = []
        let hidden = 0
        for (let packID of data) {
            const pack = await getPack(packID.id, undefined, user?.sub)
            if (pack) {
                if (!pack.membership) {
                    // @ts-ignore - fails on SDK
                    packs.push(pack)
                } else {
                    hidden++
                }
            }
        }

        return {
            has_more: false,
            packs,
            hidden
        }
    }, {
        query: t.Optional(
            t.Object({
                search: t.String(),
            }),
        ),
        detail: {
            description: 'Get a list of packs.',
            tags: ['Pack'],
        },
        response: {
            200: t.Object({
                has_more: t.Boolean(),
                packs: t.Array(t.Union([PackResponse, t.Object({
                    id: t.Literal('00000000-0000-0000-0000-000000000000'),
                    display_name: t.String({
                        default: 'Universe',
                    }),
                    slug: t.Literal('universe'),
                })])),
                hidden: t.Number(),
            }),
            500: ErrorTypebox
        }
    })
