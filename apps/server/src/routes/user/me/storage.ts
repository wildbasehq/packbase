import {YapockType} from '@/index';
import createStorage from '@/lib/storage';
import requiresAccount from "@/utils/identity/requires-account";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const storageCache = new Map<string, { data: { totalBytes: number; fileCount: number }; timestamp: number }>();

export default (app: YapockType) =>
    app.get(
        '',
        async ({set, user}) => {
            await requiresAccount({set, user});

            // Check cache
            const cached = storageCache.get(user.sub);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                return cached.data;
            }

            try {
                const storage = createStorage(process.env.S3_PROFILES_BUCKET);
                console.log('Fetching storage information for user:', user.sub);
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

                const tierRow = await prisma.storage.findFirst({
                    where: {
                        user_id: user.sub,
                    },
                    select: {
                        user_id: true,
                        tier: true,
                    },
                })

                const data = {
                    totalBytes,
                    fileCount: result.files.length,
                    tier: tierRow?.tier || 'free',
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
            beforeHandle: ({set}) => {
                set.headers['Cache-Control'] = 'public, max-age=300';
            },
        },
    );
