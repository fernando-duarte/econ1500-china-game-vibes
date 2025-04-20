const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3004"; // Using the new port that's working
const PLAYER_NAME = "DuplicatePlayer" + Math.floor(Math.random() * 1000);

console.log(`Testing multiple clients with same player name: ${PLAYER_NAME}`);

// Create first client
const client1 = io(SERVER_URL, {
  reconnection: true
});

client1.on("connect", () => {
  console.log(`CLIENT 1: Connected with ID ${client1.id}`);
  client1.emit('join_game', { playerName: PLAYER_NAME });
});

client1.on("join_ack", (data) => {
  console.log("CLIENT 1: Join acknowledgment received:", data);
  
  if (data.success) {
    console.log("CLIENT 1: Successfully joined the game");
    
    // Connect second client with the same name after 2 seconds
    setTimeout(() => {
      console.log(`Creating CLIENT 2 with same player name: ${PLAYER_NAME}`);
      
      const client2 = io(SERVER_URL, {
        reconnection: true
      });
      
      client2.on("connect", () => {
        console.log(`CLIENT 2: Connected with ID ${client2.id}`);
        client2.emit('join_game', { playerName: PLAYER_NAME });
      });
      
      client2.on("join_ack", (data) => {
        console.log("CLIENT 2: Join acknowledgment received:", data);
        
        if (data.success) {
          console.log("CLIENT 2: Successfully joined and replaced CLIENT 1");
        } else {
          console.log("CLIENT 2: Failed to join, this is unexpected");
        }
      });
      
      client2.on("game_joined", (data) => {
        console.log("CLIENT 2: Game joined event received:", data);
      });
      
      client2.on("connection_status", (data) => {
        console.log("CLIENT 2: Connection status update:", data);
      });
      
      client2.on("disconnect", (reason) => {
        console.log(`CLIENT 2: Disconnected. Reason: ${reason}`);
      });
      
      // Exit after 10 seconds
      setTimeout(() => {
        console.log("Test completed. Exiting...");
        client1.disconnect();
        client2.disconnect();
        process.exit(0);
      }, 10000);
    }, 2000);
  } else {
    console.log("CLIENT 1: Failed to join");
    client1.disconnect();
    process.exit(1);
  }
});

client1.on("game_joined", (data) => {
  console.log("CLIENT 1: Game joined event received:", data);
});

client1.on("connection_status", (data) => {
  console.log("CLIENT 1: Connection status update:", data);
});

client1.on("disconnect", (reason) => {
  console.log(`CLIENT 1: Disconnected. Reason: ${reason}`);
}); 