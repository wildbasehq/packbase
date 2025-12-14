/**
 * Types and interfaces for the search API
 */

// Token types for lexer
export enum TokenType {
  // Syntax tokens
  OPEN_BRACKET = 'OPEN_BRACKET',
  CLOSE_BRACKET = 'CLOSE_BRACKET',
  OPEN_PAREN = 'OPEN_PAREN',
  CLOSE_PAREN = 'CLOSE_PAREN',
  COLON = 'COLON',
  COMMA = 'COMMA',
  
  // Keywords
  WHERE = 'WHERE',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  SORT = 'SORT',
  BY = 'BY',
  ASC = 'ASC',
  DESC = 'DESC',
  BETWEEN = 'BETWEEN',
  EXISTS = 'EXISTS',
  EXACT = 'EXACT',
  FUZZY = 'FUZZY',
  CASE = 'CASE',
  
  // Values
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  IDENTIFIER = 'IDENTIFIER',
  TABLE = 'TABLE',
  COLUMN = 'COLUMN',
  
  // Operators
  EQUALS = 'EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_EQUALS = 'GREATER_THAN_EQUALS',
  LESS_THAN_EQUALS = 'LESS_THAN_EQUALS',
  RANGE = 'RANGE',
  
  // Special
  NAMED_QUERY = 'NAMED_QUERY',
  EOF = 'EOF',
}

// Token interface
export interface Token {
  type: TokenType;
  value: string;
  position: {
    line: number;
    column: number;
  };
}

// AST Node types
export enum NodeType {
  // Query nodes
  QUERY = 'QUERY',
  WHERE_CLAUSE = 'WHERE_CLAUSE',
  TABLE_REF = 'TABLE_REF',
  COLUMN_REF = 'COLUMN_REF',
  
  // Logical operators
  AND_EXPR = 'AND_EXPR',
  OR_EXPR = 'OR_EXPR',
  NOT_EXPR = 'NOT_EXPR',
  
  // Comparison operators
  EQUALS_EXPR = 'EQUALS_EXPR',
  GREATER_THAN_EXPR = 'GREATER_THAN_EXPR',
  LESS_THAN_EXPR = 'LESS_THAN_EXPR',
  GREATER_THAN_EQUALS_EXPR = 'GREATER_THAN_EQUALS_EXPR',
  LESS_THAN_EQUALS_EXPR = 'LESS_THAN_EQUALS_EXPR',
  BETWEEN_EXPR = 'BETWEEN_EXPR',
  EXISTS_EXPR = 'EXISTS_EXPR',
  
  // Special features
  SORT_EXPR = 'SORT_EXPR',
  WILDCARD_EXPR = 'WILDCARD_EXPR',
  FUZZY_EXPR = 'FUZZY_EXPR',
  EXACT_EXPR = 'EXACT_EXPR',
  CASE_EXPR = 'CASE_EXPR',
  
  // Literals
  STRING_LITERAL = 'STRING_LITERAL',
  NUMBER_LITERAL = 'NUMBER_LITERAL',
  BOOLEAN_LITERAL = 'BOOLEAN_LITERAL',
  
  // Named queries
  NAMED_QUERY_REF = 'NAMED_QUERY_REF',
  NAMED_QUERY_DEF = 'NAMED_QUERY_DEF',
}

// Base AST Node interface
export interface ASTNode {
  type: NodeType;
  position?: {
    start: {
      line: number;
      column: number;
    };
    end: {
      line: number;
      column: number;
    };
  };
}

// Query node
export interface QueryNode extends ASTNode {
  type: NodeType.QUERY;
  whereClause: WhereClauseNode;
  sortExpr?: SortExprNode;
}

// Where clause node
export interface WhereClauseNode extends ASTNode {
  type: NodeType.WHERE_CLAUSE;
  table: TableRefNode;
  column?: ColumnRefNode;
  condition: ExpressionNode;
}

// Table reference node
export interface TableRefNode extends ASTNode {
  type: NodeType.TABLE_REF;
  name: string;
}

// Column reference node
export interface ColumnRefNode extends ASTNode {
  type: NodeType.COLUMN_REF;
  name: string;
}

// Base expression node
export interface ExpressionNode extends ASTNode {
  type: NodeType;
}

// Logical operator nodes
export interface AndExprNode extends ExpressionNode {
  type: NodeType.AND_EXPR;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface OrExprNode extends ExpressionNode {
  type: NodeType.OR_EXPR;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface NotExprNode extends ExpressionNode {
  type: NodeType.NOT_EXPR;
  expr: ExpressionNode;
}

// Comparison operator nodes
export interface EqualsExprNode extends ExpressionNode {
  type: NodeType.EQUALS_EXPR;
  value: StringLiteralNode | NumberLiteralNode | BooleanLiteralNode;
}

export interface GreaterThanExprNode extends ExpressionNode {
  type: NodeType.GREATER_THAN_EXPR;
  value: NumberLiteralNode;
}

export interface LessThanExprNode extends ExpressionNode {
  type: NodeType.LESS_THAN_EXPR;
  value: NumberLiteralNode;
}

export interface GreaterThanEqualsExprNode extends ExpressionNode {
  type: NodeType.GREATER_THAN_EQUALS_EXPR;
  value: NumberLiteralNode;
}

export interface LessThanEqualsExprNode extends ExpressionNode {
  type: NodeType.LESS_THAN_EQUALS_EXPR;
  value: NumberLiteralNode;
}

export interface BetweenExprNode extends ExpressionNode {
  type: NodeType.BETWEEN_EXPR;
  start: StringLiteralNode | NumberLiteralNode;
  end: StringLiteralNode | NumberLiteralNode;
}

export interface ExistsExprNode extends ExpressionNode {
  type: NodeType.EXISTS_EXPR;
}

// Special feature nodes
export interface SortExprNode extends ASTNode {
  type: NodeType.SORT_EXPR;
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface WildcardExprNode extends ExpressionNode {
  type: NodeType.WILDCARD_EXPR;
  pattern: string;
}

export interface FuzzyExprNode extends ExpressionNode {
  type: NodeType.FUZZY_EXPR;
  term: string;
  distance: number;
}

export interface ExactExprNode extends ExpressionNode {
  type: NodeType.EXACT_EXPR;
  term: string;
}

export interface CaseExprNode extends ExpressionNode {
  type: NodeType.CASE_EXPR;
  caseSensitive: boolean;
}

// Literal nodes
export interface StringLiteralNode extends ExpressionNode {
  type: NodeType.STRING_LITERAL;
  value: string;
}

export interface NumberLiteralNode extends ExpressionNode {
  type: NodeType.NUMBER_LITERAL;
  value: number;
}

export interface BooleanLiteralNode extends ExpressionNode {
  type: NodeType.BOOLEAN_LITERAL;
  value: boolean;
}

// Named query nodes
export interface NamedQueryRefNode extends ExpressionNode {
  type: NodeType.NAMED_QUERY_REF;
  name: string;
}

export interface NamedQueryDefNode extends ASTNode {
  type: NodeType.NAMED_QUERY_DEF;
  name: string;
  query: QueryNode;
}

// Search result interface
export interface SearchResult {
  id: string; // UUID
  table: string;
  score?: number;
  metadata?: Record<string, any>;
}

// Search error interface
export interface SearchError {
  message: string;
  position?: {
    line: number;
    column: number;
  };
  code: string;
}