import PackMan from '@/lib/packs/PackMan'
import debug from 'debug'

const log = debug('vg:migrate:2_enforce_owner_permission')

export default async function enforceOwnerPermission() {
    const packs = await prisma.packs.findMany()

    // from PackMan.PERMISSIONS, calculate total bit value
    const maxPermissionBit = Object.values(PackMan.PERMISSIONS).reduce((a, b) => a + b, 0)
    for (const pack of packs) {
        // if owner's permission is not maxPermissionBit, force it to maxPermissionBit
        if (pack.owner_id) {
            const membership = await prisma.packs_memberships.findFirst({
                where: {tenant_id: pack.id, user_id: pack.owner_id},
            })
            if (membership?.permissions !== maxPermissionBit) {
                log(`Migrating Pack ID ${pack.id} owner bit to ${maxPermissionBit}`)
                await prisma.packs_memberships.update({
                    where: {id: membership.id},
                    data: {permissions: maxPermissionBit},
                })
            }
        }
    }
}
