import prisma from '@/db/prisma';
import { getUserClerkByID } from '@/routes/user/[username]';

export default async function mapChannel(channelId: string, currentUserId: string) {
    const [channel, participants, lastMessage] = await Promise.all([
        prisma.dm_channels.findUnique({ where: { id: channelId } }),
        prisma.dm_participants.findMany({ where: { channel_id: channelId } }),
        prisma.dm_messages.findFirst({ where: { channel_id: channelId }, orderBy: { created_at: 'desc' } }),
    ]);

    if (!channel) return undefined;

    const otherParticipant = participants.find((p) => p.user_id !== currentUserId);
    let recipientProfile: any | undefined;
    if (otherParticipant) {
        recipientProfile = await prisma.profiles.findUnique({ where: { id: otherParticipant.user_id } });
    } else {
        // self-DM: show current user's profile as recipient
        recipientProfile = await prisma.profiles.findUnique({ where: { id: currentUserId } });
    }

    const recipientClerk = await getUserClerkByID(recipientProfile.owner_id);
    const recipientProfileAvatar = recipientClerk?.imageUrl;

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
    };
}
