import supabase from '@/utils/supabase/client';
import { HTTPError } from '@/lib/HTTPError';
import prisma from '@/db/prisma';

/**
 * Check if the user owns the pack
 * @param set
 * @param user
 * @param {string} id The pack ID
 */
async function requiresOwnership({ set, user, id }: { set: any; user: { sub: string }; id: string }) {
    // Check user ID against pack owner_id
    let data;
    try {
        data = await prisma.packs.findUnique({
            where: { id },
            select: { owner_id: true },
        });
    } catch (error) {
        set.status = 404;
        throw HTTPError.notFound({
            summary: 'The pack was not found.',
        });
    }

    if (!data) {
        set.status = 404;
        throw HTTPError.notFound({
            summary: 'The pack was not found.',
        });
    } else if (data.owner_id !== user.sub) {
        set.status = 403;
        throw HTTPError.forbidden({
            summary: 'You are not the owner of this pack',
        });
    }
}

// Bitwise OR the permissions
const PERMISSIONS = {
    Owner: 1,
    Administrator: 2,
    ManageMembers: 4,
    ManagePack: 8,
    ManageHowls: 16,
};

async function hasPermission(permissions: string | number, permission: number) {
    // If permissions is a string, assume it's a user ID
    if (typeof permissions === 'string') {
        const isOwner = await prisma.packs.findUnique({
            where: { id: permissions },
            select: { owner_id: true },
        });
        if (!isOwner) return true;

        try {
            const data = await prisma.packs_memberships.findFirst({
                where: { id: permissions },
                select: { permissions: true },
            });
            if (!data) throw new Error('Membership not found');
            return hasPermission(data.permissions, permission);
        } catch (error) {
            throw error;
        }
    }

    return (permissions & permission) === permission;
}

export const pack = {
    requiresOwnership,

    hasPermission,
    PERMISSIONS,
};
