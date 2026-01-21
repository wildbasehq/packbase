import clerkClient from '@/db/auth'
import prisma from '@/db/prisma'
import {NotificationManager} from '@/lib/NotificationManager'
import {trinketManager, xpManager} from '@/lib/trinket-manager'
import {SignedInAuthObject} from '@clerk/backend/internal'
import Debug from 'debug'

const log = {
    info: Debug('vg:verify-token'),
    error: Debug('vg:verify-token:error'),
}

type AuthUser = SignedInAuthObject & any

const authorizedParties = ['https://packbase.app', 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:8000', 'http://127.0.0.1:5173', 'http://127.0.0.1:8000']

type Credentials =
    | { kind: 'none' }
    | { kind: 'apiKey'; token: string }
    | { kind: 'clerkToken'; token: string };

type HeaderGetter = { get(name: string): string | null };
type RequestLike = { headers: HeaderGetter; clone(): any };

// In-process per-user lock to prevent duplicate profile creation inside a single runtime.
// (Still not distributed; DB uniqueness must be the real source of truth.)
const profileCreationLocks = new Map<string, Promise<void>>()

function normalizeAuthorization(raw: string | null): string | null {
    if (!raw) return null
    const trimmed = raw.trim()
    if (!trimmed) return null
    // `index.ts` currently strips "Bearer ", but callers may still pass it.
    return trimmed.toLowerCase().startsWith('bearer ') ? trimmed.slice('bearer '.length).trim() : trimmed
}

function extractCredentials(req: { headers: HeaderGetter }): Credentials {
    const raw = normalizeAuthorization(req.headers.get('authorization'))
    if (!raw) return {kind: 'none'}

    // API keys in this codebase appear to be passed as raw tokens (see apps/server/src/index.ts).
    // Clerk API keys can vary in prefix; treat a likely set as API keys.
    if (raw.startsWith('ak_') || raw.startsWith('sk_') || raw.startsWith('pk_')) {
        return {kind: 'apiKey', token: raw}
    }

    // Everything else: treat as a Clerk token (JWT/session or OAuth access token).
    return {kind: 'clerkToken', token: raw}
}

async function withUserLock(userId: string, fn: () => Promise<void>) {
    const existing = profileCreationLocks.get(userId)
    if (existing) await existing

    const next = (async () => {
        try {
            await fn()
        } finally {
            // Only delete if we are still the active lock for this user.
            if (profileCreationLocks.get(userId) === next) profileCreationLocks.delete(userId)
        }
    })()

    profileCreationLocks.set(userId, next)
    await next
}

async function authenticate(req: RequestLike): Promise<
    | { ok: true; user: AuthUser }
    | { ok: false; reason: 'missing' | 'invalid' | 'error' }
> {
    const shadowReq = req.clone()
    const creds = extractCredentials(shadowReq)

    try {
        if (creds.kind === 'none') return {ok: false, reason: 'missing'}

        // Here for future proofing as we'd like to audit log later.
        if (creds.kind === 'apiKey') {
            const apiKey = await clerkClient.apiKeys.verify(creds.token)

            if (!apiKey || apiKey.revoked || apiKey.expired || !apiKey.subject) {
                return {ok: false, reason: 'invalid'}
            }

            return {
                ok: true,
                user: {
                    userId: apiKey.subject,
                    sessionClaims: {},
                } as unknown as AuthUser,
            }
        }

        const authReq = await clerkClient.authenticateRequest(shadowReq, {
            authorizedParties,
            acceptsToken: 'any',
        })

        if (!authReq.isSignedIn) return {ok: false, reason: 'invalid'}

        const user = authReq.toAuth() as unknown as AuthUser
        // Some Clerk auth modes (e.g. oauth token) may not include sessionClaims in the type surface.
        // We keep the existing downstream expectation that `sessionClaims` exists.
        if (!(user as any).sessionClaims) (user as any).sessionClaims = {}
        if (!user?.userId) return {ok: false, reason: 'invalid'}

        return {ok: true, user}
    } catch (e) {
        log.error('Auth provider error:', e)
        return {ok: false, reason: 'error'}
    }
}

async function ensureProfileId(user: AuthUser): Promise<AuthUser | void> {
    // If we already resolved the profile id, do nothing.
    if (user.sub) return

    const userId = user.userId
    if (!userId) return

    const existing = await prisma.profiles.findFirst({
        where: {owner_id: userId},
    })

    if (existing?.id) {
        user = {
            ...user,
            ...existing,
            sub: existing.id
        }

        return user
    }

    // Only auto-provision when we have a nickname
    const nickname = user.sessionClaims?.nickname
    if (!nickname) return

    await withUserLock(userId, async () => {
        // Re-check inside the lock.
        const nowExisting = await prisma.profiles.findFirst({
            where: {owner_id: userId}
        })

        if (nowExisting?.id) {
            user = {
                ...user,
                ...nowExisting,
                sub: nowExisting.id
            }
            return user
        }

        const email = (await clerkClient.users.getUser(userId))?.emailAddresses?.[0]?.emailAddress

        // Check user email in invites (best-effort; never block profile creation).
        let isInvited: { id: string; invited_by: string } | null = null
        try {
            const invites = await prisma.invites.findMany({
                select: {id: true, invited_by: true, email: true},
            })
            const match = invites.find((invite) => Bun.password.verify(email, invite.email))
            if (match) {
                isInvited = {id: match.id, invited_by: match.invited_by}
                log.info(`User ${userId} was invited by ${match.invited_by}, invite ID: ${match.id}`)
            }
        } catch (error) {
            log.error('Error checking invites:', error)
        }

        try {
            const newProfile = await prisma.profiles.create({
                data: {
                    owner_id: userId,
                    username: nickname,
                    invited_by: isInvited?.invited_by || null,
                }
            })

            user = {
                ...user,
                ...newProfile,
                sub: newProfile.id
            }

            log.info(`Created profile ${newProfile.id} for user ${userId}`)
        } catch (e: any) {
            // If we raced with another request/process, attempt to re-fetch.
            const raced = await prisma.profiles.findFirst({
                where: {owner_id: userId}
            })
            if (raced?.id) {
                user = {
                    ...user,
                    ...raced,
                    sub: raced.id
                }

                return user
            }

            log.error('Error creating profile:', e)
            throw e
        }

        // Handle invite side-effects after successful profile creation (best-effort).
        if (isInvited?.id && isInvited?.invited_by) {
            const invited = isInvited
            try {
                await prisma.invites.delete({where: {id: invited.id}})
                await trinketManager.increment(invited.invited_by, 5)
                await xpManager.increment(invited.invited_by, 525)
                await NotificationManager.createNotification(
                    invited.invited_by,
                    'invite',
                    `${nickname} joined you!`,
                    `They took your invite with open arms. +T$5 was awarded!`,
                )
            } catch (e) {
                log.error('Error processing invite side-effects:', e)
            }
        }

        return user
    })
}

/**
 * Authenticate a request and (if possible) attach `user.sub` (profile ID).
 *
 * Returns `undefined` for unauthenticated requests to match current call sites.
 */
export default async function verifyToken(req: any): Promise<AuthUser | undefined> {
    const result = await authenticate(req as RequestLike)
    if (!result.ok) return undefined

    try {
        const clerkUser = await clerkClient.users.getUser(result.user.userId)
        const privateMeta = (clerkUser?.privateMetadata ?? {}) as any

        result.user = {
            ...result.user,
            ...privateMeta
        }

        result.user = await ensureProfileId(result.user)

        // Is username different?
        if (result.user.sessionClaims?.nickname !== result.user?.username && result.user.sub) {
            // If so, change it on the DB.
            await prisma.profiles.update({
                where: {
                    username: result.user.username
                },
                data: {
                    username: result.user.sessionClaims.nickname
                }
            })
        }
    } catch (e) {
        log.error('Profile resolution error:', e)
    }

    return result.user
}
