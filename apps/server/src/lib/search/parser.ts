/**
 * Parser for the search API
 * Converts a stream of tokens into an Abstract Syntax Tree (AST)
 */

import {
    ColumnRefNode,
    EqualsExprNode,
    ExpressionNode,
    NamedQueryDefNode,
    NodeType,
    NumberLiteralNode,
    OrExprNode,
    QueryNode,
    SortExprNode,
    StringLiteralNode,
    TableRefNode,
    Token,
    TokenType,
    WhereClauseNode
} from './types';

export class SearchParserError extends Error {
    position: { line: number; column: number };
    code: string;

    constructor(message: string, token: Token, code: string = 'PARSER_ERROR') {
        super(message);
        this.name = 'SearchParserError';
        this.position = token.position;
        this.code = code;
    }
}

export class Parser {
    private tokens: Token[];
    private current: number = 0;
    private namedQueries: Map<string, QueryNode> = new Map();

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    /**
     * Parse the tokens into an AST
     * @returns The root query node
     */
    parse(): QueryNode {
        try {
            return this.query();
        } catch (error) {
            if (error instanceof SearchParserError) {
                throw error;
            }
            // Convert any other errors to SearchParserError
            throw new SearchParserError(
                error instanceof Error ? error.message : String(error),
                this.peek(),
                'UNEXPECTED_ERROR'
            );
        }
    }

    /**
     * Parse a query
     * @returns A query node
     */
    private query(): QueryNode {
        // Check for named query definition
        if (this.match(TokenType.NAMED_QUERY)) {
            const nameToken = this.previous();
            const name = nameToken.value;

            // Parse the query definition
            const query = this.query();

            // Store the named query
            this.namedQueries.set(name, query);

            // Create a named query definition node
            const namedQueryDef: NamedQueryDefNode = {
                type: NodeType.NAMED_QUERY_DEF,
                name,
                query,
                position: {
                    start: {line: nameToken.position.line, column: nameToken.position.column},
                    end: {
                        line: this.previous().position.line,
                        column: this.previous().position.column + this.previous().value.length
                    }
                }
            };

            // Return the query part of the definition
            return query;
        }

        // Check for named query reference
        if (this.check(TokenType.NAMED_QUERY)) {
            const nameToken = this.advance();
            const name = nameToken.value;

            // Look up the named query
            const query = this.namedQueries.get(name);
            if (!query) {
                throw new SearchParserError(
                    `Referenced named query '${name}' is not defined`,
                    nameToken,
                    'UNDEFINED_NAMED_QUERY'
                );
            }

            // Return a copy of the named query
            return JSON.parse(JSON.stringify(query));
        }

        // Parse a regular query
        let whereClause = this.whereClause();

        // Check for OR between WHERE clauses
        while (this.match(TokenType.OR)) {
            // Parse another WHERE clause
            if (this.check(TokenType.OPEN_BRACKET)) {
                const rightWhereClause = this.whereClause();

                // Create an OR expression node with the two WHERE clauses
                whereClause = {
                    type: NodeType.OR_EXPR,
                    left: whereClause,
                    right: rightWhereClause,
                    position: {
                        start: whereClause.position!.start,
                        end: rightWhereClause.position!.end
                    }
                } as OrExprNode;
            } else {
                // If not followed by a WHERE clause, it's a regular OR expression
                // which will be handled by the expression parser
                this.current--; // Put the OR token back
                break;
            }
        }

        // Check for sort expression
        let sortExpr: SortExprNode | undefined;
        if (this.match(TokenType.SORT)) {
            this.consume(TokenType.BY, "Expected 'BY' after 'SORT'");
            const fieldToken = this.consume(TokenType.IDENTIFIER, "Expected field name after 'SORT BY'");

            // Check for direction (ASC/DESC)
            let direction: 'ASC' | 'DESC' = 'ASC'; // Default to ASC
            if (this.match(TokenType.ASC)) {
                direction = 'ASC';
            } else if (this.match(TokenType.DESC)) {
                direction = 'DESC';
            }

            sortExpr = {
                type: NodeType.SORT_EXPR,
                field: fieldToken.value,
                direction,
                position: {
                    start: {line: fieldToken.position.line, column: fieldToken.position.column},
                    end: {
                        line: this.previous().position.line,
                        column: this.previous().position.column + this.previous().value.length
                    }
                }
            };
        }

        return {
            type: NodeType.QUERY,
            whereClause,
            sortExpr,
            position: {
                start: whereClause.position!.start,
                end: sortExpr
                    ? sortExpr.position!.end
                    : whereClause.position!.end
            }
        };
    }

