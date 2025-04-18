# ECON1500 China Game - Solow Growth Model

An interactive web application for exploring economic growth using the Solow model. This application allows users to:
- Adjust model parameters (capital share, savings rate, population growth, etc.)
- Run simulations for a specified number of years
- Visualize results through dynamic charts

## Setup

1. Make sure you have Node.js and npm installed
2. Clone the repository:
   ```
   git clone https://github.com/fernando-duarte/econ1500-china-game-vibes.git
   ```
3. Install dependencies:
   ```
   cd econ1500-china-game-vibes
   npm install
   ```

## Running the Application

### Development Mode
```
npm run dev
```
This will start the server with nodemon, which automatically restarts when you make changes.

### Production Mode
```
npm start
```

Then open your browser to http://localhost:3000

## Features

- Interactive parameter adjustments
- Real-time simulation
- Dynamic visualization of economic growth metrics
- Responsive design that works on desktop and mobile devices

## Model Details

The application implements the standard Solow growth model with:
- Cobb-Douglas production function
- Capital accumulation based on savings and depreciation
- Population growth
- Technological progress (TFP growth)

## Customizing Parameters

- Initial Capital (K): Starting level of physical capital
- Initial Population (L): Starting labor force
- Initial TFP (A): Starting total factor productivity
- Population Growth Rate (n): Annual rate of population growth
- TFP Growth Rate (g): Annual rate of technological progress
- Savings Rate (s): Fraction of output saved and invested
- Depreciation Rate (δ): Rate at which capital depreciates
- Capital Share (α): Output elasticity of capital in production function 