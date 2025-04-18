/**
 * Solow Growth Model simulation
 * 
 * This model implements the basic Solow growth model with:
 * - Cobb-Douglas production function
 * - Capital accumulation
 * - Population growth
 * - Technological progress
 */
class SolowModel {
  constructor() {
    // Default parameters
    this.parameters = {
      // Initial values
      initialCapital: 100,       // Initial capital stock (K)
      initialOutput: 100,        // Initial output (Y)
      initialPopulation: 100,    // Initial population/labor (L)
      initialTFP: 1,             // Initial total factor productivity (A)
      
      // Growth rates (annual)
      populationGrowthRate: 0.01,  // Population growth rate (n)
      tfpGrowthRate: 0.02,         // TFP growth rate (g)
      
      // Other parameters
      savingsRate: 0.2,            // Savings rate (s)
      depreciationRate: 0.1,       // Capital depreciation rate (δ)
      capitalShare: 0.3,           // Capital share in production (α)
      laborShare: 0.7              // Labor share in production (1-α)
    };
    
    // Results storage
    this.results = {
      years: [],
      capital: [],
      output: [],
      outputPerWorker: [],
      capitalPerWorker: [],
      tfp: [],
      population: []
    };
  }
  
  // Get current parameters
  getParameters() {
    return { ...this.parameters };
  }
  
  // Update parameters
  updateParameters(newParams) {
    // Validate and update parameters
    Object.keys(newParams).forEach(key => {
      if (key in this.parameters) {
        const value = parseFloat(newParams[key]);
        if (!isNaN(value)) {
          this.parameters[key] = value;
        }
      }
    });
    
    // Ensure labor share = 1 - capital share
    this.parameters.laborShare = 1 - this.parameters.capitalShare;
    
    return this.getParameters();
  }
  
  // Calculate production using Cobb-Douglas function
  production(K, L, A) {
    return A * Math.pow(K, this.parameters.capitalShare) * Math.pow(L, this.parameters.laborShare);
  }
  
  // Run simulation for specified number of years
  simulate(years = 50) {
    // Reset results
    this.results = {
      years: [],
      capital: [],
      output: [],
      outputPerWorker: [],
      capitalPerWorker: [],
      tfp: [],
      population: []
    };
    
    // Initialize values
    let K = this.parameters.initialCapital;
    let L = this.parameters.initialPopulation;
    let A = this.parameters.initialTFP;
    
    // Store initial values
    this.results.years.push(0);
    this.results.capital.push(K);
    this.results.population.push(L);
    this.results.tfp.push(A);
    
    // Calculate initial output
    const Y = this.production(K, L, A);
    this.results.output.push(Y);
    this.results.outputPerWorker.push(Y / L);
    this.results.capitalPerWorker.push(K / L);
    
    // Simulate for each year
    for (let t = 1; t <= years; t++) {
      // Update population
      L = L * (1 + this.parameters.populationGrowthRate);
      
      // Update TFP
      A = A * (1 + this.parameters.tfpGrowthRate);
      
      // Calculate output
      const Y = this.production(K, L, A);
      
      // Calculate investment and next period capital
      const I = this.parameters.savingsRate * Y;
      const depreciation = this.parameters.depreciationRate * K;
      K = K + I - depreciation;
      
      // Store results
      this.results.years.push(t);
      this.results.capital.push(K);
      this.results.output.push(Y);
      this.results.population.push(L);
      this.results.tfp.push(A);
      this.results.outputPerWorker.push(Y / L);
      this.results.capitalPerWorker.push(K / L);
    }
    
    return this.getResults();
  }
  
  // Get simulation results
  getResults() {
    return { ...this.results };
  }
}

module.exports = SolowModel; 