const request = require('supertest');
const { app } = require('../../server/index');

/**
 * Template for HTTP-based tests
 * 
 * This template can be used as a starting point for creating new HTTP-based tests.
 * It demonstrates how to test API endpoints using supertest.
 */
describe('Template HTTP Tests', () => {
  // Test API endpoints
  test('GET / should return student.html', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('GET /instructor should return instructor.html', async () => {
    const response = await request(app).get('/instructor');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('GET /screen should return screen.html', async () => {
    const response = await request(app).get('/screen');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('GET /constants.js should return JavaScript', async () => {
    const response = await request(app).get('/constants.js');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/javascript/);
    expect(response.text).toContain('const CONSTANTS =');
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
  });
});
