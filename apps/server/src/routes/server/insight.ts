import {t} from 'elysia'
import {YapockType} from '@/index'
import packCalculateHeartbeat from '@/lib/packs/calculate-heartbeat'

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
        }
    }
}