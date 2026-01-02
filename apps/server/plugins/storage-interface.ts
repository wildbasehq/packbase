import { Readable } from 'stream';
/**
 * Abstract interface for storage providers
 * This interface defines the operations that any storage provider must implement
 */
export interface StorageProvider {
    /**
     * Upload a file to the storage
     * @param key The key/path where the file should be stored
     * @param data The file data as a Buffer
     * @param contentType The content type of the file
     * @returns Promise resolving to success status
     */
    uploadFile(key: string, data: Buffer | Readable, contentType: string): Promise<boolean>;

    /**
     * Delete a file from the storage
     * @param key The key/path of the file to delete
     * @returns Promise resolving to success status
     */
    deleteFile(key: string): Promise<boolean>;

    /**
     * List files in the storage with a given prefix
     * @param prefix The prefix to filter files by
     * @param delimiter Optional delimiter for hierarchical listing
     * @returns Promise resolving to array of file information
     */
    listFiles(prefix: string, delimiter?: string): Promise<Array<{
        name: string;
        path: string;
        lastModified: Date;
        size: number;
    }>>;

    /**
     * Get a file from the storage
     * @param key The key/path of the file to get
     * @returns Promise resolving to file data and content type
     */
    getFile(key: string): Promise<{
        data: Buffer;
        contentType?: string;
    } | null>;
}