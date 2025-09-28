import { YapockType } from '@/index';
import { getUser } from '@/routes/user/[username]';
import prisma from '@/db/prisma';
import { isValidUUID } from '@/utils/dm/validation';

export default (app: YapockType) =>
    app.get('', async ({ params: { id }, set, user }) => {
        // await requiresUserProfile({set, user})

        if (!isValidUUID(id)) {
            set.status = 404;
            return;
        }

        const packExists = await prisma.packs.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!packExists) {
            set.status = 404;
            return;
        }

        let data;
        try {
            data = await prisma.packs_memberships.findMany({
                where: { tenant_id: id },
                select: { user_id: true, joined_at: true },
            });

            if (!data || data.length === 0) {
                set.status = 403;
                return;
            }
        } catch (error) {
            throw error;
        }

        let members: any[] = [];
        for (const member of data) {
            let profile = await getUser({
                by: 'id',
                value: member.user_id,
            });

            profile.joined_at = member.joined_at.toISOString();

            members.push(profile);
        }

        return members;
    });
