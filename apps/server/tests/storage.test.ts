import { test, expect, mock } from 'bun:test';
import { Storage } from '@/lib/class/storage/index';
import { StorageProvider } from '../plugins/storage-interface';

// Create a mock StorageProvider
class MockStorageProvider implements StorageProvider {
  // Mock data for tests
  private versionControlData = [
    { id: 'test-version-1', timestamp: '2023-01-01T00:00:00.000Z', deleted: false },
    { id: 'test-version-2', timestamp: '2023-01-02T00:00:00.000Z', deleted: false }
  ];

  private fileData = Buffer.from('test-data');

  private files = [
    { name: 'test-file.png', path: 'user123/test-file.png', lastModified: new Date(), size: 1024 },
    { name: 'file.png', path: 'user123/test-folder/file.png', lastModified: new Date(), size: 2048 }
  ];

  // Mock implementation of StorageProvider methods
  uploadFile = mock(async (key: string, data: Buffer, contentType: string): Promise<boolean> => {
    return true;
  });

  deleteFile = mock(async (key: string): Promise<boolean> => {
    return true;
  });

  listFiles = mock(async (prefix: string, delimiter?: string): Promise<Array<{
    name: string;
    path: string;
    lastModified: Date;
    size: number;
  }>> => {
    return this.files;
  });

  getFile = mock(async (key: string): Promise<{
    data: Buffer;
    contentType?: string;
  } | null> => {
    if (key.includes('.vc.json')) {
      return {
        data: Buffer.from(JSON.stringify(this.versionControlData)),
        contentType: 'application/json'
      };
    } else {
      return {
        data: this.fileData,
        contentType: 'image/png'
      };
    }
  });
}

// Test the Storage class
test('Storage class', () => {
  // Create a mock storage provider
  const mockProvider = new MockStorageProvider();

  // Create a test instance with the mock provider
  const storage = new Storage(mockProvider);

  test('uploadBase64Image should process and upload an image', async () => {
    const result = await storage.uploadBase64Image(
      'user123',
      'test-file.{ext}',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    );

    expect(result.success).toBe(true);
    expect(result.path).toBe('user123/test-file.png');
    expect(result.version).toBeDefined();
    expect(mockProvider.uploadFile).toHaveBeenCalledTimes(2); // One for upload, one for version control
  });

  test('deleteFile should delete a file and update version control', async () => {
    const result = await storage.deleteFile('user123', 'test-file.png');

    expect(result.success).toBe(true);
    expect(mockProvider.deleteFile).toHaveBeenCalledTimes(1);
    expect(mockProvider.uploadFile).toHaveBeenCalledTimes(1); // For version control
  });

  test('listFiles should return files in a bucket or folder', async () => {
    const result = await storage.listFiles('user123');

    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(result.files?.[0].name).toBe('test-file.png');
    expect(result.files?.[1].name).toBe('file.png');
    expect(mockProvider.listFiles).toHaveBeenCalledTimes(1);
  });

  test('getVersionControl should return version control data', async () => {
    const result = await storage.getVersionControl('user123', 'test-file.png');

    expect(result.success).toBe(true);
    expect(result.versions).toHaveLength(2);
    expect(result.versions?.[0].id).toBe('test-version-1');
    expect(result.versions?.[1].id).toBe('test-version-2');
    expect(mockProvider.getFile).toHaveBeenCalledTimes(1);
  });

  test('getFileVersion should return a specific file version', async () => {
    const result = await storage.getFileVersion('user123', 'test-file.png', 'test-version-1');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.contentType).toBe('image/png');
    expect(mockProvider.getFile).toHaveBeenCalledTimes(2); // One for version control, one for file
  });
});

// Test the createStorage factory function
test('createStorage should create a Storage instance with default config', () => {
  // Save original env
  const originalEnv = { ...process.env };

  // Set test env variables
  process.env.S3_ENDPOINT = 'https://test-endpoint.com';
  process.env.S3_REGION = 'test-region';
  process.env.S3_ACCESS_KEY = 'test-key';
  process.env.S3_SECRET_KEY = 'test-secret';

  // Import the function directly to get a fresh instance
  const { createStorage } = require('@/lib/class/storage/index');

  const storage = createStorage('test-bucket');

  expect(storage).toBeInstanceOf(Storage);

  // We can't easily mock the S3StorageProvider.createFromEnv static method in this test
  // since it's imported dynamically, but we can verify that the Storage instance was created

  // Restore original env
  process.env = originalEnv;
});
