import {parseQuery} from '@/lib/search/parser'
import {expect, test} from 'bun:test'

test('should parse variable assignment with @PAGE', () => {
    const query = '$posts = @PAGE(0, 10, [Where posts ("*")])'
    const parsed = parseQuery(query)
    expect(parsed.statements).toHaveLength(1)
    const stmt = parsed.statements[0]
    expect(stmt).toHaveProperty('name', 'posts')
    expect(stmt.skip).toBe(0)
    expect(stmt.take).toBe(10)
})
