import prisma from '@/db/prisma'
import {YapockType} from '@/index'
import {HTTPError} from '@/lib/http-error'
import requiresAccount from '@/utils/identity/requires-account'
import requiresToken from '@/utils/identity/requires-token'
import {t} from 'elysia'

// Shared types
export const FolderSchema = t.Object({
    id: t.String(),
    name: t.String(),
    description: t.Optional(t.String()),
    emoji: t.Optional(t.String()),
    query: t.Optional(t.String()),
    assets: t.Optional(t.Array(t.String())),
    howl_count: t.Optional(t.Number())
    // created_at: t.String(),
    // updated_at: t.String(),
})

export type Folder = {
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    query?: string; // when mode === 'dynamic'
    howl_count?: number;
    created_at: string;
    updated_at: string;
    assets: string[];
};

export async function readUserFolders(userId: string): Promise<Folder[]> {
    const rows = await prisma.folders.findMany({
        where: {user_id: userId},
        orderBy: {created_at: 'asc'},
    })

    // For each folder, run the query and get the first 3 assets
    for (const row of rows) {
        const folder = row as unknown as Folder
        const posts = await prisma.posts.findMany({
            where: {
                tags: {
                    hasEvery: folder.query.split(','),
                },
                assets: {
                    isEmpty: false
                }
            }
        })

        folder.howl_count = posts.length

        const folderAssets: string[] = []
        for (const post of posts) {
            if (!post.assets || folderAssets.length >= 3) continue

            // Filter assets array for images
            const imageAssets = (post.assets as any[]).filter(
                asset => asset?.type === 'image' && asset?.data?.url
            )

            for (const asset of imageAssets) {
                if (folderAssets.length >= 3) break
                folderAssets.push(new URL(asset.data.url, process.env.PROFILES_CDN_URL_PREFIX).toString())
            }
        }

        // Add assets to the folder object
        folder.assets = folderAssets
    }

    // Prisma will serialize Date to ISO strings via JSON.stringify
    return rows as unknown as Folder[]
}

export default (app: YapockType) =>
    app
        // List folders for current user
        .get(
            '',
            async ({query, user}) => {
                await requiresAccount(user)
                const folders = await readUserFolders(query.user)
                return {folders}
            },
            {
                detail: {
                    description: 'List folders for the current user',
                    tags: ['Folders'],
                },
                query: t.Object({
                    user: t.String()
                }),
                response: {
                    200: t.Object({folders: t.Array(FolderSchema)}),
                },
            }
        )
        // Create a folder
        .post(
            '',
            async ({user, body}) => {
                requiresToken(user)
                const payload = body as Partial<Folder> & { name: string; }

                if (!payload.name) {
                    throw HTTPError.badRequest({
                        summary: 'Folder name is required.'
                    })
                }

                if (!payload.query) {
                    throw HTTPError.badRequest({
                        summary: 'Dynamic folders require a query to be set.'
                    })
                }

                // Count existing folders
                const existingCount = await prisma.folders.count({
                    where: {user_id: user.sub},
                })

                if (existingCount >= 10) {
                    throw HTTPError.forbidden({
                        summary: 'Folder limit reached, delete existing folders to continue.'
                    })
                }

                const created = await prisma.folders.create({
                    data: {
                        user_id: user.sub,
                        name: payload.name,
                        description: payload.description,
                        emoji: payload.emoji,
                        mode: 'dynamic',
                        query: payload.query,
                    },
                })

                return {folder: created as unknown as Folder}
            },
            {
                detail: {
                    description: 'Create a new folder for the current user',
                    tags: ['Folders'],
                },
                body: t.Object({
                    name: t.String(),
                    description: t.Optional(t.String()),
                    emoji: t.Optional(t.String()),
                    query: t.Optional(t.String()),
                }),
                response: {
                    200: t.Object({folder: FolderSchema}),
                    400: t.Object({error: t.String()}),
                },
            }
        );
