import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import {t} from 'elysia'
import {getPack} from './index'

export default (app: YapockType) =>
    app.get(
        '',
        async ({params, set}) => {
            // Get pack by ID or slug
            const pack = await getPack(params.id)

            if (!pack) {
                set.status = 404
                throw HTTPError.notFound({
                    summary: 'Pack not found.',
                })
            }

            // Find the active theme for the pack
            const themeData = await prisma.pack_themes.findFirst({
                where: {
                    pack_id: pack.id,
                    is_active: true,
                },
            })

            if (!themeData) {
                set.status = 404
                throw HTTPError.notFound({
                    summary: 'No active theme found for this pack.',
                })
            }

            return themeData
        },
        {
            params: t.Object({
                id: t.String({
                    description: 'ID or slug of the pack to get the theme for.',
                }),
            }),
            detail: {
                description: 'Get the active theme for a specific pack.',
                tags: ['Pack', 'Themes'],
            }
        },
    );
