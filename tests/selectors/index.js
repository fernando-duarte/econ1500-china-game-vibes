// Extract and export all HTML element IDs used in the application
// This mirrors what would ideally be in the main codebase

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * Extract all element IDs from an HTML file
 */
function extractIds(htmlPath) {
  try {
    const html = fs.readFileSync(path.join(process.cwd(), htmlPath), 'utf8');
    const dom = new JSDOM(html);
    const { document } = dom.window;
    
    const ids = {};
    const elementsWithId = document.querySelectorAll('[id]');
    
    elementsWithId.forEach(el => {
      ids[el.id] = el.id;
    });
    
    return ids;
  } catch (error) {
    console.error(`Failed to extract IDs from ${htmlPath}:`, error);
    return {};
  }
}

// Extract IDs from HTML files
const studentIds = extractIds('client/student.html');
const instructorIds = extractIds('client/instructor.html');
const screenIds = extractIds('client/screen.html');

module.exports = {
  student: studentIds,
  instructor: instructorIds,
  screen: screenIds,
  // Fallbacks for common elements if not found in the extracted IDs
  fallbacks: {
    student: {
      joinForm: 'joinForm',
      playerName: 'playerName',
      gameCode: 'gameCode',
      joinButton: 'joinButton',
      decisionForm: 'decisionForm',
      investment: 'investment',
      submitDecision: 'submitDecision',
      gameUI: 'gameUI',
      confirmationMessage: 'confirmationMessage'
    },
    instructor: {
      createGameForm: 'createGameForm',
      instructorName: 'instructorName',
      createGameButton: 'createGameButton',
      gameControls: 'gameControls',
      startGameButton: 'startGameButton',
      pauseGameButton: 'pauseGameButton',
      resumeGameButton: 'resumeGameButton',
      endGameButton: 'endGameButton'
    },
    screen: {
      gameScreen: 'gameScreen',
      gameState: 'gameState',
      gameInfo: 'gameInfo',
      playerTable: 'playerTable',
      averageCapital: 'averageCapital',
      playerCount: 'playerCount',
      roundInfo: 'roundInfo'
    }
  }
}; 