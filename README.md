# Solow Growth Model Classroom Game

A web-based, real-time classroom game that demonstrates the Solow-Swan growth model concepts through student decision-making in a simulated economy.

## Overview

This application allows students to participate in a 10-round economic simulation where they make investment decisions that affect their capital accumulation and output over time. The game illustrates key economic concepts like:

- Capital accumulation
- Depreciation
- Diminishing returns
- Steady-state equilibrium

## Technology Stack

- **Web-based application** with real-time updates
- **Deployment**: Accessible via any modern web browser

## Accessing the Application

The application can be accessed through a web browser:

1. **Student view**: Main application URL
2. **Instructor view**: Instructor-specific URL provided by your instructor

## Game Flow

1. **Instructor creates a game**
2. **Students join** using their chosen names
3. **Instructor starts the game** once all students have joined
4. For each of the 10 rounds:
   - Students receive their current capital and output values
   - Students decide how much to invest (between 0 and their current output)
   - After all submissions or 60 seconds, the server processes all investments
   - Capital and output are updated according to the Solow model
5. **Game ends** after 10 rounds, and the student with the highest final output wins

## Economic Model Details

- **Production Function**: Y = K^α where α = 0.3
- **Depreciation Rate**: δ = 0.1
- **Capital Update Formula**: K_new = (1 - δ) × K + investment
- **Initial Capital**: K_0 = 100
- **Initial Output**: Y_0 ≈ 4.64

## Classroom Usage

For classroom usage:

1. The instructor creates a game session and shares the unique code with students
2. Students join using their devices and the provided code
3. The instructor manages the game flow, including starting rounds and monitoring progress
4. Students participate by making investment decisions each round

## License

MIT

## Educational Resources

This application serves as a practical demonstration of economic concepts. For further learning about the Solow growth model, consider these resources:

- Macroeconomics textbooks covering growth theory
- Online courses on economic growth models
- Academic papers on the Solow-Swan model and its applications