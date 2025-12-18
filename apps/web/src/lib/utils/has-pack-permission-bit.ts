export const PACK_PERMISSIONS = {
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

export function hasPackPermissionBit(userPermissions: number, permissionBit: number | {
    type: 'all' | 'any',
    bits: number[]
}[]): boolean {
    if (Array.isArray(permissionBit)) {
        return permissionBit.every(perm => {
            if (perm.type === 'all') {
                return perm.bits.every(bit => hasPackPermissionBit(userPermissions, bit))
            } else if (perm.type === 'any') {
                return perm.bits.some(bit => hasPackPermissionBit(userPermissions, bit))
            }
            return false
        })
    }

    return (userPermissions & permissionBit) === permissionBit
}

export function hasPackAnyManagementPermissions(userPermissions: number): boolean {
    const managementPermissions = [
        PACK_PERMISSIONS.Owner,
        PACK_PERMISSIONS.Administrator,
        PACK_PERMISSIONS.BanMembers,
        PACK_PERMISSIONS.KickMembers,
        PACK_PERMISSIONS.CreateChannels,
        PACK_PERMISSIONS.EditChannels,
        PACK_PERMISSIONS.DeleteChannels,
        PACK_PERMISSIONS.DeleteHowls,
        PACK_PERMISSIONS.CreateHowls,
        PACK_PERMISSIONS.ManagePack,
    ]

    return managementPermissions.some((permission) =>
        hasPackPermissionBit(userPermissions, permission)
    )
}