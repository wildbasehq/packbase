/**
 * Creates the universe pack if it doesn't exist
 */

import debug from 'debug'
import prisma from '@/db/prisma'

const log = debug('vg:migrate:0_universe_seed')

const universePack = {
    id: '00000000-0000-0000-0000-000000000000',
    display_name: 'Universe',
    slug: 'universe',
}

export default async function migrateCreateUniverse() {
    const data = await prisma.packs.findFirst({
        where: {
            slug: 'universe'
        }
    })

    if (data) return

    log('Creating universe pack')
    await prisma.packs.create({
        data: universePack,
    })
}

