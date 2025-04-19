# Solow Growth Model Classroom Game – Product Specification & Implementation Plan

## 1. Purpose

Build a **minimalist, web-based, real-time classroom game** to teach the Solow-Swan (Solow growth) model. Students, acting as decision-makers in a simulated economy, allocate part of their output as “investment” each round. This repeated decision-making illustrates:
- **Capital accumulation** (investment adds to capital),
- **Depreciation** (capital wears out),
- **Diminishing returns** (output grows slower with higher capital),
- **Steady-state equilibrium** (over many rounds, outcomes converge).

The game is used in a **live classroom** setting—typically with **up to 80+ students**—and aims to boost engagement and understanding of macroeconomic growth theory.

---

## 2. Technology Stack

1. **Server**  
   - **Node.js** (latest LTS) for event-driven, non-blocking I/O.  
   - **Express** to serve static files (HTML/JS) and provide a simple HTTP layer.  
   - **Socket.IO** for real-time, bi-directional communication (websocket-based).  

2. **Client**  
   - **HTML5/CSS/JavaScript**, using minimal libraries (optionally Tailwind CSS for quick styling).  
   - A single-page or dual-page approach (student view / instructor view).  

3. **Deployment**  
   - **GitHub** repository for source control.  
   - **CI/CD** with **GitHub Actions** to build/test and deploy automatically to AWS.  
   - **AWS EC2** instance hosting the Node.js server (managed by **PM2**).  

4. **Persistence**  
   - **In-memory** game state only (no database). Once the game session ends or the server restarts, state resets.

5. **Security**  
   - Minimal numeric validations (e.g., investment must be \(\ge 0\) and \(\le\) current output).  
   - A join code prevents random outsiders from interfering. No heavy user auth is needed.

---

## 3. Economic Model & Parameters

We use a **simplified Solow growth model** focusing on capital. Parameters:

- **Production Function:** \( Y = K^\alpha \) with \(\alpha = 0.3\).  
- **Depreciation:** Each round’s capital depreciates by \(\delta = 0.1\).  
- **Capital Update:**  
  \[
  K_{\text{new}} = (1 - \delta) \times K + \text{investment}
  \]  
- **Number of Rounds:** \(N = 10\).  
- **Round Duration:** 60 seconds (students have this time to submit decisions).  
- **Initial Capital:** \( K_0 = 100\), so initial output \( Y_0 = 100^{0.3} \approx 4.64\).  
- **Investment Constraint:** \( 0 \le \text{investment} \le \text{current output} \).  
- **Objective:** Students want to **maximize final output** \( Y_{\text{final}} \). The instructor declares the winner after the last round.  

This model highlights how saving/investment decisions impact future capital and, in turn, output—an intuitive demonstration of **diminishing returns** and the concept of a **steady-state**.

---

## 4. User Roles

### 4.1 Instructor
- **Creates a new game session** (server generates a join code).
- **Shares code** so students can join.
- **Starts** the game when ready (round 1 begins).
- **Monitors** real-time decisions, capital, and output across all students each round.
- **Views** final results and declares the student with **highest output** as winner.

### 4.2 Students
- **Join** using the instructor’s code and a unique display name.
- **Submit investment** each round (anywhere from \(0\) to their entire current output).
- **See** their updated capital and output after each round.
- **Compete** to end with the highest final output after 10 rounds.

---

## 5. High-Level Game Flow

1. **Instructor Creates Game**  
   - Server generates a unique **session code** (e.g., 4- or 6-digit random).
   - Instructor sees code on their dashboard; students must use it to join.

2. **Students Join**  
   - Each student enters the code and a **unique name**.  
   - The server validates the code, ensures the name is not already taken, then sends back **initial capital** (100) and **initial output** (~4.64).

3. **Instructor Starts Game**  
   - Once enough students have joined, the instructor clicks “Start.”  
   - The game transitions to round 1 (of 10).

