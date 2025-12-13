import prisma from '@/db/prisma';

export default async function mapChannel(channelId: string, currentUserId: string) {
    const [channel, participants, lastMessage, currentUserParticipant] = await Promise.all([
        prisma.dm_channels.findUnique({where: {id: channelId}}),
        prisma.dm_participants.findMany({where: {channel_id: channelId}}),
        prisma.dm_messages.findFirst({where: {channel_id: channelId}, orderBy: {created_at: 'desc'}}),
        prisma.dm_participants.findFirst({where: {channel_id: channelId, user_id: currentUserId}}),
    ]);

    if (!channel) return undefined;

    const otherParticipant = participants.find((p) => p.user_id !== currentUserId);
    let recipientProfile: any | undefined;
    if (otherParticipant) {
        recipientProfile = await prisma.profiles.findUnique({where: {id: otherParticipant.user_id}});
    } else {
        // self-DM: show current user's profile as recipient
        recipientProfile = await prisma.profiles.findUnique({where: {id: currentUserId}});
    }

    const recipientProfileAvatar = `${process.env.HOSTNAME}/user/${recipientProfile.id}/avatar`;

    // Compute unread count: messages created after user's last_read_at
    let unread_count = 0;
    if (currentUserParticipant?.last_read_at) {
        unread_count = await prisma.dm_messages.count({
            where: {
                channel_id: channelId,
                created_at: {gt: currentUserParticipant.last_read_at},
                deleted_at: null, // Don't count deleted messages
            }
        });
    } else {
        // If never read, count all non-deleted messages
        unread_count = await prisma.dm_messages.count({
            where: {
                channel_id: channelId,
                deleted_at: null,
            }
        });
    }

    return {
        id: channel.id,
        type: 'DM',
        recipients: recipientProfile
            ? [
                {
                    id: recipientProfile.id,
                    username: recipientProfile.username,
                    display_name: recipientProfile.display_name,
                    images_avatar: recipientProfileAvatar,
                },
            ]
            : [],
        last_message_id: channel.last_message_id,
        last_message: lastMessage
            ? {
                id: lastMessage.id,
                channel_id: lastMessage.channel_id,
                author_id: lastMessage.author_id,
                content: lastMessage.deleted_at ? null : lastMessage.content,
                created_at: lastMessage.created_at.toISOString(),
                edited_at: lastMessage.edited_at?.toISOString(),
                deleted_at: lastMessage.deleted_at?.toISOString(),
            }
            : null,
        created_at: channel.created_at.toISOString(),
        unread_count,
    };
}
