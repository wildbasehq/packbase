import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import validateThemeContent from '@/lib/themes/validateThemeContent'
import {CreatePackTheme, PackTheme, PackThemesList} from '@/models/pack-themes.model'
import {t} from 'elysia'
import prisma from '@/db/prisma'
import PackMan from '@/lib/packs/PackMan'

export default (app: YapockType) =>
    app
        // Get all themes for a specific pack (owner only)
        .get(
            '',
            async ({set, user, params}) => {
                if (!user) {
                    set.status = 401
                    throw HTTPError.unauthorized({
                        summary: 'You must be logged in to access pack themes.',
                    })
                }

                // Verify pack exists and user is owner
                if (!(await PackMan.hasPermission(user.sub, params.id, PackMan.PERMISSIONS.ManagePack))) return HTTPError.forbidden({
                    summary: 'Missing permission'
                })

                try {
                    return await prisma.pack_themes.findMany({
                        where: {
                            pack_id: params.id,
                        },
                        orderBy: {
                            created_at: 'desc',
                        },
                    })
                } catch (error: any) {
                    set.status = 500
                    throw HTTPError.serverError({
                        summary: 'Failed to fetch pack themes.',
                        detail: error.message,
                    })
                }
            },
            {
                params: t.Object({
                    id: t.String(),
                }),
                detail: {
                    description: 'Get all themes for a specific pack (owner only).',
                    tags: ['Pack', 'Themes'],
                },
                response: {
                    200: PackThemesList,
                    401: t.Undefined(),
                    403: t.Undefined(),
                    404: t.Undefined(),
                    500: t.Undefined(),
                },
            },
        )
        // Create a new theme for a pack (owner only)
        .post(
            '',
            async ({set, body, user, params}) => {
                if (!user) {
                    set.status = 401
                    throw HTTPError.unauthorized({
                        summary: 'You must be logged in to create a pack theme.',
                    })
                }

                // Verify pack exists and user is owner
                if (!(await PackMan.hasPermission(user.sub, params.id, PackMan.PERMISSIONS.ManagePack))) return HTTPError.forbidden({
                    summary: 'Missing permission'
                })

                // Validate and sanitize HTML and CSS
                const {html: sanitizedHTML, css: sanitizedCSS} = validateThemeContent({
                    html: body.html,
                    css: body.css,
                })

                let data
                try {
                    data = await prisma.pack_themes.create({
                        data: {
                            pack_id: params.id,
                            name: body.name,
                            html: sanitizedHTML,
                            css: sanitizedCSS,
                            is_active: body.is_active || false,
                        },
                    })
                } catch (error: any) {
                    set.status = 500
                    throw HTTPError.serverError({
                        summary: 'Failed to create pack theme.',
                        detail: error.message,
                    })
                }

                // If this theme is set as active, deactivate all other themes for this pack
                if (data.is_active) {
                    try {
                        await prisma.pack_themes.updateMany({
                            where: {
                                pack_id: params.id,
                                id: {not: data.id},
                            },
                            data: {
                                is_active: false,
                            },
                        })
                    } catch (error) {
                        // If there's an error deactivating other themes, we'll just continue
                        console.error('Failed to deactivate other pack themes:', error)
                    }
                }

                return data
            },
            {
                params: t.Object({
                    id: t.String(),
                }),
                detail: {
                    description: 'Create a new theme for a pack (owner only).',
                    tags: ['Pack', 'Themes'],
                },
                body: CreatePackTheme,
                response: {
                    200: PackTheme,
                    400: t.Undefined(),
                    401: t.Undefined(),
                    403: t.Undefined(),
                    404: t.Undefined(),
                    500: t.Undefined(),
                },
            },
        );
