import {YapockType} from '@/index'
import {t} from 'elysia'

// Yeah its gross but just hard code them for now.
// Realistically there's not much we can automate here, anyway.
const FUNDING_HISTORY = [
    {
        month: 'Jan \'26',
        income: '43',
        spend: '133.25'
    }
]

const DONATORS = 3

const EXTERNAL_PARTNERS = 5

export default (app: YapockType) => app
    .get('', async () => {
        // MRR = average income - average spend
        const avgIncome = FUNDING_HISTORY.reduce((sum, m) => sum + parseFloat(m.income), 0) / FUNDING_HISTORY.length
        const avgSpend = FUNDING_HISTORY.reduce((sum, m) => sum + parseFloat(m.spend), 0) / FUNDING_HISTORY.length
        const MRR = avgIncome - avgSpend

        const totalVolunteers = await prisma.profiles.count({
            where: {
                OR: [{type: '1'}, {type: '2'}]
            }
        })

        return {
            summary: {
                mrr: MRR,
                avgIncome,
                totalDonators: DONATORS,
                totalVolunteers,
                totalPartners: EXTERNAL_PARTNERS,
                isProfitable: MRR > 0,
                isRamen: MRR > 1500,
            },
            chart: FUNDING_HISTORY.map(m => ({
                month: m.month,
                income: parseFloat(m.income),
                spend: parseFloat(m.spend),
            }))
        }
    }, {
        detail: {
            description: 'Get funding status of this server.',
            tags: ['Server']
        },
        response: {
            200: t.Object({
                summary: t.Object({
                    mrr: t.Number(),
                    avgIncome: t.Number(),
                    totalDonators: t.Number(),
                    totalVolunteers: t.Number(),
                    totalPartners: t.Number(),
                    isProfitable: t.Boolean(),
                    isRamen: t.Boolean(),
                }),
                chart: t.Array(
                    t.Object({
                        month: t.String(),
                        income: t.Number(),
                        spend: t.Number(),
                    })
                ),
            })
        }
    })
