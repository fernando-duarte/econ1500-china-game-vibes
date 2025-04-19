# Product Market Definition: Solow Growth Model Classroom Game

## 1. Purpose
The Solow Growth Model Classroom Game is an interactive educational simulation designed to teach students the principles of the Solow-Swan economic growth model. The game provides a hands-on experience where students assume the role of economic decision-makers, making choices about investment in capital over multiple rounds. By observing the outcomes of their decisions, students learn how capital accumulation, depreciation, and diminishing returns affect economic growth. The primary goal is to reinforce understanding of steady-state equilibrium and the impact of saving (investment) rates on long-term output.

## 2. User Roles
**Instructor (Game Facilitator):** The instructor sets up and oversees the game session. They initiate the game, share the session code with students, and control the pacing if necessary (e.g., starting/ending rounds). The instructor also monitors the progress of each student’s economy and uses the results for debriefing and discussion. The instructor’s interface provides administrative controls and a view of all players’ performance.

**Students (Players):** Each student is a player managing a virtual economy in the game. Students join the instructor’s game session (using a provided session code) and enter a display name. During the game, each student makes decisions for their economy each round (specifically, how much of their output to invest in new capital). Their objective is to grow their economy’s output over the rounds. Students interact via a simple UI to submit decisions and view feedback (their current capital, output, and possibly rankings).

## 3. Core Game Loop
The core game loop simulates economic periods in which players make investment decisions and observe growth outcomes. The game proceeds as a sequence of rounds as follows:

1. **Game Setup:** The instructor creates a new game session (generating a unique session code) and communicates this code to the students. Students join the session by entering the code and their name. Once all participants have joined, the instructor starts the game.
2. **Initial State:** At the start of the game, each player’s economy is initialized with a predefined capital stock (e.g., K₀ = 100 units). The initial output is calculated using the Solow production function (e.g., Y₀ = K₀^α, assuming labor and technology are fixed at 1 for simplicity). This initial output serves as the resource that can be invested in the first round.
3. **Round Execution (Repeated for each round):**
   1. **Begin Round:** The game enters a new round (e.g., Round 1 of 10). The current round number and each player’s current capital and output are made visible to the respective player (and to the instructor’s dashboard for all players).
   2. **Decision Phase:** Each student decides how much of their current output to invest in new capital this round. This decision can be input as an investment amount (up to the amount of output) or equivalently as a percentage of output. The remainder of output (if any) is considered “consumption” (not used for growth) but is not explicitly scored in the basic game. Students submit their investment decision through the UI. A time limit (for example, 60 seconds) may be enforced for each round’s decision phase to keep the game moving. Students who do not submit within the time limit will have a default decision applied (see Section 4 on fallback rules).
   3. **Processing Phase:** After all decisions are submitted (or the time limit is reached), the server calculates the outcome for each economy:
      - The amount invested by the student (or default if none submitted) becomes new capital added.
      - Capital stock is updated according to the Solow model equation:  
        \[
        K_{new} = (1 - \delta) \times K_{current} + I
        \]  
        where \( \delta \) is the depreciation rate and \( I \) is the investment from that round’s output.
      - The output for the next period is then computed as:  
        \[
        Y_{new} = K_{new}^{\alpha}
        \]  
        (Assuming a production function \( Y = K^{\alpha} \cdot (A \cdot L)^{1-\alpha} \) with \(A \cdot L = 1\) for simplicity. Thus output is proportional to a power of capital, illustrating diminishing returns).
   4. **Feedback Phase:** The results of the round are then displayed. Each student sees an update of their own economy’s new capital stock and new output for the upcoming round. Optionally, a scoreboard or summary view shows all players’ outputs (and perhaps capital) after the round, allowing students to compare progress. The instructor’s dashboard is updated with all players’ decisions and outcomes for that round.
   5. **Next Round:** The game then proceeds to the next round, using the updated capital stocks as the starting point. Steps (a) through (d) repeat for the set number of rounds (e.g., 10 rounds in total).
4. **Game End:** After the final round is processed, the game ends. A final results summary is presented, showing each player’s ending capital and output. The instructor can then announce the winner(s) and lead a discussion on the observed dynamics (e.g., how different investment rates led to different growth trajectories, and how they relate to the theoretical steady state of the Solow model).

Throughout this core loop, the game emphasizes the cause-and-effect relationship between saving/investment decisions and growth. There are natural pauses between rounds for the instructor to explain or for students to observe how their choices impacted their economy. The design ensures the loop is straightforward: observe current state -> make decision -> see outcome -> repeat.

## 4. Winning Conditions
The game is primarily a learning tool, but it incorporates a win condition to motivate participation. The typical winning criterion is based on the economy’s output at the end of the game:

- **Highest Output:** The student whose economy has the highest output (GDP) in the final round is declared the winner. This reflects who achieved the greatest economic growth by the end of the simulation.
- If multiple students tie for highest output, they share the victory (a tie can be acknowledged by the instructor or shown as a tie in the results).
- **Optional Metrics:** Instructors may also discuss other metrics, such as total cumulative output or consumption over all rounds, but these are not used for determining the winner in the standard rules.

The competitive aspect (maximizing final output) encourages students to experiment with aggressive investment strategies, while the post-game discussion can address the trade-offs (for instance, a student who invested 100% each round will have maximum output but effectively zero consumption during the game, raising questions about real-world applicability and utility vs. growth trade-offs).

## 5. Visual Interface Components
The game features a simple, intuitive interface tailored to each role. Below are the key interface components for instructors and students:

### 5.1 Instructor Dashboard
- **Session Management:** A control panel to create a new game session (generating a session code to distribute to students) and start the game when ready. It may also allow the instructor to end the game or pause between rounds if needed.
- **Player Roster:** A list of all students who have joined the session, showing their names (or assigned team names). This updates in real time as students join.
- **Game Controls:** Buttons or actions for “Start Game” and potentially “Next Round” (if manual control of round progression is desired). If rounds are automated with a timer, a pause/resume control might be available.
- **Round Summary Display:** After each round, the dashboard shows a summary of all players’ decisions and outcomes. This could be a table listing each player’s investment decision for the round, their new capital, and new output. It might also highlight the current rank order of outputs.
- **Graphs/Charts (Optional):** The instructor view might include a simple line chart plotting each player’s output over time across rounds, to visually illustrate the growth trajectories and convergence toward a steady state. This can be useful for post-game discussion.
- **Alert/Status Messages:** Notifications about game state changes (e.g., “All submissions received for Round 3” or “Player X reconnected”) to help the instructor manage the session.

### 5.2 Student Interface
- **Join Screen:** A simple form where the student enters the session code (provided by the instructor) and their name to join the game. Feedback is given if the code is invalid or the game is not yet started.
- **Current Status Panel:** Displays the student’s current round number, current capital stock (K), and current output (Y) at the beginning of each round. This lets the player know their resources before making a decision.
- **Decision Input Control:** An input mechanism for the investment decision. This could be a slider (ranging from 0% to 100% of output) or a numeric input box to specify the exact amount to invest (bounded between 0 and the current output amount). The UI might also display the complementary amount that would be “consumed” for clarity.
- **Submit Button:** A clear action to submit the decision. Once submitted, the input is locked for that round (to prevent changes after the deadline).
- **Round Timer:** A visible countdown indicating how much time is left to submit the decision in the current round, if a time limit is enforced.
- **Feedback Display:** After submitting (or when the round ends), the interface updates to show the results:
  - The new capital stock for the next round.
  - The output produced from that new capital (which will be the basis for the next round’s decision).
  - Optionally, a message or small scoreboard snippet showing the top output or the player’s rank among all players for motivation.
- **End-of-Game Summary:** When the game concludes, the student’s interface might show a summary of their performance (e.g., a recap of capital and output over rounds, and their final rank or the winner’s output for comparison). This screen reinforces the learning outcome by letting them reflect on their strategy versus the results.

The visual design is kept clean and focused on numeric feedback, given the quantitative nature of the Solow model. Important values (capital and output) are clearly labeled with units (if any) and updated each round. The use of charts or rankings is optional but encouraged to enhance engagement. All interface components aim to reduce ambiguity (e.g., labeling the input as “Invest this round” and clarifying the meaning of the slider positions) to ensure that players understand the choices they are making and the results they are seeing.

---

# Implementation Plan: Solow Growth Model Classroom Game

## 1. Architecture and Technology Stack
**Architecture Overview:** The game will follow a client-server architecture to support multiple participants in real time. A central server manages the game state and logic, while each participant (instructor or student) interacts through a web-based client application. Real-time communication is crucial for synchronizing game rounds and broadcasting updates; this will be achieved using a WebSocket-based protocol (for example, using Socket.IO or a similar library) allowing bi-directional event-driven communication between clients and server.

