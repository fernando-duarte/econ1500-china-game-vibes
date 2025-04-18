document.addEventListener('DOMContentLoaded', function() {
  // Chart configurations
  let outputChart, capitalChart, perWorkerChart;
  
  // Initialize the app
  function init() {
    setupEventListeners();
    createCharts();
    loadInitialParameters();
  }
  
  // Set up event listeners
  function setupEventListeners() {
    document.getElementById('run-simulation').addEventListener('click', runSimulation);
    document.getElementById('parameters-form').addEventListener('reset', function() {
      // Add slight delay to ensure form values are reset before loading defaults
      setTimeout(loadInitialParameters, 50);
    });
  }
  
  // Create the charts with initial empty data
  function createCharts() {
    // Output Chart
    const outputCtx = document.getElementById('outputChart').getContext('2d');
    outputChart = new Chart(outputCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Output (Y)',
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          data: []
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Total Output Over Time'
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
    
    // Capital Chart
    const capitalCtx = document.getElementById('capitalChart').getContext('2d');
    capitalChart = new Chart(capitalCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Capital (K)',
          borderColor: '#e67e22',
          backgroundColor: 'rgba(230, 126, 34, 0.1)',
          borderWidth: 2,
          data: []
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Capital Stock Over Time'
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
    
    // Per Worker Chart
    const perWorkerCtx = document.getElementById('perWorkerChart').getContext('2d');
    perWorkerChart = new Chart(perWorkerCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Output per Worker (y)',
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          borderWidth: 2,
          data: []
        }, {
          label: 'Capital per Worker (k)',
          borderColor: '#9b59b6',
          backgroundColor: 'rgba(155, 89, 182, 0.1)',
          borderWidth: 2,
          data: []
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Per Worker Values Over Time'
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }
  
  // Load initial parameters from the server
  function loadInitialParameters() {
    fetch('/api/solow/parameters')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Update form with initial parameters
          const params = data.parameters;
          Object.keys(params).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
              input.value = params[key];
            }
          });
        }
      })
      .catch(error => {
        console.error('Error loading parameters:', error);
      });
  }
  
  // Run the simulation with current parameters
  function runSimulation() {
    // Get form values
    const formData = new FormData(document.getElementById('parameters-form'));
    const params = {};
    formData.forEach((value, key) => {
      params[key] = parseFloat(value);
    });
    
    // Update parameters on server
    fetch('/api/solow/parameters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Run simulation with specified years
        return fetch('/api/solow/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ years: params.years })
        });
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateCharts(data.results);
      }
    })
    .catch(error => {
      console.error('Error running simulation:', error);
    });
  }
  
  // Update the charts with simulation results
  function updateCharts(results) {
    // Update Output Chart
    outputChart.data.labels = results.years;
    outputChart.data.datasets[0].data = results.output;
    outputChart.update();
    
    // Update Capital Chart
    capitalChart.data.labels = results.years;
    capitalChart.data.datasets[0].data = results.capital;
    capitalChart.update();
    
    // Update Per Worker Chart
    perWorkerChart.data.labels = results.years;
    perWorkerChart.data.datasets[0].data = results.outputPerWorker;
    perWorkerChart.data.datasets[1].data = results.capitalPerWorker;
    perWorkerChart.update();
  }
  
  // Initialize the app
  init();
}); 