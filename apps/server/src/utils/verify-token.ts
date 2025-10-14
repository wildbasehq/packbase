import clerkClient from '@/db/auth';
import prisma from '@/db/prisma';
import trinketManager, {toParentId} from './trinket-manager';
import {NotificationManager} from './NotificationManager';
import Debug from 'debug';

const log = {
    info: Debug('vg:verify-token'),
    error: Debug('vg:verify-token:error'),
};

// queue
/**
 * Queue for verifying tokens, pauses promises if user.userId is in the queue,
 * this is to prevent multiple requests from the same user from creating multiple profiles
 *
 * dirty race condition fix
 */
const queue = new Set<string>();

/**
 * Verifies a token and returns a user object
 * Waits for the queue to be empty before returning the user object
 */
export default async function verifyToken(req: any) {
    // First, get the user ID from the request to check if it's in the queue
    let userId: string | null = null;

    try {
        const shadowReq = req.clone();
        const authReq = await clerkClient.authenticateRequest(shadowReq, {
            authorizedParties: ['https://packbase.app', 'http://localhost:5173', 'http://localhost:8000', 'http://localhost:5933', 'https://proto.packbase.app'],
        });

        if (authReq.isSignedIn) {
            const user = authReq.toAuth();
            userId = user.userId;
            log.info(`Authenticated user: ${userId}`);
        }
    } catch (e) {
        log.error('Failed to authenticate request:', e);
        // If we can't get the user ID, proceed without queue logic
        return await verifyTokenProcess(req);
    }

    // If no user ID, proceed without queue logic
    if (!userId) {
        return await verifyTokenProcess(req);
    }

    // Wait for the user ID to be removed from the queue (with timeout)
    const startTime = Date.now();
    const timeout = 10000; // 10 seconds

    if (queue.has(userId)) {
        log.info(`User ${userId} is in queue, waiting for processing to complete`);
    }

    while (queue.has(userId)) {
        // Check if we've exceeded the timeout
        if (Date.now() - startTime > timeout) {
            log.error(`Queue timeout for user ${userId} after ${timeout}ms`);
            return null;
        }

        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Add the user ID to the queue
    queue.add(userId);
    log.info(`Added user ${userId} to queue, queue size: ${queue.size}`);

    try {
        // Process the token verification
        log.info(`Processing token verification for user ${userId}`);
        const result = await verifyTokenProcess(req);
        log.info(`Token verification completed for user ${userId}`);
        return result;
    } catch (error) {
        log.error(`Error during token verification for user ${userId}:`, error);
        throw error;
    } finally {
        // Always remove the user ID from the queue when done
        queue.delete(userId);
        log.info(`Removed user ${userId} from queue, queue size: ${queue.size}`);
    }
}

async function verifyTokenProcess(req: any) {
    let user;
    try {
        const shadowReq = req.clone();
        const authReq = await clerkClient.authenticateRequest(shadowReq, {
            authorizedParties: ['https://packbase.app', 'http://localhost:5173', 'http://localhost:8000', 'http://localhost:5933', 'https://proto.packbase.app'],
        });

        if (authReq.isSignedIn) {
            user = authReq.toAuth();
            if (!user.userId) {
                log.info('No user ID in auth response');
                return;
            }

            log.info(`Looking up existing profile for user ${user.userId}`);
            const userID = await prisma.profiles.findFirst({
                where: {
                    owner_id: user.userId,
                },
            });

            user.sub = userID?.id;

            if (!user.sub && user.sessionClaims.nickname) {
                log.info(`Creating new user profile for ${user.userId} with nickname ${user.sessionClaims.nickname}`);
                const email = (await clerkClient.users.getUser(user.userId))?.emailAddresses?.[0]?.emailAddress;
                // Check user email in invites
                let isInvited = null;

                try {
                    // Get all invites and compare hashed email to invites
                    const invites = await prisma.invites.findMany();
                    isInvited = invites.find((invite) => Bun.password.verify(email, invite.email));
                    if (isInvited) {
                        log.info(`User ${user.userId} was invited by ${isInvited.invited_by}, invite ID: ${isInvited.id}`);
                    }
                } catch (error) {
                    log.error('Error checking invites:', error);
                }

                const newProfile = await prisma.profiles.create({
                    data: {
                        // UUID
                        owner_id: user.userId,
                        username: user.sessionClaims.nickname,
                        invited_by: isInvited?.invited_by || null,
                    },
                });

                log.info(`Created profile ${newProfile.id} for user ${user.userId}`);

                // Delete the invite
                if (isInvited) {
                    await prisma.invites.delete({
                        where: {
                            id: isInvited.id,
                        },
                    });

                    log.info(`Deleted invite ${isInvited.id} and awarding trinkets to inviter ${isInvited.invited_by}`);

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
            } else if (user.sub) {
                log.info(`Found existing profile ${user.sub} for user ${user.userId}`);
            }
        }
    } catch (e) {
        log.error('Error in verifyTokenProcess:', e);
    }
    return user;
}
