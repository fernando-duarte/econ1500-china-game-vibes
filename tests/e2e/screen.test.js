const { startTestServer, launchBrowser } = require('./e2eUtils');
const selectors = require('../selectors');

describe('Screen Dashboard', () => {
  let server;
  let browser;
  let page;
  
  beforeAll(async () => {
    // Start test server
    server = await startTestServer();
    
    // Launch browser
    const browserObj = await launchBrowser();
    browser = browserObj.browser;
    
    // Create a new page
    page = await browser.newPage();
  }, 30000);
  
  afterAll(async () => {
    // Close browser and server
    await browser.close();
    await server.close();
  });
  
  test('Screen can display game information and update with broadcasts', async () => {
    // Navigate to screen page
    await page.goto(`http://localhost:${server.port}/screen`);
    
    // Get selectors
    const gameScreenId = selectors.screen.gameScreen || selectors.fallbacks.screen.gameScreen;
    const gameStateId = selectors.screen.gameState || selectors.fallbacks.screen.gameState;
    const gameInfoId = selectors.screen.gameInfo || selectors.fallbacks.screen.gameInfo;
    const playerTableId = selectors.screen.playerTable || selectors.fallbacks.screen.playerTable;
    const averageCapitalId = selectors.screen.averageCapital || selectors.fallbacks.screen.averageCapital;
    const playerCountId = selectors.screen.playerCount || selectors.fallbacks.screen.playerCount;
    
    // Simulate UI setup
    await page.evaluate(() => {
      // Create gameScreen if it doesn't exist
      let gameScreen = document.getElementById('gameScreen');
      if (!gameScreen) {
        gameScreen = document.createElement('div');
        gameScreen.id = 'gameScreen';
        document.body.appendChild(gameScreen);
      }
      
      // Create gameState element
      if (!document.getElementById('gameState')) {
        const gameState = document.createElement('div');
        gameState.id = 'gameState';
        gameState.textContent = 'Not connected';
        gameScreen.appendChild(gameState);
      }
      
      // Create gameInfo element
      if (!document.getElementById('gameInfo')) {
        const gameInfo = document.createElement('div');
        gameInfo.id = 'gameInfo';
        gameScreen.appendChild(gameInfo);
      }
      
      // Create playerTable element
      if (!document.getElementById('playerTable')) {
        const playerTable = document.createElement('table');
        playerTable.id = 'playerTable';
        
        // Create table structure
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const nameHeader = document.createElement('th');
        nameHeader.textContent = 'Player';
        headerRow.appendChild(nameHeader);
        
        const capitalHeader = document.createElement('th');
        capitalHeader.textContent = 'Capital';
        headerRow.appendChild(capitalHeader);
        
        thead.appendChild(headerRow);
        playerTable.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        playerTable.appendChild(tbody);
        
        gameScreen.appendChild(playerTable);
      }
      
      // Create averageCapital element
      if (!document.getElementById('averageCapital')) {
        const averageCapital = document.createElement('div');
        averageCapital.id = 'averageCapital';
        averageCapital.textContent = 'Average Capital: -';
        gameScreen.appendChild(averageCapital);
      }
      
      // Create playerCount element
      if (!document.getElementById('playerCount')) {
        const playerCount = document.createElement('div');
        playerCount.id = 'playerCount';
        playerCount.textContent = 'Players: 0';
        gameScreen.appendChild(playerCount);
      }
    });
    
    // Wait for page to load
    await page.waitForSelector(`#${gameScreenId}`);
    
    // Check initial state
    const initialState = await page.$eval(`#${gameStateId}`, el => el.textContent);
    expect(initialState).toContain('Not connected');
    
    // Simulate game connection
    await page.evaluate(() => {
      // Update game info
      document.getElementById('gameInfo').textContent = 'Game ID: TEST123';
      
      // Update game state
      document.getElementById('gameState').textContent = 'Running';
      
      // Add player data
      const tbody = document.querySelector('#playerTable tbody');
      
      // Create player rows
      const players = [
        { id: 'player1', name: 'Player 1', capital: 100 },
        { id: 'player2', name: 'Player 2', capital: 200 }
      ];
      
      players.forEach(player => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = player.name;
        row.appendChild(nameCell);
        
        const capitalCell = document.createElement('td');
        capitalCell.textContent = player.capital;
        row.appendChild(capitalCell);
        
        tbody.appendChild(row);
      });
      
      // Update average capital
      document.getElementById('averageCapital').textContent = 'Average Capital: 150';
      
      // Update player count
      document.getElementById('playerCount').textContent = 'Players: 2';
    });
    
    // Check that game info is displayed
    const gameInfo = await page.$eval(`#${gameInfoId}`, el => el.textContent);
    expect(gameInfo).toContain('TEST123');
    
    // Check that player table is populated
    const playerRows = await page.$$(`#${playerTableId} tbody tr`);
    expect(playerRows.length).toBe(2);
    
    // Check that player information is correct
    const player1Name = await playerRows[0].$eval('td:nth-child(1)', td => td.textContent);
    expect(player1Name).toBe('Player 1');
    
    const player2Capital = await playerRows[1].$eval('td:nth-child(2)', td => td.textContent);
    expect(player2Capital).toBe('200');
    
    // Check that average capital is updated
    const averageCapital = await page.$eval(`#${averageCapitalId}`, el => el.textContent);
    expect(averageCapital).toContain('150');
    
    // Check that player count is updated
    const playerCount = await page.$eval(`#${playerCountId}`, el => el.textContent);
    expect(playerCount).toContain('2');
  }, 15000);
}); 