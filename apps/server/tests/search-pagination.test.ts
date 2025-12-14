import { test, expect, mock, describe, beforeEach } from 'bun:test';
import { parseQuery } from '../src/lib/search/parser';
import { executeQuery } from '../src/lib/search/executor';

// Mock prisma
const mockFindMany = mock(() => Promise.resolve([]));
const mockPrisma = {
    user: {
        findMany: mockFindMany
    },
    post: {
        findMany: mockFindMany
    }
};

mock.module('@/db/prisma', () => ({
    default: mockPrisma
}));

// Mock schema
mock.module('@/lib/search/schema', () => ({
    isValidTable: (t: string) => ['user', 'post'].includes(t),
    getColumn: (t: string, c: string) => ({ type: 'string', name: c }),
    getDefaultIdColumn: () => ({ name: 'id' }),
    Schemas: {
        user: { columns: { id: {}, name: {} } },
        post: { columns: { id: {}, title: {} } }
    },
    Relations: []
}));

// Mock whitelist
mock.module('@/lib/search/whitelist', () => ({
    ensureTableWhitelisted: () => { },
    ensureColumnsWhitelisted: () => { },
    ensureAllColumnsAllowed: () => { }
}));

// Mock cache
mock.module('@/lib/search/cache', () => ({
    makeCacheKey: () => 'key',
    withQueryCache: (k: string, fn: Function) => fn()
}));

describe('Search Pagination', () => {
    beforeEach(() => {
        mockFindMany.mockClear();
    });

    test('should parse @PAGE syntax with literals', () => {
        const query = '@PAGE(10, 5, [Where user ("*")])';
        const parsed = parseQuery(query);
        expect(parsed.statements).toHaveLength(1);
        const stmt = parsed.statements[0];
        expect(stmt.skip).toBe(10);
        expect(stmt.take).toBe(5);
        // Check if query is parsed correctly as expression
        if ('expr' in stmt) {
            expect(stmt.expr.op).toBe('ATOM');
        }
    });

    test('should parse @PAGE syntax with variables', () => {
        const query = '@PAGE($skip, $take, [Where user ("*")])';
        const parsed = parseQuery(query);
        const stmt = parsed.statements[0];
        expect(stmt.skip).toBe('$skip');
        expect(stmt.take).toBe('$take');
    });

    test('should execute with skip and take literals', async () => {
        const query = '@PAGE(10, 5, [Where user ("*")])';
        const parsed = parseQuery(query);
        await executeQuery(parsed.statements);

        expect(mockFindMany).toHaveBeenCalled();
        const args = mockFindMany.mock.calls[0]?.[0] as any;
        expect(args).toBeDefined();
        expect(args.skip).toBe(10);
        expect(args.take).toBe(5);
    });

    test('should execute with variable skip', async () => {
        // Mock first query to return 3 items, so COUNT is 3
        mockFindMany.mockResolvedValueOnce([{}, {}, {}]);
        mockFindMany.mockResolvedValueOnce([]); // Second query result

        const query = '$skip = [COUNT() Where user ("*")]; @PAGE($skip, 5, [Where post ("*")])';
        const parsed = parseQuery(query);
        await executeQuery(parsed.statements);

        console.log('Calls:', mockFindMany.mock.calls.length);
        expect(mockFindMany).toHaveBeenCalledTimes(2);

        // First query: user count
        // Second query: post with skip=3
        const args = mockFindMany.mock.calls[1]?.[0] as any;
        if (!args) throw new Error('Second call missing');
        console.log('Args:', args);
        expect(args.skip).toBe(3);
        expect(args.take).toBe(5);
    });

    test('should handle trailing AS clause with @PAGE', () => {
        const query = '@PAGE(10, 5, [Where user ("*")]) AS name';
        const parsed = parseQuery(query);
        const stmt = parsed.statements[0];
        expect(stmt.skip).toBe(10);
        expect(stmt.take).toBe(5);
        expect(stmt.asColumn).toBe('name');
    });
});