- **Server:** The server is responsible for core game logic, state management, and enforcing rules. It will likely be implemented in Node.js (JavaScript/TypeScript) to easily integrate with WebSocket libraries and to use the same language on both client and server. The server maintains data structures for the game session (list of players, current round, each player’s state: capital, output, etc.) and processes each round’s computations. The server also handles timing (round timers), applying default actions when needed, and orchestrating the sequence of rounds. A framework like Express (for basic HTTP endpoints, e.g., serving the client pages or health checks) combined with Socket.IO for real-time events is suitable.
- **Client:** The client is a web front-end that could be implemented using a modern framework (such as React, Vue, or Angular) or simpler HTML/JavaScript if the interface is simple. The client handles user input (joining the game, submitting decisions) and displays updates from the server (round results, etc.). It communicates with the server via WebSocket events defined by the game’s API contract. The client code will maintain minimal state (mostly the information needed for rendering UI) and rely on server messages as the source of truth for game progress.
- **Communication:** All game interactions use event-driven messages over the WebSocket. We define a clear set of events (with specific names and data payloads) to ensure consistent communication. This real-time approach allows immediate feedback to all players when the state changes (e.g., broadcasting round results simultaneously).
- **Data Persistence:** The game state for an ongoing session is held in memory on the server. Given that a session is short-lived (a classroom session), we do not require a persistent database for game data. However, to support fault tolerance (e.g., server restart or crashes), we could periodically save snapshots of the game state (in a simple JSON file or an in-memory database like Redis) to allow restoration. This is an optional enhancement; at minimum, the server will maintain state in memory and use it for reconnecting clients.
- **Scalability Considerations:** The game is intended for classroom sizes (maybe 10-50 players in a session). A single server instance can comfortably handle this load. If needed, the architecture could be extended to support multiple concurrent sessions (each identified by a session code and managed in a dictionary of game states on the server). For the initial implementation, one game session at a time is sufficient.

## 2. Model Parameters and Configuration
The Solow growth model simulation uses a set of economic parameters which will be explicitly defined in the implementation. These parameters can be constants in the code or configurable by the instructor when creating a session (for advanced usage). The default values, based on standard macroeconomic assumptions, are as follows:

| Parameter                  | Symbol | Value (Default) | Description                                                |
|----------------------------|--------|-----------------|------------------------------------------------------------|
| Capital's Share of Output  | α (alpha)  | 0.3             | Output elasticity of capital in the production function. Determines diminishing returns effect (30% of output is contributed by capital in this default setting). |
| Depreciation Rate          | δ (delta) | 0.1             | Fraction of capital that depreciates (wears out) each round (10% per round). |
| Initial Capital per Player | K₀ (K0)   | 100             | The starting capital stock for each player's economy at the beginning of the game. |
| Number of Rounds           | N       | 10              | Total number of rounds (periods) the game will run. After N rounds, the game ends and final outputs are compared. |
| Time Limit per Round       | –       | 60 seconds      | (Adjustable) The amount of time each decision phase lasts before the round is processed. The instructor might be able to adjust this or pause if needed. |

All players share the same global parameters α and δ, ensuring a level playing field and focus on decision-making. The production function used is \( Y = K^{\alpha} \) (with labor and technology assumed constant for all). These values can be hard-coded initially for simplicity. If future enhancements allow the instructor to modify parameters for experimentation, validation should ensure α is between 0 and 1, δ is between 0 and 1, and rounds are a reasonable positive integer (e.g., 1 to 50). 

The implementation will define these parameters in a configuration module or at the top of the game logic for easy adjustment. For example, the server might have:
```javascript
const ALPHA = 0.3;
const DELTA = 0.1;
const INITIAL_CAPITAL = 100;
const TOTAL_ROUNDS = 10;
const ROUND_TIME_LIMIT = 60000; // 60 seconds in milliseconds
```
Using named constants ensures the values are clear and maintainable. These constants will be used in the game logic calculations and in setting up any client UI elements (e.g., timer countdowns). Ensuring they are defined in one place avoids ambiguity and makes it easy to change if needed.

## 3. Client-Server API Contract (Events and Payloads)
The client and server communicate through a series of events. Each event has a defined structure (payload) and clearly identified emitter and receiver(s). The table below outlines the events that form the API contract between client and server:

| Event Name         | Payload Fields                          | Emitted By         | Received By    | Description |
|--------------------|-----------------------------------------|--------------------|----------------|-------------|
| **create_game**    | – (or optional settings like rounds)    | Instructor Client  | Server         | Instructor signals the server to create a new game session. Server responds by creating a session (generating a unique session code) and gets ready to accept players. The session code could be returned via an acknowledgment or a separate event. |
| **game_created**   | `code`: session code                    | Server             | Instructor Client | Sent to the instructor after creating a game. Contains the session code that students need to join. The instructor then shares this code with students. |
| **join_game**      | `code`: session code, `playerName`: string | Student Client    | Server         | A student attempts to join a session using the provided code. The server verifies the code and registers the player. It assigns them an internal ID and initial state (capital = K₀). If the game is already in progress, this event is also used for reconnection (server will treat a known `playerName` rejoining as the same player). |
| **join_ack**       | `success`: bool, `state`: (object)      | Server             | Student Client | Acknowledgment of join. If `success` is true, the student has joined (or rejoined) successfully. `state` contains initial game state relevant to the player: e.g., their assigned player ID, initial capital K₀, current round number, and any other needed info. If `success` is false, the state may contain an error message (invalid code or game full). |
| **player_joined**  | `playerName`: string                    | Server             | Instructor + All Students | Broadcast to all connected clients when a new player joins. Lets everyone (especially the instructor) know that a specific player has entered the game. The instructor’s UI can update the roster, and students could see a count of participants. |
| **start_game**     | –                                       | Instructor Client  | Server         | Instructor starts the game. This triggers the server to begin Round 1. No payload is needed (the server knows which session to start based on the connection). Only accepted if enough players have joined (the instructor decides when to start). |
| **round_start**    | `round`: number, `players`: list of player states (for instructor) or (for student) `capital`: number, `output`: number | Server | Student Clients (All) & Instructor | Signals the beginning of a new round. For each student, the server can emit a personalized event containing their current capital and output. (The instructor’s event may include the full list of all players’ state for display.) This event effectively prompts the students to input their investment for this round. |
| **submit_investment** | `playerId` (implicit by socket or provided), `amount`: number | Student Client | Server | A student submits their investment decision for the current round. The `amount` is how much of their output they choose to invest (must be between 0 and their current output). The server records this submission and waits for others. (If a player sends multiple submissions, the last one before the deadline will be used, or the first one can lock them out from changes, based on implementation choice.) |
| **investment_received** | `playerName` (or ID)               | Server             | Instructor (optional: Students) | Confirmation event broadcast to indicate a particular player has submitted their decision. The instructor can see which players have locked in their choices (useful if waiting on some students). Student clients might use this to display a “waiting for others” indicator. (This event is optional for gameplay but improves transparency.) |
| **round_end** (or **round_result**) | `round`: number, `results`: list of { playerName, investment, newCapital, newOutput } | Server | Instructor + All Students | Sent when the round’s processing is complete. Contains the outcome of the round for each player. This allows all clients to update their displays. The instructor dashboard will show everyone’s results; each student client can extract their own newCapital and newOutput (and potentially see others’ results if showing a leaderboard). If this is the final round, it contains the final outcomes; otherwise, it precedes the next round’s start. |
| **game_over**      | `results`: list of final { playerName, finalCapital, finalOutput, rank }, `winner`: playerName | Server | Instructor + All Students | Indicates the game has finished after the last round. Contains the final standings and the winner information. The clients will transition to a game-over state, displaying final results. (If the final `round_end` already provides all info, this event serves as an explicit terminator.) |
| **state_snapshot** | `state`: full game state snapshot      | Server             | (Reconnecting) Client | When a client (student or instructor) reconnects to an ongoing session, the server sends this event to that client with the current game state. The snapshot includes current round number, time remaining (if mid-round), the player’s current capital and output, whether they have already submitted this round, and possibly a summary of other players (for instructor or leaderboard). This allows the client to restore the UI to the correct state upon reconnection. |

**Notes on Event Design:**

- All event names are in lowercase with underscores for readability (e.g., `join_game`, `round_start`). Consistent naming prevents confusion. (This decision will be mirrored exactly in the code to avoid any mismatch.)
- The payload structures use consistent key names (e.g., `playerName`, `playerId`, `amount`) and data types (numbers for numeric values, strings for names, etc.). These are documented above and must be kept in sync between client and server implementations.
- We assume a single game session per instructor, identified by a session code. The server tracks which connected clients belong to which session (especially important if multiple sessions could run on one server process in the future).
- Acknowledgments vs. events: In some cases, we send explicit events like `join_ack` or `investment_received` for clarity. Alternatively, Socket.IO’s callback acknowledgments can handle simple responses (for example, the server could ack `join_game` with a success flag and state). The plan above uses separate events to keep the flow clear and debuggable, but the implementation could choose either approach.
- Security: The session `code` acts as a simple key to join the game. It should be sufficiently unique (and maybe short-lived) to prevent unwanted participants. In a classroom context this is usually fine (the code is given only to that class).

## 4. Game Flow and Logic Implementation
This section describes how the game logic correlates with the above events and what needs to be implemented at each step:

- **Session Creation:** When the instructor triggers `create_game`, the server creates a new game session object in memory. This includes generating a unique session code (e.g., a short alphanumeric string) that will identify the session. The session object will hold:
  - The game parameters (use defaults or any instructor-provided overrides).
  - An empty list of players (to be filled on joins).
  - A state indicating “waiting for start”.
  - Perhaps a reference to a timer or game loop controller (initially idle).
  
  The server returns the session code via `game_created`. (If the implementation chooses to auto-generate and display the code in the UI without an explicit event, that’s an alternative; but the net effect is the same.)

