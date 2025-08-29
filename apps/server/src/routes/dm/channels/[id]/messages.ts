import { t } from 'elysia';
import { YapockType } from '@/index';
import prisma from '@/db/prisma';
import { HTTPError } from '@/lib/class/HTTPError';
import { CommonErrorResponses, DM_ERROR_CODES } from '@/utils/dm/errors';
import { CreateMessageBody, MESSAGE_TYPES, validateMessageType } from '@/utils/dm/validation';
import { DMRateLimiter } from '@/utils/dm/rate-limiter';

// Message response schema
const MessageResponse = t.Object({
  id: t.String(),
  channel_id: t.String(),
  author_id: t.String(),
  content: t.Union([t.String(), t.Null()]),
  message_type: t.String(),
  created_at: t.String(),
  edited_at: t.Union([t.String(), t.Null()]),
  deleted_at: t.Union([t.String(), t.Null()]),
  reply_to: t.Union([t.String(), t.Null()]),
})

export default (app: YapockType) =>
    app
        // GET /dm/channels/:id/messages
        .get(
            '',
            async ({ set, user, params, query }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({ 
                        summary: 'Authentication required to access DM messages',
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
                response: { 
                    200: t.Array(MessageResponse),
                    401: CommonErrorResponses[401],
                    403: CommonErrorResponses[403],
                },
            },
        )
        // POST /dm/channels/:id/messages
        .post(
            '',
            async ({ set, user, params, body }) => {
                if (!user?.sub) {
                    set.status = 401;
                    throw HTTPError.unauthorized({ 
                        summary: 'Authentication required to send DM messages',
                        code: DM_ERROR_CODES.UNAUTHORIZED 
                    });
                }

                const { id } = params as { id: string };
                
                // Check rate limits before processing
                const rateLimiter = DMRateLimiter.getInstance();
                const rateLimitResult = rateLimiter.checkLimits(user.sub, id);
                
                if (!rateLimitResult.allowed) {
                    set.status = 429;
                    set.headers['Retry-After'] = rateLimitResult.retryAfterSeconds?.toString() || '60';
                    set.headers['X-RateLimit-Limit'] = rateLimitResult.limit.toString();
                    set.headers['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
                    set.headers['X-RateLimit-Reset'] = rateLimitResult.resetAt.toString();
                    
                    throw HTTPError.tooManyRequests({ 
                        summary: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`,
                        code: DM_ERROR_CODES.RATE_LIMIT_EXCEEDED 
                    });
                }

                const { content, message_type, reply_to } = body as {
                    content?: string; 
                    message_type?: string; 
                    reply_to?: string; 
                };
                
                if (!content || !content.trim()) {
                    set.status = 400;
                    throw HTTPError.badRequest({ 
                        summary: 'Message content is required and cannot be empty',
                        code: DM_ERROR_CODES.CONTENT_REQUIRED 
                    });
                }

                // Enforce max length (4k chars)
                if (content.length > 4000) {
                    set.status = 413;
                    throw HTTPError.payloadTooLarge({ 
                        summary: 'Message content exceeds maximum length of 4000 characters',
                        code: DM_ERROR_CODES.CONTENT_TOO_LONG 
                    });
                }

                // Validate message_type if provided
                const validatedMessageType = message_type || MESSAGE_TYPES.TEXT;
                if (!validateMessageType(validatedMessageType)) {
                    set.status = 400;
                    throw HTTPError.badRequest({ 
                        summary: `Invalid message type. Must be one of: ${Object.values(MESSAGE_TYPES).join(', ')}`,
                        code: DM_ERROR_CODES.INVALID_MESSAGE_TYPE 
                    });
                }

                // Validate reply_to referential integrity if provided
                if (reply_to) {
                    const replyMessage = await prisma.dm_messages.findFirst({
                        where: { 
                            id: reply_to,
                            channel_id: id, // Must be in same channel
                            deleted_at: null, // Cannot reply to deleted messages
                        }
                    });
                    if (!replyMessage) {
                        set.status = 400;
                        throw HTTPError.badRequest({ 
                            summary: 'Invalid reply_to: referenced message not found, not in this channel, or has been deleted',
                            code: DM_ERROR_CODES.INVALID_REPLY_TO 
                        });
                    }
                }

                const isParticipant = await prisma.dm_participants.findFirst({ where: { channel_id: id, user_id: user.sub } });
                if (!isParticipant) {
                    set.status = 403;
                    throw HTTPError.forbidden({ 
                        summary: 'You are not a participant in this DM channel',
                        code: DM_ERROR_CODES.NOT_PARTICIPANT 
                    });
                }

                const message = await prisma.dm_messages.create({
                    data: { 
                        channel_id: id, 
                        author_id: user.sub, 
                        content: content.trim(),
                        message_type: validatedMessageType,
                        reply_to: reply_to || null,
                    },
                });

                await prisma.dm_channels.update({ where: { id }, data: { last_message_id: message.id } });

                // Record the message for rate limiting after successful creation
                rateLimiter.recordMessage(user.sub, id);

                return {
                    id: message.id,
                    channel_id: message.channel_id,
                    author_id: message.author_id,
                    content: message.content,
                    message_type: message.message_type,
                    created_at: message.created_at.toISOString(),
                    edited_at: message.edited_at?.toISOString(),
                    deleted_at: message.deleted_at?.toISOString(),
                    reply_to: message.reply_to,
                };
            },
            {
                detail: { description: 'Send a message to a DM channel', tags: ['DM'] },
                body: CreateMessageBody,
                response: { 
                    200: MessageResponse,
                    400: CommonErrorResponses[400],
                    401: CommonErrorResponses[401],
                    403: CommonErrorResponses[403],
                    413: CommonErrorResponses[413],
                    422: CommonErrorResponses[422],
                },
            },
        );
