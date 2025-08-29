import clerkClient from '@/db/auth';
import { UnlockablesManager } from '@/utils/unlockables-manager';

export default async function verifyToken(req: any) {
    let user;
    try {
        const authReq = await clerkClient.authenticateRequest(req, {
            authorizedParties: ['https://packbase.app', 'http://localhost:5173', 'http://localhost:8000'],
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
                const emailHash = await Bun.password.hash(user.sessionClaims.email.trim().toLowerCase());
                // Check user email in invites
                const isInvited = await prisma.invites.findFirst({
                    where: {
                        email: emailHash,
                    },
                });

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
                            id: isInvited.id,
                        },
                    });
                }

                user.sub = newProfile.id;

                // Add collectible using UnlockablesManager
                const unlocableManager = new UnlockablesManager(clerkClient);
                await unlocableManager.processUnlockables(user.userId, user.sub);
            }
        }
    } catch (e) {
        console.log(e);
    }
    return user;
}