- **Player Joining:** On `join_game` events, the server verifies the session code and whether the game hasn’t started or is in progress (for late joiners or reconnections). For a new joiner before game start:
  - Create a player entry with a unique ID and the provided name. Initialize their capital to K₀ and output to calculate Y₀ (K₀^α).
  - Add them to the session’s player list.
  - Emit `player_joined` to everyone to update participant lists.
  - Acknowledge the joining player with `join_ack(success=true, state={initialCapital: K₀, initialOutput: Y₀, round: 0, playerId, ...})`. (Round might be considered 0 or “not started” at this point.)
  
  If `join_game` is received and the game is already underway (meaning a likely reconnection or a late join scenario):
  - If the `playerName` matches an existing player who was in the game, treat this as a reconnection. Do not create a new player; instead, re-associate the network connection with the existing player entry.
  - Send a `join_ack` (or immediately a `state_snapshot`) to that client with the current state of their economy and the game (so they can rejoin seamlessly without duplicating a player).
  - If a new student tries to join after the game started and late joining is not allowed, respond with `join_ack(success=false, error="Game in progress")` (and refuse entry).

- **Game Start:** When the instructor sends `start_game`, the server transitions the session state to “in progress” and begins the first round. It will:
  - Set `currentRound = 1`.
  - For Round 1, all players already have initial capital and output computed. The server emits `round_start` to all participants. Each student’s event includes their current capital and output (and round number). The instructor’s event includes every player’s current capital and output to display the starting state.
  - Start the round timer (e.g., 60 seconds) for the decision phase. This can be done with a `setTimeout` on the server that will trigger the end of the round when time expires.
  - Internally mark all players as “awaiting submission” for this round (e.g., a boolean flag or a list of pending players).

- **Decision Collection:** As students send `submit_investment` events, the server records each decision:
  - Validate the incoming `amount` (ensure it’s a number between 0 and the player’s current output; the client should enforce this too, but server double-checks for safety).
  - Store the investment choice in that player’s state for the current round (e.g., attach it to their player object or a round-specific structure).
  - Mark that player as having submitted. If using the optional confirmation, emit `investment_received` to update the instructor (and possibly others).
  - Check if all active players have submitted. If yes, cancel the remaining round timer (to not double-trigger) and immediately process the round results without waiting further.

- **Round Processing:** When the round timer elapses or all submissions are in (whichever comes first):
  - For each player who has no submission recorded for the round, apply the fallback rule (set their investment = 0 by default, as decided).
  - Compute new capital for each player using the formula:  
    `newCapital = (1 - δ) * currentCapital + investmentAmount`.  
    This requires the server to reference each player’s current capital (from the start of the round) and their decided (or default) investmentAmount.
  - Compute new output for each player:  
    `newOutput = (newCapital) ^ α`.  
    (Given our assumptions, this yields the next round’s output. We can decide on whether to round these values or keep as floats; for simplicity, we might keep one decimal or so for display if needed.)
  - Update each player’s state: set `player.currentCapital = newCapital` and `player.currentOutput = newOutput`.
  - Compile a results list (for all players or for each, as needed).
  - Emit `round_end` to all clients with the results. For example, send an array of `{ name, investment, newCapital, newOutput }` for each player. This lets students update their own display (and possibly see others), and the instructor see the entire class outcome.
  - If `currentRound === N` (last round), also emit `game_over` or include a flag in this event to indicate the game is finished, and include final standings and winner info.
  - If it was not the last round, optionally provide a short interval for clients to view the results (maybe a few seconds) before auto-starting the next round.

- **Next Round Loop:** If the game is not over, increment `currentRound` and repeat the cycle:
  - Prepare for the next round by resetting submission flags and timer.
  - Emit `round_start` for the new round with each player’s updated capital/output as the starting point.
  - Start the next round’s timer for decision submissions.
  - The sequence continues until all rounds are completed.

- **Game Conclusion:** After the final round and the `game_over` event:
  - The server may keep the session open for a short time so that clients can still reconnect and see results if needed. Eventually, the session can be closed/archived.
  - The instructor might choose to restart or start a new session for another class; in that case, a new `create_game` would be used.

Throughout the implementation of this flow, careful attention must be paid to state management and synchronization:
  - Ensure that we track which round is active and ignore any late submissions from previous rounds (e.g., if a client’s message was delayed and comes after processing, the server should detect that it’s not the current round and discard it).
  - Manage the timer such that if the round ends early (all submissions in), we cancel the pending timeout to avoid double-processing.
  - Handle error cases gracefully: e.g., if the instructor disconnects right when `start_game` was sent, the server should still proceed; if a student disconnects after submitting, their submission still counts.
  - Log relevant information for debugging (especially on the server): we can log when each round starts/ends, what decisions were made, etc., so if something looks off (like a calculation error or a missing submission that shouldn’t have been missing) it can be traced.

By implementing the game loop on the server side as described, we ensure all clients see a consistent sequence of events. The single source of truth (server) will keep the model’s integrity, and the clients are relatively thin, mainly sending user input and rendering updates.

## 5. Reconnection and State Persistence
To ensure a smooth experience even if clients disconnect or refresh, we design robust reconnection flows and maintain game state on the server:

- **Client Reconnection:** Each player is identified by a unique name or ID in the session. Assuming that the `playerName` chosen is unique in a session (the server can enforce uniqueness on join), we can use it to recognize returning players. If a student refreshes their browser or temporarily loses connection:
  - The client will attempt to reconnect (using the saved session code and the same name). This could be automatic via the socket library’s reconnect or by re-running the join flow on reload (the UI can remember last used name and code).
  - The server receives `join_game` with that session code and playerName. It finds that name in the existing session’s player list.
  - The server then treats this as a reconnection: it links the new socket to the existing player entry and does **not** create a new player.
  - Immediately, the server sends a `state_snapshot` event to the reconnecting client. This snapshot contains:
    - Current round number.
    - The player’s current capital and output.
    - Whether a round is active and awaiting their input, or if they have already submitted this round.
    - If the round is active, how much time is left (the server can calculate remaining time from when the round started).
    - If the reconnection happens just after a round ended, the snapshot might include the last round’s result for that player and indicate that the next round is about to start.
    - Possibly, a list of all players’ current outputs if a leaderboard or the instructor view (for instructor, definitely include all).
  - The client, upon receiving this data, will restore the UI state accordingly. For instance:
    - If the game is in the middle of Round 3 and the player had not submitted yet, the decision input is shown with the remaining timer counting down (which can be started from the provided remaining time).
    - If the player had already submitted in that round, the UI can show a “submitted, waiting for others” message.
    - If the reconnection happens between rounds or after game over, show the relevant info (like last results or final standings).
  - This way, the player can continue almost seamlessly. They might miss some real-time updates while disconnected, but the snapshot and subsequent events will bring them up to speed.

- **Instructor Reconnection:** The instructor can similarly reconnect using the session code (and a flag or recognition that this connection should be treated as the instructor, possibly by storing an instructor ID when the game was created). The server will send a `state_snapshot` with the full state of the game (all players’ data) to the instructor client. The instructor UI will then recreate the dashboard view. Because the game runs on the server, instructor absence does not pause the game (unless we design it to require manual continuation; in our current plan, the game auto-advances, so it keeps going even if the instructor is momentarily offline). The instructor on returning can catch up on what happened via the summary on their dashboard.

- **Persistence (Server Resilience):** In the event the server itself goes down mid-game (e.g., crash or restart), the state in memory would normally be lost. To mitigate this:
  - We can implement periodic saving of game state (for example, after each round_end, write the state to a file or database).
  - On server restart, it could attempt to reload the last saved state and reopen the session. Clients would likely have disconnected, but if they try to reconnect (or if the instructor re-invites them), the server could continue the game from where it left off.
  - This is a complex scenario and might be beyond the scope of an initial implementation. Initially, we assume the server remains stable during a session. However, documenting this possibility means we keep the door open for improvement.
  - If persistence is not implemented, a server crash would end the game. The instructor would have to start a new session and perhaps shorten it or skip to where they left off (which is obviously disruptive). So it’s worth considering at least minimal persistence.
  
- **State Management for Reconnect:** The server must maintain the authoritative game state at all times:
  - Player list and their current capital/output.
  - Current round number and whether a round is active or between rounds.
  - Timer state (when the round started, duration).
  - Which players have submitted in the current round and their chosen investments (so if a reconnecting player had submitted, the server knows that and doesn’t expect a new submission).
  - This information is all used in constructing the `state_snapshot`.
  
- **Multiple Reconnects & Edge Cases:** A player might disconnect and reconnect multiple times in a session. The logic should handle repeated joins from the same name gracefully (always reconnect to their existing state). If a player disconnects and never returns, their state remains in the game and they’ll just keep doing the fallback moves each round. The instructor might optionally remove them from consideration, but our design will simply carry them to the end (with presumably low output due to no investment).
  
- **Example Scenario:** If a student’s browser crashes during Round 5 after they submitted an investment:
  - The server has their investment recorded.
  - The round completes, their capital and output update.
  - When they get back online during Round 6, the snapshot will show Round 6, their new capital/output, and that they haven’t submitted for Round 6 yet (assuming they missed the round start event). They can jump in and submit for Round 6.
  - If they had disconnected *before* submitting in Round 5 and missed the entire round, the server would have applied the fallback for Round 5. When they reconnect in Round 6, the snapshot will show Round 6 with their capital reduced (since no investment in Round 5) and they continue from there. The missed round’s outcome is essentially part of their state now.
  
In summary, by maintaining a clear separation of game state and connections, and by sending state snapshots to reconnecting clients, we make the system robust to disconnections. This addresses the pain point of undefined behavior in network interruptions and ensures the game can proceed without manual resets.

