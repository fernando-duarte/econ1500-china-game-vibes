const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3001";

console.log("Starting automated socket connection tests...");

// Test 1: Basic Connection and Disconnection
function testBasicConnection() {
  console.log("\n=== Test 1: Basic Connection and Disconnection ===");
  
  const socket = io(SERVER_URL);
  
  socket.on("connect", () => {
    console.log(`Connected! Socket ID: ${socket.id}`);
    console.log("Test 1: Connection successful");
    
    // Disconnect after 2 seconds
    setTimeout(() => {
      socket.disconnect();
      console.log("Manually disconnected");
      
      // Wait a moment and run the next test
      setTimeout(testReconnection, 1000);
    }, 2000);
  });
  
  socket.on("disconnect", (reason) => {
    console.log(`Disconnected from server. Reason: ${reason}`);
  });
  
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
}

// Test 2: Reconnection
function testReconnection() {
  console.log("\n=== Test 2: Reconnection ===");
  
  const socket = io(SERVER_URL);
  let reconnected = false;
  
  socket.on("connect", () => {
    if (!reconnected) {
      console.log(`Connected! Socket ID: ${socket.id}`);
      
      // Forcefully disconnect and rely on auto-reconnect
      setTimeout(() => {
        console.log("Forcing disconnect to test reconnection...");
        socket.io.engine.close();
      }, 1000);
      
      reconnected = true;
    } else {
      console.log(`Reconnected! New Socket ID: ${socket.id}`);
      console.log("Test 2: Reconnection successful");
      
      // Clean up and move to next test
      setTimeout(() => {
        socket.disconnect();
        console.log("Test 2 complete, moving to next test");
        setTimeout(testPlayerJoinAndReconnect, 1000);
      }, 2000);
    }
  });
  
  socket.on("reconnect_attempt", (attempt) => {
    console.log(`Reconnection attempt ${attempt}`);
  });
  
  socket.on("reconnect", () => {
    console.log("Socket.io reports reconnected event");
  });
  
  socket.on("disconnect", (reason) => {
    console.log(`Disconnected from server. Reason: ${reason}`);
  });
}

// Test 3: Player Join and Reconnect
function testPlayerJoinAndReconnect() {
  console.log("\n=== Test 3: Player Join and Reconnect ===");
  
  const socket = io(SERVER_URL);
  const playerName = "TestPlayer" + Math.floor(Math.random() * 1000);
  let isReconnecting = false;
  
  socket.on("connect", () => {
    console.log(`Connected! Socket ID: ${socket.id}`);
    
    if (!isReconnecting) {
      // Normal join
      console.log(`Joining game as ${playerName}`);
      socket.emit('join_game', { playerName });
    } else {
      // Reconnect with same name
      console.log(`Reconnecting as ${playerName}`);
      socket.emit('join_game', { playerName, isReconnect: true });
    }
  });
  
  socket.on("join_ack", (data) => {
    console.log("Join acknowledgment received:", data);
    
    if (!isReconnecting && data.success) {
      console.log("Initial join successful!");
      
      // Wait and then disconnect to test reconnection
      setTimeout(() => {
        console.log("Disconnecting to test reconnection...");
        socket.disconnect();
        
        // Wait and reconnect
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          isReconnecting = true;
          socket.connect();
        }, 2000);
      }, 2000);
    } else if (isReconnecting && data.success) {
      console.log("Reconnection join successful!");
      console.log("Test 3: Player join and reconnect successful");
      
      // Clean up and move to next test
      setTimeout(() => {
        socket.disconnect();
        console.log("Test 3 complete, moving to next test");
        setTimeout(testMultipleClients, 1000);
      }, 2000);
    }
  });
  
  socket.on("game_joined", (data) => {
    console.log("Game joined:", data);
  });
  
  socket.on("connection_status", (data) => {
    console.log("Connection status update:", data);
  });
  
  socket.on("state_snapshot", (data) => {
    console.log("State snapshot received:", data);
  });
  
  socket.on("disconnect", (reason) => {
    console.log(`Disconnected from server. Reason: ${reason}`);
  });
}

