/**
 * Fibonacci Sequence Implementation in JavaScript
 *
 * The Fibonacci sequence is a series where each number is the sum
 * of the two preceding numbers: 0, 1, 1, 2, 3, 5, 8, 13, 21, ...
 */

/**
 * Iterative approach - O(n) time, O(1) space
 * Recommended for production use
 *
 * @param {number} n - The position in the Fibonacci sequence (0-indexed)
 * @returns {number} The nth Fibonacci number
 */
function fibonacciIterative(n) {
    if (n < 0) {
        throw new Error('Input must be a non-negative integer');
    }

    if (n <= 1) {
        return n;
    }

    let prev = 0;
    let current = 1;

    for (let i = 2; i <= n; i++) {
        const next = prev + current;
        prev = current;
        current = next;
    }

    return current;
}

/**
 * Recursive approach - O(2^n) time, O(n) stack space
 * Simple but inefficient for large n
 *
 * @param {number} n - The position in the Fibonacci sequence
 * @returns {number} The nth Fibonacci number
 */
function fibonacciRecursive(n) {
    if (n < 0) {
        throw new Error('Input must be a non-negative integer');
    }

    if (n <= 1) {
        return n;
    }

    return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

/**
 * Memoized recursive approach - O(n) time, O(n) space
 * Better than pure recursion for larger values
 *
 * @param {number} n - The position in the Fibonacci sequence
 * @param {Map} memo - Internal cache for memoization
 * @returns {number} The nth Fibonacci number
 */
function fibonacciMemoized(n, memo = new Map()) {
    if (n < 0) {
        throw new Error('Input must be a non-negative integer');
    }

    if (memo.has(n)) {
        return memo.get(n);
    }

    if (n <= 1) {
        return n;
    }

    const result = fibonacciMemoized(n - 1, memo) + fibonacciMemoized(n - 2, memo);
    memo.set(n, result);

    return result;
}

/**
 * Generates an array of Fibonacci numbers up to n
 *
 * @param {number} count - Number of Fibonacci numbers to generate
 * @returns {number[]} Array of Fibonacci numbers
 */
function generateFibonacciSequence(count) {
    if (count < 1) {
        return [];
    }

    const sequence = [0];

    if (count === 1) {
        return sequence;
    }

    sequence.push(1);

    while (sequence.length < count) {
        const next = sequence[sequence.length - 1] + sequence[sequence.length - 2];
        sequence.push(next);
    }

    return sequence;
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const n = 10;

    console.log(`First ${n} Fibonacci numbers:`);
    console.log(generateFibonacciSequence(n));

    console.log(`\nFibonacci(${n}) = ${fibonacciIterative(n)}`);
    console.log(`Fibonacci(${n}) [recursive] = ${fibonacciRecursive(n)}`);
    console.log(`Fibonacci(${n}) [memoized] = ${fibonacciMemoized(n)}`);
}

// Export for use as a module
export {
    fibonacciIterative,
    fibonacciRecursive,
    fibonacciMemoized,
    generateFibonacciSequence
};
