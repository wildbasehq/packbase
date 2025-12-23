import {YapockType} from '@/index'
import {HTTPError} from '@/lib/HTTPError'
import PackMan from '@/lib/packs/PackMan'
import {PackCreateBody} from '@/models/defs'
import requiresAccount from '@/utils/identity/requires-account'
import {similarity} from '@/utils/similarity'

const banned = ['universe', 'new', 'settings']

export default (app: YapockType) =>
    app.post(
        '',
        async ({body: {display_name, slug, description}, set, user}) => {
            await requiresAccount({set, user})

            slug = slug.toLowerCase()
            for (const route of banned) {
                if (similarity(route, slug) > 0.8) {
                    set.status = 403
                    throw HTTPError.forbidden({
                        summary: 'You cannot use that slug',
                    })
                }
            }

            const pack = await PackMan.create(display_name, slug, description, user.sub)
            if (pack instanceof PackMan) {
                return pack.getPack()
            }

            if (!pack.success) throw HTTPError.badRequest({
                summary: pack.error,
            })

            return HTTPError.serverError({
                summary: 'An unknown error occurred while creating the pack. It might be created?',
            })
        },
        {
            body: PackCreateBody,
            detail: {
                description: 'Create a new pack.',
                tags: ['Pack'],
            },
            // response: {
            //     200: PackResponse,
            //     400: ErrorTypebox,
            //     403: ErrorTypebox,
            // },
        },
    );
