/**
 * CSS Transition Script
 * 
 * This script helps with the transition from monolithic CSS to modular CSS.
 * It performs the following tasks:
 * 1. Ensures sass is installed
 * 2. Compiles modular CSS files
 * 3. Backs up original style.css
 * 4. Tests CSS modules
 * 5. Creates a report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const ORIGINAL_CSS = path.join(__dirname, '../client/style.css');
const BACKUP_CSS = path.join(__dirname, '../client/style.css.backup');
const CSS_DIR = path.join(__dirname, '../client/css');
const SCSS_DIR = path.join(__dirname, '../client/scss');

// Main function
function main() {
  console.log('=== CSS Transition Helper ===');
  
  // Step 1: Check dependencies
  checkDependencies();
  
  // Step 2: Create CSS directory if it doesn't exist
  if (!fs.existsSync(CSS_DIR)) {
    console.log('Creating CSS directory...');
    fs.mkdirSync(CSS_DIR, { recursive: true });
  }
  
  // Step 3: Backup original CSS if it exists
  if (fs.existsSync(ORIGINAL_CSS) && !fs.existsSync(BACKUP_CSS)) {
    console.log('Backing up original style.css...');
    fs.copyFileSync(ORIGINAL_CSS, BACKUP_CSS);
    console.log('Backup created at: style.css.backup');
  }
  
  // Step 4: Check for SCSS files
  const scssFiles = fs.readdirSync(SCSS_DIR)
    .filter(file => file.endsWith('.scss') && !file.startsWith('_'));
  
  console.log(`\nFound ${scssFiles.length} SCSS entry files:`);
  scssFiles.forEach(file => console.log(`- ${file}`));
  
  // Step 5: Compile CSS files
  console.log('\nCompiling CSS files...');
  try {
    execSync('npm run build:css', { stdio: 'inherit' });
    console.log('CSS compilation successful!');
  } catch (error) {
    console.error('Error compiling CSS:', error.message);
    process.exit(1);
  }
  
  // Step 6: Verify compiled files
  const cssFiles = fs.readdirSync(CSS_DIR)
    .filter(file => file.endsWith('.css'));
  
  console.log(`\nGenerated ${cssFiles.length} CSS files:`);
  cssFiles.forEach(file => {
    const stats = fs.statSync(path.join(CSS_DIR, file));
    const sizeKb = (stats.size / 1024).toFixed(2);
    console.log(`- ${file} (${sizeKb} KB)`);
  });
  
  // Step 7: Display size comparison if possible
  if (fs.existsSync(ORIGINAL_CSS)) {
    const originalStats = fs.statSync(ORIGINAL_CSS);
    const originalSizeKb = (originalStats.size / 1024).toFixed(2);
    
    console.log('\nSize comparison:');
    console.log(`- Original style.css: ${originalSizeKb} KB`);
    
    // Calculate total size of modular CSS
    const totalSize = cssFiles.reduce((acc, file) => {
      return acc + fs.statSync(path.join(CSS_DIR, file)).size;
    }, 0);
    
    const totalSizeKb = (totalSize / 1024).toFixed(2);
    console.log(`- All modular CSS files: ${totalSizeKb} KB`);
    
    // Calculate average size per page
    const avgSize = totalSize / 3; // Assuming 3 pages: student, instructor, screen
    const avgSizeKb = (avgSize / 1024).toFixed(2);
    console.log(`- Average per page: ${avgSizeKb} KB`);
    
    // Calculate savings
    const savings = originalStats.size - avgSize;
    const savingsKb = (savings / 1024).toFixed(2);
    const savingsPercent = ((savings / originalStats.size) * 100).toFixed(2);
    console.log(`- Average savings per page: ${savingsKb} KB (${savingsPercent}%)`);
  }
  
  // Step 8: Display next steps
  console.log('\n=== Next Steps ===');
  console.log('1. Run the app and test with CSS modules:');
  console.log('   npm run dev');
  console.log('2. Check for any visual regressions using the CSS Test Mode');
  console.log('3. When ready, switch to modular CSS permanently:');
  console.log('   - Update HTML files to load CSS modules directly');
  console.log('   - Remove legacy style.css reference');
  
  console.log('\nCSS transition helper completed successfully!');
}

// Check for required dependencies
function checkDependencies() {
  console.log('Checking dependencies...');
  
  try {
    // Check if sass is installed
    execSync('npm list sass', { stdio: 'ignore' });
    console.log('✓ sass dependency found');
  } catch (error) {
    console.error('× sass dependency not found! Installing...');
    try {
      execSync('npm install sass --save-dev', { stdio: 'inherit' });
      console.log('✓ sass installed successfully');
    } catch (installError) {
      console.error('Failed to install sass. Please install it manually:');
      console.error('npm install sass --save-dev');
      process.exit(1);
    }
  }
}

// Run the script
main(); 