## 6. Handling Missing Submissions (Fallback Rule)
In a classroom setting, it’s possible some players might forget to submit or run out of time in a round. To handle this gracefully, we implement a clear fallback rule for any missing submissions at the end of each decision phase:

- **Fallback Decision:** If a player fails to submit an investment decision by the end of the round’s time limit, the game will assume a default action for them: **invest 0 (zero) units of output for that round**. In other words, a non-responsive player is treated as if they chose not to invest any of their output this round.
- **Effect on Gameplay:** By investing 0, the player’s capital for the next round will be simply whatever remains after depreciation: \( K_{new} = (1 - \delta) \times K_{current} \). They will likely have a lower output next round compared to if they had invested something. This serves as a penalty for not participating, which intuitively encourages timely submissions in future rounds.
- **Why 0?** This rule is straightforward and unambiguous. It aligns with an interpretation that the player consumed all their output (saving rate 0%). Other potential fallbacks (like investing the full output or an average investment) might either overly reward inaction or complicate the comparison. Using zero investment is also easy to implement.
- **Implementation Details:** In the server’s round processing logic, after waiting for submissions:
  - Iterate through all players. For each player without a recorded submission, set their `investmentAmount` for that round to 0.
  - Mark in the logs or internal data that this was a defaulted decision (could be used to show an indicator in the results that the decision was automatic).
  - Continue with the normal calculation using this 0.
  - From the client perspective, that player’s result will just show a 0 investment. The instructor might point it out in discussion (“You didn’t invest this round, so your capital fell by 10%”).
- **User Feedback:** We might optionally inform the affected student that a default action was applied. For example, if feasible, sending a small event like `auto_investment_applied: { round: 3, amount: 0 }` to that student’s client to make it clear their time ran out. However, the same info is conveyed in the round results, so this may not be necessary.
- **No Blocking:** The fallback ensures the game flow is never stuck waiting indefinitely. Even if one or more students don’t respond, the game will progress after the timer. This automated rule means the instructor doesn’t have to manually intervene for missing inputs.
- **Adjustability:** In future, the instructor could be given an option to set a different fallback rule (for instance, invest a fixed percentage of output by default). But for now, we standardize on zero to reduce ambiguity.
- **Documentation:** We will clearly explain this rule in any user-facing instructions so students know what happens if they miss a round. It’s also documented in the code comments so developers (or AI assistants) are aware of the intended behavior.

This explicit handling of missing submissions removes any uncertainty for the developer implementing the logic. It was a previously identified gap that could confuse an AI assistant (what to do if input is missing?), and we have now resolved it with a concrete rule.

## 7. Development Steps
To implement the Solow Growth Model classroom game, the development will be broken down into clear steps, each addressing specific components of the system. This phased approach helps in testing and ensures each requirement is met methodically:

1. **Project Setup:** Initialize the project repository (e.g., a Git repository on GitHub). Set up the Node.js environment and base project structure:
   - Create a new Node.js project (`npm init`) and install essential dependencies: Express (for serving pages or any HTTP needs), Socket.IO (for real-time communication), and any build tools if using a front-end framework.
   - If using a front-end framework like React, use a setup tool (like Create React App or Vite) to scaffold the client app. Otherwise, plan a simple static HTML/JS client served by the server.
   - Configure development scripts and TypeScript if desired (though vanilla JS is fine). Add `.gitignore` for node_modules and build artifacts.
   - Set up linters/formatters (ESLint, Prettier) with rules to enforce the coding standards (for example, no semi vs semi, indent spacing, no trailing whitespace, etc.). This ensures consistency from the start.
   - Verify the server can start and serve a basic page, and that the project structure is ready for development.

2. **Define Game Model and Config:** Before coding the game loop, define the data structures and configuration:
   - Create a config file or section in code for the model parameters (α, δ, K0, N rounds, time limit). Use the values specified (0.3, 0.1, 100, 10, 60s) as defaults.
   - Define classes or factory functions for `Player` and `GameSession`. For example:
     ```js
     class Player {
       constructor(name) {
         this.name = name;
         this.id = generateUniqueId();
         this.capital = INITIAL_CAPITAL;
         this.output = Math.pow(INITIAL_CAPITAL, ALPHA);
         this.hasSubmitted = false;
         this.investment = 0;
       }
     }
     class GameSession {
       constructor(code) {
         this.code = code;
         this.players = [];
         this.currentRound = 0;
         this.maxRounds = TOTAL_ROUNDS;
         this.timer = null;
         this.inProgress = false;
       }
       // methods to add player, start game, etc.
     }
     ```
     Defining these helps organize state management.
   - Implement helper functions for calculations: e.g., `calculateOutput(capital)` returning `Math.pow(capital, ALPHA)`, and maybe a function to advance a player’s state given an investment.
   - This step ensures the core model logic (Solow equations) is captured in one place.

3# Product Market Definition: Solow Growth Model Classroom Game

## 1. Purpose
The Solow Growth Model Classroom Game is an interactive educational simulation designed to teach students the principles of the Solow-Swan economic growth model. The game provides a hands-on experience where students assume the role of economic decision-makers, making choices about investment in capital over multiple rounds. By observing the outcomes of their decisions, students learn how capital accumulation, depreciation, and diminishing returns affect economic growth. The primary goal is to reinforce understanding of steady-state equilibrium and the impact of saving (investment) rates on long-term output.

## 2. User Roles
**Instructor (Game Facilitator):** The instructor sets up and oversees the game session. They initiate the game, share the session code with students, and control the pacing if necessary (e.g., starting/ending rounds). The instructor also monitors the progress of each student’s economy and uses the results for debriefing and discussion. The instructor’s interface provides administrative controls and a view of all players’ performance.

**Students (Players):** Each student is a player managing a virtual economy in the game. Students join the instructor’s game session (using a provided session code) and enter a display name. During the game, each student makes decisions for their economy each round (specifically, how much of their output to invest in new capital). Their objective is to grow their economy’s output over the rounds. Students interact via a simple UI to submit decisions and view feedback (their current capital, output, and possibly rankings).

## 3. Core Game Loop
The core game loop simulates economic periods in which players make investment decisions and observe growth outcomes. The game proceeds as a sequence of rounds as follows:

1. **Game Setup:** The instructor creates a new game session (generating a unique session code) and communicates this code to the students. Students join by entering the code and their name. Once all participants have joined, the instructor starts the game.
2. **Initial State:** At the start, each player’s economy is initialized with a predefined capital stock (e.g., K₀ = 100 units). The initial output is calculated using the Solow production function (e.g., Y₀ = K₀^α, assuming labor and technology are fixed at 1 for simplicity). This initial output is the resource available to invest in Round 1.
3. **Round Execution (repeated for each round):**
   - **Begin Round:** The game enters a new round (e.g., Round 1 of 10). The current round number and each player’s current capital and output are displayed to that player (and to the instructor for all players).
   - **Decision Phase:** Each student decides how much of their current output to invest in new capital. This can be input as an amount (up to their output) or as a percentage. The remainder (output minus investment) is effectively “consumption” (not used for growth, not tracked for scoring). Students submit their decision via the UI. A time limit (e.g., 60 seconds) may be enforced for each round’s decision phase. Students who do not submit in time will have a default action applied (see Section 4).
   - **Processing Phase:** Once time is up or all decisions are in, the server processes the results:
     - Use each player’s investment (or default) to update their capital:  
       \( K_{\text{new}} = (1 - \delta) \times K_{\text{current}} + I \)  
       where δ is the depreciation rate and I is the invested output.
     - Compute new output for next round:  
       \( Y_{\text{new}} = K_{\text{new}}^{\alpha} \)  
       (Assuming \(A \cdot L = 1\), so output is \(K^\alpha\). This illustrates diminishing returns to capital.)
   - **Feedback Phase:** The results of the round are displayed. Each student sees their new capital and new output for the next round. Optionally, a scoreboard can show all players’ outcomes (e.g., outputs or ranks) to foster comparison. The instructor’s view shows a summary of every player’s decision and outcome for that round.
   - **Next Round:** Increase the round counter and repeat the cycle for the next period, using the updated capital as the starting point. The game continues until the predetermined number of rounds (e.g., 10) is completed.
4. **Game End:** After the final round, the game ends. A final summary is shown with each player’s ending capital and output. The instructor announces the winner(s) and can lead a discussion connecting the game outcomes to theoretical expectations (e.g., which strategies led to higher growth, and how results relate to the Solow model’s steady state).

The loop emphasizes the relationship between saving/investment decisions and subsequent growth. Between rounds, the instructor can pause to explain concepts as needed. The design keeps gameplay straightforward: observe current state → decide investment → see outcome → repeat.

## 4. Winning Conditions
While the primary aim is learning, the game includes win conditions to motivate students:

- **Highest Final Output:** The player with the highest output (GDP) in the final round wins the game. This reflects who achieved the greatest economic growth by the end.
- **Ties:** If two or more players share the highest output, they are considered tied for victory. The instructor can acknowledge multiple winners in this case.
- *Additional considerations:* The instructor may highlight other metrics from the results (like total output over time or consumption levels) for discussion, but these are not used to determine the winner in the standard rules.

This competitive element encourages students to experiment with different investment rates. After the game, the instructor can discuss the implications (e.g., investing everything yields high output growth but zero consumption, illustrating a trade-off, or how all players may approach a steady-state growth path).

## 5. Visual Interface Components
The game’s interface is designed to be clear and minimal, focusing on essential information and inputs. Key components for each role are:

