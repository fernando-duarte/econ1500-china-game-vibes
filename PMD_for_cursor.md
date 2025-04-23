# Solow Growth Model Classroom Game – Product Specification & Implementation Plan

## 1. Purpose

Build a **minimalist, web-based, real-time classroom game** to teach the Solow-Swan (Solow growth) model. Students, acting as decision-makers in a simulated economy, allocate part of their output as "investment" each round. This repeated decision-making illustrates:
- **Capital accumulation** (investment adds to capital),
- **Depreciation** (capital wears out),
- **Diminishing returns** (output grows slower with higher capital),
- **Steady-state equilibrium** (over many rounds, outcomes converge).

The game is used in a **live classroom** setting—typically with **up to 80+ students**—and aims to boost engagement and understanding of macroeconomic growth theory.

---

## 2. Technology Overview

1. **Application Type**
   - **Web-based** application accessible through standard browsers.
   - **Real-time** communication for immediate feedback and interaction.

2. **User Interface**
   - **Responsive design** that works on various devices (laptops, tablets, phones).
   - Separate views for students and instructors.

3. **Deployment**
   - **Cloud-based** hosting for reliable access.
   - **Scalable** to handle classroom-sized groups (80+ students).

4. **Data Management**
   - **Session-based** game state that resets after each class.

5. **Security**
   - **Simple access control** using join codes.
   - **Input validation** to ensure proper game mechanics.

---

## 3. Economic Model & Parameters

We use a **simplified Solow growth model** focusing on capital. Parameters:

- **Production Function:** \( Y = K^\alpha \) with \(\alpha = 0.3\).
- **Depreciation:** Each round's capital depreciates by \(\delta = 0.1\).
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
- **Game is created automatically and starts when all teams have joined**
- **Monitors** real-time decisions, capital, and output across all students each round.
- **Views** final results and declares the student with **highest output** as winner.

### 4.2 Students
- **Join** using a unique display name that they can enter in lieu of the econ-themed fun default pre-generated in the code.
- **Submit investment** each round (anywhere from \(0\) to their entire current output).
- **See** their updated capital and output after each round.
- **Compete** to end with the highest final output after 10 rounds.

---

## 5. High-Level Game Flow

1. **Instructor Creates Game Automatically When Game Server is Started**

2. **Students Join**
   - Each student enters the code and a **unique name**.
   - The server ensures the name is not already taken, then sends back **initial capital** (100) and **initial output** (~4.64).

3. **Instructor Starts Game**
   - Once enough students have joined, the instructor clicks "Start."
   - The game transitions to round 1 (of 10).

4. **Rounds 1–10**
   Each round has four phases:
   1. **Round Start:**
      - Server sends each student a round start event with the round number, their current capital \(K\), and current output \(Y\).
      - A 60-second timer starts.
   2. **Decision Phase (60s):**
      - Each student chooses \(\text{investment} \in [0, Y]\).
      - Sends their investment decision to the server.
      - If time runs out (or a student never submits), **investment defaults to 0**.
   3. **Processing Phase:**
      - After all submissions or after 60s, the server computes for each student:
        \[
        K_{\text{new}} = 0.9 \times K + \text{investment}
        \quad\text{and}\quad
        Y_{\text{new}} = K_{\text{new}}^{0.3}.
        \]
      - The server updates each student's stored capital and output.
   4. **Feedback:**
      - The server sends each student their new capital/output.
      - The server also sends the instructor a summary containing all students' decisions and outcomes.
   - **Repeat** until all 10 rounds complete.

5. **Game Over**
   - After round 10, the server sends final outputs for all students and identifies the **winner** (highest output).
   - Instructor announces the winner. The session can then end or reset.

---

## 6. Communication Protocol

Below is a **consolidated** table of the key events and payloads.

| **Event Name**        | **Payload**                                                                                                 | **Emitted By** | **Received By**           | **Description**                                                                                       |
|-----------------------|-------------------------------------------------------------------------------------------------------------|----------------|---------------------------|-------------------------------------------------------------------------------------------------------|
| **Create Game**       | *none*                                                                                                      | Instructor     | Server                    | Instructor requests a new session; server generates a code.                                           |
| **Game Created**      | Game code                                                                                                   | Server         | Instructor                | Sent in response to create game. Carries the unique join code.                                        |
| **Join Game**         | Code, player name                                                                                           | Student        | Server                    | Student attempts to join using session code + chosen name.                                            |
| **Join Acknowledge**  | Success status, error message, initial capital, initial output                                              | Server         | Student                   | Acknowledges join attempt success/fail; on success, includes student's initial capital/output.        |
| **Player Joined**     | Player name                                                                                                 | Server         | All clients (broadcast)   | Notifies everyone a new player joined (for UI updates).                                               |
| **Start Game**        | *none*                                                                                                      | Instructor     | Server                    | Instructor starts the game if valid session is ready.                                                 |
| **Round Start**       | Round number, capital, output, time remaining                                                               | Server         | Students                  | Announces start of a round, each student sees their current capital/output. Instructor sees round info.|
| **Submit Investment** | Investment amount                                                                                           | Student        | Server                    | Student's input for the round (0 ≤ investment ≤ output).                                              |
| **Round End**         | New capital, new output                                                                                     | Server         | The specific Student      | Individual result for each student once the round processes.                                          |
| **Round Summary**     | Round number, results list with player name, investment, new capital, new output                            | Server         | Instructor                | Detailed results listing all student decisions/outcomes for the round.                                |
| **Game Over**         | Final results list with player name and final output, winner                                                | Server         | All clients               | Final results and the winner after the last round.                                                    |
| **State Snapshot**    | Round number, capital, output, submission status, time remaining                                            | Server         | Student (reconnecting)    | Provides up-to-date state if a student reconnects mid-round.                                          |