    /**
     * Parse a WHERE clause
     * @returns A where clause node
     */
    private whereClause(): WhereClauseNode {
        const startToken = this.consume(TokenType.OPEN_BRACKET, "Expected '[' at the start of query");
        this.consume(TokenType.WHERE, "Expected 'WHERE' after '['");

        // Parse table reference
        const tableToken = this.consume(TokenType.IDENTIFIER, "Expected table name after 'WHERE'");
        const table: TableRefNode = {
            type: NodeType.TABLE_REF,
            name: tableToken.value,
            position: {
                start: {line: tableToken.position.line, column: tableToken.position.column},
                end: {
                    line: tableToken.position.line,
                    column: tableToken.position.column + tableToken.value.length
                }
            }
        };

        // Check for column reference
        let column: ColumnRefNode | undefined;
        if (this.match(TokenType.COLON)) {
            const columnToken = this.consume(TokenType.IDENTIFIER, "Expected column name after ':'");
            column = {
                type: NodeType.COLUMN_REF,
                name: columnToken.value,
                position: {
                    start: {line: columnToken.position.line, column: columnToken.position.column},
                    end: {
                        line: columnToken.position.line,
                        column: columnToken.position.column + columnToken.value.length
                    }
                }
            };
        }

        // Parse condition
        const condition = this.expression();

        const endToken = this.consume(TokenType.CLOSE_BRACKET, "Expected ']' at the end of query");

        return {
            type: NodeType.WHERE_CLAUSE,
            table,
            column,
            condition,
            position: {
                start: {line: startToken.position.line, column: startToken.position.column},
                end: {line: endToken.position.line, column: endToken.position.column}
            }
        };
    }

    /**
     * Parse an expression
     * @returns An expression node
     */
    private expression(): ExpressionNode {
        return this.logicalOr();
    }

    /**
     * Parse a logical OR expression
     * @returns An expression node
     */
    private logicalOr(): ExpressionNode {
        let expr = this.logicalAnd();

        while (this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.logicalAnd();

            expr = {
                type: NodeType.OR_EXPR,
                left: expr,
                right,
                position: {
                    start: expr.position!.start,
                    end: right.position!.end
                }
            };
        }

        return expr;
    }

    /**
     * Parse a logical AND expression
     * @returns An expression node
     */
    private logicalAnd(): ExpressionNode {
        let expr = this.unary();

        while (this.match(TokenType.AND)) {
            const operator = this.previous();

            // Check if the next token is an open bracket (for nested query)
            if (this.check(TokenType.OPEN_BRACKET)) {
                // Parse the nested query
                const right = this.primary(); // This will handle the nested query

                expr = {
                    type: NodeType.AND_EXPR,
                    left: expr,
                    right,
                    position: {
                        start: expr.position!.start,
                        end: right.position!.end
                    }
                };
            } else {
                // Regular AND expression
                const right = this.unary();

                expr = {
                    type: NodeType.AND_EXPR,
                    left: expr,
                    right,
                    position: {
                        start: expr.position!.start,
                        end: right.position!.end
                    }
                };
            }
        }

        return expr;
    }

    /**
     * Parse a unary expression
     * @returns An expression node
     */
    private unary(): ExpressionNode {
        if (this.match(TokenType.NOT)) {
            const operator = this.previous();
            const expr = this.unary();

            return {
                type: NodeType.NOT_EXPR,
                expr,
                position: {
                    start: {line: operator.position.line, column: operator.position.column},
                    end: expr.position!.end
                }
            };
        }

        return this.primary();
    }

