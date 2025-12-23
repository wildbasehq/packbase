import prisma from '@/db/prisma'
import Debug from 'debug'

const log = {
    info: Debug('vg:packs:heartbeat'),
    error: Debug('vg:packs:heartbeat:error'),
}
const heartbeatStore = new Map<string, string>()

/**
 * A packs heartbeat is a calculated value, based on the number of active members, number of <14 day old posts, and the number of >30 day old accounts.
 */
export default async function packCalculateHeartbeat(packID: string): Promise<number> {
    if (packID === 'server_startup_init') {
        // Recursively calculate all packs
        const packs = await prisma.packs.findMany({
            select: {id: true}
        })
        if (!packs) return -1
        for (const pack of packs) {
            await packCalculateHeartbeat(pack.id)
        }
        return 1
    }

    // Report average of all packs
    if (packID === 'all' || packID === 'all_combined') {
        let total = 0
        let count = 0
        for (const [, value] of heartbeatStore) {
            total += parseInt(value.split(':')[1])
            count++
        }
        if (packID === 'all_combined') {
            return total
        } else {
            return Math.round(total / count)
        }
    }

    if (heartbeatStore.has(packID)) {
        const store = heartbeatStore.get(packID)
        const lastHeartbeat = store.split(':')
        // If the cache is less than env.EXPIRE_CACHE_HOURS old, return the cached value
        const cacheHours = parseInt(process.env.EXPIRE_CACHE_HOURS || '1')
        if (Date.now() - parseInt(lastHeartbeat[0]) < cacheHours * 60 * 60 * 1000) {
            log.info(`ECG valid for ${packID}`)
            return parseInt(lastHeartbeat[1])
        } else {
            log.info(`ECG Recalculating for ${packID}`)
        }
    } else {
        log.info(`ECG Calculating for ${packID}`)
    }

    let totalCount = 0
    const members = await prisma.packs_memberships.findMany({
        where: {tenant_id: packID},
        select: {user_id: true}
    })
    if (!members) return -1
    const recentPosts = await prisma.posts.findMany({
        where: {
            tenant_id: packID,
            created_at: {
                gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            }
        },
        select: {id: true}
    })
    if (!recentPosts) return 0
    // Count all accounts older than 30 days
    // @TODO: Should become last seen instead of created_at
    for (const user of members) {
        const userAccount = await prisma.profiles.findUnique({
            where: {id: user.user_id},
            select: {created_at: true}
        })
        // Check if the account is older than 30 days
        const accountAge = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        if (userAccount && userAccount.created_at < accountAge) {
            totalCount += 0.58
        }
    }

    recentPosts.forEach(() => {
        totalCount += 0.9
    })

    heartbeatStore.set(packID, `${Date.now()}:${Math.round(totalCount)}`)

    log.info(`ECG Calculated for ${packID} as ${Math.round(totalCount)}`)
    return Math.round(totalCount)
}
