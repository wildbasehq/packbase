import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { StorageProvider } from '../../../plugins/storage-interface';

/**
 * Storage class for managing S3 compatible buckets
 * Supports:
 * - Uploading images by base64
 * - Deletion
 * - List files in bucket
 * - List files in bucket folder
 * - Version control (stored within a [filename].vc.json in ./vc)
 * - All operations which affect the file should update its version control file
 * - Get version control content
 * - Get specific file version
 */
export class Storage {
    private storageProvider: StorageProvider;

    /**
     * Create a new Storage instance
     * @param storageProvider The storage provider to use
     */
    constructor(storageProvider: StorageProvider) {
        this.storageProvider = storageProvider;
    }

    /**
     * Upload a base64 encoded image to the bucket
     * @param userId The user ID (used for folder structure)
     * @param filePath The path within the user's folder
     * @param base64 The base64 encoded image data
     * @param animated Whether the image is animated (for GIFs)
     * @returns Object with success status, path, and version info
     */
    async uploadBase64Image(
        userId: string,
        filePath: string,
        base64: string,
        animated: boolean = true,
    ): Promise<{
        success: boolean;
        error?: Error;
        path?: string;
        version?: string;
    }> {
        try {
            // Process the image with sharp
            let imageBuffer = Buffer.from(base64.split(';base64,').pop() || '', 'base64');
            let sharpQuery = sharp(imageBuffer, { animated });

            // Determine content type and extension
            let contentType = base64.substring('data:'.length, base64.indexOf(';base64'));
            let ext = base64.substring('data:image/'.length, base64.indexOf(';base64'));

            // Validate that this is an image
            if (!contentType.startsWith('image/')) {
                return {
                    success: false,
                    error: new Error('Only images are supported'),
                };
            }

            // Convert to PNG or keep as GIF if animated
            if (ext === 'gif' && animated) {
                sharpQuery.toFormat('gif');
                ext = 'gif';
                contentType = 'image/gif';
            } else {
                sharpQuery.toFormat('png');
                ext = 'png';
                contentType = 'image/png';
            }

            // Process the image
            const processedImage = await sharpQuery.toBuffer();

            // Generate a version ID
            const versionId = uuidv4();

            // Create the full path
            const fullPath = `${userId}/${filePath.replace('{ext}', ext)}`;

            // Upload the file using the storage provider
            const uploadSuccess = await this.storageProvider.uploadFile(fullPath, processedImage, contentType);

            if (!uploadSuccess) {
                return {
                    success: false,
                    error: new Error('Failed to upload file to storage'),
                };
            }

            // Update version control
            await this.updateVersionControl(userId, fullPath, versionId, processedImage);

            return {
                success: true,
                path: fullPath,
                version: versionId,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }

    /**
     * Delete a file from the bucket
     * @param userId The user ID
     * @param filePath The path to the file within the user's folder
     * @returns Object with success status
     */
    async deleteFile(
        userId: string,
        filePath: string,
    ): Promise<{
        success: boolean;
        error?: Error;
    }> {
        try {
            const fullPath = `${userId}/${filePath}`;

            // Delete the file using the storage provider
            const deleteSuccess = await this.storageProvider.deleteFile(fullPath);

            if (!deleteSuccess) {
                return {
                    success: false,
                    error: new Error('Failed to delete file from storage'),
                };
            }

            // Update version control to mark as deleted
            await this.updateVersionControl(userId, fullPath, uuidv4(), null, true);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }

    /**
     * List files in a bucket or folder
     * @param userId The user ID
     * @param prefix Optional folder prefix to list files from
     * @returns Object with success status and array of files
     */
    async listFiles(
        userId: string,
        prefix: string = '',
    ): Promise<{
        success: boolean;
        error?: Error;
        files?: Array<{
            name: string;
            path: string;
            lastModified: Date;
            size: number;
        }>;
    }> {
        try {
            const fullPrefix = prefix ? `${userId}/${prefix}` : `${userId}/`;

            // List files using the storage provider
            const files = await this.storageProvider.listFiles(fullPrefix, '/');

            return {
                success: true,
                files,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }

    /**
     * Get version control information for a file
     * @param userId The user ID
     * @param filePath The path to the file
     * @returns Object with success status and version control data
     */
    async getVersionControl(
        userId: string,
        filePath: string,
    ): Promise<{
        success: boolean;
        error?: Error;
        versions?: Array<{
            id: string;
            timestamp: string;
            deleted: boolean;
        }>;
    }> {
        try {
            const vcPath = `${userId}/vc/${path.basename(filePath)}.vc.json`;

            try {
                // Get the version control file using the storage provider
                const fileResult = await this.storageProvider.getFile(vcPath);

                if (!fileResult) {
                    return {
                        success: true,
                        versions: [],
                    };
                }

                const vcData = fileResult.data.toString('utf-8');
                if (!vcData) {
                    return {
                        success: true,
                        versions: [],
                    };
                }

                const versions = JSON.parse(vcData);
                return {
                    success: true,
                    versions,
                };
            } catch (error) {
                // If the file doesn't exist, return an empty array
                if ((error as any).name === 'NoSuchKey') {
                    return {
                        success: true,
                        versions: [],
                    };
                }
                throw error;
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }

    /**
     * Get a specific version of a file
     * @param userId The user ID
     * @param filePath The path to the file
     * @param versionId The version ID to retrieve
     * @returns Object with success status and file data
     */
    async getFileVersion(
        userId: string,
        filePath: string,
        versionId: string,
    ): Promise<{
        success: boolean;
        error?: Error;
        data?: Buffer;
        contentType?: string;
    }> {
        try {
            // Get version control data
            const vcResult = await this.getVersionControl(userId, filePath);
            if (!vcResult.success || !vcResult.versions) {
                return {
                    success: false,
                    error: vcResult.error || new Error('Failed to get version control data'),
                };
            }

            // Find the requested version
            const version = vcResult.versions.find((v) => v.id === versionId);
            if (!version) {
                return {
                    success: false,
                    error: new Error('Version not found'),
                };
            }

            // If the version is marked as deleted, return an error
            if (version.deleted) {
                return {
                    success: false,
                    error: new Error('This version was deleted'),
                };
            }

            // Get the version file
            const versionPath = `${userId}/vc/${path.basename(filePath)}.${versionId}`;

            // Get the file using the storage provider
            const fileResult = await this.storageProvider.getFile(versionPath);

            if (!fileResult) {
                return {
                    success: false,
                    error: new Error('Failed to get file version'),
                };
            }

            return {
                success: true,
                data: fileResult.data,
                contentType: fileResult.contentType,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }

    /**
     * Update the version control for a file
     * @param userId The user ID
     * @param filePath The path to the file
     * @param versionId The version ID
     * @param data The file data (null if deleted)
     * @param deleted Whether the file was deleted
     * @private
     */
    private async updateVersionControl(userId: string, filePath: string, versionId: string, data: Buffer | null, deleted: boolean = false): Promise<void> {
        // Get current version control data
        const vcResult = await this.getVersionControl(userId, filePath);
        const versions = vcResult.success && vcResult.versions ? vcResult.versions : [];

        // Add the new version
        versions.push({
            id: versionId,
            timestamp: new Date().toISOString(),
            deleted,
        });

        // Save the version control file
        const vcPath = `${userId}/vc/${path.basename(filePath)}.vc.json`;

        // Upload the version control file using the storage provider
        await this.storageProvider.uploadFile(vcPath, Buffer.from(JSON.stringify(versions)), 'application/json');

        // If we have data, save the version file
        if (data) {
            const versionPath = `${userId}/vc/${path.basename(filePath)}.${versionId}`;

            // Upload the version file using the storage provider
            await this.storageProvider.uploadFile(versionPath, data, 'application/octet-stream');
        }
    }
}

/**
 * Create a new Storage instance with the default configuration
 * @param bucket The bucket name to use
 * @returns A configured Storage instance
 */
export function createStorage(bucket: string): Storage {
    // Import the S3StorageProvider dynamically to avoid circular dependencies
    const { S3StorageProvider } = require('../../../plugins/s3-storage-provider');

    // Create a new S3StorageProvider with default configuration
    const storageProvider = S3StorageProvider.createFromEnv(bucket);

    // Create a new Storage instance with the S3StorageProvider
    return new Storage(storageProvider);
}

export default createStorage;
