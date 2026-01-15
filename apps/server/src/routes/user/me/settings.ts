import {YapockType} from '@/index'
import {Settings} from '@/lib/settings'
import requiresAccount from '@/utils/identity/requires-account'
import {t} from 'elysia'


export default (app: YapockType) =>
    app.get(
        '',
        async ({set, user}) => {
            await requiresAccount({set, user})
            const settings = new Settings('user', {
                modelId: user.sub
            })
            await settings.waitForInit()

            const allSettings = settings.getAll()
            const schema = settings.getSchema()

            return {
                ...allSettings,
                definitions: schema.settings
            }
        },
        {
            response: {
                200: t.Object({}, {
                    additionalProperties: t.Any()
                })
            },
        },
    )
        .post(
            '',
            async ({user, body}) => {
                const settings = new Settings('user', {
                    modelId: user.sub
                })
                await settings.waitForInit()

                await settings.setMany(body)
                return {success: true}
            },
            {
                body: t.Record(t.String(), t.Any()),
                response: {
                    200: t.Object({
                        success: t.Boolean(),
                    }),
                },
            },
        )