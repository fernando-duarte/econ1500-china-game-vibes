const http = require('http');

// Test that only uses HTTP
describe('HTTP Only Tests', () => {
  let server;
  let port;

  beforeAll((done) => {
    // Create HTTP server
    server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end('OK');
    });
    
    // Start server on random port
    server.listen(() => {
      port = server.address().port;
      console.log(`Server listening on port ${port}`);
      done();
    });
  });

  afterAll((done) => {
    // Close server
    server.close(() => {
      console.log('Server closed');
      done();
    });
  });

  // Test HTTP functionality
  test('should respond to HTTP requests', (done) => {
    console.log(`Making HTTP request to port ${port}`);
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET'
    }, (res) => {
      console.log(`Got HTTP response: ${res.statusCode}`);
      expect(res.statusCode).toBe(200);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response body: ${data}`);
        expect(data).toBe('OK');
        done();
      });
    });
    
    req.on('error', (error) => {
      console.error(`HTTP request error: ${error.message}`);
      done(error);
    });
    
    req.end();
  });
});
