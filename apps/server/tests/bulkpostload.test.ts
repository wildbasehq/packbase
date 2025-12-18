import {describe, expect, it} from 'bun:test';
import {parseQuery} from '../src/lib/search/parser';

describe('BulkPostLoad Parser', () => {
    it('should parse @BULKPOSTLOAD with query', () => {
        const query = '@BULKPOSTLOAD([Where posts:id ("some-id")])';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        expect(result.statements[0]).toHaveProperty('type', 'bulkpostload');
        expect(result.statements[0]).toHaveProperty('expr');
    });

    it('should parse @BULKPOSTLOAD with currentUserId', () => {
        const query = '@BULKPOSTLOAD("user123", [Where posts:id ("post-id")])';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.currentUserId).toBe('user123');
            expect(stmt.expr).toBeDefined();
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with variable reference for userId', () => {
        const query = '@BULKPOSTLOAD($userId, [Where posts:channel_id ("channel-123")])';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.currentUserId).toBe('$userId');
            expect(stmt.expr).toBeDefined();
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with AS projection', () => {
        const query = '@BULKPOSTLOAD([Where posts:id ("some-id")] AS id)';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.asColumn).toBe('id');
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with complex WHERE clause', () => {
        const query = '@BULKPOSTLOAD([Where posts:channel_id ("channel-123") AND posts:created_at ("2023-01-01".."2023-12-31")])';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.expr.op).toBe('AND');
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with variable assignment', () => {
        const query = '$posts = @BULKPOSTLOAD([Where posts:channel_id ("channel-123")])';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.name).toBe('posts');
            expect(stmt.expr).toBeDefined();
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with variable assignment and currentUserId', () => {
        const query = '$enrichedPosts = @BULKPOSTLOAD($currentUser, [Where posts:id ("post-123")])';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.name).toBe('enrichedPosts');
            expect(stmt.currentUserId).toBe('$currentUser');
            expect(stmt.expr).toBeDefined();
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with @PAGE wrapper', () => {
        const query = '@BULKPOSTLOAD(@PAGE(0, 10, [Where posts:channel_id ("channel-123")]))';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.skip).toBe(0);
            expect(stmt.take).toBe(10);
            expect(stmt.expr).toBeDefined();
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with currentUserId and @PAGE wrapper', () => {
        const query = '@BULKPOSTLOAD("user-456", @PAGE(5, 15, [Where posts:channel_id ("channel-789")]))';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.currentUserId).toBe('user-456');
            expect(stmt.skip).toBe(5);
            expect(stmt.take).toBe(15);
            expect(stmt.expr).toBeDefined();
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with variable assignment and @PAGE', () => {
        const query = '$posts = @BULKPOSTLOAD(@PAGE(0, 20, [Where posts:id ("post-abc")]))';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.name).toBe('posts');
            expect(stmt.skip).toBe(0);
            expect(stmt.take).toBe(20);
            expect(stmt.expr).toBeDefined();
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });

    it('should parse @BULKPOSTLOAD with variable userId and @PAGE wrapper', () => {
        const query = '$enrichedPosts = @BULKPOSTLOAD($currentUser, @PAGE(10, 25, [Where posts:channel_id ("channel-xyz")]))';
        const result = parseQuery(query);

        expect(result.statements).toHaveLength(1);
        const stmt = result.statements[0];

        if ('type' in stmt && stmt.type === 'bulkpostload') {
            expect(stmt.name).toBe('enrichedPosts');
            expect(stmt.currentUserId).toBe('$currentUser');
            expect(stmt.skip).toBe(10);
            expect(stmt.take).toBe(25);
            expect(stmt.expr).toBeDefined();
        } else {
            throw new Error('Expected bulkpostload statement');
        }
    });
});


