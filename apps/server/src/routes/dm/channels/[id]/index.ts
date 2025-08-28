import { t } from 'elysia';
import { YapockType } from '@/index';
import prisma from '@/db/prisma';
import { HTTPError } from '@/lib/class/HTTPError';
import mapChannel from '@/utils/channels/mapChannel';

export default (app: YapockType) =>
    app
        // GET /dm/channels/:id
        .get(
            '',
            async ({ set, user, params }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({ summary: 'Unauthorized' });
                }

                const { id } = params as { id: string };

                // Ensure the user participates in the channel
                const isParticipant = await prisma.dm_participants.findFirst({ where: { channel_id: id, user_id: user.sub } });
                if (!isParticipant) {
                    set.status = 403;
                    throw HTTPError.forbidden({ summary: 'Not a participant of this channel' });
                }

                const payload = await mapChannel(id, user.sub);
                if (!payload) {
                    set.status = 404;
                    throw HTTPError.notFound({ summary: 'Channel not found' });
                }

                return payload;
            },
            {
                detail: { description: 'Get a DM channel by id', tags: ['DM'] },
                response: { 200: t.Any() },
            },
        );
