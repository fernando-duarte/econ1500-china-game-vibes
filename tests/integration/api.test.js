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
  
  // Note: Optional endpoints /api/games and /api/game/:id are not implemented
  // in this version of the application, so we're skipping those tests
}); 