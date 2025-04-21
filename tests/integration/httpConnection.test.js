const http = require('http');

describe('Basic HTTP Connection Test', () => {
  let server;
  let port;

  beforeAll((done) => {
    // Create a simple HTTP server that just responds with "OK"
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
    
    // Start the server on a random port
    server.listen(0, () => {
      port = server.address().port;
      console.log(`HTTP server listening on port ${port}`);
      done();
    });
  });

  afterAll((done) => {
    // Close the server
    server.close(() => {
      console.log('HTTP server closed');
      done();
    });
  });

  // Simple test to verify basic HTTP functionality
  it('should respond to HTTP request', (done) => {
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