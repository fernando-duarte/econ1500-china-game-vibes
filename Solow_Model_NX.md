# China's Growth Game: Saving, Trade, and Prosperity (1980–2025)

## Overview

- **Game Type**: Interactive economic simulation
- **Duration**: 50 minutes total
- **Participants**: Online, individually or in teams
- **Timeframe**: 1980–2025 (10 rounds, each representing 5 years: 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025)

## Game Flow and Timing

### Group Formation (3 minutes)

- Students form groups by proximity.
- Select one leader device per group.

### Group Naming (2 minutes)

- UI auto-generates a default, fun economic-themed group name (e.g., "The Prosperous Pandas").
- Students can generate alternative names or manually input their own.
- Explicit confirmation required for the chosen name.

### Gameplay (34 minutes)

- Rounds 1–2: 5 minutes each (for familiarization).
- Rounds 3–10: 4 minutes each (standard play).

### Discussion (8 minutes)

- Instructor-led reflection and analysis of strategies and outcomes.

## Prizes (Announced at Start)

### Categories

- Highest GDP Growth
- Highest Net Exports
- Best Balanced Economy (combination of GDP and Consumption)

### Suggested Prizes

- Gift cards, certificates, or economic-themed souvenirs.

## Student UI Components

### Dashboard (Always Visible)

- Current Year
- Group Name
- Countdown Timer (e.g., ⏳ TIME LEFT: 4:30)
- Economic Statistics:
  - GDP
  - Capital Stock
  - Consumption
  - Net Exports
  - Previous Round GDP Growth (%)
  - Current Ranking

### Breaking News (Event Announcements)

- Initial announcement without numeric details.
- Numeric impact explicitly revealed at the end of each affected round.

#### Events

- **2001**: China Joins WTO (Exports +25%, TFP +2% per year)
- **2008**: Global Financial Crisis (Exports -20%, GDP growth -3%)
- **2018**: US-China Trade War (Exports -10%)
- **2020**: COVID-19 Pandemic (GDP growth -4%)

### Decision Controls

- **Savings Rate Slider**: 1%–99%, default at 10%
- **Exchange Rate Policy Buttons**:
  - Undervalue (set exchange rate 20% lower than the market baseline)
  - Market-Based (set at baseline market exchange rate)
  - Overvalue (set exchange rate 20% higher than the market baseline)
- Explicit submit button with confirmation step

### Results Visualization

- GDP Growth (line chart)
- Trade Balance (bar graph)
- Consumption vs. Savings (pie chart)

+--------------------------------------------+
| Year: 2005 ℹ️ |
| Your GDP: $2,500 bn |
| Your Capital Stock: $1,800 bn |
| Your Consumption: $1,200 bn |
| Your Net Exports: +$200 bn |
| GDP Growth (last round): 8% |
| Ranking: #2 of 10 groups 🔥 |
+--------------------------------------------+
| ⏳ TIME LEFT: 3:45 |
+--------------------------------------------+

BREAKING NEWS (2001): 🌎 China joins the WTO!

## Decision Time!

Savings Rate: [ ▮▮▮▮▮▯▯▯▯▯▯ 45% ]
(Choose from 1% to 99%)

---

Exchange Rate Policy:
🔵 [Undervalue] ⚪ [Market-Based] ⚪ [Overvalue]

[SUBMIT DECISIONS]

Results Visualizations:

- GDP Growth 📈
- Trade Balance 📊
- Consumption vs Savings 🥧

## Professor Dashboard

- Real-time leaderboard displaying:
  - GDP ranking
  - Net exports ranking
  - Balanced economy ranking
- Charts tracking overall class performance
- Controls explicitly provided to start subsequent rounds
- Capability to pause or restart the timer
- **Load testing for up to 100 simultaneous connections implemented. See `load-testing/` for details.**

## Technical Setup

- Players connect through the internet

## Comprehensive Economic Model

### Endogenous Variables

- GDP (Y)
- Capital Stock (K)
- Human Capital (H)
- Productivity (Total Factor Productivity, TFP, A)
- Net Exports (NX)
- Consumption (C)
- Investment (I)

### Exogenous Variables

- Labor Force Growth (n)
- Foreign Income (\(Y_t^\*\))
- Baseline Market Exchange Rate (\(e\_{market, t}\))
- Openness Ratio (\(openness_ratio_t\))
- FDI Ratio (\(fdi_ratio_t\))

### Student-Determined Variables (Exogenous, set by students each round)

- **Savings Rate (s)**: Chosen explicitly by students (1%–99%).
- **Exchange Rate Policy (\(e_policy\))**: Determines the actual exchange rate (\(e*t\)) relative to the baseline market rate (\(e*{market, t}\)):
  - Undervalue: \(e*t = e*{market, t} \times 1.2\) (Makes exports cheaper, imports dearer)
  - Market-Based: \(e*t = e*{market, t}\)
  - Overvalue: \(e*t = e*{market, t} \times 0.8\) (Makes exports dearer, imports cheaper)

### Model Equations (Explicitly Defined)

