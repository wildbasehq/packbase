import {YapockType} from '@/index'
import {t} from 'elysia'
import requiresUserProfile from '@/utils/identity/requires-user-profile'
import {ErrorTypebox} from '@/utils/errors'
import prisma from '@/db/prisma'

export default (app: YapockType) =>
    app
        .post(
            '',
            async ({set, body, user, error}) => {
                await requiresUserProfile({set, user})

                let {dpk, dpv}: { dpk: string; dpv: any } = body

                let {json, dp} = await getDPObject(user.sub)
                if (!json) return error(500, {
                    summary: 'DP failure when grabbing json object!'
                })

                if (!dpv || dpv.length === 0) dpv = 1
                dp[dpk] = dpv

                json.dp = dp

                let insertData;
                try {
                    insertData = await prisma.profiles_settings.upsert({
                        where: { id: user.sub },
                        update: { json },
                        create: { id: user.sub, json }
                    });
                } catch (err) {
                    console.error(err);
                    return error(500, {
                        summary: err.message || 'Internal error when importing to profiles.settings!'
                    });
                }
                return insertData
            },
            {
                detail: {
                    description: 'Updates a specific dipswitch.',
                    tags: ['Users'],
                },
                body: t.Object({
                    dpk: t.String(),
                    dpv: t.String(),
                }),
                response: {
                    200: t.Object({}, {
                        additionalProperties: t.Any(),
                    }),
                    500: ErrorTypebox
                }
            },
        )
        .get(
            '',
            async ({query, user, error, set}) => {
                await requiresUserProfile({set, user})

                const {dpk} = query

                let {dp} = await getDPObject(user.sub)

                if (dpk) {
                    if (!dp[dpk]) return error(404, null)

                    return dp[dpk]
                } else {
                    return dp
                }
            },
            {
                detail: {
                    description: 'Gets a specific dipswitch.',
                    tags: ['Users'],
                },
                query: t.Optional(t.Object({
                    dpk: t.Optional(t.String()),
                })),
                response: {
                    200: t.Union([t.String(), t.Object({}, {
                        additionalProperties: t.Any(),
                    })]),
                    404: t.Null()
                }
            },
        );

export async function getDPObject(userID: string) {
    let json: {
        dp: {
            [key: string]: any
        }
    } = {
        dp: {},
    }
    let data;
    try {
        data = await prisma.profiles_settings.findUnique({
            where: { id: userID }
        });

        if (!data) {
            // assume the user is already signed in
            data = await prisma.profiles_settings.create({
                data: {
                    id: userID,
                    json: {}
                }
            });
        }
    } catch (error) {
        throw error;
    }

    json = data.json
    let dp = json.dp
    if (!dp) dp = {}

    return {
        json,
        dp,
    }
}