4. **Rounds 1–10**  
   Each round has four phases:
   1. **Round Start:**  
      - Server sends each student a `round_start` event with the round number, their current capital \(K\), and current output \(Y\).  
      - A 60-second timer starts.
   2. **Decision Phase (60s):**  
      - Each student chooses \(\text{investment} \in [0, Y]\).  
      - Sends `submit_investment { investment }` to server.  
      - If time runs out (or a student never submits), **investment defaults to 0**.
   3. **Processing Phase:**  
      - After all submissions or after 60s, the server computes for each student:  
        \[
        K_{\text{new}} = 0.9 \times K + \text{investment}
        \quad\text{and}\quad
        Y_{\text{new}} = K_{\text{new}}^{0.3}.
        \]  
      - The server updates each student’s stored capital and output.
   4. **Feedback:**  
      - The server emits a `round_end` event **to each student** with their new capital/output.  
      - The server also emits `round_summary` **to the instructor** containing **all** students’ decisions and outcomes.  
   - **Repeat** until all 10 rounds complete.

5. **Game Over**  
   - After round 10, the server emits `game_over` with final outputs for all students and identifies the **winner** (highest output).
   - Instructor announces the winner. The session can then end or reset.

---

## 6. Detailed Event-Driven API (Socket.IO)

Below is a **consolidated** table of the key events and payloads.

| **Event Name**        | **Payload**                                                                                                 | **Emitted By** | **Received By**           | **Description**                                                                                       |
|-----------------------|-------------------------------------------------------------------------------------------------------------|----------------|---------------------------|-------------------------------------------------------------------------------------------------------|
| `create_game`         | *none*                                                                                                      | Instructor     | Server                    | Instructor requests a new session; server generates a code.                                           |
| `game_created`        | `{ code }`                                                                                                  | Server         | Instructor                | Sent in response to `create_game`. Carries the unique join code.                                       |
| `join_game`           | `{ code, playerName }`                                                                                      | Student        | Server                    | Student attempts to join using session code + chosen name.                                            |
| `join_ack`            | `{ success, error?, initialCapital?, initialOutput? }`                                                      | Server         | Student                   | Acknowledges join attempt success/fail; on success, includes student’s initial capital/output.         |
| `player_joined`       | `{ playerName }`                                                                                            | Server         | All clients (broadcast)   | Notifies everyone a new player joined (for UI updates).                                               |
| `start_game`          | *none*                                                                                                      | Instructor     | Server                    | Instructor starts the game if valid session is ready.                                                 |
| `round_start`         | `{ roundNumber, capital, output, timeRemaining? }`                                                          | Server         | Students                  | Announces start of a round, each student sees their current capital/output. Instructor sees round info.|
| `submit_investment`   | `{ investment }`                                                                                            | Student        | Server                    | Student’s input for the round (0 ≤ investment ≤ output).                                              |
| `round_end`           | `{ newCapital, newOutput }`                                                                                 | Server         | The specific Student      | Individual result for each student once the round processes.                                          |
| `round_summary`       | `{ roundNumber, results: [{ playerName, investment, newCapital, newOutput }] }`                             | Server         | Instructor                | Detailed results listing all student decisions/outcomes for the round.                                |
| `game_over`           | `{ finalResults: [{ playerName, finalOutput }], winner }`                                                   | Server         | All clients               | Final results and the winner after the last round.                                                    |
| `state_snapshot`*     | `{ roundNumber, capital, output, submitted, timeRemaining }`                                                | Server         | Student (reconnecting)    | Provides up-to-date state if a student reconnects mid-round. *Optional but recommended.*              |

**Optional “investment_received” Event**  
- The server can optionally emit something like `investment_received { playerName }` to all or to the instructor only, indicating each student’s submission is in. This is not strictly required but can help track who has submitted.

---

## 7. User Interface Design

### 7.1 Student Interface

