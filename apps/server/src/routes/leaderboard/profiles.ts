import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {UserProfile} from '@/models/defs'
import {getUser} from '@/routes/user/[username]'
import {t} from 'elysia'

const MAX_RESULTS = 100

type LeaderboardEntry = {
    position: number
    user_id: string
    since: Date
    movement: string
    delta: number
}

export default (app: YapockType) =>
    app.get(
        '',
        async ({user}) => {
            try {
                // Check when leaderboard was last updated
                const lastUpdate = await prisma.server_meta.findUnique({
                    where: {kind: 'leaderboard_last_update'},
                })

                const now = new Date()
                const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)
                const shouldRecalculate = !lastUpdate || new Date(lastUpdate.updated_at) <= twelveHoursAgo

                // Fetch top XP holders and existing leaderboard in parallel
                const [xpRows, leaderboardEntries] = await Promise.all([
                    prisma.currency.findMany({
                        where: {
                            type: 'xp',
                            amount: {gt: 0},
                        },
                        orderBy: {
                            amount: 'desc',
                        },
                        take: MAX_RESULTS,
                        select: {
                            parent_id: true,
                            amount: true,
                        },
                    }),
                    prisma.leaderboard.findMany({
                        take: MAX_RESULTS,
                        orderBy: {
                            position: 'asc',
                        }
                    }),
                ])

                // Early return if no XP data
                if (xpRows.length === 0) {
                    return {profiles: []}
                }

                // Build lookup maps
                const leaderboardByPosition = new Map(
                    leaderboardEntries.map((entry) => [entry.position, entry])
                )
                const previousPositionByUser = new Map(
                    leaderboardEntries.map((entry) => [entry.user_id, entry.position])
                )

                // Extract user IDs and fetch all profiles in one batch
                const userIds = xpRows.map((row) => row.parent_id).filter((id): id is string => id !== null)

                if (userIds.length === 0) {
                    return {profiles: []}
                }

                // Fetch all profiles in parallel
                const profilePromises = userIds.map((userId) =>
                    getUser({
                        by: 'id',
                        value: userId,
                        user,
                        scope: 'basic',
                    }).catch(() => null)
                )

                const profiles = await Promise.all(profilePromises)

                // Build results with proper type safety
                const updates: LeaderboardEntry[] = []
                const results: {
                    xp: number
                    since: string
                    movement: string
                    delta: number
                    profile: NonNullable<Awaited<ReturnType<typeof getUser>>>
                }[] = []

                for (let i = 0; i < xpRows.length; i++) {
                    const row = xpRows[i]
                    const profile = profiles[i]
                    const userId = row.parent_id

                    // Skip if profile not found or invalid data
                    if (!profile || !userId || row.amount < 0) continue

                    profile.xp = row.amount

                    const position = results.length + 1
                    const existing = leaderboardByPosition.get(position)
                    const previousPosition = previousPositionByUser.get(userId)

                    let movement: string
                    let delta: number
                    let since: Date

                    if (shouldRecalculate) {
                        // Recalculate movement and update since if position changed
                        since = existing?.user_id === userId ? existing.since : now
                        movement = 'same'
                        delta = 0

                        if (previousPosition !== undefined && previousPosition !== position) {
                            if (previousPosition > position) {
                                movement = 'gained'
                                delta = previousPosition - position
                            } else {
                                movement = 'lost'
                                delta = position - previousPosition
                            }
                        } else if (previousPosition === undefined) {
                            movement = 'new'
                        }

                        updates.push({position, user_id: userId, since, movement, delta})
                    } else {
                        // Use existing data from leaderboard table
                        const existingEntry = leaderboardEntries.find((e) => e.user_id === userId)
                        movement = existingEntry?.movement || 'same'
                        delta = existingEntry?.delta || 0
                        since = existingEntry?.since || now
                    }

                    results.push({
                        xp: row.amount,
                        since: since.toISOString(),
                        movement,
                        delta,
                        profile,
                    })
                }

                // Only update database if we should recalculate and have results
                if (shouldRecalculate && updates.length > 0) {
                    await prisma.$transaction([
                        // Upsert all leaderboard entries
                        ...updates.map((entry) =>
                            prisma.leaderboard.upsert({
                                where: {position: entry.position},
                                create: {
                                    position: entry.position,
                                    user_id: entry.user_id,
                                    since: entry.since,
                                    movement: entry.movement,
                                    delta: entry.delta,
                                },
                                update: {
                                    user_id: entry.user_id,
                                    since: entry.since,
                                    movement: entry.movement,
                                    delta: entry.delta,
                                },
                            })
                        ),
                        // Clean up stale entries
                        prisma.leaderboard.deleteMany({
                            where: {
                                position: {gt: updates.length},
                            },
                        }),
                        // Update last update timestamp
                        prisma.server_meta.upsert({
                            where: {kind: 'leaderboard_last_update'},
                            create: {
                                kind: 'leaderboard_last_update',
                                data: {timestamp: now.toISOString()},
                                updated_at: now,
                            },
                            update: {
                                data: {timestamp: now.toISOString()},
                                updated_at: now,
                            },
                        }),
                    ])
                }

                return {
                    profiles: results,
                }
            } catch (error) {
                console.error('Leaderboard error:', error)
                // Return empty results on error to prevent client crashes
                return {profiles: []}
            }
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
                            since: t.String(),
                            movement: t.String(),
                            delta: t.Number(),
                            profile: UserProfile,
                        }),
                    ),
                }),
            },
        },
    )
