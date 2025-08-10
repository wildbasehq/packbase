/**
 * Lexer for the search API
 * Converts a search query string into a stream of tokens
 */

import { Token, TokenType } from './types';

export class SearchLexerError extends Error {
  position: { line: number; column: number };
  code: string;

  constructor(message: string, line: number, column: number, code: string = 'LEXER_ERROR') {
    super(message);
    this.name = 'SearchLexerError';
    this.position = { line, column };
    this.code = code;
  }
}

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  // Keywords map
  private keywords: Record<string, TokenType> = {
    'WHERE': TokenType.WHERE,
    'AND': TokenType.AND,
    'OR': TokenType.OR,
    'NOT': TokenType.NOT,
    'SORT': TokenType.SORT,
    'BY': TokenType.BY,
    'ASC': TokenType.ASC,
    'DESC': TokenType.DESC,
    'BETWEEN': TokenType.BETWEEN,
    'EXISTS': TokenType.EXISTS,
    'EXACT': TokenType.EXACT,
    'FUZZY': TokenType.FUZZY,
    'CASE': TokenType.CASE,
  };

  constructor(input: string) {
    this.input = input;
  }

  /**
   * Tokenize the input string
   * @returns Array of tokens
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      this.scanToken();
    }

    // Add EOF token
    this.addToken(TokenType.EOF, '');
    return this.tokens;
  }

  /**
   * Scan a single token
   */
  private scanToken(): void {
    const char = this.advance();

    switch (char) {
      // Handle whitespace
      case ' ':
      case '\t':
      case '\r':
        // Ignore whitespace
        break;
      case '\n':
        this.line++;
        this.column = 1;
        break;

      // Handle syntax tokens
      case '[':
        this.addToken(TokenType.OPEN_BRACKET, char);
        break;
      case ']':
        this.addToken(TokenType.CLOSE_BRACKET, char);
        break;
      case '(':
        this.addToken(TokenType.OPEN_PAREN, char);
        break;
      case ')':
        this.addToken(TokenType.CLOSE_PAREN, char);
        break;
      case ':':
        this.addToken(TokenType.COLON, char);
        break;
      case ',':
        this.addToken(TokenType.COMMA, char);
        break;

      // Handle operators
      case '=':
        this.addToken(TokenType.EQUALS, char);
        break;
      case '>':
        if (this.match('=')) {
          this.addToken(TokenType.GREATER_THAN_EQUALS, '>=');
        } else {
          this.addToken(TokenType.GREATER_THAN, char);
        }
        break;
      case '<':
        if (this.match('=')) {
          this.addToken(TokenType.LESS_THAN_EQUALS, '<=');
        } else {
          this.addToken(TokenType.LESS_THAN, char);
        }
        break;

      // Handle string literals
      case '"':
        this.string('"');
        break;
      case "'":
        this.string("'");
        break;

      // Handle named queries (variables)
      case '$':
        this.namedQuery();
        break;

      // Handle identifiers and keywords
      default:
        if (this.isDigit(char)) {
          this.number();
        } else if (this.isAlpha(char)) {
          this.identifier();
        } else {
          throw new SearchLexerError(
            `Unexpected character: ${char}`,
            this.line,
            this.column - 1,
            'UNEXPECTED_CHARACTER'
          );
        }
        break;
    }
  }

  /**
   * Process a string literal
   */
  private string(quote: string): void {
    const startLine = this.line;
    const startColumn = this.column - 1;
    let value = '';
    let escaped = false;

    while (!this.isAtEnd()) {
      const char = this.advance();

      if (escaped) {
        // Handle escaped characters
        if (char === 'n') value += '\n';
        else if (char === 't') value += '\t';
        else if (char === 'r') value += '\r';
        else value += char;
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        // End of string
        this.addToken(TokenType.STRING, value, startLine, startColumn);
        return;
      } else {
        value += char;
        if (char === '\n') {
          this.line++;
          this.column = 1;
        }
      }
    }

    // If we get here, the string was not closed
    throw new SearchLexerError(
      'Unterminated string',
      startLine,
      startColumn,
      'UNTERMINATED_STRING'
    );
  }

  /**
   * Process a number literal
   */
  private number(): void {
    const startPosition = this.position - 1;
    const startLine = this.line;
    const startColumn = this.column - 1;

    // Consume digits
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for a decimal point
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the decimal point
      this.advance();

      // Consume the fractional part
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.input.substring(startPosition, this.position);
    this.addToken(TokenType.NUMBER, value, startLine, startColumn);
  }

  /**
   * Process an identifier or keyword
   */
  private identifier(): void {
    const startPosition = this.position - 1;
    const startLine = this.line;
    const startColumn = this.column - 1;

    // Consume alphanumeric characters
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    // Extract the identifier
    const text = this.input.substring(startPosition, this.position);
    
    // Check if it's a keyword
    const type = this.keywords[text.toUpperCase()] || TokenType.IDENTIFIER;
    
    this.addToken(type, text, startLine, startColumn);
  }

  /**
   * Process a named query reference
   */
  private namedQuery(): void {
    const startPosition = this.position - 1;
    const startLine = this.line;
    const startColumn = this.column - 1;

    // Consume alphanumeric characters
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    // Extract the name (including the $)
    const name = this.input.substring(startPosition, this.position);
    
    this.addToken(TokenType.NAMED_QUERY, name, startLine, startColumn);
  }

  /**
   * Add a token to the token list
   */
  private addToken(
    type: TokenType, 
    value: string, 
    line: number = this.line, 
    column: number = this.column - value.length
  ): void {
    this.tokens.push({
      type,
      value,
      position: { line, column }
    });
  }

  /**
   * Advance to the next character
   */
  private advance(): string {
    const char = this.input.charAt(this.position);
    this.position++;
    this.column++;
    return char;
  }

  /**
   * Check if the current character matches the expected character
   */
  private match(expected: string): boolean {
    if (this.isAtEnd() || this.input.charAt(this.position) !== expected) {
      return false;
    }

    this.position++;
    this.column++;
    return true;
  }

  /**
   * Peek at the current character without advancing
   */
  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.input.charAt(this.position);
  }

  /**
   * Peek at the next character without advancing
   */
  private peekNext(): string {
    if (this.position + 1 >= this.input.length) return '\0';
    return this.input.charAt(this.position + 1);
  }

  /**
   * Check if we've reached the end of the input
   */
  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  /**
   * Check if a character is a digit
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * Check if a character is alphabetic
   */
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
           (char >= 'A' && char <= 'Z') ||
           char === '_';
  }

  /**
   * Check if a character is alphanumeric
   */
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

/**
 * Tokenize a search query string
 * @param input The search query string
 * @returns Array of tokens
 */
export function tokenize(input: string): Token[] {
  const lexer = new Lexer(input);
  return lexer.tokenize();
}