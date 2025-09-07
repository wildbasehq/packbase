import { YapockType } from '@/index';
import { t } from 'elysia';
import { Settings } from '@/lib/settings';
import { getPack } from '@/routes/pack/[id]';

export default (app: YapockType) =>
    app.get(
        '',
        async ({ params: { id } }) => {
            const settings = new Settings();
            const pack = await getPack(id);
            return (
                await settings.getSettingValues({
                    model: 'pack',
                    ...pack,
                })
            ).map((setting) => {
                delete setting.definition.db;
                return setting;
            });
        },
        {
            response: {
                200: t.Any(),
            },
        },
    );
