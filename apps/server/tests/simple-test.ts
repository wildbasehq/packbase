import { test, expect } from 'bun:test';

// A simple utility function to test
function add(a: number, b: number): number {
  return a + b;
}

// Test group
test('basic math operations', () => {
  // Test case
  test('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });
});

// Export the function so it can be used elsewhere
export { add };