    /**
     * Parse a primary expression
     * @returns An expression node
     */
    private primary(): ExpressionNode {
        // Handle nested queries
        if (this.match(TokenType.OPEN_BRACKET)) {
            // Put the token back so the whereClause parser can consume it
            this.current--;

            return this.whereClause();
        }

        // Handle parenthesized expressions
        if (this.match(TokenType.OPEN_PAREN)) {
            // Check for range syntax: (value..value)
            if (this.check(TokenType.STRING) || this.check(TokenType.NUMBER)) {
                const startTok = this.advance();
                const startIsString = startTok.type === TokenType.STRING;

                if (this.match(TokenType.RANGE)) {
                    // Right-hand side
                    const endTok = this.consume(
                        startIsString ? TokenType.STRING : TokenType.NUMBER,
                        startIsString
                            ? "Expected string literal after '..' in range expression"
                            : "Expected number literal after '..' in range expression",
                    );
                    this.consume(TokenType.CLOSE_PAREN, "Expected ')' after range expression");

                    const startNode = startIsString
                        ? ({ type: NodeType.STRING_LITERAL, value: startTok.value } as StringLiteralNode)
                        : ({ type: NodeType.NUMBER_LITERAL, value: Number(startTok.value) } as NumberLiteralNode);
                    const endNode = startIsString
                        ? ({ type: NodeType.STRING_LITERAL, value: endTok.value } as StringLiteralNode)
                        : ({ type: NodeType.NUMBER_LITERAL, value: Number(endTok.value) } as NumberLiteralNode);

                    return {
                        type: NodeType.BETWEEN_EXPR,
                        start: startNode as any,
                        end: endNode as any,
                        position: {
                            start: { line: startTok.position.line, column: startTok.position.column - 1 },
                            end: { line: this.previous().position.line, column: this.previous().position.column },
                        },
                    };
                }
            }

            // Check if the next token is a string literal
            if (this.check(TokenType.STRING)) {
                const stringToken = this.advance();

                // Check if there's a logical operator after the string
                if (this.match(TokenType.CLOSE_PAREN)) {
                    // Simple string literal in parentheses
                    // Create a string literal node
                    const stringLiteral: StringLiteralNode = {
                        type: NodeType.STRING_LITERAL,
                        value: stringToken.value,
                        position: {
                            start: {line: stringToken.position.line, column: stringToken.position.column},
                            end: {
                                line: stringToken.position.line,
                                column: stringToken.position.column + stringToken.value.length
                            }
                        }
                    };

                    // Create an equals expression node
                    return {
                        type: NodeType.EQUALS_EXPR,
                        value: stringLiteral,
                        position: {
                            start: {
                                line: this.previous().position.line,
                                column: this.previous().position.column - stringToken.value.length - 2
                            },
                            end: {
                                line: this.previous().position.line,
                                column: this.previous().position.column
                            }
                        }
                    };
                } else if (this.match(TokenType.AND, TokenType.OR)) {
                    // Logical operator after the string
                    const operator = this.previous();

                    // Create a string literal node for the left side
                    const leftStringLiteral: StringLiteralNode = {
                        type: NodeType.STRING_LITERAL,
                        value: stringToken.value,
                        position: {
                            start: {line: stringToken.position.line, column: stringToken.position.column},
                            end: {
                                line: stringToken.position.line,
                                column: stringToken.position.column + stringToken.value.length
                            }
                        }
                    };

                    // Create an equals expression node for the left side
                    const leftExpr: EqualsExprNode = {
                        type: NodeType.EQUALS_EXPR,
                        value: leftStringLiteral,
                        position: {
                            start: {line: stringToken.position.line, column: stringToken.position.column - 1},
                            end: {
                                line: stringToken.position.line,
                                column: stringToken.position.column + stringToken.value.length + 1
                            }
                        }
                    };

                    // Check if the next token is a string literal or an open bracket
                    if (this.check(TokenType.STRING)) {
                        // Parse a string literal for the right side
                        const rightStringToken = this.advance();

                        // Create a string literal node for the right side
                        const rightStringLiteral: StringLiteralNode = {
                            type: NodeType.STRING_LITERAL,
                            value: rightStringToken.value,
                            position: {
                                start: {line: rightStringToken.position.line, column: rightStringToken.position.column},
                                end: {
                                    line: rightStringToken.position.line,
                                    column: rightStringToken.position.column + rightStringToken.value.length
                                }
                            }
                        };

                        // Create an equals expression node for the right side
                        const rightExpr: EqualsExprNode = {
                            type: NodeType.EQUALS_EXPR,
                            value: rightStringLiteral,
                            position: {
                                start: {
                                    line: rightStringToken.position.line,
                                    column: rightStringToken.position.column - 1
                                },
                                end: {
                                    line: rightStringToken.position.line,
                                    column: rightStringToken.position.column + rightStringToken.value.length + 1
                                }
                            }
                        };

                        // Consume the closing parenthesis
                        this.consume(TokenType.CLOSE_PAREN, "Expected ')' after logical expression");

                        // Create the logical expression node
                        if (operator.type === TokenType.AND) {
                            return {
                                type: NodeType.AND_EXPR,
                                left: leftExpr,
                                right: rightExpr,
                                position: {
                                    start: leftExpr.position!.start,
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column
                                    }
                                }
                            };
                        } else {
                            return {
                                type: NodeType.OR_EXPR,
                                left: leftExpr,
                                right: rightExpr,
                                position: {
                                    start: leftExpr.position!.start,
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column
                                    }
                                }
                            };
                        }
                    } else if (this.check(TokenType.OPEN_BRACKET)) {
                        // Parse a nested query for the right side
                        const right = this.primary(); // This will handle the nested query

                        // Consume the closing parenthesis
                        this.consume(TokenType.CLOSE_PAREN, "Expected ')' after logical expression");

                        // Create the logical expression node
                        if (operator.type === TokenType.AND) {
                            return {
                                type: NodeType.AND_EXPR,
                                left: leftExpr,
                                right,
                                position: {
                                    start: leftExpr.position!.start,
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column
                                    }
                                }
                            };
                        } else {
                            return {
                                type: NodeType.OR_EXPR,
                                left: leftExpr,
                                right,
                                position: {
                                    start: leftExpr.position!.start,
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column
                                    }
                                }
                            };
                        }
                    } else {
                        // Parse the right side of the logical expression
                        const rightExpr = this.expression();

                        // Consume the closing parenthesis
                        this.consume(TokenType.CLOSE_PAREN, "Expected ')' after logical expression");

                        // Create the logical expression node
                        if (operator.type === TokenType.AND) {
                            return {
                                type: NodeType.AND_EXPR,
                                left: leftExpr,
                                right: rightExpr,
                                position: {
                                    start: leftExpr.position!.start,
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column
                                    }
                                }
                            };
                        } else {
                            return {
                                type: NodeType.OR_EXPR,
                                left: leftExpr,
                                right: rightExpr,
                                position: {
                                    start: leftExpr.position!.start,
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column
                                    }
                                }
                            };
                        }
                    }
                } else {
                    // No logical operator, just consume the closing parenthesis
                    this.consume(TokenType.CLOSE_PAREN, "Expected ')' after string literal");

                    // Create a string literal node
                    const stringLiteral: StringLiteralNode = {
                        type: NodeType.STRING_LITERAL,
                        value: stringToken.value,
                        position: {
                            start: {line: stringToken.position.line, column: stringToken.position.column},
                            end: {
                                line: stringToken.position.line,
                                column: stringToken.position.column + stringToken.value.length
                            }
                        }
                    };

                    // Create an equals expression node
                    return {
                        type: NodeType.EQUALS_EXPR,
                        value: stringLiteral,
                        position: {
                            start: {
                                line: this.previous().position.line,
                                column: this.previous().position.column - stringToken.value.length - 2
                            },
                            end: {
                                line: this.previous().position.line,
                                column: this.previous().position.column
                            }
                        }
                    };
                }
            }

            // Handle other types of expressions
            const expr = this.expression();
            this.consume(TokenType.CLOSE_PAREN, "Expected ')' after expression");
            return expr;
        }

        // Handle special expressions
        if (this.match(TokenType.EXISTS)) {
            const token = this.previous();
            return {
                type: NodeType.EXISTS_EXPR,
                position: {
                    start: {line: token.position.line, column: token.position.column},
                    end: {
                        line: token.position.line,
                        column: token.position.column + token.value.length
                    }
                }
            };
        }

        if (this.match(TokenType.EXACT)) {
            const token = this.previous();
            this.consume(TokenType.OPEN_PAREN, "Expected '(' after EXACT");
            const stringToken = this.consume(TokenType.STRING, "Expected string literal in EXACT expression");
            this.consume(TokenType.CLOSE_PAREN, "Expected ')' after string literal");

            return {
                type: NodeType.EXACT_EXPR,
                term: stringToken.value,
                position: {
                    start: {line: token.position.line, column: token.position.column},
                    end: {
                        line: this.previous().position.line,
                        column: this.previous().position.column + this.previous().value.length
                    }
                }
            };
        }

        if (this.match(TokenType.FUZZY)) {
            const token = this.previous();
            this.consume(TokenType.EQUALS, "Expected '=' after FUZZY");
            const distanceToken = this.consume(TokenType.NUMBER, "Expected number after FUZZY=");
            this.consume(TokenType.OPEN_PAREN, "Expected '(' after FUZZY=n");
            const stringToken = this.consume(TokenType.STRING, "Expected string literal in FUZZY expression");
            this.consume(TokenType.CLOSE_PAREN, "Expected ')' after string literal");

            return {
                type: NodeType.FUZZY_EXPR,
                term: stringToken.value,
                distance: Number(distanceToken.value),
                position: {
                    start: {line: token.position.line, column: token.position.column},
                    end: {
                        line: this.previous().position.line,
                        column: this.previous().position.column + this.previous().value.length
                    }
                }
            };
        }

        if (this.match(TokenType.CASE)) {
            const token = this.previous();
            this.consume(TokenType.EQUALS, "Expected '=' after CASE");
            const boolToken = this.consume(TokenType.IDENTIFIER, "Expected 'true' or 'false' after CASE=");

            if (boolToken.value.toLowerCase() !== 'true' && boolToken.value.toLowerCase() !== 'false') {
                throw new SearchParserError(
                    "Expected 'true' or 'false' after CASE=",
                    boolToken,
                    'INVALID_BOOLEAN'
                );
            }

            return {
                type: NodeType.CASE_EXPR,
                caseSensitive: boolToken.value.toLowerCase() === 'true',
                position: {
                    start: {line: token.position.line, column: token.position.column},
                    end: {
                        line: boolToken.position.line,
                        column: boolToken.position.column + boolToken.value.length
                    }
                }
            };
        }

        if (this.match(TokenType.BETWEEN)) {
            const token = this.previous();
            this.consume(TokenType.OPEN_PAREN, "Expected '(' after BETWEEN");

            // Parse start value
            const startToken = this.advance();
            if (startToken.type !== TokenType.STRING && startToken.type !== TokenType.NUMBER) {
                throw new SearchParserError(
                    "Expected string or number as start value in BETWEEN expression",
                    startToken,
                    'INVALID_BETWEEN_VALUE'
                );
            }

            const startValue = startToken.type === TokenType.STRING
                ? {type: NodeType.STRING_LITERAL, value: startToken.value} as StringLiteralNode
                : {type: NodeType.NUMBER_LITERAL, value: Number(startToken.value)} as NumberLiteralNode;

            this.consume(TokenType.AND, "Expected 'AND' between values in BETWEEN expression");

            // Parse end value
            const endToken = this.advance();
            if (endToken.type !== TokenType.STRING && endToken.type !== TokenType.NUMBER) {
                throw new SearchParserError(
                    "Expected string or number as end value in BETWEEN expression",
                    endToken,
                    'INVALID_BETWEEN_VALUE'
                );
            }

            const endValue = endToken.type === TokenType.STRING
                ? {type: NodeType.STRING_LITERAL, value: endToken.value} as StringLiteralNode
                : {type: NodeType.NUMBER_LITERAL, value: Number(endToken.value)} as NumberLiteralNode;

            this.consume(TokenType.CLOSE_PAREN, "Expected ')' after BETWEEN expression");

            return {
                type: NodeType.BETWEEN_EXPR,
                start: startValue,
                end: endValue,
                position: {
                    start: {line: token.position.line, column: token.position.column},
                    end: {
                        line: this.previous().position.line,
                        column: this.previous().position.column + this.previous().value.length
                    }
                }
            };
        }

        // Handle comparison expressions
        if (this.match(TokenType.OPEN_PAREN)) {
            const token = this.previous();

            // Check for wildcard pattern
            if (this.check(TokenType.STRING)) {
                const stringToken = this.advance();
                const value = stringToken.value;

                this.consume(TokenType.CLOSE_PAREN, "Expected ')' after string literal");

                // Check if the string contains wildcard characters
                if (value.includes('*')) {
                    return {
                        type: NodeType.WILDCARD_EXPR,
                        pattern: value,
                        position: {
                            start: {line: token.position.line, column: token.position.column},
                            end: {
                                line: this.previous().position.line,
                                column: this.previous().position.column + this.previous().value.length
                            }
                        }
                    };
                }

                // Regular string literal
                return {
                    type: NodeType.EQUALS_EXPR,
                    value: {
                        type: NodeType.STRING_LITERAL,
                        value,
                        position: {
                            start: {line: stringToken.position.line, column: stringToken.position.column},
                            end: {
                                line: stringToken.position.line,
                                column: stringToken.position.column + stringToken.value.length
                            }
                        }
                    },
                    position: {
                        start: {line: token.position.line, column: token.position.column},
                        end: {
                            line: this.previous().position.line,
                            column: this.previous().position.column + this.previous().value.length
                        }
                    }
                };
            }

            // Handle numeric comparisons
            if (this.check(TokenType.NUMBER)) {
                const numberToken = this.advance();
                const value = Number(numberToken.value);

                this.consume(TokenType.CLOSE_PAREN, "Expected ')' after number literal");

                return {
                    type: NodeType.EQUALS_EXPR,
                    value: {
                        type: NodeType.NUMBER_LITERAL,
                        value,
                        position: {
                            start: {line: numberToken.position.line, column: numberToken.position.column},
                            end: {
                                line: numberToken.position.line,
                                column: numberToken.position.column + numberToken.value.length
                            }
                        }
                    },
                    position: {
                        start: {line: token.position.line, column: token.position.column},
                        end: {
                            line: this.previous().position.line,
                            column: this.previous().position.column + this.previous().value.length
                        }
                    }
                };
            }

            // Handle boolean literals
            if (this.check(TokenType.IDENTIFIER)) {
                const identToken = this.advance();
                const value = identToken.value.toLowerCase();

                if (value !== 'true' && value !== 'false') {
                    throw new SearchParserError(
                        "Expected 'true' or 'false' for boolean literal",
                        identToken,
                        'INVALID_BOOLEAN'
                    );
                }

                this.consume(TokenType.CLOSE_PAREN, "Expected ')' after boolean literal");

                return {
                    type: NodeType.EQUALS_EXPR,
                    value: {
                        type: NodeType.BOOLEAN_LITERAL,
                        value: value === 'true',
                        position: {
                            start: {line: identToken.position.line, column: identToken.position.column},
                            end: {
                                line: identToken.position.line,
                                column: identToken.position.column + identToken.value.length
                            }
                        }
                    },
                    position: {
                        start: {line: token.position.line, column: token.position.column},
                        end: {
                            line: this.previous().position.line,
                            column: this.previous().position.column + this.previous().value.length
                        }
                    }
                };
            }
        }

        // Handle comparison operators
        if (this.match(TokenType.EQUALS, TokenType.GREATER_THAN, TokenType.LESS_THAN,
            TokenType.GREATER_THAN_EQUALS, TokenType.LESS_THAN_EQUALS)) {
            const operator = this.previous();

            // Expect a value after the operator
            if (this.match(TokenType.OPEN_PAREN)) {
                let valueToken;

                if (this.check(TokenType.STRING)) {
                    valueToken = this.advance();
                    this.consume(TokenType.CLOSE_PAREN, "Expected ')' after string literal");

                    const stringLiteral: StringLiteralNode = {
                        type: NodeType.STRING_LITERAL,
                        value: valueToken.value,
                        position: {
                            start: {line: valueToken.position.line, column: valueToken.position.column},
                            end: {
                                line: valueToken.position.line,
                                column: valueToken.position.column + valueToken.value.length
                            }
                        }
                    };

                    // Create the appropriate comparison node
                    switch (operator.type) {
                        case TokenType.EQUALS:
                            return {
                                type: NodeType.EQUALS_EXPR,
                                value: stringLiteral,
                                position: {
                                    start: {line: operator.position.line, column: operator.position.column},
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column + this.previous().value.length
                                    }
                                }
                            };
                        default:
                            throw new SearchParserError(
                                `Cannot use operator '${operator.value}' with string values`,
                                operator,
                                'INVALID_OPERATOR'
                            );
                    }
                }

                if (this.check(TokenType.NUMBER)) {
                    valueToken = this.advance();
                    this.consume(TokenType.CLOSE_PAREN, "Expected ')' after number literal");

                    const numberLiteral: NumberLiteralNode = {
                        type: NodeType.NUMBER_LITERAL,
                        value: Number(valueToken.value),
                        position: {
                            start: {line: valueToken.position.line, column: valueToken.position.column},
                            end: {
                                line: valueToken.position.line,
                                column: valueToken.position.column + valueToken.value.length
                            }
                        }
                    };

                    // Create the appropriate comparison node
                    switch (operator.type) {
                        case TokenType.EQUALS:
                            return {
                                type: NodeType.EQUALS_EXPR,
                                value: numberLiteral,
                                position: {
                                    start: {line: operator.position.line, column: operator.position.column},
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column + this.previous().value.length
                                    }
                                }
                            };
                        case TokenType.GREATER_THAN:
                            return {
                                type: NodeType.GREATER_THAN_EXPR,
                                value: numberLiteral,
                                position: {
                                    start: {line: operator.position.line, column: operator.position.column},
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column + this.previous().value.length
                                    }
                                }
                            };
                        case TokenType.LESS_THAN:
                            return {
                                type: NodeType.LESS_THAN_EXPR,
                                value: numberLiteral,
                                position: {
                                    start: {line: operator.position.line, column: operator.position.column},
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column + this.previous().value.length
                                    }
                                }
                            };
                        case TokenType.GREATER_THAN_EQUALS:
                            return {
                                type: NodeType.GREATER_THAN_EQUALS_EXPR,
                                value: numberLiteral,
                                position: {
                                    start: {line: operator.position.line, column: operator.position.column},
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column + this.previous().value.length
                                    }
                                }
                            };
                        case TokenType.LESS_THAN_EQUALS:
                            return {
                                type: NodeType.LESS_THAN_EQUALS_EXPR,
                                value: numberLiteral,
                                position: {
                                    start: {line: operator.position.line, column: operator.position.column},
                                    end: {
                                        line: this.previous().position.line,
                                        column: this.previous().position.column + this.previous().value.length
                                    }
                                }
                            };
                    }
                }
            }
        }

        throw new SearchParserError(
            "Expected expression",
            this.peek(),
            'EXPECTED_EXPRESSION'
        );
    }

    /**
     * Check if the current token matches any of the given types
     * @param types The token types to match
     * @returns True if the current token matches any of the given types
     */
    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the current token is of the given type
     * @param type The token type to check
     * @returns True if the current token is of the given type
     */
    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    /**
     * Advance to the next token
     * @returns The previous token
     */
    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    /**
     * Check if we've reached the end of the token stream
     * @returns True if we've reached the end
     */
    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    /**
     * Get the current token without advancing
     * @returns The current token
     */
    private peek(): Token {
        return this.tokens[this.current];
    }

    /**
     * Get the previous token
     * @returns The previous token
     */
    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    /**
     * Consume a token of the expected type
     * @param type The expected token type
     * @param message The error message if the token doesn't match
     * @returns The consumed token
     */
    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();

        throw new SearchParserError(message, this.peek(), 'UNEXPECTED_TOKEN');
    }
}

/**
 * Parse a stream of tokens into an AST
 * @param tokens The tokens to parse
 * @returns The root query node
 */
export function parse(tokens: Token[]): QueryNode {
    const parser = new Parser(tokens);
    return parser.parse();
}