### 5.1 Instructor Dashboard
- **Session Control:** Options to create a new game session (which generates a join code) and to start the game when ready. The instructor can also end the game if needed. If manual pacing is desired, a “Next Round” button could be available (though by default rounds auto-advance after each decision phase).
- **Session Code Display:** Once a session is created, the unique code is shown for the instructor to share with students (e.g., displayed in large text).
- **Player List:** A live-updating list of all students who have joined, showing their names (or team identifiers). This lets the instructor verify everyone is in before starting.
- **Real-time Updates:** During the game, the dashboard shows each round’s data for all players. This could be a table with columns for player name, investment chosen, new capital, and new output after each round. The instructor can quickly see how each student is performing.
- **Highlights/Alerts:** Visual cues or messages for important events (e.g., “Round 5 complete – last round coming up” or “Player Alice has reconnected”) to help manage the class.
- **Charts (Optional):** A simple line chart plotting each player’s output over rounds could be included to visualize growth trajectories. This is useful for post-game discussion about convergence to steady state or effects of different investment patterns.

### 5.2 Student Interface
- **Join Screen:** A simple form where the student enters the session code and their name to join the game. Upon joining, a waiting lobby screen might indicate success (“Waiting for the game to start…”).
- **Game Status Panel:** Once the game starts, the main screen shows the current round number, the student’s current capital \(K\), and current output \(Y\).
- **Investment Input:** An interface element (slider or input box) for the student to enter how much of \(Y\) to invest this round. If a slider is used, one end could be labeled 0% (invest nothing) and the other 100% (invest all output), with perhaps tick marks or a numeric display for the actual amount. If a numeric input is used, it should validate max value = current output.
- **Submit Button:** A button to submit the decision. Once clicked (or once time expires), the input is disabled. The student can change their choice until the decision phase ends, if allowed (the UI can allow resubmission until time is up).
- **Timer Countdown:** A visible countdown (e.g., “Time remaining: 30s”) to inform the student how long they have to submit. This creates a sense of pace and ensures timely decisions.
- **Round Outcome Display:** After each round’s processing, the student’s panel updates:
  - New capital for next round.
  - New output (produced from that new capital).
  - An outcome message, e.g., “You invested 20, so your capital grew to 180 and your next output is 180^0.3 ≈ 23.4.”
  - Optionally, their rank or the top output could be shown (“You are 2nd out of 10 players”) to increase engagement.
- **Final Results Screen:** At game end, show the student’s final output and capital, and highlight the winner (“Winner: [Name] with output = X”). The student might also see a summary of their own performance across rounds (maybe a small table or chart of their \(K\) and \(Y\) over time for reflection).

The UI uses clear labels (e.g., “Current Output (Y)”, “Invest in Capital”) and tooltips or brief instructions if needed (especially on the first round, to guide new players). The layout should avoid clutter: for example, on the student view, focus mainly on their own data to prevent information overload. If a scoreboard is shown, it could be toggleable or only show partial info (like top 3) to keep competition healthy without discouraging those behind. Overall, the interface prioritizes readability and ease of use, ensuring that the focus remains on understanding the relationship between investment decisions and growth outcomes.

---

# Implementation Plan: Solow Growth Model Classroom Game

## 1. Architecture and Technology Stack
**Architecture Overview:** The game employs a client-server architecture to support real-time interaction among multiple users. A central server runs the game logic and maintains the authoritative state, while each participant (instructor and students) uses a client application to send inputs and receive updates. Communication is handled via WebSockets (e.g., using Socket.IO) for low-latency, event-driven updates, which is crucial for synchronized rounds and instant feedback.

- **Server:** Implemented with Node.js (JavaScript/TypeScript), the server manages the game session and all computations. It will use Express (or a similar framework) to serve the client and Socket.IO for real-time events. The server holds the game state in memory: player list, current round, parameters (α, δ, etc.), and each player’s current capital/output. It processes incoming events (joins, submissions) and emits outgoing events (round starts, results). The server also enforces rules (e.g., applying depreciation, applying defaults for no submission, controlling the game flow timing).
- **Client:** The client is a web application (which could be a single-page app using a framework like React/Vue or a simpler HTML/JS page) that connects to the server via WebSockets. It displays the game UI for either the instructor or students, and handles user interactions (form inputs, button clicks). The client uses the event contract to know when to update the display (for example, listening for `round_start` or `round_end` events) and sends user actions to the server (like emitting `submit_investment`). The client side can be kept lightweight, relying on server-sent data for most calculations (though computing something like \(Y = K^α\) on the client as well wouldn’t hurt for instantaneous display, the source of truth is the server).
- **Data Flow:** The design follows a publish/subscribe model via events. For instance, when the server emits a `round_start` event, all student clients receive the message and update their UI to enable the input for that round. When a student emits `submit_investment`, the server records it and possibly emits an `investment_received` to update the instructor. At round end, the server broadcasts results to everyone, so all UIs sync up to the new state.
- **Scalability:** The application will handle a classroom-sized group (dozens of concurrent clients). Socket.IO on Node.js can easily manage this scale. In case of larger scale or multiple simultaneous sessions, the server could be extended to manage multiple game rooms (each with its own code and state) and possibly use horizontal scaling with sticky sessions or a message broker. However, for the scope of a classroom game, a single Node instance is sufficient.
- **Technology Stack Summary:** Node.js + Express + Socket.IO for the server; HTML/CSS/JS (possibly with a framework) for the client. We will use PM2 to run the Node server in production (for reliability) and GitHub Actions for CI/CD (as described later). The environment assumes modern browsers for clients (as students can use laptops or smartphones with up-to-date browsers to connect).

## 2. Model Parameters and Configuration
We define explicit constants for the economic model parameters and game settings to ensure clarity in implementation:

| Parameter                  | Symbol | Default Value | Description                                                  |
|----------------------------|--------|---------------|--------------------------------------------------------------|
| Capital's Share of Output  | α      | 0.3           | Output elasticity of capital in the production function \(Y = K^{α}\). Represents diminishing returns intensity (30% capital share). |
| Depreciation Rate          | δ      | 0.1           | Fraction of capital that depreciates each round (10% per round). |
| Initial Capital per Player | K₀     | 100           | Starting capital stock for each player's economy at the beginning of the game. |
| Number of Rounds           | N      | 10            | Total number of rounds in the game session. |
| Decision Time Limit        | –      | 60 seconds    | Time allotted for each decision phase in a round. |

All players operate under the same α and δ values (these could be made configurable by the instructor in a future version, but will be fixed in this implementation for consistency and fairness). The production function used is \(Y = K^{α}\) (assuming labor and technology are constant and normalized to 1). With α = 0.3, there are diminishing returns to capital.

These parameters will be stored in a configuration or constants module on the server. For example, in the server code:
```js
const ALPHA = 0.3;
const DELTA = 0.1;
const INITIAL_CAPITAL = 100;
const TOTAL_ROUNDS = 10;
const ROUND_TIME_LIMIT_MS = 60000; // 60 seconds
```
The client may also need to know some of these values for local UI (e.g., to display the number of rounds or show the timer), so they can be sent to the client on game start or hard-coded if we assume they match the server defaults.

By defining these explicitly, we remove ambiguity (the developer knows exactly what numbers to use) and we ensure that any changes to these values are deliberate and tested. The ranges for these could be validated (if in a future version the instructor inputs them): α and δ should be between 0 and 1, and rounds should be a positive integer.

## 3. Client-Server API Contract (Events)
We establish a clear event-driven API between the client and server. The following table outlines each event, including its payload, who emits it, and who listens:

| Event Name        | Payload                                 | Emitted By           | Received By         | Purpose |
|-------------------|-----------------------------------------|----------------------|---------------------|---------|
| **create_game**   | *(none, or optional settings)*          | Instructor Client    | Server              | Instructor initiates a new game session. Server creates a session (assigns a session code) and prepares to accept players. |
| **game_created**  | `code`: string                          | Server               | Instructor Client   | Server confirms game creation. Contains the unique session code that students will use to join. |
| **join_game**     | `code`: string, `playerName`: string    | Student Client       | Server              | Student requests to join a game with given code and name. Server registers the player to that session if the code is valid. Also used by returning players on reconnect (same code & name). |
| **join_ack**      | `success`: bool, `error` (if any), initial state data | Server | Student Client | Acknowledgment of join request. If successful, contains initial state (e.g., player ID, initial capital/output, current round or start status). If failed, contains an error message (e.g., invalid code or name conflict). |
| **player_joined** | `playerName`: string                    | Server               | Instructor + Students (all) | Notification that a new player has joined the session. Used to update participant lists on all clients. |
| **start_game**    | *(none)*                                | Instructor Client    | Server              | Instructor starts the game. Server transitions to round 1 and emits the first round event. (Ignored if sent before minimum one player joins, or if game already started.) |
| **round_start**   | `round`: number, `players`: array of {name, capital, output} (for instructor) / or for each student: `capital`, `output` | Server | Instructor (full data) + Students (personal data) | Announces the beginning of a round. Instructors receive the state of all players at start of round; students receive their own current capital/output (the basis for their decision). Triggers the client UI to enable decision input for that round. |
| **submit_investment** | `amount`: number                    | Student Client       | Server              | Student’s decision for the round – how much to invest. The server infers the player from the connection (or a player ID if included) and records the investment. |
| **investment_received** (optional) | `playerName`: string   | Server               | Instructor Client (possibly all students) | Confirms that a particular player’s submission was received. The instructor dashboard can mark this player as “done” for the round. (Students might not need this, but it could be broadcast to all to show a count like “X of Y players submitted.”) |
| **round_end**     | `round`: number, `results`: array of { name, investment, newCapital, newOutput } | Server | Instructor + Students (all) | Signals the end of a round with outcomes for each player. The instructor gets the full results list; students may get the full list as well (so they can see rankings) or just their own outcome plus perhaps rank info. This event tells clients to update displays with the new values. If `round` equals N (last round), this event will be followed by game over. |
| **game_over**     | `finalResults`: array of { name, finalOutput }, `winner`: string | Server | Instructor + Students (all) | Declares the game finished and provides the final standings. The winner can be identified explicitly. Clients may use this to transition to a summary screen. (The finalResults could include more info like final capital or a rounds summary if needed.) |
| **state_snapshot** | `state`: object                        | Server               | [Reconnecting] Instructor/Student | Sends a snapshot of the current game state to a client who (re)joins an ongoing game. This includes all info needed to sync their UI (current round, their capital/output, whether the game is waiting for their input or in result phase, time left, and possibly a summary of others if relevant). |

