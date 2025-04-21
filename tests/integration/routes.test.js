const request = require('supertest');
const { app } = require('../../server/index');

// Directly use the app for testing routes without starting a server
describe('Express Routes', () => {
  test('GET / responds with student.html', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('GET /instructor responds with instructor.html', async () => {
    const response = await request(app).get('/instructor');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('GET /screen responds with screen.html', async () => {
    const response = await request(app).get('/screen');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  test('GET /constants.js responds with JavaScript', async () => {
    const response = await request(app).get('/constants.js');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/javascript/);
    expect(response.text).toMatch(/const CONSTANTS =/);
  });

  test('GET /nonexistent returns 404', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
    expect(response.type).toBe('application/json');
    expect(response.body).toHaveProperty('message', 'Not Found');
    expect(response.body).toHaveProperty('path', '/nonexistent');
  });
});
