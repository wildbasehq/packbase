import { t } from 'elysia';
import { YapockType } from '@/index';
import prisma from '@/db/prisma';
import { HTTPError } from '@/lib/class/HTTPError';
import { CommonErrorResponses, DM_ERROR_CODES } from '@/utils/dm/errors';

// Message response schema
const MessageResponse = t.Object({
    id: t.String(),
    channel_id: t.String(),
    author_id: t.String(),
    content: t.Optional(t.String()),
    message_type: t.String(),
    created_at: t.String(),
    edited_at: t.Optional(t.String()),
    deleted_at: t.Optional(t.String()),
    reply_to: t.Optional(t.String()),
});

export default (app: YapockType) =>
    app
        // PATCH /dm/messages/:id
        .patch(
            '',
            async ({ set, user, params, body }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({
                        summary: 'Authentication required to edit DM messages',
                        code: DM_ERROR_CODES.UNAUTHORIZED,
                    });
                }

                const { id } = params as { id: string };
                const { content } = body as { content?: string };
                if (!content || !content.trim()) {
                    set.status = 400;
                    throw HTTPError.badRequest({
                        summary: 'Message content is required and cannot be empty',
                        code: DM_ERROR_CODES.CONTENT_REQUIRED,
                    });
                }

                // Enforce max length (4k chars)
                if (content.length > 4000) {
                    set.status = 413;
                    throw HTTPError.payloadTooLarge({
                        summary: 'Message content exceeds maximum length of 4000 characters',
                        code: DM_ERROR_CODES.CONTENT_TOO_LONG,
                    });
                }

                const msg = await prisma.dm_messages.findUnique({ where: { id } });
                if (!msg) {
                    set.status = 404;
                    throw HTTPError.notFound({
                        summary: 'DM message not found or no longer accessible',
                        code: DM_ERROR_CODES.MESSAGE_NOT_FOUND,
                    });
                }

                if (msg.author_id !== user.sub) {
                    set.status = 403;
                    throw HTTPError.forbidden({
                        summary: 'You can only edit your own messages',
                        code: DM_ERROR_CODES.CANNOT_EDIT_MESSAGE,
                    });
                }

                const updated = await prisma.dm_messages.update({ where: { id }, data: { content: content.trim(), edited_at: new Date() } });

                // Return with consistent timestamp serialization
                return {
                    id: updated.id,
                    channel_id: updated.channel_id,
                    author_id: updated.author_id,
                    content: updated.content,
                    message_type: updated.message_type,
                    created_at: updated.created_at.toISOString(),
                    edited_at: updated.edited_at?.toISOString(),
                    deleted_at: updated.deleted_at?.toISOString(),
                    reply_to: updated.reply_to,
                };
            },
            {
                detail: { description: 'Edit a DM message by id', tags: ['DM'] },
                body: t.Object({ content: t.String() }),
                response: {
                    200: MessageResponse,
                    400: CommonErrorResponses[400],
                    401: CommonErrorResponses[401],
                    403: CommonErrorResponses[403],
                    404: CommonErrorResponses[404],
                    413: CommonErrorResponses[413],
                },
            },
        )
        // DELETE /dm/messages/:id (soft delete)
        .delete(
            '',
            async ({ set, user, params }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({
                        summary: 'Authentication required to delete DM messages',
                        code: DM_ERROR_CODES.UNAUTHORIZED,
                    });
                }

                const { id } = params as { id: string };

                const msg = await prisma.dm_messages.findUnique({ where: { id } });
                if (!msg) {
                    set.status = 404;
                    throw HTTPError.notFound({
                        summary: 'DM message not found or no longer accessible',
                        code: DM_ERROR_CODES.MESSAGE_NOT_FOUND,
                    });
                }

                if (msg.author_id !== user.sub) {
                    set.status = 403;
                    throw HTTPError.forbidden({
                        summary: 'You can only delete your own messages',
                        code: DM_ERROR_CODES.CANNOT_DELETE_MESSAGE,
                    });
                }

                const updated = await prisma.dm_messages.update({ where: { id }, data: { deleted_at: new Date() } });

                // Return with consistent timestamp serialization
                return {
                    id: updated.id,
                    channel_id: updated.channel_id,
                    author_id: updated.author_id,
                    content: updated.content,
                    message_type: updated.message_type,
                    created_at: updated.created_at.toISOString(),
                    edited_at: updated.edited_at?.toISOString(),
                    deleted_at: updated.deleted_at?.toISOString(),
                    reply_to: updated.reply_to,
                };
            },
            {
                detail: { description: 'Delete (soft) a DM message by id', tags: ['DM'] },
                response: {
                    200: MessageResponse,
                    401: CommonErrorResponses[401],
                    403: CommonErrorResponses[403],
                    404: CommonErrorResponses[404],
                },
            },
        );
