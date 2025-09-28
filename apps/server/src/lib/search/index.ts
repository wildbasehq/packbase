/**
 * Search API
 * Provides a simple interface for searching data using a custom query syntax
 */
export * from './lexer';
export * from './parser';
export * from './executor';
export * from './types';

import { tokenize } from './lexer';
import { parse } from './parser';
import { executeQuery } from './executor';
import { SearchResult, SearchError } from './types';

/**
 * Search error class
 */
export class SearchApiError extends Error {
    code: string;
    position?: { line: number; column: number };
    details?: any;

    constructor(message: string, code: string, position?: { line: number; column: number }, details?: any) {
        super(message);
        this.name = 'SearchApiError';
        this.code = code;
        this.position = position;
        this.details = details;
    }
}

/**
 * Search options
 */
export interface SearchOptions {
    /**
     * Maximum number of results to return
     */
    limit?: number;

    /**
     * Number of results to skip
     */
    offset?: number;

    /**
     * Whether to include metadata in the results
     */
    includeMetadata?: boolean;

    /**
     * List of tables that are allowed to be searched
     * If not provided, all valid tables can be searched
     */
    allowedTables?: string[];
}

/**
 * Search the database using the custom query syntax
 * @param query The search query string
 * @param options Search options
 * @returns Array of search results
 *
 * @example
 * // Basic query
 * const results = await search('[Where packs ("travel")]');
 *
 * // Column-specific query
 * const results = await search('[Where packs:display_name ("Travel Blog")]');
 *
 * // Query with logical operators
 * const results = await search('[Where packs ("travel" AND "blog")]');
 *
 * // Nested query
 * const results = await search('[Where packs ("travel" AND [Where posts ("vacation")])]');
 *
 * // Query with sorting
 * const results = await search('[Where packs ("travel")] SORT BY display_name DESC');
 *
 * // Query with wildcard
 * const results = await search('[Where profiles ("j*n*")]');
 *
 * // Query with case sensitivity
 * const results = await search('[Where profiles CASE=true ("John")]');
 *
 * // Query with range
 * const results = await search('[Where posts:created_at BETWEEN ("2023-01-01" AND "2023-12-31")]');
 *
 * // Query with fuzzy matching
 * const results = await search('[Where profiles FUZZY=2 ("john")]');
 *
 * // Query with numerical comparison
 * const results = await search('[Where posts:likes >=(10)]');
 *
 * // Query with existence check
 * const results = await search('[Where profiles:bio EXISTS]');
 *
 * // Query with exact match
 * const results = await search('[Where profiles EXACT ("John Doe")]');
 *
 * // Named query
 * const results = await search('$popularPosts = [Where posts:likes >=(100)] $popularPosts');
 */
export async function search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    try {
        // Tokenize the query
        const tokens = tokenize(query);

        // Parse the tokens into an AST
        const ast = parse(tokens);

        // Execute the query
        let results = await executeQuery(ast, options.allowedTables);

        // Apply limit and offset
        if (options.offset !== undefined && options.offset > 0) {
            results = results.slice(options.offset);
        }

        // slice FROM BOTTOM
        if (options.limit !== undefined && options.limit > 0) {
            results = results.slice(-options.limit);
        }

        // Remove metadata if not requested
        if (!options.includeMetadata) {
            results = results.map((result) => ({
                id: result.id,
                table: result.table,
            }));
        }

        return results;
    } catch (error: any) {
        // Convert lexer/parser/executor errors to SearchApiError
        if (error.position) {
            throw new SearchApiError(error.message, error.code || 'SEARCH_ERROR', error.position, error.details);
        } else {
            throw new SearchApiError(error.message, error.code || 'SEARCH_ERROR', undefined, error.details);
        }
    }
}

// Export types and classes
export * from './types';
export { SearchLexerError } from './lexer';
export { SearchParserError } from './parser';
export { SearchExecutionError } from './executor';
