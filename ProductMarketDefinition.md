# Product Market Definition: Solow Growth Model Classroom Game

## 1. Purpose
The Solow Growth Model Classroom Game is an interactive educational simulation designed to teach students the principles of the Solow-Swan economic growth model. The game provides a hands-on experience where students assume the role of economic decision-makers, making choices about investment in capital over multiple rounds. By observing the outcomes of their decisions, students learn how capital accumulation, depreciation, and diminishing returns affect economic growth. The primary goal is to reinforce understanding of steady-state equilibrium and the impact of saving (investment) rates on long-term output.

## 2. User Roles
**Instructor (Game Facilitator):** The instructor sets up and oversees the game session. At any given time, there is only one game, so no need to track multiple game instances with codes. They initiate the game, and control the pacing if necessary (e.g., starting/ending rounds). The instructor also monitors the progress of each student’s economy and uses the results for debriefing and discussion. The instructor’s interface provides administrative controls and a view of all players’ performance.

**Students (Players):** Each student is a player managing a virtual economy in the game. Students join the instructor’s game session and enter a display name. During the game, each student makes decisions for their economy each round (specifically, how much of their output to invest in new capital). Their objective is to grow their economy’s output over the rounds. Students interact via a simple UI to submit decisions and view feedback (their current capital, output, and possibly rankings).

## 3. Core Game Loop
The core game loop simulates economic periods in which players make investment decisions and observe growth outcomes. The game proceeds as a sequence of rounds as follows:

1. **Game Setup:** The instructor creates a new game session. Students join the session by entering their name. Once all participants have joined, the instructor starts the game.
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
- **Session Management:** A control panel to create a new game session and start the game when ready. It may also allow the instructor to end the game or pause between rounds if needed.
- **Player Roster:** A list of all students who have joined the session, showing their names (or assigned team names). This updates in real time as students join.
- **Game Controls:** Buttons or actions for “Start Game” and potentially “Next Round” (if manual control of round progression is desired). If rounds are automated with a timer, a pause/resume control might be available.
- **Round Summary Display:** After each round, the dashboard shows a summary of all players’ decisions and outcomes. This could be a table listing each player’s investment decision for the round, their new capital, and new output. It might also highlight the current rank order of outputs.
- **Graphs/Charts (Optional):** The instructor view might include a simple line chart plotting each player’s output over time across rounds, to visually illustrate the growth trajectories and convergence toward a steady state. This can be useful for post-game discussion.
- **Alert/Status Messages:** Notifications about game state changes (e.g., “All submissions received for Round 3” or “Player X reconnected”) to help the instructor manage the session.

### 5.2 Student Interface
- **Join Screen:** A simple form where the student enters their name to join the game. Feedback is given if the game is not yet started or the name is already taken or invalid.
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
- **Scalability Considerations:** The game is intended for classroom sizes (maybe 10-50 players in a session). A single server instance can comfortably handle this load. The architecture will never need to be extended to support multiple concurrent sessions.

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
| **create_game**    | – (or optional settings like rounds)    | Instructor Client  | Server         | Instructor signals the server to create a new game session. Server responds by creating a session and gets ready to accept players. |
| **game_created**   |                    | Server             | Instructor Client | Sent to the instructor after creating a game. Contains the session that students need to join. |
| **join_game**      | `playerName`: string | Student Client    | Server         | A student attempts to join a session. The server verifies the username is valid and registers the player. It assigns them an internal ID and initial state (capital = K₀). If the game is already in progress, this event is also used for reconnection (server will treat a known `playerName` rejoining as the same player). |
| **join_ack**       | `success`: bool, `state`: (object)      | Server             | Student Client | Acknowledgment of join. If `success` is true, the student has joined (or rejoined) successfully. `state` contains initial game state relevant to the player: e.g., their assigned player ID, initial capital K₀, current round number, and any other needed info. If `success` is false, the state may contain an error message (invalid name or game full). |
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
- We assume a single game session. The server tracks which connected clients belong to which session (especially important if multiple sessions could run on one server process in the future).
- Acknowledgments vs. events: In some cases, we send explicit events like `join_ack` or `investment_received` for clarity. Alternatively, Socket.IO’s callback acknowledgments can handle simple responses (for example, the server could ack `join_game` with a success flag and state). The plan above uses separate events to keep the flow clear and debuggable, but the implementation could choose either approach.

## 4. Game Flow and Logic Implementation
This section describes how the game logic correlates with the above events and what needs to be implemented at each step:

- **Session Creation:** When the instructor triggers `create_game`, the server creates a new game session object in memory. The session object will hold:
  - The game parameters (use defaults or any instructor-provided overrides).
  - An empty list of players (to be filled on joins).
  - A state indicating “waiting for start”.
  - Perhaps a reference to a timer or game loop controller (initially idle).


- **Player Joining:** On `join_game` events, the server verifies whether the game hasn’t started or is in progress (for late joiners or reconnections). For a new joiner before game start:
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
  - The client will attempt to reconnect (using the same name). This could be automatic via the socket library’s reconnect or by re-running the join flow on reload (the UI can remember last used name).
  - The server receives `join_game` with that session playerName. It finds that name in the existing session’s player list.
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

- **Instructor Reconnection:** The instructor can similarly reconnect (and a flag or recognition that this connection should be treated as the instructor, possibly by storing an instructor ID when the game was created). The server will send a `state_snapshot` with the full state of the game (all players’ data) to the instructor client. The instructor UI will then recreate the dashboard view. Because the game runs on the server, instructor absence does not pause the game (unless we design it to require manual continuation; in our current plan, the game auto-advances, so it keeps going even if the instructor is momentarily offline). The instructor on returning can catch up on what happened via the summary on their dashboard.

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
