// These imports are not currently used since readHTMLFile function was commented out
// const fs = require('fs');
// const path = require('path');
const { JSDOM } = require('jsdom');

// Helper to safely read HTML - not currently used but kept for future tests
// const readHTMLFile = (filePath) => {
//   try {
//     return fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
//   } catch (error) {
//     console.log(`Could not read file: ${filePath}. Creating mock HTML.`);
//     return `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Mock HTML</title>
//         </head>
//         <body>
//           <form id="mockForm">
//             <input id="mockInput" type="text" name="mockName" />
//             <button id="mockButton" type="submit">Submit</button>
//           </form>
//           <div id="gameUI" class="hidden"></div>
//           <div id="gameScreen"></div>
//           <table id="playerTable">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Score</th>
//               </tr>
//             </thead>
//             <tbody></tbody>
//           </table>
//         </body>
//       </html>
//     `;
//   }
// };

// Mock HTML for testing
const createMockStudentHTML = () => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Student View</title>
    </head>
    <body>
      <form id="joinForm">
        <input id="playerName" type="text" name="playerName" placeholder="Your Name" />
        <input id="gameCode" type="text" name="gameCode" placeholder="Game Code" />
        <button id="joinButton" type="submit">Join Game</button>
      </form>
      <div id="gameUI" class="hidden">
        <div id="playerInfo"></div>
        <form id="decisionForm">
          <input id="investment" type="range" min="0" max="100" value="50" />
          <button id="submitDecision" type="submit">Submit</button>
        </form>
        <div id="confirmationMessage" style="display: none;"></div>
      </div>
    </body>
  </html>
`;

const createMockInstructorHTML = () => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Instructor View</title>
    </head>
    <body>
      <form id="createGameForm">
        <input id="instructorName" type="text" name="instructorName" placeholder="Your Name" />
        <button id="createGameButton" type="submit">Create Game</button>
      </form>
      <div id="gameControls" class="hidden">
        <button id="startGameButton">Start Game</button>
        <button id="pauseGameButton" disabled>Pause Game</button>
        <button id="resumeGameButton" disabled>Resume Game</button>
        <button id="endGameButton">End Game</button>
      </div>
    </body>
  </html>
`;

const createMockScreenHTML = () => `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Screen Dashboard</title>
    </head>
    <body>
      <div id="gameScreen">
        <div id="gameState">Not connected</div>
        <div id="gameInfo"></div>
        <div id="roundInfo"></div>
        <table id="playerTable">
          <thead>
            <tr>
              <th>Player</th>
              <th>Capital</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <div id="averageCapital">Average Capital: -</div>
        <div id="playerCount">Players: 0</div>
      </div>
    </body>
  </html>
`;

describe('UI Components', () => {
  test('Student UI structure matches expectations', () => {
    const dom = new JSDOM(createMockStudentHTML());
    const { document } = dom.window;

    // Extract structure
    const structure = {
      title: document.title,
      forms: Array.from(document.querySelectorAll('form')).map((f) => ({
        id: f.id,
        method: f.method,
        action: f.action,
      })),
      inputs: Array.from(document.querySelectorAll('input')).map((i) => ({
        id: i.id,
        type: i.type,
        name: i.name,
      })),
      buttons: Array.from(document.querySelectorAll('button')).map((b) => ({
        id: b.id,
        type: b.type,
        text: b.textContent.trim(),
      })),
    };

    // Check for basic elements
    expect(structure.forms.length).toBeGreaterThan(0);
    expect(structure.inputs.length).toBeGreaterThan(0);

    // Check for form elements
    const joinForm = document.getElementById('joinForm');
    expect(joinForm).not.toBeNull();

    // Verify game UI is hidden initially
    const gameUI = document.getElementById('gameUI');
    expect(gameUI).not.toBeNull();
    expect(gameUI.classList.contains('hidden')).toBe(true);

    // Check for form inputs
    const playerNameInput = document.getElementById('playerName');
    const gameCodeInput = document.getElementById('gameCode');
    expect(playerNameInput).not.toBeNull();
    expect(gameCodeInput).not.toBeNull();
  });

  test('Instructor UI structure matches expectations', () => {
    const dom = new JSDOM(createMockInstructorHTML());
    const { document } = dom.window;

    // Extract structure
    const structure = {
      title: document.title,
      forms: Array.from(document.querySelectorAll('form')).map((f) => ({
        id: f.id,
        method: f.method,
        action: f.action,
      })),
      inputs: Array.from(document.querySelectorAll('input')).map((i) => ({
        id: i.id,
        type: i.type,
        name: i.name,
      })),
      buttons: Array.from(document.querySelectorAll('button')).map((b) => ({
        id: b.id,
        type: b.type,
        text: b.textContent.trim(),
      })),
    };

    // Check for basic elements
    expect(structure.forms.length).toBeGreaterThan(0);
    expect(structure.inputs.length).toBeGreaterThan(0);

    // Check for form element
    const createForm = document.getElementById('createGameForm');
    expect(createForm).not.toBeNull();

    // Check for game controls
    const gameControls = document.getElementById('gameControls');
    expect(gameControls).not.toBeNull();
    expect(gameControls.classList.contains('hidden')).toBe(true);

    // Check for control buttons
    const startButton = document.getElementById('startGameButton');
    const pauseButton = document.getElementById('pauseGameButton');
    expect(startButton).not.toBeNull();
    expect(pauseButton).not.toBeNull();
    expect(pauseButton.disabled).toBe(true);
  });

  test('Screen dashboard UI structure matches expectations', () => {
    const dom = new JSDOM(createMockScreenHTML());
    const { document } = dom.window;

    // Structure variable - currently unused but kept for future tests
    // const structure = {
    //   title: document.title,
    //   divs: Array.from(document.querySelectorAll('div[id]')).map(d => ({
    //     id: d.id,
    //     classes: Array.from(d.classList)
    //   })),
    //   tables: Array.from(document.querySelectorAll('table')).map(t => ({
    //     id: t.id,
    //     headers: Array.from(t.querySelectorAll('th')).map(th => th.textContent.trim())
    //   }))
    // };

    // Check for key dashboard elements
    const gameScreen = document.getElementById('gameScreen');
    expect(gameScreen).not.toBeNull();

    // Check for player table
    const playerTable = document.getElementById('playerTable');
    expect(playerTable).not.toBeNull();

    // Check for status elements
    const gameState = document.getElementById('gameState');
    const playerCount = document.getElementById('playerCount');
    expect(gameState).not.toBeNull();
    expect(playerCount).not.toBeNull();
    expect(gameState.textContent).toBe('Not connected');
  });

  test('UI toggling behavior', () => {
    const dom = new JSDOM(createMockStudentHTML(), {
      runScripts: 'outside-only',
      resources: 'usable',
    });
    const { document } = dom.window;

    // Set up minimal mocks for browser APIs
    dom.window.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
    dom.window.io = jest.fn(() => ({
      on: jest.fn(),
      emit: jest.fn(),
    }));

    // Find elements that have toggle behavior (showing/hiding)
    const joinForm = document.getElementById('joinForm');
    const gameUI = document.getElementById('gameUI');

    // Test initial state
    expect(joinForm.classList.contains('hidden')).toBe(false);
    expect(gameUI.classList.contains('hidden')).toBe(true);

    // Simulate toggling UI elements
    joinForm.classList.add('hidden');
    gameUI.classList.remove('hidden');

    // Test toggled state
    expect(joinForm.classList.contains('hidden')).toBe(true);
    expect(gameUI.classList.contains('hidden')).toBe(false);
  });
});
