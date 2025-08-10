import {similarity} from '@/utils/similarity'
import {YapockType} from '@/index'
import requiresUserProfile from '@/utils/identity/requires-user-profile'
import {PackCreateBody, PackResponse} from '@/models/defs'
import {getPack} from '@/routes/pack/[id]'
import {ErrorTypebox} from '@/utils/errors'
import {HTTPError} from '@/lib/class/HTTPError'
import prisma from '@/db/prisma'

const banned = [
    'universe',
    'new',
    'settings'
]

export default (app: YapockType) => app
    .post('', async ({body: {display_name, slug, description}, set, user}) => {
        await requiresUserProfile({set, user})

        slug = slug.toLowerCase()
        for (const route of banned) {
            if (similarity(route, slug) > 0.8) {
                set.status = 403
                throw HTTPError.forbidden({
                    summary: 'You cannot use that slug'
                })
            }
        }

        let pack = await prisma.packs.findFirst({
            where: { slug },
            select: { id: true }
        })
        if (pack) {
            set.status = 409
            throw HTTPError.conflict({
                summary: 'Pack already exists with that slug'
            })
        }

        let data;
        try {
            data = await prisma.packs.create({
                data: {
                    owner_id: user.sub,
                    display_name,
                    slug,
                    description
                }
            });
        } catch (error) {
            set.status = 400
            throw HTTPError.badRequest({
                summary: error.message || 'An unexpected problem happened'
            });
        }

        if (!data) {
            set.status = 400
            throw HTTPError.badRequest({
                summary: 'Failed to create pack'
            });
        }

        try {
            await prisma.packs_memberships.create({
                data: {
                    tenant_id: data.id,
                    user_id: user.sub
                }
            });
        } catch (error) {
            console.error('Failed to create pack membership:', error);
            // Continue even if membership creation fails
        }

        return await getPack(data.id, undefined, user.sub)
    }, {
        body: PackCreateBody,
        detail: {
            description: 'Create a new pack.',
            tags: ['Pack'],
        },
        response: {
            200: PackResponse,
            400: ErrorTypebox,
            403: ErrorTypebox,
        }
    })
