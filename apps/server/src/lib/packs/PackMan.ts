import {packs, packs_memberships} from '@prisma/client'
import {HTTPError} from '@/lib/HTTPError'

export default class PackMan {
    private _pack: packs
    private _user: packs_memberships | null
    public static PERMISSIONS = {
        Owner: 1,
        Administrator: 2,
        ManageMembers: 4,
        ManagePack: 8,
        ManageHowls: 16,
    }

    private constructor(pack: packs, user?: packs_memberships) {
        if (!pack) throw new Error('Pack not found')
        this._pack = pack
        if (user) this._user = user
    }

    /**
     * Initialise packman
     * @param packID
     * @param userID
     * @returns
     */
    static async init(packID: string, userID?: string) {
        prisma.packs
            .findUnique({
                where: {
                    id: packID,
                },
            })
            .then((pack) => {
                if (userID) {
                    prisma.packs_memberships
                        .findFirst({
                            where: {tenant_id: packID, user_id: userID},
                        })
                        .then((user) => {
                            if (!user) throw new Error('User not found')
                            return new PackMan(pack, user)
                        })
                        .catch((error) => {
                            throw new Error('User not found')
                        })
                }
            })
            .catch((error) => {
                throw new Error('Pack not found')
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
        } catch (error) {
            return {
                success: false,
                error: error.message,
            }
        }

        try {
            membership = await prisma.packs_memberships.create({
                data: {
                    tenant_id: pack.id,
                    user_id: owner_id,
                },
            })

            if (pack && membership) {
                return new PackMan(pack, membership)
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
            }
        }
    }

    /**
     * Get the pack
     * @returns
     */
    getPack() {
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
        try {
            this._pack = await prisma.packs.update({
                where: {id: this._pack.id},
                data,
            })

            return {
                success: true,
                pack: this._pack,
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
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
        if (!this._user) return false
        return (this._user.permissions & permission) === permission
    }

    // Ditto, but static public
    static async hasPermission(user_id: string, tenant_id: string, permission: number) {
        // Get user
        try {
            const user = await prisma.packs_memberships.findFirst({
                where: {
                    tenant_id,
                    user_id,
                }
            })

            if (!user) return false
            console.log('will accept', user.permissions, permission, (user.permissions & permission))
            return (user.permissions & permission) === permission
        } catch (error) {
            return false
        }
    }
}
