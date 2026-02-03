import prisma from '@/db/prisma'

export default async function getIDType(id: string) {
    let type = 0

    const pack = await prisma.packs.findUnique({where: {id}})
    if (pack) {
        type = 1
    } else {
        const profile = await prisma.profiles.findUnique({where: {id}})
        type = profile && 2
    }
    
    return type
}
