import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import PackMan from '@/lib/packs/PackMan'
import validateThemeContent from '@/lib/themes/validateThemeContent'
import {t} from 'elysia'

export default (app: YapockType) =>
    app.post(
        '',
        async ({set, body, user, params}) => {
            if (!user) {
                set.status = 401
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
                set.status = 400
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
                    }),
                }),
                400: t.Undefined(),
                401: t.Undefined(),
                403: t.Undefined(),
                404: t.Undefined(),
            },
        },
    );
