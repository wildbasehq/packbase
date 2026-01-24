import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {UserProfile} from '@/models/defs'
import {getUser} from '@/routes/user/[username]'
import {t} from 'elysia'

const MAX_RESULTS = 100
const CACHE_TTL = 60 * 60 * 1000
const profilesCache = new Map<string, {data: {profiles: {xp: number; profile: any}[]}; timestamp: number}>()

export default (app: YapockType) =>
    app.get(
        '',
        async ({user}) => {
            const cacheKey = user?.sub || 'anon'
            const cached = profilesCache.get(cacheKey)
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.data
            }

            const xpRows = await prisma.currency.findMany({
                where: {
                    type: 'xp',
                },
                orderBy: {
                    amount: 'desc',
                },
                take: MAX_RESULTS,
                select: {
                    parent_id: true,
                    amount: true,
                },
            })

            const results: { xp: number; profile: any }[] = []

            for (const row of xpRows) {
                const userId = row.parent_id

                if (!userId) continue

                const profile = await getUser({
                    by: 'id',
                    value: userId,
                    user,
                    scope: 'basic',
                })

                if (!profile) continue

                profile.xp = row.amount

                results.push({
                    xp: row.amount,
                    profile,
                })
            }

            const data = {
                profiles: results,
            }
            profilesCache.set(cacheKey, {data, timestamp: Date.now()})
            return data
        },
        {
            detail: {
                description: 'Get the top profiles ranked by XP.',
                tags: ['Leaderboard'],
            },
            beforeHandle: ({set}) => {
                set.headers['Cache-Control'] = 'private, max-age=3600'
            },
            response: {
                200: t.Object({
                    profiles: t.Array(
                        t.Object({
                            xp: t.Number(),
                            profile: UserProfile,
                        }),
                    ),
                }),
            },
        },
    )
