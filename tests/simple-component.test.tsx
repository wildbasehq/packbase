import { describe, expect, test } from 'bun:test';

// A simple utility function to test
function capitalizeString(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

describe('capitalizeString', () => {
  test('capitalizes first letter and lowercases the rest', () => {
    expect(capitalizeString('hello')).toBe('Hello');
    expect(capitalizeString('WORLD')).toBe('World');
    expect(capitalizeString('javaScript')).toBe('Javascript');
  });

  test('handles empty strings', () => {
    expect(capitalizeString('')).toBe('');
  });

  test('handles single character strings', () => {
    expect(capitalizeString('a')).toBe('A');
    expect(capitalizeString('Z')).toBe('Z');
  });
});
