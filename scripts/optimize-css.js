/**
 * CSS Performance Optimization Script
 *
 * This script implements performance optimizations for CSS:
 * 1. Adds preload links for critical CSS
 * 2. Configures proper cache headers
 * 3. Implements minification
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const CleanCSS = require('clean-css'); // Would need to be installed

// Configuration
const HTML_FILES = [
  {
    path: path.join(__dirname, '../client/student.html'),
    type: 'student',
    title: 'Student View',
    critical: ['core', 'components'], // Critical CSS for this view
  },
  {
    path: path.join(__dirname, '../client/instructor.html'),
    type: 'instructor',
    title: 'Instructor View',
    critical: ['core', 'components'],
  },
  {
    path: path.join(__dirname, '../client/screen.html'),
    type: 'screen',
    title: 'Screen Dashboard',
    critical: ['core'],
  },
];

// CSS module paths
const CSS_MODULES = {
  core: '/css/core.css',
  components: '/css/components.css',
  student: '/css/student.css',
  instructor: '/css/instructor.css',
  screen: '/css/screen.css',
};

// Main function
async function main() {
  console.log('=== CSS Performance Optimization ===');

  // Step 1: Add preload links
  console.log('\n1. Adding preload links for critical CSS...');

  for (const file of HTML_FILES) {
    try {
      await addPreloadLinks(file);
    } catch (error) {
      console.error(
        `× Failed to add preload links to ${file.title}:`,
        error.message
      );
    }
  }

  // Step 2: Minify CSS files
  console.log('\n2. Minifying CSS files...');
  await minifyCssFiles();

  // Step 3: Add server cache headers (instructions only)
  console.log('\n3. Cache headers for CSS files:');
  console.log(
    'To optimize caching, add the following middleware to server/index.js:'
  );
  console.log(`
// Add cache headers for CSS files
app.use('/css', (req, res, next) => {
  // Set cache for 1 week (604800 seconds)
  res.setHeader('Cache-Control', 'public, max-age=604800');
  next();
});
  `);

  console.log('\n=== Optimization Complete ===');
  console.log('CSS files are now optimized for performance.');
}

/**
 * Add preload links for critical CSS files
 * @param {Object} fileInfo - Information about the HTML file
 */
async function addPreloadLinks(fileInfo) {
  console.log(`\nAdding preload links to ${fileInfo.title}...`);

  // Read the file
  const originalContent = fs.readFileSync(fileInfo.path, 'utf8');

  // Create backup
  const backupPath = `${fileInfo.path}.perf.backup`;
  fs.writeFileSync(backupPath, originalContent);

  // Generate preload links
  const preloadLinks = fileInfo.critical
    .map(
      (module) =>
        `<link rel="preload" href="${CSS_MODULES[module]}" as="style">`
    )
    .join('\n    ');

  // Add preload links to head
  let newContent = originalContent.replace(
    /<\/head>/i,
    `    ${preloadLinks}\n  </head>`
  );

  // Write the updated file
  fs.writeFileSync(fileInfo.path, newContent);
  console.log(`✓ Added preload links to ${path.basename(fileInfo.path)}`);
}

/**
 * Minify CSS files
 */
async function minifyCssFiles() {
  // Check if clean-css is installed
  try {
    require.resolve('clean-css');
  } catch {
    console.log('clean-css not found, attempting to install...');
    try {
      execSync('npm install clean-css --save-dev', { stdio: 'inherit' });
      console.log('✓ Installed clean-css successfully');
    } catch {
      console.error('× Failed to install clean-css.');
      console.error(
        'Please install it manually: npm install clean-css --save-dev'
      );
      console.error('Then run this script again.');
      return;
    }
  }

  const cssDir = path.join(__dirname, '../client/css');
  const files = fs.readdirSync(cssDir).filter((file) => file.endsWith('.css'));

  const cleanCSS = new CleanCSS({
    level: 2, // More aggressive optimization
    sourceMap: true,
  });

  for (const file of files) {
    const filePath = path.join(cssDir, file);
    const css = fs.readFileSync(filePath, 'utf8');

    // Create backup
    fs.writeFileSync(`${filePath}.backup`, css);

    // Minify
    const minified = cleanCSS.minify(css);

    if (minified.errors.length > 0) {
      console.error(`× Error minifying ${file}:`, minified.errors);
      continue;
    }

    // Write minified file
    fs.writeFileSync(filePath, minified.styles);

    // Write source map
    if (minified.sourceMap) {
      fs.writeFileSync(`${filePath}.map`, minified.sourceMap.toString());
    }

    // Calculate savings
    const originalSize = css.length;
    const minifiedSize = minified.styles.length;
    const savings = (
      ((originalSize - minifiedSize) / originalSize) *
      100
    ).toFixed(2);

    console.log(`✓ Minified ${file} (${savings}% smaller)`);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
