const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3001";
const PLAYER_NAME = "TestPlayer" + Math.floor(Math.random() * 1000);

console.log(`Testing server restart reconnection with player: ${PLAYER_NAME}`);

// Create socket
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

// Track connection events
socket.on("connect", () => {
  console.log(`Connected! Socket ID: ${socket.id}`);
  
  // Join the game
  socket.emit('join_game', { playerName: PLAYER_NAME });
});

socket.on("join_ack", (data) => {
  console.log("Join acknowledgment received:", data);
  
  if (data.success) {
    console.log("Successfully joined the game");
    console.log("\nNow please restart the server (Ctrl+C and run it again)");
    console.log("The client will attempt to reconnect and rejoin the game automatically");
  }
});

socket.on("game_joined", (data) => {
  console.log("Game joined event received:", data);
});

socket.on("connection_status", (data) => {
  console.log("Connection status update:", data);
  
  // If server is restarting, we should receive this notification
  if (data.status === 'server_restart') {
    console.log("Server is restarting as expected. Client will auto-reconnect...");
  }
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
  console.log("Attempting to rejoin the game...");
  
  // When reconnected, try to rejoin with the same player name
  socket.emit('join_game', { 
    playerName: PLAYER_NAME, 
    isReconnect: true 
  });
});

socket.on("reconnect_failed", () => {
  console.log("Failed to reconnect after multiple attempts");
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
}); 