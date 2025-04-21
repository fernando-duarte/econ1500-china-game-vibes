// Global teardown to ensure all resources are cleaned up
const { cleanupAllResources } = require('./e2e/e2eUtils');
const { cleanupAllSocketResources } = require('./integration/socketUtils');

module.exports = async () => {
  console.log('Running global teardown to clean up test resources...');

  try {
    // Run cleanup functions
    await Promise.all([cleanupAllResources(), cleanupAllSocketResources()]);
    console.log('Global teardown completed successfully');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
};
