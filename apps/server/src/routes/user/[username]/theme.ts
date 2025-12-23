import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import {Theme} from '@/models/themes.model'
import {t} from 'elysia'
import {getUser} from './index'

export default (app: YapockType) =>
    app.get(
        '',
        async ({params, set}) => {
            let user = await getUser({
                by: 'username',
                value: params.username,
            })

            // Try ID
            user ??= await getUser({
                by: 'id',
                value: params.username,
            })

            if (!user) {
                set.status = 404
                throw HTTPError.notFound({
                    summary: 'The user was not found.',
                })
            }

            // Find the active theme for the user
            try {
                const themeData = await prisma.user_themes.findFirst({
                    where: {
                        user_id: user.id,
                        is_active: true,
                    },
                })

                if (!themeData) {
                    set.status = 404
                    throw HTTPError.notFound({
                        summary: 'No active theme found for this user.',
                    })
                }

                return themeData
            } catch (error) {
                // For errors, return a 500
                set.status = 500
                throw HTTPError.serverError({
                    summary: 'Failed to fetch theme.',
                    detail: error.message,
                })
            }
        },
        {
            params: t.Object({
                username: t.String({
                    description: 'Username of the user to get the theme for.',
                }),
            }),
            detail: {
                description: 'Get the active theme for a specific user.',
                tags: ['User', 'Themes'],
            },
            response: {
                200: Theme,
                404: t.Undefined(),
                500: t.Undefined(),
            },
        },
    );
