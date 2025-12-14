import { test, expect } from 'bun:test';
import { tokenize } from '@/lib/search/lexer';
import { parse } from '@/lib/search/parser';
import { NodeType, QueryNode, BetweenExprNode, WhereClauseNode } from '@/lib/search/types';

function getWhereExpression(query: string) {
  const tokens = tokenize(query);
  const ast = parse(tokens) as QueryNode;
  const where = ast.whereClause as WhereClauseNode;
  return where.condition;
}

// Parsing range for numbers: (10..99)
test('parser supports numeric range syntax (10..99)', () => {
  const expr = getWhereExpression('[Where posts:likes (10..99)]');
  expect(expr.type).toBe(NodeType.BETWEEN_EXPR);
  const between = expr as BetweenExprNode;
  expect(between.start.type).toBe(NodeType.NUMBER_LITERAL);
  expect(between.end.type).toBe(NodeType.NUMBER_LITERAL);
  // @ts-ignore
  expect(between.start.value).toBe(10);
  // @ts-ignore
  expect(between.end.value).toBe(99);
});

// Parsing range for strings: ("".."some-id")
test('parser supports string range syntax ("".."some-id")', () => {
  const expr = getWhereExpression('[Where profiles:username ("".."some-id")]');
  expect(expr.type).toBe(NodeType.BETWEEN_EXPR);
  const between = expr as BetweenExprNode;
  expect(between.start.type).toBe(NodeType.STRING_LITERAL);
  expect(between.end.type).toBe(NodeType.STRING_LITERAL);
  // @ts-ignore
  expect(between.start.value).toBe("");
  // @ts-ignore
  expect(between.end.value).toBe("some-id");
});
