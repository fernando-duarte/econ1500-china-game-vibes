// Reset teams script
const fs = require('fs');
const path = require('path');

// Path to the teamManager.js file
const teamManagerPath = path.join(__dirname, 'server', 'teamManager.js');

// Read the file
let content = fs.readFileSync(teamManagerPath, 'utf8');

// Replace the teams object initialization with an empty object
content = content.replace(
  '// In-memory store of teams and their members\nconst teams = {};',
  '// In-memory store of teams and their members\nconst teams = {}; // Reset on server restart'
);

// Write the file back
fs.writeFileSync(teamManagerPath, content, 'utf8');

console.log('Teams object has been reset.');