**Notes:**
- All events are sent over the WebSocket connection. We ensure the event names in the code exactly match those in this table to avoid confusion.
- The `players` list in `round_start` for the instructor allows the instructor to see everyone’s starting point each round (useful for monitoring). Student clients don’t necessarily need everyone’s data at round start, but they might get a pared-down version (just their own data) to reduce bandwidth and clutter.
- In `round_end`, broadcasting all players’ results to everyone can facilitate a shared understanding (students can see how others did). If privacy or simplicity is a concern, we could send full results only to the instructor and personal results to each student, but for a classroom game, transparency is typically fine.
- The `state_snapshot` is crucial for reconnection handling (covered in the next section). It’s not triggered by a user, but by the server when it detects a rejoining client. Alternatively, the client could explicitly request it by sending an event like `request_state` after rejoining, but immediate push from server is simpler.
- We will implement appropriate safeguards: e.g., ignore `start_game` if already started, ignore `submit_investment` from a player who already submitted (unless we allow overwriting within time), etc., to maintain game integrity.
- Time synchronization: The server is the time-keeper. We won't rely on client-side clocks for enforcing timeouts. If needed, the server can send the remaining time in `round_start` or tick events, but a simpler approach is to have the client start its own countdown timer when a round starts (assuming small network delay). The server will cut off at 60s regardless, and any late `submit_investment` events will be ignored.

By defining this contract clearly, developers and any assisting AI have a blueprint for the network communications, ensuring both sides (client & server) implement the same events and data structures.

## 4. Game Flow and Logic Implementation
The server-side game flow follows the core loop described in the PMD, implemented with the above events. Here’s how the server logic maps to that flow:

- **Session Initialization:** On `create_game`, generate a session code (e.g., a short random string) that is not currently in use. Create a new GameSession object to track state (players list, round = 0, etc.). Store it in a dictionary (e.g., `activeSessions[code] = GameSession`). Reply to instructor with `game_created { code }`. The instructor’s client will display the code.
- **Player Join:** On `join_game` from a student:
  - Find the GameSession by the provided code. If not found or game already started and the player is new, respond with `join_ack success=false` (with an error message).
  - If the game is in the “waiting to start” state:
    * Create a new Player object with the given name. Initialize `capital = INITIAL_CAPITAL` and `output = INITIAL_CAPITAL^ALPHA`. Assign a unique ID (if needed, though name could serve as unique key within a session).
    * Add to GameSession.players. 
    * Emit `player_joined { playerName }` to everyone in the session (so instructor and any already-connected students see the new name).
    * Send `join_ack success=true` to the joining student, including their initial capital, initial output, and any other info (maybe their assigned ID if we use one, and round=0 indicating the game hasn’t started yet).
  - If the game is already in progress:
    * Check if `playerName` matches an existing player in session (this indicates a reconnection). If so, do **not** create a new player; instead re-associate this socket with that player.
    * Immediately send a `join_ack success=true` (or directly a `state_snapshot`) to provide the current game state. (Details in Section 5, Reconnection.)
    * Do not emit `player_joined` anew (since they were already counted).
    * If `playerName` doesn’t exist and game started, they’re a latecomer – we likely reject with `join_ack false` (unless we choose to allow observers).
- **Game Start:** On `start_game` from instructor:
  - Retrieve the session and mark it as started (inProgress=true). Set currentRound = 1.
  - For each player in session, ensure their current capital/output are set (for round 1, it’s from initial state).
  - Emit `round_start { round: 1, ... }`:
    * Instructor: gets an array of all players with their capital and output at start of round 1 (which are basically initial values).
    * Each student: gets their own capital and output (which they could know, but sending it confirms the authoritative values).
  - Start a round timer (using `setTimeout`) for ROUND_TIME_LIMIT (60s). When this timer expires, the server will process the round if it hasn’t already been processed.
  - Optionally, begin tracking which players have submitted in this round (e.g., a set of submitted player IDs).
- **During Round (Decision Phase):** As `submit_investment` events come in:
  - Verify the payload and identify the player. Ensure the amount is between 0 and that player’s current output (clamp or reject if out of range).
  - Record the investment: e.g., store it in player.investment for the current round, and mark the player as submitted.
  - If using `investment_received`, emit it so the instructor (and possibly others) know that player is done.
  - If all players have submitted before the timer, clear the timer and proceed to processing immediately (so the game isn’t idle waiting unnecessarily).
- **Round Processing (End of Decision Phase):** This occurs either when the timer triggers or when all submissions are in:
  - For each player, determine the investment used:
    * If the player submitted an investment, use that.
    * If not, apply fallback (investment = 0 by our rule).
  - For each player, compute newCapital = (1 - δ) * currentCapital + investment.
  - Then compute newOutput = newCapital ^ α.
  - Update the player’s state: set their capital = newCapital, output = newOutput. Also reset their investment field for cleanliness, and mark them as not submitted for the next round.
  - Prepare results data structure (e.g., an array as described under `round_end` event).
  - Emit `round_end { round: X, results: [...] }` to everyone.
  - If currentRound < N, you may wait a brief moment (e.g., a few seconds) before automatically starting the next round to allow players to see the outcome. Alternatively, transition immediately to next round (especially if instructor wants a quick flow). We could also implement a slight delay or require the instructor to press “Next” if manual pacing is desired.
  - If currentRound == N (last round), emit `game_over` after `round_end` (or incorporate finality in the round_end payload). The game session state is marked completed.
- **Advance to Next Round:** If not last round:
  - Increment currentRound.
  - Emit the next `round_start` event similarly, now with each player’s updated capital/output.
  - Restart the decision timer and repeat the above process for submissions and processing.
- **Game Over:** Once final results are out, no further round_start is emitted. The server can keep the session open for a while to allow reconnections to see the final state. The instructor may choose to reset or create a new session for another game if needed (which would be a new `create_game` with a fresh code).

**Key Implementation Details:**
- Maintain consistent state updates: It’s important to only update a player’s capital and output at the end of the round, *after* using the old capital for that round’s calculation. This way, the values remain correct for each round’s context. For example, during Round 3 decision phase, player.capital is still the value as of end of Round 2; after processing Round 3, we update to newRound3Capital which will be used for Round 4.
- Timer management: Use one timer per round. Store it in the session object so we can cancel it if needed (e.g., if all submissions came in early). Also, handle cases where the instructor might manually end the game or disconnect (though in auto-run, instructor presence isn’t needed to continue).
- Threading model: Node.js is single-threaded, so our timers and events are fine. Heavy computation isn’t an issue here (the math is trivial), so no need for worker threads.
- Numerical precision: The output calculation \(K^α\) with α = 0.3 will often yield fractional results. We can decide to round numbers for display (e.g., one decimal place) but keep higher precision in calculations. This is more of a UI formatting concern—internally it’s fine to use JavaScript’s floating point. Just be mindful in the client to format numbers nicely (maybe using toFixed or similar).
- Logging: For debugging, log the events on the server (e.g., console.log when a round ends, listing outcomes) which can help verify the model’s correctness during development.

By following this logic, we ensure the implemented game loop matches the designed core loop. Each step corresponds to an event in the contract, and each state update corresponds to the Solow model’s equations.

## 5. Reconnection and State Persistence
Building a resilient game means handling players leaving and rejoining seamlessly. Our approach:

