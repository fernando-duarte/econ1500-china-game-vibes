#!/usr/bin/env node

/**
 * Script to check if any JavaScript or CSS files exceed the maximum allowed line count.
 * Used in pre-commit hooks to prevent committing overly long files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MAX_LINES = 200;
const EXCLUDE_DIRS = ['node_modules', '.git', '.venv', 'types', 'scripts'];
const INCLUDE_EXTENSIONS = ['.js', '.css', '.html'];

/**
 * Get files to be committed
 * @returns {string[]} Array of file paths
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM')
      .toString()
      .trim();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error getting staged files:', error.message);
    return [];
  }
}

/**
 * Count non-blank, non-comment lines in a file
 * @param {string} filePath - Path to the file
 * @returns {number} Line count
 */
function countSignificantLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let inBlockComment = false;
    let significantLines = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) continue;

      // Handle block comments
      if (!inBlockComment && trimmedLine.startsWith('/*')) {
        inBlockComment = !trimmedLine.includes('*/');
        continue;
      }

      if (inBlockComment) {
        if (trimmedLine.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      // Skip single-line comments
      if (trimmedLine.startsWith('//')) continue;

      significantLines++;
    }

    return significantLines;
  } catch (error) {
    console.error(`Error counting lines in ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Check if a file should be processed
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if the file should be processed
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // Check extension
  if (!INCLUDE_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Check excluded directories
  for (const dir of EXCLUDE_DIRS) {
    if (filePath.includes(`${dir}${path.sep}`)) {
      return false;
    }
  }

  return true;
}

/**
 * Check a specific file for line count
 * @param {string} filePath - Path to the file to check
 * @returns {{file: string, lineCount: number}|null} Result or null if file should not be processed
 */
function checkFile(filePath) {
  if (!shouldProcessFile(filePath)) {
    return null;
  }

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }

    const lineCount = countSignificantLines(filePath);
    return {
      file: filePath,
      lineCount,
      exceedsLimit: lineCount > MAX_LINES,
    };
  } catch (error) {
    console.error(`Error checking file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  // If specific files are provided as arguments, check them
  if (args.length > 0) {
    const results = args.map(checkFile).filter(Boolean);

    const longFiles = results.filter((r) => r.exceedsLimit);

    results.forEach(({ file, lineCount, exceedsLimit }) => {
      const status = exceedsLimit
        ? `⚠️  Exceeds limit: ${lineCount} lines (max: ${MAX_LINES})`
        : `✓ Within limit: ${lineCount} lines (max: ${MAX_LINES})`;
      console.log(`${file}: ${status}`);
    });

    if (longFiles.length > 0) {
      console.error('\nPlease refactor these files to be shorter.');
      process.exit(1);
    }

    process.exit(0);
  }

  // Otherwise, check staged files
  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    console.log('No files staged for commit.');
    process.exit(0);
  }

  const longFiles = [];

  for (const file of stagedFiles) {
    if (!shouldProcessFile(file)) continue;

    const lineCount = countSignificantLines(file);
    if (lineCount > MAX_LINES) {
      longFiles.push({ file, lineCount });
    }
  }

  if (longFiles.length > 0) {
    console.error('\n⚠️  The following files exceed the maximum line count:');
    longFiles.forEach(({ file, lineCount }) => {
      console.error(`   ${file}: ${lineCount} lines (max: ${MAX_LINES})`);
    });
    console.error(
      '\nPlease refactor these files to be shorter before committing.'
    );
    console.error(
      'You can use "git commit --no-verify" to bypass this check if necessary.\n'
    );
    process.exit(1);
  }

  console.log('✓ All files are within the maximum line count limit.');
  process.exit(0);
}

main();
