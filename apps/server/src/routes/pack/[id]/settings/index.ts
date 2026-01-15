import {YapockType} from '@/index'
import {Settings} from '@/lib/settings'
import {t} from 'elysia'

export default (app: YapockType) =>
    app.get(
        '',
        async ({params: {id}}) => {
            const settings = new Settings('user', {
                modelId: id
            })
            await settings.waitForInit()

            const allSettings = settings.getAll()
            const schema = settings.getSchema()

            return Object.entries(schema.settings).map(([key, definition]) => ({
                key,
                value: allSettings[key],
                definition
            }))
        },
        {
            response: {
                200: t.Any(),
            },
        },
    );
