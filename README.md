# Solow Growth Model Classroom Game

A web-based, real-time classroom game that demonstrates the Solow-Swan growth model concepts through student decision-making in a simulated economy.

## Overview

This application allows students to participate in a 10-round economic simulation where they make investment decisions that affect their capital accumulation and output over time. The game illustrates key economic concepts like:

- Capital accumulation
- Depreciation
- Diminishing returns
- Steady-state equilibrium

## Technology Stack

- **Server**: Node.js, Express, Socket.IO
- **Client**: HTML, CSS, JavaScript
- **Deployment**: GitHub, AWS EC2 (optional)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/solow-game.git
   cd solow-game
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   NODE_ENV=development
   ```

## Running the Application

1. Start the server:
   ```
   npm start
   ```

2. Access the application:
   - Student view: http://localhost:3000
   - Instructor view: http://localhost:3000/instructor

## Game Flow

1. **Instructor creates a game**
2. **Students join** using their chosen names
3. **Instructor starts the game** once all students have joined
4. For each of the 10 rounds:
   - Students receive their current capital and output values
   - Students decide how much to invest (between 0 and their current output)
   - After all submissions or 60 seconds, the server processes all investments
   - Capital and output are updated according to the Solow model
5. **Game ends** after 10 rounds, and the student with the highest final output wins

## Economic Model Details

- **Production Function**: Y = K^α where α = 0.3
- **Depreciation Rate**: δ = 0.1
- **Capital Update Formula**: K_new = (1 - δ) × K + investment
- **Initial Capital**: K_0 = 100
- **Initial Output**: Y_0 ≈ 4.64

## Deployment

### Local Testing

For testing with multiple users locally, open multiple browser tabs:
- One for the instructor
- Several for different students

### Production Deployment (AWS EC2)

1. Launch an EC2 instance (t3.small recommended)
2. Install Node.js and PM2
3. Clone the repository
4. Install dependencies
5. Set up PM2 to manage the application:
   ```
   pm2 start server/index.js --name solow-game
   pm2 save
   pm2 startup
   ```

## License

MIT

## Running Tests

This project uses Jest for testing, including end-to-end tests with jest-puppeteer.

### Test Commands

- `npm test`: Run all tests
- `npm run test:unit`: Run only unit tests
- `npm run test:integration`: Run only integration tests
- `npm run test:e2e`: Run only end-to-end tests with Puppeteer
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate test coverage report

### End-to-End Testing with jest-puppeteer

The project is configured to use jest-puppeteer (v11.0.0) for end-to-end testing with Puppeteer (v24.6.1). These tests automate browser interactions to verify the application works correctly from a user's perspective.

#### How it Works

- jest-puppeteer automatically launches a Chrome browser for testing
- The tests navigate to the application and perform actions like a real user
- Screenshots are captured during tests and saved to `tests/e2e/screenshots/`

#### Writing E2E Tests

E2E tests are located in the `tests/e2e/` directory. Here's a simple example:

```javascript
describe('Login Page', () => {
  beforeAll(async () => {
    await page.goto('http://localhost:3000/login');
  });

  it('should allow user to log in', async () => {
    await page.type('#username', 'testuser');
    await page.type('#password', 'password');
    await page.click('#login-button');
    
    // Verify successful login
    await page.waitForSelector('#welcome-message');
    const welcomeText = await page.$eval('#welcome-message', el => el.textContent);
    expect(welcomeText).toContain('Welcome');
  });
});
```

#### Configuration

The jest-puppeteer configuration is in `jest-puppeteer.config.js`. You can modify browser options, server settings, and more in this file. 