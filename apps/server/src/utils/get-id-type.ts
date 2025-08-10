import prisma from '@/db/prisma'

export default async function getIDType(id: string) {
    try {
        const data = await prisma.packs.findUnique({ where: { id } })
        if (data) return 1
    } catch (_) {
        try {
            const data2 = await prisma.profiles.findUnique({ where: { id } })
            if (data2) return 2
        } catch (_) {
            return 0
        }
    }
}
