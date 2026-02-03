import {YapockType} from '@/index'
import {HTTPError} from '@/lib/http-error'
import {Settings} from '@/lib/settings'
import {xpManager} from '@/lib/trinket-manager'
import {t} from 'elysia'

/**
 * Rehowl a specific post, as `HOWLING_ECHO`
 */
export default (app: YapockType) =>
    app
        .post(
            '',
            async ({params, user}) => {
                const {id} = params

                // Does it exist?
                let howl = await prisma.posts.findFirst({
                    where: {
                        id
                    },
                })

                if (!howl) {
                    throw HTTPError.notFound({
                        summary: 'Howl not found',
                    })
                }

                // If the howl is a howling_alongside, stop
                if (howl.content_type === 'howling_alongside') {
                    throw HTTPError.forbidden({
                        summary: 'You cannot rehowl a comment',
                    })
                }

                // If the howl is a rehowl, get the parent
                if (howl.content_type === 'howling_echo') {
                    howl = await prisma.posts.findFirst({
                        where: {
                            id: howl.parent,
                        }
                    })

                    // if, for some reason, it STILL has a parent, block it
                    if (howl.content_type === 'howling_echo') {
                        console.log('Parent howl is somehow a rehowl and will be deleted.')
                        await prisma.posts.delete({
                            where: {
                                id: howl.id,
                            }
                        })

                        throw HTTPError.forbidden({
                            summary: `*the howling in the distance abruptly goes quiet...*`,
                        })
                    }
                }

                // Does the parent user allow rehowling?
                const settings = new Settings('user', {
                    currentUserId: user.sub,
                    modelId: howl.user_id,
                })
                await settings.waitForInit()

                if (!settings.get('allow_rehowl', true)) {
                    throw HTTPError.forbidden({
                        summary: 'You are not allowed to rehowl this user',
                    })
                }

                // Has this user already rehowled this post?
                const existingRehowl = await prisma.posts.findFirst({
                    where: {
                        user_id: user.sub,
                        parent: howl.id,
                        content_type: 'howling_echo',
                    }
                })

                if (existingRehowl) {
                    throw HTTPError.conflict({
                        summary: 'You have already rehowled this post',
                    })
                }

                // Rehowl it
                await prisma.posts.create({
                    data: {
                        user_id: user.sub,
                        tenant_id: user.default_pack,
                        content_type: 'howling_echo',
                        parent: howl.id
                    },
                })

                if (user.sub !== howl.user_id) {
                    await xpManager.increment(howl.user_id, 20)
                }
            },
            {
                detail: {
                    description: 'Rehowl a specific post',
                    tags: ['Howl'],
                },
                params: t.Object({
                    id: t.String({
                        description: 'Howl ID',
                    }),
                })
            },
        )

