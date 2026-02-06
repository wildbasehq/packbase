import clerkClient from '@/db/auth'
import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import packCalculateHeartbeat from '@/lib/packs/calculate-heartbeat'
import {CompressedLRUCache} from '@/utils/compressed-cache'
import {t} from 'elysia'

type InsightData = {
    ecg: { avg: number; total: number }
    howls: { total: number; regular: number; rehowls: number; comments: number; howls_with_assets: number }
    packs: { total: number }
    users: { total: number; profiles: number; leech: number }
    health: { clerk: boolean }
}

const insightCache = new CompressedLRUCache<string, InsightData>({
    max: 1,
    ttl: 12 * 60 * 60 * 1000 // 12 hours
})

export default (app: YapockType) => app
    .get('', insight, {
        detail: {
            description: 'Get some insights about the server.',
            tags: ['Server']
        },
        response: {
            200: t.Object({
                ecg: t.Object({
                    avg: t.Number(),
                    total: t.Number()
                }),
                howls: t.Object({
                    total: t.Number(),
                    regular: t.Number(), // `rich` | `markdown`
                    rehowls: t.Number(), // `howling_alongside`
                    comments: t.Number(), // `howling_echo`
                    howls_with_assets: t.Number(), // post.asset?
                }),
                packs: t.Object({
                    total: t.Number()
                }),
                users: t.Object({
                    total: t.Number(),
                    profiles: t.Number(),
                    leech: t.Number()
                }),
                health: t.Object({
                    clerk: t.Boolean()
                })
            })
        }
    })

async function insight() {
    const cached = insightCache.get('data')
    if (cached) {
        return cached
    }

    const data: InsightData = {
        ecg: {
            avg: (await packCalculateHeartbeat('all')) || 0,
            total: (await packCalculateHeartbeat('all_combined')) || 0
        },
        howls: await howlCount(),
        packs: {total: await prisma.packs.count()},
        users: await userCount(),
        health: {
            clerk: await clerkHealth()
        }
    }

    insightCache.set('data', data)
    return data
}

async function howlCount() {
    const counts = await prisma.posts.groupBy({
        by: ['content_type'],
        _count: {content_type: true}
    })

    const howls_with_assets = await prisma.posts.count({
        where: {
            assets: {isEmpty: false}
        }
    })

    const countMap = counts.reduce((acc, {content_type, _count}) => {
        acc[content_type] = _count.content_type
        return acc
    }, {} as Record<string, number>)

    const regular = (countMap['rich'] || 0) + (countMap['markdown'] || 0)
    const rehowls = countMap['howling_alongside'] || 0
    const comments = countMap['howling_echo'] || 0
    const total = regular + rehowls + comments

    return {
        total,
        regular,
        rehowls,
        comments,
        howls_with_assets
    }
}

async function userCount() {
    const [total, profiles] = await Promise.all([
        clerkClient.users.getCount(),
        prisma.profiles.count()
    ])

    return {total, profiles, leech: Math.max(total - profiles, 0)}
}

async function clerkHealth() {
    // Get https://status.clerk.com/, look for "we're currently experiencing issues" (case insensitive),
    // AS WELL AS "core services" (case insensitive). If both exist, assume outage.
    const response = await fetch('https://status.clerk.com/')
    const text = await response.text()
    const lowerText = text.toLowerCase()

    const hasIssues = lowerText.includes('we\'re currently experiencing issues')
    const hasCoreServices = lowerText.includes('core services')

    return !hasIssues && hasCoreServices
}
