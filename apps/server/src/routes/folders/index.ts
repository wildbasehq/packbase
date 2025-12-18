import {YapockType} from '@/index';
import {t} from 'elysia';
import requiresToken from '@/utils/identity/requires-token';
import prisma from '@/db/prisma';
import requiresAccount from "@/utils/identity/requires-account";

// Shared types
export const FolderSchema = t.Object({
    id: t.String(),
    name: t.String(),
    description: t.Optional(t.String()),
    emoji: t.Optional(t.String()),
    query: t.Optional(t.String()),
    // created_at: t.String(),
    // updated_at: t.String(),
});

export type Folder = {
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    query?: string; // when mode === 'dynamic'
    created_at: string;
    updated_at: string;
};

export async function readUserFolders(userId: string): Promise<Folder[]> {
    const rows = await prisma.folders.findMany({
        where: {user_id: userId},
        orderBy: {created_at: 'asc'},
    });
    // Prisma will serialize Date to ISO strings via JSON.stringify
    return rows as unknown as Folder[];
}

export default (app: YapockType) =>
    app
        // List folders for current user
        .get(
            '',
            async ({query, set, user}) => {
                await requiresAccount({set, user});
                const folders = await readUserFolders(query.user);
                return {folders};
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
            async ({set, user, body}) => {
                requiresToken({set, user});
                const payload = body as Partial<Folder> & { name: string; mode: 'dynamic' | 'manual' };

                if (!payload.name) {
                    set.status = 400;
                    return {error: 'Missing required fields: name, mode'};
                }

                if (!payload.query) {
                    set.status = 400;
                    return {error: 'Folders require a query'};
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
                });

                return {folder: created as unknown as Folder};
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