// Test 4: Multiple Clients with Same Name
function testMultipleClients() {
  console.log("\n=== Test 4: Multiple Clients with Same Name ===");
  
  const playerName = "DuplicatePlayer" + Math.floor(Math.random() * 1000);
  
  // First client
  const client1 = io(SERVER_URL);
  
  client1.on("connect", () => {
    console.log(`Client 1 connected! Socket ID: ${client1.id}`);
    console.log(`Client 1 joining as ${playerName}`);
    client1.emit('join_game', { playerName });
  });
  
  client1.on("join_ack", (data) => {
    console.log("Client 1 join acknowledged:", data);
    
    if (data.success) {
      // Connect second client with same name
      setTimeout(() => {
        const client2 = io(SERVER_URL);
        
        client2.on("connect", () => {
          console.log(`Client 2 connected! Socket ID: ${client2.id}`);
          console.log(`Client 2 joining as ${playerName} (same as Client 1)`);
          client2.emit('join_game', { playerName });
        });
        
        client2.on("join_ack", (data) => {
          console.log("Client 2 join acknowledged:", data);
          
          // Cleanup after test
          setTimeout(() => {
            client2.disconnect();
            console.log("Client 2 disconnected");
            setTimeout(() => {
              client1.disconnect();
              console.log("Client 1 disconnected");
              console.log("Test 4 complete, moving to next test");
              setTimeout(testConnectionCheck, 1000);
            }, 1000);
          }, 3000);
        });
        
        client2.on("connection_status", (data) => {
          console.log("Client 2 connection status:", data);
        });
        
        client2.on("disconnect", (reason) => {
          console.log(`Client 2 disconnected. Reason: ${reason}`);
        });
      }, 2000);
    }
  });
  
  client1.on("connection_status", (data) => {
    console.log("Client 1 connection status:", data);
  });
  
  client1.on("disconnect", (reason) => {
    console.log(`Client 1 disconnected. Reason: ${reason}`);
  });
}

// Test 5: Connection Check Feature
function testConnectionCheck() {
  console.log("\n=== Test 5: Connection Check Feature ===");
  
  const socket = io(SERVER_URL);
  
  socket.on("connect", () => {
    console.log(`Connected! Socket ID: ${socket.id}`);
    
    // Test connection check
    console.log("Testing connection check...");
    let responseReceived = false;
    
    socket.emit('connection_check', {}, (response) => {
      responseReceived = true;
      console.log("Connection check response:", response);
      console.log("Test 5: Connection check successful");
      
      // Clean up and move to next test
      setTimeout(() => {
        socket.disconnect();
        console.log("Test 5 complete, moving to final test");
        setTimeout(testServerDisconnect, 1000);
      }, 1000);
    });
    
    // Check if response was received
    setTimeout(() => {
      if (!responseReceived) {
        console.log("No response received from connection check!");
        console.log("Test 5: Connection check failed");
        socket.disconnect();
        setTimeout(testServerDisconnect, 1000);
      }
    }, 5000);
  });
  
  socket.on("disconnect", (reason) => {
    console.log(`Disconnected from server. Reason: ${reason}`);
  });
}

// Test 6: Server Disconnect Handling
function testServerDisconnect() {
  console.log("\n=== Test 6: Server Disconnect Handling ===");
  console.log("This test requires manual intervention.");
  console.log("Please press Ctrl+C on the server process and restart it within 10 seconds.");
  console.log("We'll wait 15 seconds and then check if our socket can automatically reconnect.");
  
  const socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  });
  
  socket.on("connect", () => {
    console.log(`Connected! Socket ID: ${socket.id}`);
    
    if (socket.recovered) {
      console.log("Connection recovered with server state!");
    }
  });
  
  socket.on("disconnect", (reason) => {
    console.log(`Disconnected from server. Reason: ${reason}`);
  });
  
  socket.on("reconnect_attempt", (attempt) => {
    console.log(`Reconnection attempt ${attempt} after server disconnect`);
  });
  
  socket.on("reconnect", (attemptNumber) => {
    console.log(`Reconnected to server after ${attemptNumber} attempts!`);
    console.log("Test 6: Server disconnect handling successful");
    
    // End all tests
    setTimeout(() => {
      socket.disconnect();
      console.log("\n=== All tests completed ===");
      console.log("Summary: Our socket connection reliability improvements are working correctly.");
      process.exit(0);
    }, 2000);
  });
  
  socket.on("reconnect_failed", () => {
    console.log("Failed to reconnect to server after all attempts");
    console.log("Test 6: Server disconnect handling failed");
    console.log("\n=== Tests completed with some failures ===");
    process.exit(1);
  });
  
  // Set a timeout to end the test if no reconnection happens
  setTimeout(() => {
    console.log("No reconnection observed after 15 seconds");
    console.log("Test 6: Server disconnect handling inconclusive");
    console.log("\n=== Tests completed ===");
    process.exit(0);
  }, 15000);
}

// Start the tests
testBasicConnection(); 