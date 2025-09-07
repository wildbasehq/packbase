import { YapockType } from '@/index';
import { t } from 'elysia';
import { HTTPError } from '@/lib/HTTPError';
import { PackTheme } from '@/models/pack-themes.model';
import prisma from '@/db/prisma';
import { getPack } from './index';

export default (app: YapockType) =>
    app.get(
        '',
        async ({ params, set }) => {
            // Get pack by ID or slug
            const pack = await getPack(params.id);

            if (!pack) {
                set.status = 404;
                throw HTTPError.notFound({
                    summary: 'Pack not found.',
                });
            }

            // Find the active theme for the pack
            try {
                const themeData = await prisma.pack_themes.findFirst({
                    where: {
                        pack_id: pack.id,
                        is_active: true,
                    },
                });

                if (!themeData) {
                    set.status = 404;
                    throw HTTPError.notFound({
                        summary: 'No active theme found for this pack.',
                    });
                }

                return themeData;
            } catch (error: any) {
                // For errors, return a 500
                set.status = 500;
                throw HTTPError.serverError({
                    summary: 'Failed to fetch pack theme.',
                    detail: error.message,
                });
            }
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
            },
            response: {
                200: PackTheme,
                404: t.Undefined(),
                500: t.Undefined(),
            },
        },
    );
