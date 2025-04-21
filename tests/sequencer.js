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
    // Return tests in a predictable order
    return tests.sort((testA, testB) => {
      const pathA = testA.path;
      const pathB = testB.path;

      // Run unit tests first
      if (pathA.includes('/unit/') && !pathB.includes('/unit/')) {
        return -1;
      }
      if (!pathA.includes('/unit/') && pathB.includes('/unit/')) {
        return 1;
      }

      // Then run integration tests
      if (pathA.includes('/integration/') && !pathB.includes('/integration/')) {
        return -1;
      }
      if (!pathA.includes('/integration/') && pathB.includes('/integration/')) {
        return 1;
      }

      // E2E tests run last
      if (pathA.includes('/e2e/') && !pathB.includes('/e2e/')) {
        return 1;
      }
      if (!pathA.includes('/e2e/') && pathB.includes('/e2e/')) {
        return -1;
      }

      // Alpha sort for same category
      return pathA.localeCompare(pathB);
    });
  }
}

module.exports = CustomSequencer; 