- **Reconnection Handling:** Thanks to the event-driven model and our state storage on the server, a player (or instructor) can rejoin an ongoing session using the same code and name:
  - The server’s `join_game` logic distinguishes new joins vs. rejoins by checking the name. If a name matches an existing player and that player is currently marked as disconnected (we might mark players offline when their socket disconnects), we treat it as a reconnection.
  - When a socket disconnects, Socket.IO can detect it. We should hook into the disconnect event: `socket.on('disconnect')` to mark that player as temporarily offline. We do **not** remove them from the game session, we just note that they are not currently active. Their state remains in memory.
  - If the game requires all players every round, one might pause on disconnect, but our design uses default moves for missing players, so the game continues. This means even if someone drops out, others aren’t stuck.
  - On reconnection (`join_game` with same name and code):
    * The server re-associates the player’s record with the new socket.
    * Immediately send `state_snapshot` containing: currentRound, time left (if in decision phase), the player’s current capital/output, whether they have submitted this round (if the server has a record of that), and any relevant info on the game state. For example, if they disconnected during the results phase, the snapshot might include the last round results or at least their own outcome, so their UI can catch up.
    * If the player had not yet submitted and the round is still ongoing, the snapshot or a follow-up message should instruct the client to show the input for the remaining time. We might include the remaining milliseconds in the snapshot, or simpler, on reconnect the server could extend the timer by a small grace period to allow them to submit (optional). In many cases, the student will reconnect after a short interruption, so likely within the same round’s timeframe.
    * If the player reconnects after missing a round or two, their state now includes the effects of the default investments. The snapshot will reflect their current capital/output (which would be lower than if they had stayed, due to missed investments). They just continue from the current round.
  - The instructor reconnection works similarly: when the instructor’s client rejoins with the code, the server recognizes that role (perhaps by storing instructor’s socket ID initially or by a flag in join message identifying instructor). The instructor gets a snapshot of the entire game state (all players’ current capital/output, current round, perhaps a history of past rounds outcomes if we want to display it). The instructor dashboard can then reconstruct the view (e.g., repopulate the player list and possibly the last round’s results if the instructor missed them).
  - Throughout, ensure that events that occurred while a client was offline (round starts/ends) are summarized in the snapshot so the client doesn’t get out-of-order old events. Typically, upon reconnection, Socket.IO starts a fresh event stream (it won’t replay missed events), so the snapshot serves to bridge that gap.
- **Persistence (Server Restarts):** In the current scope, we do not implement full persistence of game state to survive a server crash or restart mid-game. The assumption is the server stays up for the session. However, as a design note:
  - We could periodically save the GameSession state to disk (or a Redis store) at each round_end. That would include the round number and all players’ capital and output.
  - On server start, we could check for an existing session that was mid-game and reload it, then possibly allow clients to reconnect. This would be complex to coordinate (all clients would have to reconnect manually, since their sockets were gone).
  - Given classroom sessions are relatively short, a simpler approach is to avoid deploying new code or restarting the server during a game. If a crash happens, the session is unfortunately lost and would have to be restarted by the instructor.
  - Our CI/CD approach will not deploy in the middle of a game (we can schedule updates between classes).
- **Handling Permanent Dropouts:** If a student never returns after disconnecting, their player remains in the game. They will keep getting 0 investment each round. This means their output will gradually decay. They won’t win, and they effectively exit the competition. We choose not to remove them automatically because their data might still be useful for class discussion (“this is what happens if a country stops investing…”). The instructor can ignore them or explain the scenario. If desired, the instructor could have a button to remove a player from the game (that would be an additional feature: it would stop including them in results broadcasts). This is beyond current requirements, so by default we simply carry everyone through.
- **Multi-device or cheating considerations:** If a student tries to connect from two devices with the same name, our logic would treat the second connection as the “true” player and possibly disconnect the first. We should ensure that only one socket is active per player. We can enforce this by upon a reconnection, emitting a disconnect event to the old socket (if it’s somehow still connected) or simply by the nature of Socket.IO which might drop the old one if the new one uses the same session cookie. This prevents a student from doubling up or a different person using their name.
- **Instructor disconnect:** Since the game runs server-side, the instructor being offline doesn’t halt the game loop. If instructor misses some rounds, on return they get the snapshot of current state and can review the results from logs or from students’ screens. For completeness, we might log all results so the instructor can retrieve what happened (or the instructor could ask students). But ideally, the instructor stays connected. If we wanted, we could pause the game if the instructor disconnects (i.e., not start new rounds until they return), but this wasn’t specified and might not be necessary if the game is mostly automated.

In summary, the reconnection flow ensures that transient network issues don’t overly disrupt the learning experience. The snapshot mechanism provides exactly what a reconnecting client needs to know to continue as if they never left. This careful design addresses a known pain point where an AI or developer might be unsure how to handle a reconnect or might inadvertently allow inconsistent state — our explicit approach prevents those issues.

## 6. Handling Missing Submissions (Fallback Rule)
We have defined the fallback for missing submissions as a key rule: if a player does not submit an investment decision in time, the server assumes an investment of 0 for that round. Here’s how that is implemented and why:

- **Automated Default:** At the end of each decision phase (when processing the round), the server iterates through all players. For any player without a recorded submission, `investmentAmount = 0` is used. This is straightforward to implement in code and leaves no ambiguity.
- **Game Impact:** A player who doesn’t submit essentially doesn’t invest, meaning their capital will only decrease due to depreciation. If it happens occasionally, they lose a bit of ground. If they never submit (or drop out entirely), their economy will shrink each round by 10%. This mimics a real-world scenario of zero savings rate.
- **Feedback to Player:** The round results (via `round_end` event) will show that player’s investment as 0 and their new capital/output reflecting that. The UI could potentially highlight “no input – assumed 0 investment” for that player (especially on instructor’s dashboard). We may also choose to send a private notice to the player’s client if they are still connected but simply didn’t hit submit in time, something like an overlay saying “You did not submit in time, so 0 was invested by default.”
- **Edge Handling:** If a player experiences a disconnect during the decision phase, the reconnection logic might save them (if they return quickly). But if they don’t return in time, from the game’s perspective it’s the same outcome: no submission, so apply 0. In other words, the fallback covers both neglect and inability to submit.
- **No Advantage Exploit:** By choosing 0, we avoid any scenario where not submitting could be advantageous. (If we had, say, auto-invest 100% or the average, a student might purposely not submit to see what happens or free-ride on others’ choices. 0 ensures it’s generally disadvantageous or at best neutral if their optimal would have been 0 anyway.)
- **Alternate Options Considered:** We considered auto-investing a fixed moderate percentage (like 50% or just enough to maintain capital). However, any positive default investment could reward inactivity in some cases or at least change the dynamics. 0 is neutral in terms of not adding anything new. It also keeps the coding simple.
- **Instructor Override:** If a student consistently fails to submit (e.g., they are not present), the instructor may decide to remove that player or simply use their data as a learning example. Our system doesn’t require instructor to do anything; the fallback handles it.
- **Timing and UI:** The client-side timer will clearly show the countdown. When it hits 0, the round ends. We won’t implement a client-side automatic submission; it’s all handled server-side. The user might see that they missed the round when the results pop up and see 0 invested. This naturally encourages participation in subsequent rounds.

This rule is coded directly into the round processing logic, so there’s no chance to forget it – it’s an integral part of determining `investmentAmount` for each player. Documenting it here ensures that developers and AI assistants know to include this step, preventing a situation where a missing input could cause an undefined state or halt (which was identified as a potential pain point).

## 7. Development Steps
To build this project in a systematic way, we outline the development steps aligned with the requirements:

1. **Project Setup:** Initialize the repository and development environment.
   - Set up a Node.js project with a package.json. Install Express and Socket.IO (and any front-end build tools if using, say, React).
   - Initialize a basic Express server that can serve a placeholder page and establish a Socket.IO connection. Verify that the development server runs and that you can connect a socket.
   - Set up tooling: ESLint/Prettier with our desired style rules (include configs to avoid trailing spaces, etc.), and possibly a simple GitHub Actions workflow to run linting/testing on pushes (to start integrating CI early).
2. **Define Data Model & Config:** Write the code for game session and player management.
   - Create a module (e.g., `gameSession.js`) that exports a GameSession class and Player class as described. Include methods for adding players, starting game, etc., to encapsulate some logic.
   - Include the constants for ALPHA, DELTA, etc., in a config file or at the top of this module.
   - Write unit tests for the model functions (optional but useful): e.g., test that given a certain capital and investment, the update function returns expected new capital/output.
3. **Server Event Handlers:** Implement Socket.IO event handling on the server according to the contract:
   - `connection` event: when a new client connects, set up listeners for `create_game`, `join_game`, `start_game`, `submit_investment`, etc., relevant to that socket.
   - `create_game`: create a new GameSession, store it, respond with `game_created`.
   - `join_game`: find session, handle new or returning player logic, emit `player_joined` and `join_ack` appropriately.
   - Manage an internal mapping from socket to session/player so that later events from that socket (like submit) can be routed to the correct session and player.
   - `start_game`: start the game loop for that session (perhaps by calling a method on the GameSession that emits round_start and sets up the timer).
   - `submit_investment`: record the data. Possibly directly call a function to check if round complete.
   - Implement the round timer using `setTimeout`. You might store the timeout ID in GameSession to cancel if needed.
   - On round completion (whether by timeout or submissions): calculate results, emit `round_end` (and `game_over` if applicable), then either schedule next round or end.
   - Ensure that all emits include the proper data as per the contract, and to the correct room (Socket.IO allows emitting to all sockets in a session “room” identified by code, which is handy).
   - Test the server logic with a couple of dummy players by calling events manually (or writing a small script or using Socket.IO client from Node to simulate).
4. **Client-side Implementation:** Develop the client application.
   - If using a framework like React: create components for InstructorLobby, StudentLobby, InstructorDashboard, StudentGameScreen, etc. Otherwise, create HTML pages/templates for instructor vs student and use simple JS to update the DOM.
   - Establish Socket.IO client connection and emit `join_game` or `create_game` based on user input on the join screen.
   - Implement event listeners on the client:
     * On `game_created`: display the session code (instructor view).
     * On `player_joined`: update participant list UI.
     * On `join_ack`: if success, transition from join screen to waiting state (if game hasn’t started) or directly into the game if it was already ongoing (in which case the ack might carry some state or followed by snapshot).
     * On `round_start`: in student UI, display the round number and current values, enable input; in instructor UI, maybe display a message “Round X started” and possibly all players’ starting values.
     * On `round_end`: update the displays with results. If student, show their new K and Y (and maybe others if provided); if instructor, show the summary table for that round.
     * On `game_over`: announce the winner and final standings.
     * On `state_snapshot`: use it to restore the interface (if implementing reload mid-game logic; this might be tricky to test manually, but ensure the client can apply the snapshot data to its state).
   - Implement the investment input control and ensure it triggers `submit_investment` event on the socket. Also, perhaps implement a countdown timer on the UI that mirrors the server’s (for user awareness; the server is authoritative, so if the UI clock is slightly off, it’s okay).
   - Basic styling with CSS to make it presentable (doesn’t need to be fancy, just clear).
   - Test the client with the server by running one instructor and one student in different windows. Refine as needed.
