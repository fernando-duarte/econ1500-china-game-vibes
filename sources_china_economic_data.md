# Data Sources for Corrected China Economic Data

- **GDP:** World Bank, World Development Indicators (1980-2023), IMF WEO projections (2024).
- **Capital Stock:** Penn World Table 10.01 (1980-2019), estimates post-2020 based on historical trends and investment data.
- **Labor Force:** World Bank / International Labour Organization (ILO) data.
- **Net Exports:** World Bank (1980-2020), IMF and OECD trade balance data (2021 onwards).
- **Human Capital Index:** Penn World Table 10.01 Human Capital Index (1980-2019); N/A post-2019.
- **TFP (Total Factor Productivity):** Penn World Table 10.01 TFP Index (1980-2019), values post-2019 assumed based on:
  - Start from the last reliable official figure (2019 TFP from PWT).
  - Apply a negative adjustment for the year 2020, reflecting economic disruptions from COVID-19. This negative adjustment was presumably informed by GDP and productivity impacts documented by institutions like the IMF, World Bank, or OECD during the pandemic.
  - From 2021 onward, positive adjustments (gradual increases in TFP) were made, assuming partial recovery in productivity growth, possibly guided by international forecasts (e.g., IMF World Economic Outlook).
- **Consumption:** World Bank World Development Indicators (Final Consumption Expenditure), adjusted to match GDP accurately.
- **Investment:** World Bank World Development Indicators (Gross Capital Formation).
- **FX Rate (CNY/USD):** Historical official exchange rates (IMF International Financial Statistics, World Bank, historical accounts).