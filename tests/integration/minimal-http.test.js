/**
 * Minimal HTTP Test
 * 
 * This is a minimal test for HTTP functionality.
 */
const http = require('http');

describe('Minimal HTTP Test', () => {
  let server;
  let port;
  
  beforeAll((done) => {
    // Create HTTP server
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
    
    // Start server on a random port
    server.listen(0, () => {
      port = server.address().port;
      console.log(`Server listening on port ${port}`);
      done();
    });
  });
  
  afterAll((done) => {
    // Close server
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });
  
  test('should respond to HTTP request', (done) => {
    // Create a request to our server
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET'
    }, (res) => {
      console.log(`Got response: ${res.statusCode}`);
      
      // Check status code
      expect(res.statusCode).toBe(200);
      
      // Collect response data
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Check response body
      res.on('end', () => {
        console.log(`Response body: ${data}`);
        expect(data).toBe('OK');
        done();
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      done(error);
    });
    
    // End the request
    req.end();
  });
});
