import { YapockType } from '@/index';
import { HTTPError } from '@/lib/HTTPError';
import validateThemeContent from '@/lib/themes/validateThemeContent';
import { Theme } from '@/models/themes.model';
import { t } from 'elysia';
import prisma from '@/db/prisma';

export default (app: YapockType) =>
    app
        // Update an existing theme
        .put(
            '',
            async ({ set, params, body, user }) => {
                if (!user) {
                    set.status = 401;
                    throw HTTPError.unauthorized({
                        summary: 'You must be logged in to update a theme.',
                    });
                }

                // Check if the theme exists and belongs to the user
                const existingTheme = await prisma.user_themes.findUnique({
                    where: {
                        id: params.id,
                        user_id: user.sub,
                    },
                });

                if (!existingTheme) {
                    set.status = 404;
                    throw HTTPError.notFound({
                        summary: 'Theme not found or you do not have permission to update it.',
                    });
                }

                // Validate and sanitize HTML and CSS if provided
                let sanitizedHTML = existingTheme.html;
                let sanitizedCSS = existingTheme.css;

                if (body.html || body.css) {
                    const validatedContent = validateThemeContent({
                        html: body.html || existingTheme.html,
                        css: body.css || existingTheme.css,
                    });

                    if (body.html) sanitizedHTML = validatedContent.html;
                    if (body.css) sanitizedCSS = validatedContent.css;
                }

                const updateData = {
                    ...(body.name && { name: body.name }),
                    ...(body.html && { html: sanitizedHTML }),
                    ...(body.css && { css: sanitizedCSS }),
                    ...(body.is_active !== undefined && { is_active: body.is_active }),
                };

                try {
                    const data = await prisma.user_themes.update({
                        where: {
                            id: params.id,
                            user_id: user.sub,
                        },
                        data: updateData,
                    });

                    // If this theme is set as active, deactivate all other themes
                    if (data.is_active) {
                        await prisma.user_themes.updateMany({
                            where: {
                                user_id: user.sub,
                                id: {
                                    not: data.id,
                                },
                            },
                            data: {
                                is_active: false,
                            },
                        });
                    }

                    return data;
                } catch (error) {
                    set.status = 500;
                    throw HTTPError.serverError({
                        summary: 'Failed to update theme.',
                        detail: error.message,
                    });
                }
            },
            {
                detail: {
                    description: 'Update an existing theme.',
                    tags: ['Themes'],
                },
                params: t.Object({
                    id: t.String(),
                }),
                body: Theme,
                response: {
                    200: Theme,
                    400: t.Undefined(),
                    401: t.Undefined(),
                    404: t.Undefined(),
                    500: t.Undefined(),
                },
            },
        )
        // Delete a theme
        .delete(
            '',
            async ({ set, params, user }) => {
                if (!user) {
                    set.status = 401;
                    throw HTTPError.unauthorized({
                        summary: 'You must be logged in to delete a theme.',
                    });
                }

                // Check if the theme exists and belongs to the user
                const existingTheme = await prisma.user_themes.findUnique({
                    where: {
                        id: params.id,
                        user_id: user.sub,
                    },
                });

                if (!existingTheme) {
                    set.status = 404;
                    throw HTTPError.notFound({
                        summary: 'Theme not found or you do not have permission to delete it.',
                    });
                }

                try {
                    await prisma.user_themes.delete({
                        where: {
                            id: params.id,
                            user_id: user.sub,
                        },
                    });
                } catch (error) {
                    set.status = 500;
                    throw HTTPError.serverError({
                        summary: 'Failed to delete theme.',
                        detail: error.message,
                    });
                }

                return { success: true };
            },
            {
                detail: {
                    description: 'Delete a theme.',
                    tags: ['Themes'],
                },
                params: t.Object({
                    id: t.String(),
                }),
                response: {
                    200: t.Object({
                        success: t.Boolean(),
                    }),
                    401: t.Undefined(),
                    404: t.Undefined(),
                    500: t.Undefined(),
                },
            },
        );
