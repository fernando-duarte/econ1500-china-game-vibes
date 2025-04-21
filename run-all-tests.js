// Script to run all our simple tests in sequence
const { spawn } = require('child_process');

// List of test files to run
const testFiles = [
  'simple-e2e-test.js',
  'simple-puppeteer-test.js',
  'simple-instructor-test.js',
  'simple-screen-test.js',
  'simple-student-test.js'
];

console.log('Starting all tests in sequence...');

// Function to run a single test
async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n----- Running ${testFile} -----\n`);
    
    const test = spawn('node', [testFile], { stdio: 'inherit' });
    
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