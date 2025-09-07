import createStorage from '@/lib/storage';

export default async function uploadFile(bucket: string, path: string, base64: string, upsert: boolean = false, animated: boolean = true) {
    // Extract user ID from the path (assuming format: userId/...)
    const userId = path.split('/')[0];
    const filePath = path.substring(userId.length + 1);

    // Create storage instance
    const storage = createStorage(bucket);

    // For backward compatibility, if the image is already processed, upload it directly
    if (!base64.startsWith('data:')) {
        // This is already a processed image buffer
        const buffer = Buffer.from(base64, 'base64');
        const result = await storage.uploadBase64Image(userId, filePath, buffer.toString('base64'), animated);

        if (!result.success) {
            return { error: result.error };
        }

        return {
            data: {
                path: result.path,
            },
        };
    }

    // Process the image with our storage class
    const result = await storage.uploadBase64Image(userId, filePath, base64, animated);

    if (!result.success) {
        return { error: result.error };
    }

    return {
        data: {
            path: result.path,
        },
    };
}
