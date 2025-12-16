import {packs, packs_memberships} from '@prisma/client'
import debug from "debug";

const log = {
    info: debug('vg:packman:info'),
    warn: debug('vg:packman:warn'),
    error: debug('vg:packman:error'),
}

export default class PackMan {
    private _pack: packs
    private _user: packs_memberships | null
    public static PERMISSIONS = {
        Owner: 1,
        Administrator: 2,
        BanMembers: 4,
        KickMembers: 8,
        CreateChannels: 16,
        EditChannels: 32,
        DeleteChannels: 64,
        DeleteHowls: 128,
        CreateHowls: 256,
        ManagePack: 512,
    }

    private constructor(pack: packs, user?: packs_memberships) {
        log.info('PackMan.constructor called %s', pack?.id)
        if (!pack) {
            log.error('PackMan.constructor: pack not provided')
            throw new Error('Pack not found')
        }
        this._pack = pack
        this._user = user ?? null
        log.info('PackMan.constructor initialized', {packId: this._pack.id, userId: this._user?.user_id ?? null})
    }

    /**
     * Initialise packman
     * @param packID
     * @param userID
     * @returns
     */
    static async init(packID: string, userID?: string) {
        log.info('PackMan.init called', {packID, userID: userID ?? null})
        return prisma.packs
            .findUnique({
                where: {
                    id: packID,
                },
            })
            .then(async (pack) => {
                if (!pack) {
                    log.warn('PackMan.init: pack not found', packID)
                    return
                }
                log.info('PackMan.init: pack found', pack.id)

                if (userID) {
                    const user = await prisma.packs_memberships
                        .findFirst({
                            where: {tenant_id: packID, user_id: userID},
                        })

                    if (user) {
                        log.info('PackMan.init: membership found', {
                            packId: pack.id,
                            membershipId: user.id,
                            userId: user.user_id
                        })
                        return new PackMan(pack, user)
                    }

                    log.warn('PackMan.init: membership not found', {packId: pack.id, userID})
                    throw new Error('Pack membership not found')
                }

                log.warn('PackMan.init: no userID provided; not initializing PackMan instance for a user', {packId: pack.id})
                return
            })
    }

    /**
     * Create a pack, without initialising packman
     * @returns
     * @param display_name
     * @param slug
     * @param description
     * @param owner_id
     */
    static async create(display_name: string, slug: string, description: string, owner_id: string) {
        log.info('PackMan.create called', {display_name, slug, owner_id})
        let pack: packs | null = null
        let membership: packs_memberships | null = null
        try {
            pack = await prisma.packs.create({
                data: {
                    owner_id,
                    display_name,
                    slug,
                    description,
                },
            })
            log.info('PackMan.create: pack created', {packId: pack.id})
        } catch (error) {
            log.error('PackMan.create: pack create failed', {error: (error as any)?.message ?? error})
            return {
                success: false,
                error: (error as any)?.message ?? String(error),
            }
        }

        try {
            membership = await prisma.packs_memberships.create({
                data: {
                    tenant_id: pack.id,
                    user_id: owner_id,
                },
            })
            log.info('PackMan.create: membership created', {packId: pack.id, membershipId: membership.id})

            if (pack && membership) {
                log.info('PackMan.create: returning PackMan instance', {packId: pack.id, membershipId: membership.id})
                return new PackMan(pack, membership)
            }
        } catch (error) {
            log.error('PackMan.create: membership create failed', {error: (error as any)?.message ?? error})
            return {
                success: false,
                error: (error as any)?.message ?? String(error),
            }
        }
    }

    /**
     * Get the pack
     * @returns
     */
    getPack() {
        log.info('PackMan.getPack called', {packId: this._pack.id})
        return this._pack
    }

    /**
     * Update the pack
     * @param data - The data to update the pack with
     * @returns
     */
    async update(data: {
        display_name?: string;
        slug?: string;
        description?: string
    }) {
        log.info('PackMan.update called', {packId: this._pack.id, data})
        try {
            this._pack = await prisma.packs.update({
                where: {id: this._pack.id},
                data,
            })
            log.info('PackMan.update: update successful', {packId: this._pack.id})

            return {
                success: true,
                pack: this._pack,
            }
        } catch (error) {
            log.error('PackMan.update: update failed', {packId: this._pack.id, error: (error as any)?.message ?? error})
            return {
                success: false,
                error: (error as any)?.message ?? String(error),
            }
        }
    }

    // ======== Permissions ========
    /**
     * Check if the user has a specific permission
     * @param permission
     * @returns
     */
    async hasPermission(permission: number) {
        log.info('PackMan.hasPermission called', {packId: this._pack.id, permission})
        if (!this._user) {
            log.warn('PackMan.hasPermission: no user on PackMan instance', {packId: this._pack.id})
            return false
        }

        const result = (this._user.permissions & permission) === permission
        log.info('PackMan.hasPermission: result', {
            packId: this._pack.id,
            userId: this._user.user_id,
            permission,
            result
        })
        return result
    }

    // Ditto, but static public
    static async hasPermission(user_id: string, tenant_id: string, permission: number) {
        // Get user
        log.info('PackMan.hasPermission (static) called', {tenant_id, user_id, permission})
        try {
            const user = await prisma.packs_memberships.findFirst({
                where: {
                    tenant_id,
                    user_id,
                }
            })

            if (!user) {
                log.warn('PackMan.hasPermission (static): membership not found', {tenant_id, user_id})
                return false
            }

            const bitAnd = (user.permissions & permission)
            const result = bitAnd === permission
            log.info('PackMan.hasPermission (static): permission check', {
                tenant_id,
                user_id,
                userPermissions: user.permissions,
                permission,
                bitAnd,
                result
            })
            return result
        } catch (error) {
            log.error('PackMan.hasPermission (static): error during check', {
                tenant_id,
                user_id,
                error: (error as any)?.message ?? error
            })
            return false
        }
    }
}
