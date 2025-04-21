#!/usr/bin/env node

/**
 * Simple script to kill processes using a specific port
 * Useful before running e2e tests to avoid port conflicts
 */

const { execSync } = require('child_process');
const CONSTANTS = require('../shared/constants');

// Use default port or specified port in environment
const PORT = process.env.PORT || CONSTANTS.DEFAULT_PORT || 3001;

function killProcessOnPort(port) {
  try {
    console.log(`Attempting to kill processes on port ${port}...`);

    // Different commands for different operating systems
    if (process.platform === 'win32') {
      // Windows
      const output = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = output.split('\n');
      const pids = new Set();

      lines.forEach(line => {
        const match = line.match(/LISTENING\s+(\d+)/);
        if (match && match[1]) {
          pids.add(match[1]);
        }
      });

      pids.forEach(pid => {
        console.log(`Killing process ${pid}...`);
        execSync(`taskkill /F /PID ${pid}`);
      });
    } else {
      // macOS/Linux
      try {
        // Use lsof to find process IDs
        const output = execSync(`lsof -i :${port} -t`).toString();
        const pids = output.split('\n').filter(Boolean);

        if (pids.length === 0) {
          console.log(`No processes found using port ${port}`);
          return;
        }

        pids.forEach(pid => {
          console.log(`Killing process ${pid}...`);
          execSync(`kill -9 ${pid}`);
        });
      } catch (error) {
        // If lsof command fails, it's likely that no process is using the port
        console.log(`No processes found using port ${port}`);
      }
    }

    console.log(`Successfully killed processes on port ${port}`);
  } catch (error) {
    console.error(`Error killing processes on port ${port}:`, error.message);
  }
}

killProcessOnPort(PORT); 