import {YapockType} from '@/index';
import {t} from 'elysia';
import requiresToken from '@/utils/identity/requires-token';
import prisma from '@/db/prisma';

// Shared types
export const FolderSchema = t.Object({
    id: t.String(),
    name: t.String(),
    description: t.Optional(t.String()),
    emoji: t.Optional(t.String()),
    mode: t.Union([t.Literal('dynamic'), t.Literal('manual')]),
    query: t.Optional(t.String()),
    howl_ids: t.Optional(t.Array(t.String())),
    // created_at: t.String(),
    // updated_at: t.String(),
});

export type Folder = {
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    mode: 'dynamic' | 'manual';
    query?: string; // when mode === 'dynamic'
    howl_ids?: string[]; // when mode === 'manual'
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
            async ({set, user}) => {
                requiresToken({set, user});
                const folders = await readUserFolders(user.sub);
                return {folders};
            },
            {
                detail: {
                    description: 'List folders for the current user',
                    tags: ['Folders'],
                },
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

                if (!payload.name || !payload.mode) {
                    set.status = 400;
                    return {error: 'Missing required fields: name, mode'};
                }
                if (payload.mode === 'dynamic' && !payload.query) {
                    set.status = 400;
                    return {error: 'Dynamic folders require a query'};
                }
                if (payload.mode === 'manual' && (!payload.howl_ids || !Array.isArray(payload.howl_ids))) {
                    set.status = 400;
                    return {error: 'Manual folders require howl_ids[]'};
                }

                const created = await prisma.folders.create({
                    data: {
                        user_id: user.sub,
                        name: payload.name,
                        description: payload.description,
                        emoji: payload.emoji,
                        mode: payload.mode,
                        query: payload.mode === 'dynamic' ? payload.query : undefined,
                        howl_ids: payload.mode === 'manual' ? (payload.howl_ids || []) : [],
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
                    mode: t.Union([t.Literal('dynamic'), t.Literal('manual')]),
                    query: t.Optional(t.String()),
                    howl_ids: t.Optional(t.Array(t.String())),
                }),
                response: {
                    200: t.Object({folder: FolderSchema}),
                    400: t.Object({error: t.String()}),
                },
            }
        );
