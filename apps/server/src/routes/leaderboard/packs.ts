import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import packCalculateHeartbeat from '@/lib/packs/calculate-heartbeat'
import {PackResponse} from '@/models/defs'
import {t} from 'elysia'

const MAX_RESULTS = 100
const BATCH_SIZE = 10
const CACHE_TTL = 60 * 60 * 1000
const packsCache = new Map<string, {data: {packs: {activity: number; pack: ReturnType<typeof formatPack>}[]}; timestamp: number}>()

function formatPack(pack: {
    id: string;
    slug: string;
    display_name: string;
    description: string | null;
    images_avatar: string | null;
    images_header: string | null;
    created_at: Date;
    owner_id: string | null;
}) {
    const formatted: {
        id: string;
        slug: string;
        display_name: string;
        created_at: string;
        owner_id?: string;
        about?: { bio: string };
        images?: { avatar?: string; header?: string };
    } = {
        id: pack.id,
        slug: pack.slug,
        display_name: pack.display_name,
        created_at: pack.created_at.toString(),
    }

    if (pack.owner_id) {
        formatted.owner_id = pack.owner_id
    }

    if (pack.description) {
        formatted.about = {bio: pack.description}
    }

    if (pack.images_avatar || pack.images_header) {
        formatted.images = {
            ...(pack.images_avatar ? {avatar: pack.images_avatar} : {}),
            ...(pack.images_header ? {header: pack.images_header} : {}),
        }
    }

    return formatted
}

export default (app: YapockType) =>
    app.get(
        '',
        async () => {
            const cached = packsCache.get('leaderboard.packs')
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.data
            }

            const packs = await prisma.packs.findMany({
                select: {
                    id: true,
                    slug: true,
                    display_name: true,
                    description: true,
                    images_avatar: true,
                    images_header: true,
                    created_at: true,
                    owner_id: true,
                },
            })

            const scored: { id: string; activity: number }[] = []

            for (let i = 0; i < packs.length; i += BATCH_SIZE) {
                const batch = packs.slice(i, i + BATCH_SIZE)
                const batchScores = await Promise.all(
                    batch.map(async (pack) => ({
                        id: pack.id,
                        activity: await packCalculateHeartbeat(pack.id),
                    })),
                )
                scored.push(...batchScores)
            }

            const ranked = scored
                .filter((entry) => entry.activity >= 0)
                .sort((a, b) => b.activity - a.activity)
                .slice(0, MAX_RESULTS)

            const packMap = new Map(packs.map((pack) => [pack.id, pack]))

            const results = ranked
                .map((entry) => {
                    const pack = packMap.get(entry.id)
                    if (!pack) return null

                    return {
                        activity: entry.activity,
                        pack: formatPack(pack),
                    }
                })
                .filter((entry): entry is { activity: number; pack: ReturnType<typeof formatPack> } => Boolean(entry))

            const data = {
                packs: results,
            }
            packsCache.set('leaderboard.packs', {data, timestamp: Date.now()})
            return data
        },
        {
            detail: {
                description: 'Get the top packs ranked by activity.',
                tags: ['Leaderboard'],
            },
            beforeHandle: ({set}) => {
                set.headers['Cache-Control'] = 'public, max-age=3600'
            },
            response: {
                200: t.Object({
                    packs: t.Array(
                        t.Object({
                            activity: t.Number(),
                            pack: PackResponse,
                        }),
                    ),
                }),
            },
        },
    )
