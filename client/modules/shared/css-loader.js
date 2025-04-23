/**
 * CSS Loader Utility
 * Handles dynamic loading of modular CSS files
 */
(function(window) {
  'use strict';

  const CSSLoader = {
    /**
     * Load CSS files in order
     * @param {Array} files - Array of CSS file paths to load
     * @param {Function} callback - Callback function when all files loaded
     */
    loadCSS: function(files, callback) {
      if (!Array.isArray(files) || files.length === 0) {
        console.error('No CSS files specified for loading');
        return;
      }

      console.log('Loading modular CSS files:', files);
      let loaded = 0;
      
      // Load each CSS file in sequence
      files.forEach(file => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = file;
        link.dataset.cssModule = file.split('/').pop().replace('.css', '');
        
        link.onload = () => {
          console.log(`Loaded CSS module: ${file}`);
          loaded++;
          
          // When all files are loaded, execute callback
          if (loaded === files.length && typeof callback === 'function') {
            console.log('All CSS modules loaded successfully');
            callback();
          }
        };
        
        // Error handling
        link.onerror = () => {
          console.error(`Failed to load CSS module: ${file}`);
          loaded++;
          
          // Continue even if some files fail to load
          if (loaded === files.length && typeof callback === 'function') {
            callback();
          }
        };
        
        document.head.appendChild(link);
      });
    },
    
    /**
     * Enable testing mode between different CSS configurations
     * @param {Array} files - CSS modules to test
     * @param {Array} alternativeFiles - Alternative CSS modules to toggle
     */
    enableTestMode: function(files, alternativeFiles) {
      if (!alternativeFiles || !Array.isArray(alternativeFiles)) {
        console.error('Alternative files must be provided for test mode');
        return;
      }
      
      // Add a testing indicator
      const testIndicator = document.createElement('div');
      testIndicator.id = 'css-test-indicator';
      testIndicator.style.position = 'fixed';
      testIndicator.style.bottom = '10px';
      testIndicator.style.left = '10px';
      testIndicator.style.background = 'rgba(0,0,0,0.7)';
      testIndicator.style.color = 'white';
      testIndicator.style.padding = '5px 10px';
      testIndicator.style.borderRadius = '3px';
      testIndicator.style.fontSize = '12px';
      testIndicator.style.zIndex = '9999';
      testIndicator.textContent = 'CSS Test Mode: Default';
      
      document.body.appendChild(testIndicator);
      
      // Load both sets of CSS files
      this.loadCSS(files, () => {
        this.loadCSS(alternativeFiles, () => {
          console.log('Test mode enabled with CSS modules');
          
          // Disable alternative files initially
          const alternativeLinks = alternativeFiles.map(file => 
            document.querySelector(`link[href="${file}"]`)
          ).filter(Boolean);
          
          alternativeLinks.forEach(link => {
            link.setAttribute('disabled', 'disabled');
          });
          
          // Add toggle button
          const toggleButton = document.createElement('button');
          toggleButton.textContent = 'Toggle CSS';
          toggleButton.style.marginLeft = '10px';
          
          // Track which set is active
          let usingDefault = true;
          
          // Toggle between CSS sets
          toggleButton.addEventListener('click', () => {
            const defaultLinks = files.map(file => 
              document.querySelector(`link[href="${file}"]`)
            ).filter(Boolean);
            
            if (usingDefault) {
              // Disable default, enable alternative
              defaultLinks.forEach(link => link.setAttribute('disabled', 'disabled'));
              alternativeLinks.forEach(link => link.removeAttribute('disabled'));
              testIndicator.textContent = 'CSS Test Mode: Alternative';
            } else {
              // Disable alternative, enable default
              alternativeLinks.forEach(link => link.setAttribute('disabled', 'disabled'));
              defaultLinks.forEach(link => link.removeAttribute('disabled'));
              testIndicator.textContent = 'CSS Test Mode: Default';
            }
            
            usingDefault = !usingDefault;
          });
          
          testIndicator.appendChild(toggleButton);
        });
      });
    }
  };

  // Expose the module globally
  // @ts-ignore - Add CSSLoader to window object
  window.CSSLoader = CSSLoader;

})(window); 