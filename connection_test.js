const { io } = require("socket.io-client");
const readline = require('readline');

const SERVER_URL = "http://localhost:3001";

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create a client socket
let socket = null;
let playerName = "";

// Function to connect with a given player name
function connect(name) {
  console.log(`Connecting as player: ${name}`);
  
  // Create socket
  socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });
  
  // Track connection events
  socket.on("connect", () => {
    console.log(`Connected! Socket ID: ${socket.id}`);
    playerName = name;
    
    // Try to join the game
    socket.emit('join_game', { playerName: name });
  });
  
  socket.on("join_ack", (data) => {
    console.log("Join acknowledgment received:", data);
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
  
  socket.on("reconnect_attempt", (attempt) => {
    console.log(`Reconnection attempt ${attempt}`);
  });
  
  socket.on("reconnect", () => {
    console.log("Reconnected to server!");
  });
  
  socket.on("reconnect_failed", () => {
    console.log("Failed to reconnect after multiple attempts");
  });
  
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
}

// Function to reconnect as the same player
function reconnect() {
  if (!playerName) {
    console.log("No player name set. Cannot reconnect.");
    return;
  }
  
  console.log(`Attempting to reconnect as player: ${playerName}`);
  
  if (socket && socket.connected) {
    console.log("Socket already connected! Disconnecting first...");
    socket.disconnect();
  }
  
  // Create new socket
  socket = io(SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });
  
  // Set up event handlers
  socket.on("connect", () => {
    console.log(`Reconnected! New Socket ID: ${socket.id}`);
    socket.emit('join_game', { playerName, isReconnect: true });
  });
  
  socket.on("join_ack", (data) => {
    console.log("Join acknowledgment received:", data);
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

// Function to simulate multiple clients with the same player name
function simulateMultipleClients(name) {
  console.log(`Simulating multiple clients with player name: ${name}`);
  
  // Create first client
  const client1 = io(SERVER_URL);
  
  client1.on("connect", () => {
    console.log(`Client 1 connected! Socket ID: ${client1.id}`);
    client1.emit('join_game', { playerName: name });
    
    // After client 1 joins, connect client 2 with the same name
    setTimeout(() => {
      const client2 = io(SERVER_URL);
      
      client2.on("connect", () => {
        console.log(`Client 2 connected! Socket ID: ${client2.id}`);
        client2.emit('join_game', { playerName: name });
      });
      
      client2.on("connection_status", (data) => {
        console.log("Client 2 connection status:", data);
      });
      
      client2.on("join_ack", (data) => {
        console.log("Client 2 join acknowledgment:", data);
      });
      
      client2.on("disconnect", (reason) => {
        console.log(`Client 2 disconnected. Reason: ${reason}`);
      });
      
      // Cleanup after test
      setTimeout(() => {
        client2.disconnect();
        console.log("Client 2 manually disconnected");
      }, 5000);
    }, 2000);
  });
  
  client1.on("connection_status", (data) => {
    console.log("Client 1 connection status:", data);
  });
  
  client1.on("join_ack", (data) => {
    console.log("Client 1 join acknowledgment:", data);
  });
  
  client1.on("disconnect", (reason) => {
    console.log(`Client 1 disconnected. Reason: ${reason}`);
  });
  
  // Cleanup after test
  setTimeout(() => {
    client1.disconnect();
    console.log("Client 1 manually disconnected");
  }, 10000);
}

// Function to test connection check feature
function testConnectionCheck() {
  if (!socket || !socket.connected) {
    console.log("Socket not connected. Cannot test connection check.");
    return;
  }
  
  console.log("Testing connection check...");
  let responseReceived = false;
  
  socket.emit('connection_check', {}, (response) => {
    responseReceived = true;
    console.log("Connection check response:", response);
  });
  
  // Check if response was received
  setTimeout(() => {
    if (!responseReceived) {
      console.log("No response received from connection check!");
    }
  }, 2000);
}

// Function to display menu and handle user input
function showMenu() {
  console.log("\n===== Socket Connection Test Menu =====");
  console.log("1. Connect with a player name");
  console.log("2. Disconnect");
  console.log("3. Reconnect");
  console.log("4. Test connection check");
  console.log("5. Simulate multiple clients with same name");
  console.log("6. Request state snapshot");
  console.log("0. Exit");
  
  rl.question("\nEnter your choice: ", (choice) => {
    switch (choice) {
      case "1":
        rl.question("Enter player name: ", (name) => {
          connect(name);
          setTimeout(showMenu, 1000);
        });
        break;
      
      case "2":
        if (socket && socket.connected) {
          socket.disconnect();
          console.log("Disconnected from server");
        } else {
          console.log("Socket not connected");
        }
        setTimeout(showMenu, 1000);
        break;
      
      case "3":
        reconnect();
        setTimeout(showMenu, 1000);
        break;
      
      case "4":
        testConnectionCheck();
        setTimeout(showMenu, 1000);
        break;
      
      case "5":
        rl.question("Enter player name for multiple clients: ", (name) => {
          simulateMultipleClients(name);
          setTimeout(showMenu, 11000);
        });
        break;
      
      case "6":
        if (socket && socket.connected && playerName) {
          console.log("Requesting state snapshot...");
          socket.emit('request_state_snapshot', { playerName });
        } else {
          console.log("Socket not connected or no player name set");
        }
        setTimeout(showMenu, 1000);
        break;
      
      case "0":
        console.log("Exiting...");
        if (socket && socket.connected) {
          socket.disconnect();
        }
        rl.close();
        process.exit(0);
        break;
      
      default:
        console.log("Invalid choice");
        setTimeout(showMenu, 500);
    }
  });
}

// Start the program
console.log("Socket.io Connection Test");
console.log(`Server URL: ${SERVER_URL}`);
showMenu(); 