1. **Join Screen**  
   - Fields: “Session Code” + “Name”.  
   - On submit, sends `join_game { code, playerName }`.  
   - If `join_ack` is `success: false`, show error; else move to **Main Game Screen**.

2. **Main Game Screen**  
   - **Header**: Current round number out of 10, player’s name, session code.  
   - **Capital & Output**: Display `K` (capital) and `Y` (output), updating each round.  
   - **Investment Input**: A slider or numeric field limited to `[0, Y]`, plus a “Submit” button.  
     - On click, emits `submit_investment { amount }`.  
     - After submission, disable the input (or allow changes until round ends, if desired).  
   - **Countdown Timer**: 60-second countdown. If the server ends the round early, the UI transitions accordingly.  
   - **Round Results**: Receives `round_end`; shows new `capital` and `output`. Optionally see a partial leaderboard.  
   - **Game Over**: On `game_over`, display final standings, winner, and “Game Over” message.

### 7.2 Instructor Dashboard

1. **Create & Control**  
   - A “Create Game” button that emits `create_game`. On success, display the `code`.  
   - A “Start Game” button (only enabled if at least 1 student has joined). Emits `start_game`.  

2. **Player List**  
   - Updates upon `player_joined`. Shows names of all current players.  
   - Optionally highlight who has submitted in the current round (if using `investment_received`).  

3. **Round Summaries**  
   - Each `round_summary` event includes `[ { playerName, investment, newCapital, newOutput } ]`.  
   - Display a table for the instructor to see all decisions/results.

4. **Game End**  
   - On `game_over`, show final results and highlight the winner.

---

## 8. Implementation Plan (Step by Step)

1. **Scaffold the Project**  
   - Initialize the Node.js project (`npm init`).  
   - Install dependencies: `express`, `socket.io`, optionally `dotenv`, plus dev tools (`eslint`).  
   - Create a file structure:

```
solow-game/
├─ server/
│  ├─ index.js
│  ├─ gameLogic.js
│  ├─ events.js
│  └─ model.js
├─ client/
│  ├─ index.html
│  ├─ instructor.html
│  ├─ student.html
│  ├─ instructor.js
│  ├─ student.js
│  └─ style.css
├─ .env
├─ package.json
├─ .eslintrc.js
├─ .gitignore
├─ README.md
└─ LICENSE
```

2. **Server Skeleton**  
   - In `server/index.js`, create an Express app to serve files from `client/`.  
   - Attach Socket.IO to the HTTP server.  
   - Maintain an in-memory `gameState` object with fields like `gameCode`, `isGameRunning`, `round`, and a `players` collection.

3. **Socket.IO Event Handlers**  
   - **`create_game`**: Instructor only. Generate code, reset data, emit `game_created { code }`.  
   - **`join_game`**: Validate code and player name; if valid, add to `players`, emit `join_ack` + `player_joined`.  
   - **`start_game`**: Set `isGameRunning = true`, `round = 1`, call `startRound(1)`.  
   - **`submit_investment`**: Validate within `[0, currentOutput]`. Store it. If all submitted or timer ends, finalize round.

4. **Round Lifecycle Functions**  
   - **`startRound(round)`**: Emit `round_start` with each student’s capital/output, start a 60s timeout.  
   - **`endRound(round)`**: For unsubmitted, investment=0. Compute new capital/output. Emit `round_end` individually + a `round_summary` to the instructor. If `round < 10`, `startRound(round + 1)`; else `game_over`.

5. **Game Over**  
   - Find the player with max output. Emit `game_over { finalResults, winner }`.  
   - Reset `isGameRunning = false`.

6. **Reconnection Handling**  
   - On socket `disconnect`, do not remove the player—mark them disconnected.  
   - On `join_game` with the same name/code, treat as a reconnect and emit `state_snapshot`.

