import { DeleteObjectCommand, GetObjectCommand, paginateListObjectsV2, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import { StorageProvider } from './storage-interface'

/**
 * AWS S3 implementation of the StorageProvider interface
 */
export class S3StorageProvider implements StorageProvider {
    private readonly client: S3Client
    private readonly bucket: string

    /**
     * Create a new S3StorageProvider instance
     * @param config Configuration for the S3 client
     * @param bucket The bucket name to use
     */
    constructor(config: {
        endpoint: string;
        region: string;
        credentials: {
            accessKeyId: string;
            secretAccessKey: string;
        };
        forcePathStyle?: boolean;
    }, bucket: string) {
        this.client = new S3Client({
            endpoint: config.endpoint,
            region: config.region,
            credentials: {
                accessKeyId: config.credentials.accessKeyId,
                secretAccessKey: config.credentials.secretAccessKey,
            },
            forcePathStyle: config.forcePathStyle ?? true, // Required for some S3-compatible services
        })
        this.bucket = bucket
    }

    /**
     * Create a new S3StorageProvider with default configuration from environment variables
     * @param bucket The bucket name to use
     * @returns A configured S3StorageProvider instance
     */
    static createFromEnv(bucket: string): S3StorageProvider {
        const config = {
            endpoint: process.env.S3_ENDPOINT || 'https://s3.amazonaws.com',
            region: process.env.S3_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY || '',
                secretAccessKey: process.env.S3_SECRET_KEY || '',
            },
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false'
        }

        return new S3StorageProvider(config, bucket)
    }

    /**
     * Upload a file to the S3 bucket
     * @param key The key/path where the file should be stored
     * @param data The file data as a Buffer
     * @param contentType The content type of the file
     * @returns Promise resolving to success status
     */
    async uploadFile(key: string, data: Buffer | Readable, contentType: string): Promise<boolean> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    Body: data,
                    ContentType: contentType,
                })
            )
            return true
        } catch (error) {
            console.error('Error uploading file to S3:', error)
            return false
        }
    }

    /**
     * Delete a file from the S3 bucket
     * @param key The key/path of the file to delete
     * @returns Promise resolving to success status
     */
    async deleteFile(key: string): Promise<boolean> {
        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                })
            )
            return true
        } catch (error) {
            console.error('Error deleting file from S3:', error)
            return false
        }
    }

    /**
     * List files in the S3 bucket with a given prefix
     * @param prefix The prefix to filter files by
     * @param delimiter Optional delimiter for hierarchical listing (set to undefined for recursive listing)
     * @returns Promise resolving to array of file information
     */
    async listFiles(prefix: string, delimiter?: string): Promise<Array<{
        name: string;
        path: string;
        lastModified: Date;
        size: number;
    }>> {
        try {
            const paginator = paginateListObjectsV2(
                { client: this.client, pageSize: 1000 },
                {
                    Bucket: this.bucket,
                    Prefix: prefix,
                    Delimiter: delimiter
                }
            )

            const allFiles: Array<{
                name: string;
                path: string;
                lastModified: Date;
                size: number;
            }> = []

            for await (const page of paginator) {
                // Handle files in Contents
                if (page.Contents) {
                    const files = page.Contents.map(item => ({
                        name: item.Key?.split('/').pop() || '',
                        path: item.Key || '',
                        lastModified: item.LastModified || new Date(),
                        size: item.Size || 0
                    }))
                    allFiles.push(...files)
                }

                // Handle subfolders in CommonPrefixes (when delimiter is used)
                if (delimiter && page.CommonPrefixes) {
                    for (const commonPrefix of page.CommonPrefixes) {
                        if (commonPrefix.Prefix) {
                            // Recursively list files in each subfolder
                            const subFiles = await this.listFiles(commonPrefix.Prefix, delimiter)
                            allFiles.push(...subFiles)
                        }
                    }
                }
            }

            console.log(`S3 listed ${allFiles.length} files with prefix: ${prefix}`)
            return allFiles
        } catch (error) {
            console.error('Error listing files from S3:', error)
            return []
        }
    }

    /**
     * Get a file from the S3 bucket
     * @param key The key/path of the file to get
     * @returns Promise resolving to file data and content type
     */
    async getFile(key: string): Promise<{
        data: Buffer;
        contentType?: string;
    } | null> {
        try {
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                })
            )

            // Convert the stream to a buffer
            const chunks: Uint8Array[] = []
            const stream = response.Body as any

            if (stream) {
                for await (const chunk of stream) {
                    chunks.push(chunk)
                }
            }

            const buffer = Buffer.concat(chunks)

            return {
                data: buffer,
                contentType: response.ContentType
            }
        } catch (error) {
            // If the file doesn't exist, return null
            if ((error as any).name === 'NoSuchKey') {
                return null
            }
            console.error('Error getting file from S3:', error)
            return null
        }
    }
}

export default S3StorageProvider