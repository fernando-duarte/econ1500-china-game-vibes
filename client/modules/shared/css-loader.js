/**
 * CSS Loader Utility
 * Handles progressive loading of modular CSS files
 * with fallback to the original style.css
 */
(function(window) {
  'use strict';

  const CSSLoader = {
    /**
     * Load CSS files in order with proper fallback
     * @param {Array} files - Array of CSS file paths to load
     * @param {Function} callback - Callback function when all files loaded
     * @param {Boolean} disableOriginal - Whether to disable original CSS
     */
    loadCSS: function(files, callback, disableOriginal = false) {
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
            
            // Optionally disable the original CSS
            if (disableOriginal) {
              const originalCSS = document.querySelector('link[href="/style.css"]');
              if (originalCSS) {
                console.log('Disabling original CSS');
                originalCSS.setAttribute('disabled', 'disabled');
              }
            }
            
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
     * Enable testing mode with both original and modular CSS
     * @param {Array} files - CSS modules to test
     */
    enableTestMode: function(files) {
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
      testIndicator.textContent = 'CSS Test Mode';
      
      document.body.appendChild(testIndicator);
      
      // Load the CSS files but don't disable original
      this.loadCSS(files, () => {
        console.log('Test mode enabled with CSS modules:', files);
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle CSS';
        toggleButton.style.marginLeft = '10px';
        
        // Toggle between original and modular CSS
        toggleButton.addEventListener('click', () => {
          const originalCSS = document.querySelector('link[href="/style.css"]');
          const moduleCSSLinks = document.querySelectorAll('link[data-css-module]');
          
          if (originalCSS.hasAttribute('disabled')) {
            // Enable original, disable modules
            originalCSS.removeAttribute('disabled');
            moduleCSSLinks.forEach(link => link.setAttribute('disabled', 'disabled'));
            testIndicator.textContent = 'CSS Test Mode: Original';
          } else {
            // Disable original, enable modules
            originalCSS.setAttribute('disabled', 'disabled');
            moduleCSSLinks.forEach(link => link.removeAttribute('disabled'));
            testIndicator.textContent = 'CSS Test Mode: Modular';
          }
        });
        
        testIndicator.appendChild(toggleButton);
      }, false);
    }
  };

  // Expose the module globally
  // @ts-ignore - Add CSSLoader to window object
  window.CSSLoader = CSSLoader;

})(window); 