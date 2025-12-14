import {parseQuery} from '../parser';

describe('parseQuery list values', () => {
    it('parses list with or and not prefixes', () => {
        const parsed = parseQuery('[Where posts:tags ("rating_safe" "~test" "-blocked")]');
        const stmt = parsed.statements[0];
        if (!('expr' in stmt)) throw new Error('expected expression statement');
        const atom = stmt.expr.op === 'ATOM' ? stmt.expr.where : null;
        if (!atom || atom.kind !== 'basic') throw new Error('expected basic atom');
        const value = atom.value;
        expect(value.type).toBe('list');
        if (value.type !== 'list') return;
        expect(value.items).toEqual([
            {value: 'rating_safe', or: undefined, not: undefined},
            {value: 'test', or: true, not: undefined},
            {value: 'blocked', or: undefined, not: true},
        ]);
    });
});
