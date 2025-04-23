/**
 * Final CSS Migration Script
 * 
 * This script updates HTML files to use modular CSS directly,
 * removing the legacy style.css reference.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const HTML_FILES = [
  {
    path: path.join(__dirname, '../client/student.html'),
    type: 'student',
    title: 'Student View'
  },
  {
    path: path.join(__dirname, '../client/instructor.html'),
    type: 'instructor',
    title: 'Instructor View'
  },
  {
    path: path.join(__dirname, '../client/screen.html'),
    type: 'screen',
    title: 'Screen Dashboard'
  }
];

// CSS module paths
const CSS_MODULES = {
  core: '/css/core.css',
  components: '/css/components.css',
  student: '/css/student.css',
  instructor: '/css/instructor.css',
  screen: '/css/screen.css'
};

// Main function
async function main() {
  console.log('=== Final CSS Migration ===');
  
  // Step 1: Ensure CSS files are compiled
  console.log('\n1. Compiling CSS files...');
  try {
    execSync('npm run build:css', { stdio: 'inherit' });
    console.log('✓ CSS compilation successful');
  } catch (error) {
    console.error('× CSS compilation failed:', error.message);
    process.exit(1);
  }
  
  // Step 2: Update each HTML file
  console.log('\n2. Updating HTML files...');
  
  let successCount = 0;
  for (const file of HTML_FILES) {
    try {
      await updateHtmlFile(file);
      successCount++;
    } catch (error) {
      console.error(`× Failed to update ${file.title}:`, error.message);
    }
  }
  
  // Step 3: Summary
  console.log(`\n✓ Updated ${successCount}/${HTML_FILES.length} HTML files`);
  
  if (successCount === HTML_FILES.length) {
    console.log('\n=== Migration Complete ===');
    console.log('The application now uses modular CSS files directly.');
    console.log('You can remove the test mode functionality if desired.');
  } else {
    console.log('\n=== Migration Incomplete ===');
    console.log('Some files could not be updated. Please check the errors above.');
  }
}

/**
 * Update an HTML file to use modular CSS
 * @param {Object} fileInfo - Information about the HTML file
 */
async function updateHtmlFile(fileInfo) {
  console.log(`\nUpdating ${fileInfo.title}...`);
  
  // Read the file
  const originalContent = fs.readFileSync(fileInfo.path, 'utf8');
  
  // Create backup
  const backupPath = `${fileInfo.path}.backup`;
  fs.writeFileSync(backupPath, originalContent);
  console.log(`✓ Created backup at ${path.basename(backupPath)}`);
  
  // Replace the CSS link
  let newContent = originalContent;
  
  // Look for the style.css link
  const styleRegex = /<link[^>]*href\s*=\s*["']\/style\.css["'][^>]*>/i;
  const styleMatch = originalContent.match(styleRegex);
  
  if (!styleMatch) {
    console.warn('⚠ Could not find style.css link. File may already be updated.');
    return;
  }
  
  // Generate the new CSS links
  const cssLinks = [
    `<link rel="stylesheet" href="${CSS_MODULES.core}">`,
    `<link rel="stylesheet" href="${CSS_MODULES.components}">`,
    `<link rel="stylesheet" href="${CSS_MODULES[fileInfo.type]}">`
  ].join('\n    ');
  
  // Add view class to body
  newContent = newContent.replace(/<body([^>]*)>/i, `<body$1 class="${fileInfo.type}-view">`);
  
  // Replace style.css link with modular CSS links
  newContent = newContent.replace(styleRegex, cssLinks);
  
  // Write the updated file
  fs.writeFileSync(fileInfo.path, newContent);
  console.log(`✓ Updated ${path.basename(fileInfo.path)}`);
  
  // Check if test scripts should be removed
  const testScriptRegex = /<script[^>]*src\s*=\s*["']\/modules\/shared\/css-test\.js["'][^>]*>/i;
  if (testScriptRegex.test(newContent)) {
    console.log('ℹ File still contains CSS test script. You may want to remove it manually.');
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 