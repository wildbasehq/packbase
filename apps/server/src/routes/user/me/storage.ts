import {YapockType} from '@/index';
import {t} from 'elysia';
import requiresToken from '@/utils/identity/requires-token';
import createStorage from '@/lib/storage';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const storageCache = new Map<string, { data: { totalBytes: number; fileCount: number }; timestamp: number }>();

export default (app: YapockType) =>
    app.get(
        '',
        async ({set, user}) => {
            requiresToken({set, user});

            // Check cache
            const cached = storageCache.get(user.sub);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.data;
            }

            try {
                const storage = createStorage('packbase-public-profiles');
                const result = await storage.listFiles(user.sub);

                if (!result.success || !result.files) {
                    set.status = 500;
                    return {
                        error: result.error?.message || 'Failed to retrieve storage information',
                        totalBytes: 0,
                    };
                }

                // Calculate total bytes used
                const totalBytes = result.files.reduce((sum, file) => sum + file.size, 0);

                const data = {
                    totalBytes,
                    fileCount: result.files.length,
                    tier: 'void' // everyone has void storage during private alpha
                };

                // Store in cache
                storageCache.set(user.sub, {data, timestamp: Date.now()});

                return data
            } catch (error) {
                set.status = 500;
                return {
                    error: error instanceof Error ? error.message : 'Unknown error occurred',
                    totalBytes: 0,
                };
            }
        },
        {
            detail: {
                description: "Get the current user's storage usage in bytes",
                tags: ['User'],
            },
            response: {
                200: t.Object({
                    totalBytes: t.Number({
                        description: 'Total storage used in bytes',
                    }),
                    fileCount: t.Number({
                        description: 'Total number of files',
                    }),
                    tier: t.String({
                        description: 'Storage tier',
                    }),
                }),
                500: t.Object({
                    error: t.String(),
                    totalBytes: t.Number(),
                }),
            },
            beforeHandle: ({set}) => {
                set.headers['Cache-Control'] = 'public, max-age=300';
            },
        },
    );
