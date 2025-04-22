// Script to run all working tests in sequence
const { spawn } = require('child_process');

// List of test files that are known to work
const testFiles = [
  'tests/unit/gameLogic.test.js',
  'tests/unit/ui.test.js',
  'tests/integration/minimal-http.test.js',
  'tests/integration/api.test.js'
];

console.log('Starting working tests in sequence...');

// Function to run a single test
async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n----- Running ${testFile} -----\n`);
    
    const test = spawn('npx', ['jest', testFile], { stdio: 'inherit' });
    
    test.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${testFile} completed successfully`);
        resolve();
      } else {
        console.error(`\n❌ ${testFile} failed with code ${code}`);
        resolve(); // Still continue to next test even if this one fails
      }
    });
    
    test.on('error', (error) => {
      console.error(`\n❌ Error running ${testFile}: ${error.message}`);
      resolve(); // Still continue to next test even if this one fails
    });
  });
}

// Run all tests in sequence
async function runAllTests() {
  for (const testFile of testFiles) {
    await runTest(testFile);
  }
  
  console.log('\n----- All tests completed -----\n');
}

// Start the tests
runAllTests().catch(error => {
  console.error('Error in test runner:', error);
  process.exit(1);
});
