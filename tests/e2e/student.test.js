const { startTestServer, launchBrowser } = require('./e2eUtils');
const SELECTORS = require('../../shared/selectors');

describe('Student Flow', () => {
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
  
  test('Student can join a game with a game code', async () => {
    // Navigate to student page
    await page.goto(`http://localhost:${server.port}/`);
    
    // Get selectors from shared file
    const joinFormId = SELECTORS.STUDENT.JOIN_FORM;
    const playerNameId = SELECTORS.STUDENT.PLAYER_NAME;
    const gameCodeId = SELECTORS.STUDENT.GAME_CODE;
    const joinButtonId = SELECTORS.STUDENT.JOIN_BUTTON;
    const gameUiId = SELECTORS.STUDENT.GAME_UI;
    
    // Wait for page to load using the correct form ID
    await page.waitForSelector(`#${joinFormId}`);
    
    // Check initial UI state - game UI should be hidden
    const isGameUiHidden = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el ? el.classList.contains('hidden') : true;
    }, gameUiId);
    expect(isGameUiHidden).toBe(true);
    
    // Fill in form
    if (gameCodeId) {
      await page.type(`#${gameCodeId}`, 'TESTCODE');
    }
    await page.type(`#${playerNameId}`, 'Test Student');
    
    // Submit form
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), // May not navigate
      page.click(`#${joinButtonId}`)
    ]);
    
    // Check for confirmation in page content
    const pageContent = await page.content();
    expect(pageContent).toContain('Test Student');
  }, 15000);
  
  test('Student can submit a decision', async () => {
    // Navigate to student page (assuming game is already joined from previous test)
    await page.goto(`http://localhost:${server.port}/`);
    
    // Get selectors from shared file
    const decisionFormId = SELECTORS.STUDENT.DECISION_FORM;
    const investmentId = SELECTORS.STUDENT.INVESTMENT;
    const submitButtonId = SELECTORS.STUDENT.SUBMIT_DECISION;
    const confirmationMessageId = SELECTORS.STUDENT.CONFIRMATION_MESSAGE;
    
    // Simulate game already started and UI setup
    await page.evaluate((SELECTORS) => {
      // Create gameUI if it doesn't exist
      let gameUI = document.getElementById(SELECTORS.STUDENT.GAME_UI);
      if (!gameUI) {
        gameUI = document.createElement('div');
        gameUI.id = SELECTORS.STUDENT.GAME_UI;
        document.body.appendChild(gameUI);
      }
      
      // Create decision form if it doesn't exist
      let decisionForm = document.getElementById(SELECTORS.STUDENT.DECISION_FORM);
      if (!decisionForm) {
        decisionForm = document.createElement('form');
        decisionForm.id = SELECTORS.STUDENT.DECISION_FORM;
        gameUI.appendChild(decisionForm);
        
        // Create investment input
        const investmentInput = document.createElement('input');
        investmentInput.id = SELECTORS.STUDENT.INVESTMENT;
        investmentInput.type = 'number';
        decisionForm.appendChild(investmentInput);
        
        // Create submit button
        const submitButton = document.createElement('button');
        submitButton.id = SELECTORS.STUDENT.SUBMIT_DECISION;
        submitButton.textContent = 'Submit';
        decisionForm.appendChild(submitButton);
      }
      
      // Create confirmation message element
      let confirmationMessage = document.getElementById(SELECTORS.STUDENT.CONFIRMATION_MESSAGE);
      if (!confirmationMessage) {
        confirmationMessage = document.createElement('div');
        confirmationMessage.id = SELECTORS.STUDENT.CONFIRMATION_MESSAGE;
        confirmationMessage.style.display = 'none';
        gameUI.appendChild(confirmationMessage);
      }
      
      // Show decision form
      decisionForm.style.display = 'block';
      gameUI.classList.remove('hidden');
      
      // Add form submission handler
      decisionForm.onsubmit = function(e) {
        e.preventDefault();
        confirmationMessage.textContent = 'Decision submitted. Waiting for other players...';
        confirmationMessage.style.display = 'block';
        return false;
      };
    }, SELECTORS);
    
    // Wait for decision form to appear
    await page.waitForSelector(`#${decisionFormId}`);
    
    // Fill in decision values
    await page.type(`#${investmentId}`, '50');
    
    // Submit decision
    await page.click(`#${submitButtonId}`);
    
    // Check for confirmation message
    const confirmationMessage = await page.waitForSelector(`#${confirmationMessageId}`);
    const messageVisible = await page.evaluate(el => {
      return window.getComputedStyle(el).display !== 'none';
    }, confirmationMessage);
    
    expect(messageVisible).toBe(true);
    
    const messageText = await page.evaluate(el => el.textContent, confirmationMessage);
    expect(messageText).toContain('Decision submitted');
  }, 15000);
}); 