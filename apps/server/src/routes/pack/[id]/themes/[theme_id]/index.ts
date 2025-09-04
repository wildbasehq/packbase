import { YapockType } from '@/index'
import { HTTPError } from '@/lib/class/HTTPError'
import validateThemeContent from '@/lib/themes/validateThemeContent'
import { PackTheme, UpdatePackTheme } from '@/models/pack-themes.model'
import { t } from 'elysia'
import prisma from '@/db/prisma'
import { pack } from '@/lib/packs/permissions'

export default (app: YapockType) =>
    app
        // Update an existing pack theme (owner only)
        .put(
            '',
            async ({ set, params, body, user }) => {
                if (!user) {
                    set.status = 401
                    throw HTTPError.unauthorized({
                        summary: 'You must be logged in to update a pack theme.',
                    })
                }

                // Verify pack exists and user is owner
                await pack.requiresOwnership({ set, user, id: params.id })

                // Check if the theme exists and belongs to the pack
                const existingTheme = await prisma.pack_themes.findFirst({
                    where: {
                        id: params.theme_id,
                        pack_id: params.id
                    }
                })

                if (!existingTheme) {
                    set.status = 404
                    throw HTTPError.notFound({
                        summary: 'Pack theme not found.',
                    })
                }

                // Validate and sanitize HTML and CSS if provided
                let sanitizedHTML = existingTheme.html
                let sanitizedCSS = existingTheme.css

                if (body.html || body.css) {
                    const validatedContent = validateThemeContent({
                        html: body.html || existingTheme.html,
                        css: body.css || existingTheme.css
                    })

                    if (body.html) sanitizedHTML = validatedContent.html
                    if (body.css) sanitizedCSS = validatedContent.css
                }

                const updateData = {
                    ...(body.name && { name: body.name }),
                    ...(body.html && { html: sanitizedHTML }),
                    ...(body.css && { css: sanitizedCSS }),
                    ...(body.is_active !== undefined && { is_active: body.is_active }),
                    updated_at: new Date()
                }

                try {
                    const data = await prisma.pack_themes.update({
                        where: {
                            id: params.theme_id,
                        },
                        data: updateData
                    })

                    // If this theme is set as active, deactivate all other themes for this pack
                    if (data.is_active) {
                        await prisma.pack_themes.updateMany({
                            where: {
                                pack_id: params.id,
                                id: {
                                    not: data.id
                                }
                            },
                            data: {
                                is_active: false
                            }
                        })
                    }

                    return data
                } catch (error: any) {
                    set.status = 500
                    throw HTTPError.serverError({
                        summary: 'Failed to update pack theme.',
                        detail: error.message
                    })
                }
            },
            {
                detail: {
                    description: 'Update an existing pack theme (owner only).',
                    tags: ['Pack', 'Themes'],
                },
                params: t.Object({
                    id: t.String(),
                    theme_id: t.String()
                }),
                body: UpdatePackTheme,
                response: {
                    200: PackTheme,
                    400: t.Undefined(),
                    401: t.Undefined(),
                    403: t.Undefined(),
                    404: t.Undefined(),
                    500: t.Undefined()
                }
            },
        )
        // Delete a pack theme (owner only)
        .delete(
            '',
            async ({ set, params, user }) => {
                if (!user) {
                    set.status = 401
                    throw HTTPError.unauthorized({
                        summary: 'You must be logged in to delete a pack theme.',
                    })
                }

                // Verify pack exists and user is owner
                await pack.requiresOwnership({ set, user, id: params.id })

                // Check if the theme exists and belongs to the pack
                const existingTheme = await prisma.pack_themes.findFirst({
                    where: {
                        id: params.theme_id,
                        pack_id: params.id
                    }
                })

                if (!existingTheme) {
                    set.status = 404
                    throw HTTPError.notFound({
                        summary: 'Pack theme not found.',
                    })
                }

                try {
                    await prisma.pack_themes.delete({
                        where: {
                            id: params.theme_id,
                        }
                    })
                } catch (error: any) {
                    set.status = 500
                    throw HTTPError.serverError({
                        summary: 'Failed to delete pack theme.',
                        detail: error.message
                    })
                }

                return { success: true }
            },
            {
                detail: {
                    description: 'Delete a pack theme (owner only).',
                    tags: ['Pack', 'Themes'],
                },
                params: t.Object({
                    id: t.String(),
                    theme_id: t.String()
                }),
                response: {
                    200: t.Object({
                        success: t.Boolean()
                    }),
                    401: t.Undefined(),
                    403: t.Undefined(),
                    404: t.Undefined(),
                    500: t.Undefined()
                }
            },
        );