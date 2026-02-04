import {YapockType} from '@/index'
import Baozi from '@/lib/events'
import {Settings} from '@/lib/settings'
import requiresAccount from '@/utils/identity/requires-account'
import {t} from 'elysia'

async function getSelfSettings(user) {
    if (!user) return undefined

    const settings = new Settings('user', {
        modelId: user.sub
    })
    await settings.waitForInit()

    const allSettings = settings.getAll({
        allow_rehowl: true
    })
    const schema = settings.getSchema()

    return {
        ...allSettings,
        definitions: schema.settings
    }
}

Baozi.on('ADDITIONAL_CONTEXT', async (ctx) => {
    if (!ctx.context.user) return ctx
    ctx.context.settings = await getSelfSettings(ctx.context.user)
    return ctx
})

export default (app: YapockType) =>
    app.get(
        '',
        async ({user}) => {
            await requiresAccount(user)
            return await getSelfSettings(user)
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