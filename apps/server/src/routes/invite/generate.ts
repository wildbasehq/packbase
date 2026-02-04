// Allow a user to generate codes as long as they pass a quick ECG test.

import clerkClient from '@/db/auth'
import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {ErrorTypebox, HTTPError} from '@/lib/http-error'
import requiresAccount from '@/utils/identity/requires-account'
import {Invitation} from '@clerk/backend'
import {t} from 'elysia'

export default (app: YapockType) =>
    app.post(
        '',
        async ({set, body, user, auditLog}) => {
            await requiresAccount(user)

            let is_admin = user.sessionClaims?.roles?.includes('admin')

            if (!is_admin) {
                let points = 0
                const posts = await prisma.posts.findMany({
                    where: {user_id: user.sub},
                    select: {id: true},
                })
                if (!posts) {
                    set.status = 403
                    throw HTTPError.forbidden({summary: 'Not enough points'})
                }

                let postPointWeight = 0.3
                points += posts.length * postPointWeight

                const invites = await prisma.profiles.findMany({
                    where: {invited_by: user.sub},
                    select: {id: true},
                })

                if (invites && invites.length >= 100) {
                    set.status = 403
                    throw HTTPError.forbidden({summary: 'Too many invited people'})
                }

                let invitePointWeight = 0.7
                if (invites) {
                    points -= invites.length * invitePointWeight
                }

                points = Math.floor(points)
                if (points < 0) points = 0

                if (process.env.PACKBASE_WAITLIST_POINTS && points < parseInt(process.env.PACKBASE_WAITLIST_POINTS)) {
                    set.status = 403
                    throw HTTPError.forbidden({summary: 'Not enough points'})
                }
            }

            const invited = await clerkClient.invitations.getInvitationList({
                query: body.email,
            })

            if (invited.data.length > 0) {
                set.status = 403
                throw HTTPError.forbidden({summary: 'Email already invited'})
            }

            let inviteCreated: Invitation | undefined = undefined
            try {
                inviteCreated = await clerkClient.invitations.createInvitation({
                    emailAddress: body.email.trim().toLowerCase(),
                    notify: true,
                })

                if (!inviteCreated) {
                    set.status = 500
                    throw HTTPError.serverError({summary: 'Failed to create invite'})
                }

                // Add to invite table
                const emailSafeHash = await Bun.password.hash(body.email.trim().toLowerCase())
                await prisma.invites.create({
                    data: {
                        invite_id: inviteCreated.id,
                        email: emailSafeHash,
                        invited_by: user.sub,
                        created_at: new Date(),
                    },
                })
            } catch (createError) {
                set.status = 500
                console.log(createError)
                throw HTTPError.serverError({summary: 'Failed to create invite'})
            }

            auditLog({
                action: 'INVITE_CREATED',
                model_id: inviteCreated.id,
                model_type: 'invite',
                model_object: {
                    email: body.email,
                    invited_by: user.sub,
                },
            })

            return {
                invite_id: inviteCreated.id,
                created_at: new Date(inviteCreated.createdAt).toISOString(),
            }
        },
        {
            detail: {
                description: 'Generate an invite code.',
                tags: ['Invite'],
            },
            body: t.Optional(
                t.Object({
                    invite_type: t.Optional(t.String()),
                    for: t.Optional(t.String({description: 'The user ID to generate the invite for.'})),
                    email: t.String({
                        description: 'The email address to generate the invite for.',
                    }),
                }),
            ),
            response: {
                404: t.Void(),
                200: t.Object({
                    invite_id: t.String(),
                    created_at: t.String(),
                }),
                500: ErrorTypebox,
            },
        },
    );
