import {YapockType} from '@/index'
import {ErrorTypebox, HTTPError} from '@/lib/http-error'
import PackMan from '@/lib/packs/pack-manager'
import validateThemeContent from '@/lib/themes/validate-theme-content'
import {t} from 'elysia'

export default (app: YapockType) =>
    app.post(
        '',
        async ({body, user, params}) => {
            if (!user) {
                throw HTTPError.unauthorized({
                    summary: 'You must be logged in to validate pack theme content.',
                })
            }

            // Verify pack exists and user is owner
            if (!(await PackMan.hasPermission(user.sub, params.id, PackMan.PERMISSIONS.ManagePack))) return HTTPError.forbidden({
                summary: 'Missing permission'
            })

            try {
                const result = validateThemeContent(
                    {
                        html: body.html,
                        css: body.css,
                    },
                    true,
                )

                return {
                    valid: true,
                    sanitized: result,
                }
            } catch (error: any) {
                throw HTTPError.badRequest({
                    summary: 'Theme content validation failed.',
                    detail: error.message,
                })
            }
        },
        {
            params: t.Object({
                id: t.String(),
            }),
            body: t.Object({
                html: t.String(),
                css: t.String(),
            }),
            detail: {
                description: 'Validate pack theme content (owner only).',
                tags: ['Pack', 'Themes'],
            },
            response: {
                200: t.Object({
                    valid: t.Boolean(),
                    sanitized: t.Object({
                        html: t.String(),
                        css: t.String(),
                        isValid: t.Boolean(),
                        htmlIssue: t.Optional(t.String()),
                        cssIssue: t.Optional(t.String())
                    }),
                }),
                400: ErrorTypebox,
                401: ErrorTypebox,
                403: ErrorTypebox,
                404: ErrorTypebox,
            },
        },
    );
