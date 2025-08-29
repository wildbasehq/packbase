import { t } from 'elysia';
import { YapockType } from '@/index';
import prisma from '@/db/prisma';
import { HTTPError } from '@/lib/class/HTTPError';
import mapChannel from '@/utils/channels/mapChannel';
import { CommonErrorResponses, DM_ERROR_CODES } from '../schemas/errors';

// Channel response schemas
const RecipientResponse = t.Object({
  id: t.String(),
  username: t.String(),
  display_name: t.Union([t.String(), t.Null()]),
  images_avatar: t.Union([t.String(), t.Null()]),
})

const MessageResponse = t.Object({
  id: t.String(),
  channel_id: t.String(),
  author_id: t.String(),
  content: t.Union([t.String(), t.Null()]),
  created_at: t.String(),
  edited_at: t.Union([t.String(), t.Null()]),
  deleted_at: t.Union([t.String(), t.Null()]),
})

const ChannelResponse = t.Object({
  id: t.String(),
  type: t.String(),
  recipients: t.Array(RecipientResponse),
  last_message_id: t.Union([t.String(), t.Null()]),
  last_message: t.Union([MessageResponse, t.Null()]),
  created_at: t.String(),
})

export default (app: YapockType) =>
    app
        // GET /dm/channels - list all DM channels for current user
        .get(
            '',
            async ({ set, user }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({ 
                        summary: 'Authentication required to access DM channels',
                        code: DM_ERROR_CODES.UNAUTHORIZED 
                    });
                }

                const links = await prisma.dm_participants.findMany({
                    where: { user_id: user.sub },
                    select: { channel_id: true },
                });

                const result: any[] = [];
                for (const link of links) {
                    const payload = await mapChannel(link.channel_id, user.sub);
                    if (payload) result.push(payload);
                }

                return result;
            },
            {
                detail: {
                    description: 'List your DM channels',
                    tags: ['DM'],
                },
                response: {
                    200: t.Array(ChannelResponse),
                    401: CommonErrorResponses[401],
                },
            },
        )
        // POST /dm/channels - create or return an existing 1:1 channel
        .post(
            '',
            async ({ set, user, body }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({ 
                        summary: 'Authentication required to create DM channels',
                        code: DM_ERROR_CODES.UNAUTHORIZED 
                    });
                }

                const { userId } = body as { userId?: string };
                if (!userId) {
                    set.status = 400;
                    throw HTTPError.badRequest({ 
                        summary: 'User ID is required to create a DM channel',
                        code: DM_ERROR_CODES.USER_ID_REQUIRED 
                    });
                }

                // Support self-DM: if userId is self, find or create a solo channel
                let channelId: string;
                if (userId === user.sub) {
                    const selfExisting = await prisma.dm_channels.findFirst({
                        where: {
                            dm_participants: {
                                some: { user_id: user.sub },
                                every: { user_id: user.sub }, // ensures only self is a participant
                            },
                        },
                    });

                    if (selfExisting) {
                        channelId = selfExisting.id;
                    } else {
                        const created = await prisma.dm_channels.create({ data: {} });
                        channelId = created.id;
                        await prisma.dm_participants.create({ data: { channel_id: channelId, user_id: user.sub } });
                    }
                } else {
                    // Find existing channel shared by both users
                    const myLinks = await prisma.dm_participants.findMany({ where: { user_id: user.sub }, select: { channel_id: true } });
                    const myChannelIds = myLinks.map((l) => l.channel_id);

                    const existing = await prisma.dm_participants.findFirst({
                        where: { user_id: userId, channel_id: { in: myChannelIds } },
                        select: { channel_id: true },
                    });

                    if (existing?.channel_id) {
                        channelId = existing.channel_id;
                    } else {
                        const created = await prisma.dm_channels.create({ data: {} });
                        channelId = created.id;
                        await prisma.dm_participants.createMany({
                            data: [
                                { channel_id: channelId, user_id: user.sub },
                                { channel_id: channelId, user_id: userId },
                            ],
                        });
                    }
                }

                const payload = await mapChannel(channelId, user.sub);
                return payload;
            },
            {
                detail: {
                    description: 'Create or return an existing DM channel with userId',
                    tags: ['DM'],
                },
                body: t.Object({ userId: t.String() }),
                response: { 
                    200: ChannelResponse,
                    400: CommonErrorResponses[400],
                    401: CommonErrorResponses[401],
                },
            },
        );
