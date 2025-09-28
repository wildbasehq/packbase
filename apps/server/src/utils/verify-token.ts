import clerkClient from '@/db/auth';
import trinketManager, { toParentId } from './trinket-manager';
import { NotificationManager } from './NotificationManager';

export default async function verifyToken(req: any) {
    let user;
    try {
        const shadowReq = req.clone();
        const authReq = await clerkClient.authenticateRequest(shadowReq, {
            authorizedParties: ['https://packbase.app', 'http://localhost:5173', 'http://localhost:8000', 'http://localhost:5933'],
        });

        if (authReq.isSignedIn) {
            user = authReq.toAuth();
            if (!user.userId) return;

            const userID = await prisma.profiles.findFirst({
                where: {
                    owner_id: user.userId,
                },
            });

            user.sub = userID?.id;

            if (!user.sub) {
                console.log('URGENT: Creating new user profile for ', user.userId);
                const emailHash = user.sessionClaims?.email ? await Bun.password.hash(user.sessionClaims?.email?.trim().toLowerCase()) : 'ENULL';
                // Check user email in invites
                let isInvited = null;

                try {
                    isInvited = await prisma.invites.findFirst({
                        where: {
                            email: emailHash,
                        },
                    });
                } catch (_) {}

                const newProfile = await prisma.profiles.create({
                    data: {
                        // UUID
                        owner_id: user.userId,
                        username: user.sessionClaims.nickname,
                        ...(isInvited
                            ? {
                                  invited_by: isInvited.invited_by,
                              }
                            : {}),
                    },
                });

                // Delete the invite
                if (isInvited) {
                    await prisma.invites.delete({
                        where: {
                            invite_id: isInvited.id,
                        },
                    });

                    // Give trinkets to the inviter
                    await trinketManager.increment(toParentId('user', isInvited.invited_by), 5);
                    // Create a notification for the inviter
                    await NotificationManager.createNotification(
                        isInvited.invited_by,
                        'invite',
                        `${user.sessionClaims.nickname} joined you!`,
                        `They took your invite with open arms. +T$5 was awarded!`,
                    );
                }

                user.sub = newProfile.id;
            }
        }
    } catch (e) {
        console.log(e);
    }
    return user;
}
