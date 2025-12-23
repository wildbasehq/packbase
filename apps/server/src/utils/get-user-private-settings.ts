import prisma from '@/db/prisma'
import type {Prisma} from '@prisma/client'

type ProfileSettings = Prisma.profiles_settingsGetPayload<{}>;

// Overload: no key -> return full settings
export default async function getUserPrivateSettings(
    userId: string
): Promise<ProfileSettings>;

// Overload: with key -> return value of that field
export default async function getUserPrivateSettings<K extends keyof ProfileSettings>(
    userId: string,
    key: K
): Promise<ProfileSettings[K]>;

// Implementation
export default async function getUserPrivateSettings<K extends keyof ProfileSettings>(
    userId: string,
    key?: K
): Promise<ProfileSettings | ProfileSettings[K]> {
    const select: Prisma.profiles_settingsSelect = key
        ? {[key]: true}
        : undefined

    let settings = await prisma.profiles_settings.findUnique({
        where: {id: userId},
        select: select,
    })

    if (!settings) {
        settings = await prisma.profiles_settings.create({
            data: {id: userId},
            select: select,
        })
    }

    return (key ? settings[key] : settings) as any
}
