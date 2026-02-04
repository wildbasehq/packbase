import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {type Folder, FolderSchema} from '@/routes/folders'
import requiresAccount from '@/utils/identity/requires-account'
import requiresToken from '@/utils/identity/requires-token'
import {t} from 'elysia'

export default (app: YapockType) =>
    app
        // Get a folder by id
        .get(
            '',
            async ({set, user, params}) => {
                await requiresAccount(user)
                const {id} = params as { id: string }
                const folder = await prisma.folders.findFirst({where: {id}})
                if (!folder) {
                    set.status = 404
                    return {error: 'Folder not found'}
                }

                const profile = await prisma.profiles.findUnique({where: {id: folder.user_id}})
                return {
                    folder: folder as unknown as Folder,
                    profile: {
                        id: profile.id,
                        display_name: profile.display_name || profile.username,
                        username: profile.username,
                        images_avatar: `${process.env.HOSTNAME}/user/${profile.id}/avatar`
                    }
                }
            },
            {
                params: t.Object({id: t.String()}),
                response: {
                    200: t.Object({
                        folder: FolderSchema,
                        profile: t.Object({
                            id: t.String(),
                            display_name: t.String(),
                            username: t.String(),
                            images_avatar: t.String()
                        })
                    }),
                    404: t.Object({error: t.String()}),
                },
                detail: {
                    description: 'Get a folder by id',
                    tags: ['Folders'],
                },
            }
        )
        // Update a folder
        .patch(
            '',
            async ({set, user, params, body}) => {
                requiresToken(user)
                const {id} = params as { id: string }
                const payload = body as Partial<Folder>

                const current = await prisma.folders.findFirst({where: {id, user_id: user.sub}})
                if (!current) {
                    set.status = 404
                    return {error: 'Folder not found'}
                }

                const updated = await prisma.folders.update({
                    where: {id},
                    data: {
                        name: payload.name ?? current.name,
                        description: payload.description ?? current.description ?? undefined,
                        emoji: payload.emoji ?? current.emoji ?? undefined,
                        query: payload.query ?? current.query ?? undefined,
                        updated_at: new Date(),
                    },
                })

                return {folder: updated as unknown as Folder}
            },
            {
                params: t.Object({id: t.String()}),
                body: t.Partial(FolderSchema),
                response: {
                    200: t.Object({folder: FolderSchema}),
                    404: t.Object({error: t.String()}),
                },
                detail: {
                    description: 'Update a folder by id',
                    tags: ['Folders'],
                },
            }
        )
        // Delete a folder
        .delete(
            '',
            async ({set, user, params}) => {
                requiresToken(user)
                const {id} = params as { id: string }
                const result = await prisma.folders.deleteMany({where: {id, user_id: user.sub}})
                if (result.count === 0) {
                    set.status = 404
                    return {error: 'Folder not found'}
                }
                return {success: true}
            },
            {
                params: t.Object({id: t.String()}),
                response: {
                    200: t.Object({success: t.Boolean()}),
                    404: t.Object({error: t.String()}),
                },
                detail: {
                    description: 'Delete a folder by id',
                    tags: ['Folders'],
                },
            }
        );