7. **Client Development**  
   - **Student**:  
     - A join form, then a main UI with capital/output, an investment slider, a timer, and round results.  
     - Listen for `round_start`, `round_end`, `game_over`, etc.  
   - **Instructor**:  
     - “Create Game” and “Start Game” buttons.  
     - Display joined players, round-by-round summaries, final results.

8. **Testing Locally**  
   - Open multiple browser tabs (some as students, one as instructor) to simulate the flow.

9. **Deployment**  
   - **AWS EC2**: Install Node, PM2, clone the repo, run `pm2 start server/index.js --name solow-game`.  
   - Expose the port in security groups.  

10. **CI/CD with GitHub Actions**  
   - Use an SSH-based deploy.  
   - Pull the latest changes on EC2, install dependencies, and reload PM2 automatically.

---

## 9. Numerical Precision & Validation

- **Display**: Round to **one decimal place** in the UI for capital/output.  
- **Calculations**: Use standard JavaScript float for \((1 - 0.1)\times K + I\) and \(K^{0.3}\).  
- **Validation**: The server always clamps or rejects out-of-range investments.

---

## 10. Reconnection Logic (Simplified)

- If a student reconnects mid-round with the same name/code, the server emits a `state_snapshot` so they know if they already submitted.  
- If they never reconnect, they default to 0 investment in subsequent rounds.

---

## 11. Logging & Debugging

- **Essential Logs**: Round starts/ends, new joins, submissions, etc.  
- **PM2** logs can be viewed in production with `pm2 logs solow-game`.  
- Keep logs concise and meaningful.

---

## 12. Security & Edge Cases

- **Minimal**: Classroom setting doesn’t require heavy security.  
- **Join Code**: Must be random to prevent uninvited access.  
- **Name Uniqueness**: Reject duplicates if the original is still connected.  
- **No Late Joins**: After the game starts, ignore new join requests.  
- **Cheating**: Not feasible since the server is authoritative for calculations.

---

## 13. CI/CD & Deployment Details

1. **AWS Setup**  
   - A small EC2 instance (t3.small) handles ~80 players easily.  
   - Open port 80 (or 3000) in security group.

2. **PM2 Process Management**  
   - `pm2 start server/index.js --name solow-game`  
   - `pm2 save` and `pm2 startup` for auto-restart on reboot.

3. **GitHub Actions**  
   - Create `.github/workflows/deploy.yml`:
     ```yaml
     on:
       push:
         branches: [ "main" ]
     jobs:
       deploy:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v3
           - name: Deploy to EC2
             uses: appleboy/ssh-action@master
             with:
               host: ${{ secrets.EC2_HOST }}
               username: ubuntu
               key: ${{ secrets.EC2_SSH_KEY }}
               script: |
                 cd /path/to/solow-game
                 git pull origin main
                 npm install
                 pm2 reload solow-game || pm2 start server/index.js --name solow-game
     ```
   - Auto-deployment on each push to `main`.

4. **Monitoring**  
   - Check PM2 logs (`pm2 logs solow-game`).  
   - Manually test after each deployment.

---

## 14. Coding Standards

- **Naming**:  
  - **camelCase** for variables (`currentRound`, `playerName`).  
  - **UPPER_CASE** for constants (`ALPHA = 0.3`).  

- **Formatting**:  
  - 2 spaces per indent, no trailing whitespace, single newline at EOF.  
  - Use ESLint or Prettier for consistent style.

- **Comments**:  
  - Short, meaningful, especially around the Solow math or special logic.

- **File Organization**:  
  - Keep each file under ~300–400 lines.  
  - Separate modules for server logic, event handling, front-end scripts.

---

## 15. Final Notes & Future Extensions

- **Testing**: Thoroughly test with multiple tabs before classroom use.  
- **Scalability**: Single Node instance can handle ~80 users. For more, consider clustering or a Redis adapter for Socket.IO.  
- **Enhancements**: Pause button, adjustable round times, advanced parameters, or parallel sessions could be added later.