**Optional "Investment Received" Event**
- The server can optionally send a notification when each student's submission is received. This is not strictly required but can help track who has submitted.

---

## 7. User Interface Design

### 7.1 Student Interface

1. **Join Screen**
   - Fields: "Session Code" + "Name".
   - On submit, sends join request with code and player name.
   - If join is unsuccessful, show error; else move to **Main Game Screen**.

2. **Main Game Screen**
   - **Header**: Current round number out of 10, player's name, session code.
   - **Capital & Output**: Display `K` (capital) and `Y` (output), updating each round.
   - **Investment Input**: A slider or numeric field limited to `[0, Y]`, plus a "Submit" button.
     - On click, sends investment amount.
     - After submission, disable the input (or allow changes until round ends, if desired).
   - **Countdown Timer**: 60-second countdown. If the server ends the round early, the UI transitions accordingly.
   - **Round Results**: Shows new capital and output. Optionally see a partial leaderboard.
   - **Game Over**: Display final standings, winner, and "Game Over" message.

### 7.2 Instructor Dashboard

1. **Create & Control**
   - A "Create Game" button that creates a new game. On success, display the code.
   - A "Start Game" button (only enabled if at least 1 student has joined).

2. **Player List**
   - Updates when new players join. Shows names of all current players.
   - Optionally highlight who has submitted in the current round.

3. **Round Summaries**
   - Each round summary includes player name, investment, new capital, and new output.
   - Display a table for the instructor to see all decisions/results.

4. **Game End**
   - On game over, show final results and highlight the winner.

---

## 8. Implementation Plan (Step by Step)

1. **Project Planning**
   - Define the application structure and user flows.
   - Establish the economic model parameters and calculations.
   - Design the user interface for both student and instructor views.

2. **Application Architecture**
   - Create a system that manages game sessions and player interactions.
   - Implement real-time communication between participants.
   - Maintain game state and handle the progression of rounds.

3. **Game Flow Implementation**
   - **Game Creation**: Instructor initiates a new game session with a unique code.
   - **Player Joining**: Students join using the code and their chosen names.
   - **Game Start**: The instructor begins the game when all students are ready.
   - **Investment Submission**: Students submit their investment decisions within the allowed range.

4. **Round Management**
   - **Round Start**: Begin each round with current economic values for all players.
   - **Round End**: Process all investments, calculate new values, and provide feedback to players.
   - If all rounds are complete, determine the winner; otherwise, proceed to the next round.

5. **Game Conclusion**
   - Identify the player with the highest output as the winner.
   - Display final results to all participants.

6. **Connection Management**
   - Handle temporary disconnections gracefully.
   - Allow players to rejoin and continue from their current state.

7. **User Interface Development**
   - **Student**:
     - A join form for entering the game.
     - Main game screen with current values, investment controls, and results display.
   - **Instructor**:
     - Game management controls.
     - Real-time monitoring of all players' progress and decisions.

8. **Testing**
   - Verify functionality with multiple simultaneous users.

9. **Deployment**
   - Host the application on a reliable server.
   - Configure for optimal performance with classroom-sized groups.

10. **Maintenance**
   - Establish procedures for updates and improvements.
   - Ensure consistent availability during class sessions.

---

## 9. Numerical Precision & Validation

- **Display**: Round to **one decimal place** in the UI for capital/output.
- **Calculations**: Apply the economic formulas consistently for all players.
- **Validation**: The server always clamps or rejects out-of-range investments.

---

## 10. Reconnection Logic (Simplified)

- If a student reconnects mid-round with the same name/code, they receive their current state information.
- If they never reconnect, they default to 0 investment in subsequent rounds.

---

## 11. Logging & Debugging

- **Essential Logs**: Round starts/ends, new joins, submissions, etc.
- **System Logs**: Monitor application performance and user interactions.
- Keep logs concise and meaningful.

---

## 12. Security & Edge Cases

- **Minimal**: Classroom setting doesn't require heavy security.
- **Name Uniqueness**: Reject duplicates if the original is still connected.
- **Cheating**: Not feasible since the server is authoritative for calculations.

---

## 13. Deployment and Maintenance

1. **Hosting Environment**
   - A cloud-based server capable of handling classroom-sized groups (~80 players).
   - Proper network configuration to allow secure access.

2. **Application Management**
   - Automated startup and recovery in case of system restarts.
   - Regular backups of application configuration.

3. **Update Process**
   - Automated deployment of new versions.
   - Minimal downtime during updates.

4. **Monitoring**
   - Regular checks of application performance.
   - Testing after each update to ensure functionality.

---

## 14. Documentation Standards

- **Terminology**:
  - Consistent use of economic terms throughout documentation.
  - Clear explanations of game mechanics for non-economists.

- **Formatting**:
  - Structured documentation with headings, lists, and paragraphs.
  - Visual aids where helpful to explain concepts.

- **User Guides**:
  - Separate instructions for students and instructors.
  - Step-by-step explanations of game participation.

- **Educational Materials**:
  - Connections between game mechanics and economic theory.
  - Suggestions for classroom discussion topics.

---

## 15. Final Notes & Future Extensions

- **Testing**: Thoroughly test with multiple tabs before classroom use.
- **Scalability**: The application is designed to handle classroom-sized groups of approximately 80 users.
- **Enhancements**: Pause button, adjustable round times, advanced parameters, or parallel sessions could be added later.
