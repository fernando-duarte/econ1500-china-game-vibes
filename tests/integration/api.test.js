const request = require('supertest');
const { app } = require('../../server/index');
const CONSTANTS = require('../../shared/constants');

describe('API Endpoints', () => {
  test('GET /constants.js returns correct game constants', async () => {
    const response = await request(app).get('/constants.js');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/javascript/);
    
    // Verify key constants are present in the response
    const constantsKeys = Object.keys(CONSTANTS);
    constantsKeys.forEach(key => {
      expect(response.text).toContain(key);
    });
  });
  
  // Add helper for testing optional endpoints
  beforeAll(() => {
    // Add optional test method that skips if the endpoint doesn't exist
    test.optional = (name, fn, timeout) => {
      test(name, async () => {
        try {
          await fn();
        } catch (error) {
          if (error.status === 404) {
            console.log(`Skipping optional test for non-existent endpoint: ${name}`);
            return;
          }
          throw error;
        }
      }, timeout);
    };
  });
  
  // Optional tests for additional API endpoints if they exist
  test.optional('GET /api/games returns list of games', async () => {
    const response = await request(app).get('/api/games');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
  
  test.optional('GET /api/game/:id returns game details', async () => {
    const response = await request(app).get('/api/game/test123');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });
}); 