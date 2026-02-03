/**
 * On server boot, check if any users have howls with `rating_suggestive` or `rating_explicit` tags. If so, set their `is_r18` flag to true on DB.
 */
import Debug from 'debug'

const log = Debug('vg:migrate:4_toggle_r18_user_status')

export default async function migrateToggleR18UserStatus() {
    log('Starting migration: Toggle R18 user status based on howl ratings...')

    const startTime = Date.now()

    try {
        // Fetch all users
        const howls = await prisma.posts.findMany({
            where: {
                tags: {
                    hasSome: ['rating_suggestive', 'rating_explicit'],
                },
            },
            select: {
                user_id: true,
            },
            distinct: ['user_id'],
        })
        const userIds = howls.map((howl) => howl.user_id)

        // Update users to set is_r18 to true
        const updateResult = await prisma.profiles.updateMany({
            where: {
                id: {
                    in: userIds,
                },
            },
            data: {
                is_r18: true,
            },
        })

        log(`Migration successful: Updated ${updateResult.count} users to set is_r18 to true.`)
    } catch (error) {
        log('Migration failed:', error)
        return
    }

    const endTime = Date.now()
    log(`Migration completed in ${(endTime - startTime) / 1000} seconds.`)
}