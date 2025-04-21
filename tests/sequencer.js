const Sequencer = require('@jest/test-sequencer').default;

/**
 * Custom Jest Test Sequencer
 *
 * This sequencer organizes test execution in a logical order:
 * 1. Unit tests first
 * 2. Integration tests next
 * 3. E2E tests last
 */
class CustomSequencer extends Sequencer {
  /**
   * Sorts the test paths based on their type and name
   * @param {Array} tests Array of test objects
   * @returns {Array} Sorted array of test objects
   */
  sort(tests) {
    // Ensure tests run in a specific order for better isolation:
    // 1. Unit tests (fastest and most isolated)
    // 2. Integration tests (require server but not browser)
    // 3. E2E tests (require full stack)

    return tests.sort((testA, testB) => {
      // Extract test type from path
      const getTestType = (path) => {
        if (path.includes('/unit/')) return 1;
        if (path.includes('/integration/')) return 2;
        if (path.includes('/e2e/')) return 3;
        return 4; // Other tests
      };

      // Get test types
      const typeA = getTestType(testA.path);
      const typeB = getTestType(testB.path);

      // Sort by test type first
      if (typeA !== typeB) {
        return typeA - typeB;
      }

      // If same test type, use Jest's default sorting
      return super.sort([testA, testB])[0] === testA ? -1 : 1;
    });
  }
}

module.exports = CustomSequencer;