- **Production**: \(Y(t) = A(t) \times K(t)^\alpha \times (L(t) \times H(t))^{(1-\alpha)}\)
- **Capital Accumulation**: \(K(t+1) = (1 - \delta) \times K(t) + I(t)\)
- **Investment**: \(I(t) = s \times Y(t) + NX(t)\)
- **Labor Force Growth**: \(L(t+1) = L(t) \times (1+n)\)
- **Human Capital Growth**: \(H(t+1) = H(t) \times (1+\eta)\)
- **Productivity Growth**: \(A(t+1) = A(t) \times (1 + g + \theta \times openness_ratio_t + \phi \times fdi_ratio_t)\)
- **Net Exports**:
  \[ NX(t) = X*0 \left(\frac{e_t}{e*{1980}}\right)^{\varepsilon*x}\left(\frac{Y_t^\*}{Y*{1980}^\*}\right)^{\mu*x} - M_0\left(\frac{e_t}{e*{1980}}\right)^{-\varepsilon*m}\left(\frac{Y_t}{Y*{1980}}\right)^{\mu_m} \]
  Where \(e_t\) is determined by the student's policy choice (see above).

### Explicit Parameters

- **Production & Accumulation**:
  - \(\alpha = 0.3\)
  - \(\delta = 0.1\)
  - \(g = 0.005\)
  - \(\theta = 0.1453\)
  - \(\phi = 0.1\)
  - \(n = 0.00717\)
  - \(\eta = 0.02\)
- **Net Exports**:
  - Initial Exports (1980): \(X_0 = 18.1\)
  - Initial Imports (1980): \(M_0 = 14.5\)
  - Exchange Rate Elasticity (Exports): \(\varepsilon_x = 1.5\)
  - Exchange Rate Elasticity (Imports): \(\varepsilon_m = 1.2\)
  - Foreign Income Elasticity (Exports): \(\mu_x = 1.0\)
  - Domestic Income Elasticity (Imports): \(\mu_m = 1.0\)
- **Base Values**:
  - Initial Exchange Rate (1980): \(e\_{1980} = 1.5\)
  - Initial Foreign Income (1980): \(Y\_{1980}^\* = 1000\) (arbitrary units)
  - Initial Domestic Income (1980): \(Y\_{1980}\) (Use the actual initial GDP value assigned to teams)

### Explicit Exogenous Variables (Formulas)

- **Baseline Market Exchange Rate**: Linear interpolation from 1.5 (1980) to 7.0 (2020). For round index \(r = 0, ..., 9\): \(e\_{market, t} = 1.5 + (7.0 - 1.5) \times r / 9\)
- **Foreign Income**: Starts at 1000 in 1980, grows 3% annually (compounded over 5 years per round). For round index \(r = 0, ..., 9\): \(Y_t^\* = 1000 \times (1.03^{5r})\)
- **Openness Ratio**: Starts at 0.1 in 1980 (round 0), increases by 0.02 per round. For round index \(r = 0, ..., 9\): \(openness_ratio_t = 0.1 + 0.02 \times r\)
- **FDI Ratio**: \(fdi_ratio_t = 0.02\) if year >= 1990, else 0.
- **Labor Force Growth (\(n\))** and **Human Capital Growth (\(\eta\))** applied each round based on parameters above.

## Step-by-Step Computation (Explicitly Detailed)

- Each Round (indexed by \(r = 0, ..., 9\), corresponding to start years \(1980, ..., 2020\)):
  1. Input current state \(K_t, L_t, H_t, A_t\). Get student inputs \(s, e_policy\).
  2. Determine baseline exogenous variables for this round: \(e\_{market, t}\), \(Y_t^\*\), \(openness_ratio_t\), \(fdi_ratio_t\).
  3. Determine actual exchange rate \(e*t\) based on \(e*{market, t}\) and \(e_policy\).
  4. Compute current GDP \(Y_t\) using the Production equation.
  5. Compute Net Exports \(NX_t\) using the Net Exports equation with \(e_t\), \(Y_t^\*\), \(Y_t\), and base values.
  6. Compute Investment \(I_t = s \times Y_t + NX_t\).
  7. Compute Consumption \(C_t = (1-s) \times Y_t\).
  8. Update state variables for the start of the next round (\(t+1\)):
     - \(K\_{t+1} = (1 - \delta) K_t + I_t\)
     - \(L\_{t+1} = L_t (1+n)\)
     - \(H\_{t+1} = H_t (1+\eta)\)
     - \(A\_{t+1} = A_t (1 + g + \theta \times openness_ratio_t + \phi \times fdi_ratio_t)\)
  9. Store calculated values (\(Y*t, NX_t, C_t, I_t\)) and next state (\(K*{t+1}, L*{t+1}, H*{t+1}, A\_{t+1}\)) for the team.

## Prize Determination (Explicit Criteria)

- **Highest GDP Growth**: Highest GDP value in the final round.
- **Highest Net Exports**: Highest Net Export value in the final round.
- **Best Balanced Economy**: Highest combined GDP and consumption in the final round.

This specification provides thorough and explicit details designed to facilitate seamless implementation by any developer or system operator.