5. **Testing and Refinement:** Conduct thorough testing with multiple simulated users.
   - Run multiple browser tabs (or use colleagues to connect) to emulate a real session. Check that all flows work: joining, starting, normal play, someone not submitting (does their investment default to 0 and does the game continue? Yes), someone disconnecting (close a tab mid-round, see that round still ends, reconnect that tab or open a new one with same name to see if snapshot restores state).
   - Fix any bugs. For example, you might find that if two players submit at the same exact last second, the timer and manual trigger might conflict (ensure your code handles if the timer fires after you already processed).
   - Pay special attention to edge cases: the first round (initial conditions properly sent), the last round (game_over triggers correctly), and reconnection (maybe simulate by adding a button in dev mode to force a snapshot send).
   - Validate the calculations against expected Solow behavior. For instance, try a scenario: one student always invests 100%, another always 0%. After several rounds, 100% investor’s output should be much higher. If something seems off, check the formula implementation.
   - Ensure performance is fine (it should be, given the small scale and simple math).
6. **Documentation and Cleanup:** Finalize the documentation and code quality.
   - Double-check that variable names and event names in code match those in the spec (e.g., if code used `roundResult` event but spec says `round_end`, unify them to avoid confusion).
   - Remove any debug logs or comments that are not needed, but keep informative comments.
   - Update README or in-code documentation to include how to run the server, how to deploy, etc., if needed.
   - Make sure the PMD and Implementation Plan (this document) reflect the final implementation (if any adjustments were made during development, incorporate them so that the documents and code are in sync).
   - Adhere to all style guidelines (run the linter, fix remaining warnings).

By following these steps, a developer can gradually build the game and verify each part. This stepwise approach also helps an AI coding assistant focus on one part at a time, reducing the chance of confusion. For example, implementing and testing server logic (step 3) before worrying about the UI ensures the core works correctly.

## 8. Continuous Integration and Deployment (CI/CD)
We will set up an automated CI/CD pipeline to ensure code quality and to deploy updates reliably:

- **Continuous Integration:** Using GitHub Actions, every push or pull request will trigger workflows that run our test suite and linter. This catches any issues early. For instance, the workflow will:
  - Install dependencies (`npm ci`).
  - Run `npm run lint` to enforce coding standards (if lint fails, the build is marked failed).
  - Run `npm test` (if we have tests for the logic).
  - Possibly build the client application (e.g., `npm run build` if using a bundler) to ensure the front-end compiles without errors.
  Only if all these pass do we consider the code ready for deployment.
- **Deployment Strategy:** The game server will be hosted on an AWS EC2 instance (Ubuntu). We choose EC2 for full control (alternatively, could use Heroku or others, but EC2 with PM2 is the plan).
  - **Process Manager:** We use PM2 to run the Node.js server as a daemon. PM2 will be configured to start the server on boot and to auto-restart if it crashes.
  - **GitHub Actions Deployment:** On merging to the main branch (or tagging a release), a deployment action will run. This action uses SSH to connect to the EC2 instance and execute deployment steps. We will store the EC2 host, username, and SSH key in GitHub Secrets to be used by the action.
  - **Deployment Steps:** The action will SSH into the server and then:
    1. `cd` to the application directory (which was set up initially with a git clone of the repository).
    2. `git pull` the latest changes.
    3. `npm install` (or `npm ci`) to install any new dependencies.
    4. `npm run build` to build the client (if we have a separate build step; if using plain HTML/JS, this might not be needed).
    5. `pm2 reload solow-game` (assuming our PM2 process is named "solow-game" and points to the server start script).
  - This will result in a few seconds of downtime at most (reload can be zero-downtime if configured, but even a short restart is acceptable in a class context, ideally done between sessions).
  - We will test this pipeline by doing a dummy deployment before actual class use.
- **Environment Variables:** If any configuration (like different ports or debug modes) is needed, PM2 or a .env file can handle that. For example, we might set the PORT or a NODE_ENV=production on the server. The CI/CD will ensure not to override such configs.
- **Monitoring:** PM2 provides logging and we can set up alerts if the process crashes. However, since our CI will only deploy when tests pass, and given the simplicity of the app, we expect crashes to be rare.
- **Rollback Plan:** If a new deployment has a critical issue, the instructor can use PM2 to switch to a previous version (if we keep previous commit on disk or use `pm2 deploy` with versioning). Simpler: we could quickly push a fix or revert commit and the CI/CD will deploy that. Because the game is used in scheduled class sessions, we can schedule deployments at safe times and not update during a live class unless absolutely necessary.
- **Continuous Delivery:** In practice, we’ll automate deployment on main branch updates. We might restrict it so that not every push deploys instantly (to avoid deploying untested code during a class). Perhaps require a tag or manual trigger for deployment when we’re ready. This can be configured in GitHub Actions (e.g., workflow dispatch or only on releases).

This CI/CD setup ensures that our code is always in a deployable state and that deploying a new version is as simple as merging a pull request. It eliminates manual steps (which can be error-prone) and integrates quality checks so that we don’t deploy code that fails linting or tests (addressing a possible pain point where inconsistent style or minor errors slip through).

## 9. Coding Standards and Best Practices
To maintain code quality and make the project friendly for collaboration (and AI assistance), we adhere to the following:

- **Consistency and Style:** We enforce a consistent coding style using ESLint and Prettier. Key rules include using either all semicolons or none consistently, a standard indentation (2 or 4 spaces), and no trailing whitespace at end-of-lines. We configure the linter to flag any deviation. This ensures any code written (by humans or AI) conforms to the project’s style guidelines.
- **Markdown vs. Code Formatting:** Our documentation files (like this one) are kept in the repository. We avoid using trailing spaces in Markdown (which would be interpreted as a line break in Markdown but as lint errors in code). Instead, we structure content with proper headings, bullet points, and paragraphs. This resolves the earlier conflict between markdown formatting and code style rules. In practice, we’ll configure the linter to ignore markdown files or apply a markdown-specific rule set that allows certain things. But by writing clearly (no unnecessary whitespace tricks), we make it easier to keep everything aligned.
- **Naming Conventions:** We use clear, descriptive names. Variables and functions in JavaScript follow camelCase (e.g., `currentRound`, `submitInvestment()`), constants are in UPPER_CASE (e.g., `INITIAL_CAPITAL`), and event names are exactly as specified (lowercase_with_underscores). Consistency in event naming is vital: the string emitted by server and listened by client must match. We avoid abbreviations that aren’t obvious. For example, we prefer `playerName` over `pn`, and `investmentAmount` over just `amt`. This clarity helps anyone reading the code (or any AI trying to continue the code) understand the context without guessing.
- **In-Code Documentation:** Wherever the implementation might be non-obvious, we add comments. For instance, in the server code where we apply the fallback investment, we’ll comment `// No submission from player: default to 0 investment as per game rule`. Similarly, we’ll note formula usage: `// Compute new output = K^alpha`. These comments tie back to this specification, reinforcing the connection between design and code. They also help AI assistants not to remove or alter important logic during refactoring, as the intent is clearly stated.
- **Avoiding Ambiguity for AI Assistants:** We recognize that AI coding tools may sometimes misunderstand requirements if they’re not explicit. We have made every requirement explicit in this document. During development, if using such a tool, we will feed it these specs or ensure it has access to them. By following the plan step-by-step and using the exact event names and rules given, the AI should not need to guess. We have resolved potential ambiguities (like how to handle timeouts, or reconnection state) so the implementation can be direct.
- **Testing and Validation Mindset:** Even with best specs, bugs can occur. We plan to test thoroughly, as described, which is a best practice on its own. Writing tests for critical parts helps catch deviations early. For example, a test can assert that after 1 round with full investment, the output increased in a certain way, which verifies both the formula and the event sequencing (if tested in integration).
- **Collaboration and Version Control:** All changes go through code review (if multiple developers) or at least are tested by the author. The use of CI ensures style and basic correctness checks on every commit. This disciplined approach means the codebase remains clean and maintainable.
- **Future-Proofing:** We document not just how to implement, but also why certain decisions were made (like the 0 investment fallback), either in comments or in project notes. This helps future maintainers (or an AI reading the code later without this spec) understand the rationale and not consider it a bug or arbitrary choice.
- **Security:** Although not highly sensitive (no personal data beyond maybe names), we still ensure the server is not exposed to common exploits:
  - Validate inputs (e.g., playerName length to prevent extremely long strings, sanitize to alphanumeric to avoid injection in logs or HTML).
  - The session code should be sufficiently random to not be easily guessed by outsiders within the timeframe of a game.
  - If deploying on a server, enable only necessary ports (e.g., the game port, maybe 80/443 if routing through a web server). Use HTTPS/WSS if served over the internet, especially if not on a closed network.
  - These are standard practices to mention, even if the risk is low in a controlled classroom environment.