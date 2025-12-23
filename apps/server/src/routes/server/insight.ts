import {YapockType} from '@/index'
import packCalculateHeartbeat from '@/lib/packs/calculate-heartbeat'
import {t} from 'elysia'

export default (app: YapockType) => app
    .get('', Insight, {
        detail: {
            description: 'Get some insights about the server.',
            tags: ['Server']
        },
        response: {
            200: t.Object({
                ecg: t.Object({
                    avg: t.Number(),
                    total: t.Number()
                })
            })
        }
    })

async function Insight() {
    return {
        ecg: {
            avg: (await packCalculateHeartbeat('all')) || 0,
            total: (await packCalculateHeartbeat('all_combined')) || 0
        },
        health: {
            clerk: await clerkHealth()
        }
    }
}

async function clerkHealth() {
    // Get https://status.clerk.com/, look for "we're currently experiencing issues" (case insensitive),
    // AS WELL AS "core services" (case insensitive). If both exist, assume outage.
    const response = await fetch('https://status.clerk.com/')
    const text = await response.text()
    const lowerText = text.toLowerCase()

    const hasIssues = lowerText.includes('we\'re currently experiencing issues')
    const hasCoreServices = lowerText.includes('core services')

    return hasIssues && hasCoreServices
}
