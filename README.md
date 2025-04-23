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

## CSS Architecture

The application uses a modular CSS architecture to organize styles logically and reduce file size.

### Organization

Styles are organized into:
- **Core Styles**: Essential styles shared across all views
- **Component Styles**: Reusable UI components
- **View-Specific Styles**: Styles specific to each interface (student, instructor, screen)

### Development

During development, CSS files are compiled from SCSS sources:

```bash
# Watch SCSS files for changes
npm run watch:css

# Build compressed CSS
npm run build:css

# Start development server with CSS watching
npm run dev
```

### CSS Testing

The application includes a test mode to compare original CSS with modular CSS:

1. Open any view in a browser
2. Look for the "CSS Test Mode" indicator in the bottom-left
3. Use the toggle button to switch between original and modular CSS

### CSS Transition

The application is in the process of transitioning from a monolithic CSS architecture to a modular one. For details on the transition process, see:

- [CSS Architecture Documentation](client/CSS_ARCHITECTURE.md)
- [CSS Transition Guide](client/CSS_TRANSITION.md)

To complete the transition, run:

```bash
# Test the modular CSS
npm run css:transition

# Migrate HTML files to use modular CSS directly
npm run migrate:css

# Optimize CSS for production
npm run optimize:css
```

### Documentation

For detailed information about the CSS architecture, see [CSS_ARCHITECTURE.md](client/CSS_ARCHITECTURE.md).