import {Settings} from "@/lib/settings";
import {t} from "elysia";
import {YapockType} from '@/index';


export default (app: YapockType) =>
    app.get(
        '',
        async ({user}) => {
            const settings = new Settings();
            const userObj = await prisma.profiles.findUnique({
                where: {
                    id: user.sub,
                },
            });

            return (
                await settings.getSettingValues({
                    model: 'user',
                    ...userObj,
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
    )
        .post(
            '',
            async ({user, body}) => {
                const settings = new Settings();
                const userObj = await prisma.profiles.findUnique({
                    where: {
                        id: user.sub,
                    },
                });

                return await settings.updateSettings({
                    model: 'user',
                    ...userObj,
                }, body as Record<string, any>)
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