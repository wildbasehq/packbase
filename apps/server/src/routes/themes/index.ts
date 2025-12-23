import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import validateThemeContent from '@/lib/themes/validateThemeContent'
import {Theme, ThemesList} from '@/models/themes.model'
import requiresAccount from '@/utils/identity/requires-account'
import {t} from 'elysia'

export default (app: YapockType) =>
    app
        // Get all themes for the current user
        .get(
            '',
            async ({set, user}) => {
                await requiresAccount({set, user})

                try {
                    return await prisma.user_themes.findMany({
                        where: {
                            user_id: user.sub,
                        },
                    })
                } catch (error: any) {
                    set.status = 500
                    throw HTTPError.serverError({
                        summary: 'Failed to fetch themes.',
                        detail: error.message,
                    })
                }
            },
            {
                detail: {
                    description: 'Get all themes for the current user.',
                    tags: ['Themes'],
                },
                response: {
                    200: ThemesList,
                    401: t.Undefined(),
                    500: t.Undefined(),
                },
            },
        )
        // Create a new theme
        .post(
            '',
            async ({set, body, user}) => {
                await requiresAccount({set, user})

                // Validate and sanitize HTML and CSS
                const {html: sanitizedHTML, css: sanitizedCSS} = validateThemeContent({
                    html: body.html,
                    css: body.css,
                })

                let data
                try {
                    data = await prisma.user_themes.create({
                        data: {
                            user_id: user.sub,
                            name: body.name,
                            html: sanitizedHTML,
                            css: sanitizedCSS,
                            is_active: body.is_active || false,
                        },
                    })
                } catch (error: any) {
                    set.status = 500
                    throw HTTPError.serverError({
                        summary: 'Failed to create theme.',
                        detail: error.message,
                    })
                }

                // If this theme is set as active, deactivate all other themes
                if (data.is_active) {
                    try {
                        await prisma.user_themes.updateMany({
                            where: {
                                user_id: user.sub,
                                id: {not: data.id},
                            },
                            data: {
                                is_active: false,
                            },
                        })
                    } catch (error) {
                        // If there's an error deactivating other themes, we'll just continue
                        console.error('Failed to deactivate other themes:', error)
                    }
                }

                return data
            },
            {
                detail: {
                    description: 'Create a new theme.',
                    tags: ['Themes'],
                },
                body: Theme,
                response: {
                    200: Theme,
                    400: t.Undefined(),
                    401: t.Undefined(),
                    500: t.Undefined(),
                },
            },
        );
