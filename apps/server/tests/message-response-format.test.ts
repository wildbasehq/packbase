import { test, expect } from 'bun:test';

// Mock message data that would come from the database
const mockMessage = {
    id: 'test-id',
    channel_id: 'test-channel',
    author_id: 'test-author',
    content: 'test content',
    message_type: 'text',
    created_at: new Date('2025-08-28T07:31:29.681Z'),
    edited_at: new Date('2025-08-28T08:00:00.000Z'), // Non-null date
    deleted_at: null, // Null date
    reply_to: null,
};

const mockMessageWithNullDates = {
    id: 'test-id-2',
    channel_id: 'test-channel',
    author_id: 'test-author',
    content: 'test content',
    message_type: 'text',
    created_at: new Date('2025-08-28T07:31:29.681Z'),
    edited_at: null, // Null date
    deleted_at: null, // Null date
    reply_to: null,
};

// Function that mimics the mapping logic from the GET handler
function mapMessageToResponse(m: any) {
    return {
        id: m.id,
        channel_id: m.channel_id,
        author_id: m.author_id,
        content: m.deleted_at ? null : m.content,
        message_type: m.message_type,
        created_at: m.created_at.toISOString(),
        edited_at: m.edited_at?.toISOString() || null,
        deleted_at: m.deleted_at?.toISOString() || null,
        reply_to: m.reply_to,
    };
}

test('message response format validation', () => {
    test('should properly serialize date fields when they exist', () => {
        const response = mapMessageToResponse(mockMessage);
        
        // All required fields should be present
        expect(response).toHaveProperty('id');
        expect(response).toHaveProperty('channel_id');
        expect(response).toHaveProperty('author_id');
        expect(response).toHaveProperty('content');
        expect(response).toHaveProperty('message_type');
        expect(response).toHaveProperty('created_at');
        expect(response).toHaveProperty('edited_at');
        expect(response).toHaveProperty('deleted_at');
        expect(response).toHaveProperty('reply_to');
        
        // Date fields should be ISO strings or null
        expect(typeof response.created_at).toBe('string');
        expect(response.created_at).toBe('2025-08-28T07:31:29.681Z');
        
        expect(typeof response.edited_at).toBe('string');
        expect(response.edited_at).toBe('2025-08-28T08:00:00.000Z');
        
        expect(response.deleted_at).toBe(null);
        expect(response.reply_to).toBe(null);
        
        // Should have exactly 9 properties as expected by schema
        expect(Object.keys(response)).toHaveLength(9);
    });
    
    test('should handle null date fields correctly', () => {
        const response = mapMessageToResponse(mockMessageWithNullDates);
        
        expect(response.created_at).toBe('2025-08-28T07:31:29.681Z');
        expect(response.edited_at).toBe(null);
        expect(response.deleted_at).toBe(null);
        expect(response.reply_to).toBe(null);
        
        // Should still have exactly 9 properties
        expect(Object.keys(response)).toHaveLength(9);
    });
});