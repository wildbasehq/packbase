import { t } from 'elysia';
import { YapockType } from '@/index';
import prisma from '@/db/prisma';
import { HTTPError } from '@/lib/class/HTTPError';

export default (app: YapockType) =>
    app
        // GET /dm/channels/:id/messages
        .get(
            '',
            async ({ set, user, params, query }) => {
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

                const { limit: limitQ, before, after } = query as any;
                const limit = Math.max(1, Math.min(Number(limitQ) || 50, 100));

                let beforeDate: Date | undefined;
                let afterDate: Date | undefined;

                if (before) {
                    const msg = await prisma.dm_messages.findUnique({ where: { id: String(before) } });
                    if (msg) beforeDate = msg.created_at;
                }
                if (after) {
                    const msg = await prisma.dm_messages.findUnique({ where: { id: String(after) } });
                    if (msg) afterDate = msg.created_at;
                }

                const messages = await prisma.dm_messages.findMany({
                    where: {
                        channel_id: id,
                        ...(beforeDate ? { created_at: { lt: beforeDate } } : {}),
                        ...(afterDate ? { created_at: { gt: afterDate } } : {}),
                    },
                    orderBy: { created_at: 'desc' },
                    take: limit,
                });

                // Map to response payloads (hide content if deleted)
                const mapped = messages.map((m) => ({
                    id: m.id,
                    channel_id: m.channel_id,
                    author_id: m.author_id,
                    content: m.deleted_at ? null : m.content,
                    message_type: m.message_type,
                    created_at: m.created_at.toISOString(),
                    edited_at: m.edited_at,
                    deleted_at: m.deleted_at,
                    reply_to: m.reply_to,
                }));

                return mapped;
            },
            {
                detail: { description: 'List messages in a DM channel', tags: ['DM'] },
                response: { 200: t.Array(t.Any()) },
            },
        )
        // POST /dm/channels/:id/messages
        .post(
            '',
            async ({ set, user, params, body }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({ summary: 'Unauthorized' });
                }

                const { id } = params as { id: string };
                const { content } = body as { content?: string };
                if (!content || !content.trim()) {
                    set.status = 400;
                    throw HTTPError.badRequest({ summary: 'content is required' });
                }

                const isParticipant = await prisma.dm_participants.findFirst({ where: { channel_id: id, user_id: user.sub } });
                if (!isParticipant) {
                    set.status = 403;
                    throw HTTPError.forbidden({ summary: 'Not a participant of this channel' });
                }

                const message = await prisma.dm_messages.create({
                    data: { channel_id: id, author_id: user.sub, content: content.trim() },
                });

                await prisma.dm_channels.update({ where: { id }, data: { last_message_id: message.id } });

                return {
                    id: message.id,
                    channel_id: message.channel_id,
                    author_id: message.author_id,
                    content: message.content,
                    message_type: message.message_type,
                    created_at: message.created_at,
                    edited_at: message.edited_at,
                    deleted_at: message.deleted_at,
                    reply_to: message.reply_to,
                };
            },
            {
                detail: { description: 'Send a message to a DM channel', tags: ['DM'] },
                body: t.Object({ content: t.String() }),
                response: { 200: t.Any() },
            },
        );
