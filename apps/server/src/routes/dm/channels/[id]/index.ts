import { t } from 'elysia';
import { YapockType } from '@/index';
import prisma from '@/db/prisma';
import { HTTPError } from '@/lib/class/HTTPError';
import mapChannel from '@/utils/channels/mapChannel';
import { CommonErrorResponses, DM_ERROR_CODES } from '../../schemas/errors';

export default (app: YapockType) =>
    app
        // GET /dm/channels/:id
        .get(
            '',
            async ({ set, user, params }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({ 
                        summary: 'Authentication required to access DM channel',
                        code: DM_ERROR_CODES.UNAUTHORIZED 
                    });
                }

                const { id } = params as { id: string };

                // Ensure the user participates in the channel
                const isParticipant = await prisma.dm_participants.findFirst({ where: { channel_id: id, user_id: user.sub } });
                if (!isParticipant) {
                    set.status = 403;
                    throw HTTPError.forbidden({ 
                        summary: 'You are not a participant in this DM channel',
                        code: DM_ERROR_CODES.NOT_PARTICIPANT 
                    });
                }

                const payload = await mapChannel(id, user.sub);
                if (!payload) {
                    set.status = 404;
                    throw HTTPError.notFound({ 
                        summary: 'DM channel not found or no longer accessible',
                        code: DM_ERROR_CODES.CHANNEL_NOT_FOUND 
                    });
                }

                return payload;
            },
            {
                detail: { description: 'Get a DM channel by id', tags: ['DM'] },
                response: { 
                    200: t.Any(),
                    401: CommonErrorResponses[401],
                    403: CommonErrorResponses[403],
                    404: CommonErrorResponses[404],
                },
            },
        );
