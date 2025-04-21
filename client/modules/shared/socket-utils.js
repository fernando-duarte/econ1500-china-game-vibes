/**
 * Socket utility functions shared across all client types
 * Provides common helpers for logging, DOM updates, and data formatting
 */
(function(window) {
  'use strict';
  
  const SocketUtils = {
    /**
     * Format a number with consistent decimal precision
     * @param {number|string} value - The number to format
     * @param {number} [precision] - Decimal precision (defaults to CONSTANTS.DECIMAL_PRECISION or 2)
     * @returns {string} - Formatted number string
     */
    formatNumber: function(value, precision) {
      if (value === undefined || value === null) {
        return '0';
      }
      
      // Use constant if available, otherwise default to 2
      const decimalPrecision = (window.CONSTANTS && window.CONSTANTS.DECIMAL_PRECISION) || precision || 2;
      return parseFloat(value).toFixed(decimalPrecision);
    },
    
    /**
     * Log socket events with consistent formatting
     * @param {string} eventName - Name of the event
     * @param {*} data - Event data
     */
    logEvent: function(eventName, data) {
      if (!eventName) return;
      
      if (data) {
        console.log(`Socket event [${eventName}]:`, data);
      } else {
        console.log(`Socket event [${eventName}]`);
      }
    },
    
    /**
     * Safely update element text content
     * @param {HTMLElement} element - DOM element to update
     * @param {string|number} text - New text content
     * @returns {boolean} - Whether update was successful
     */
    updateElementText: function(element, text) {
      if (!element) return false;
      
      try {
        element.textContent = text;
        return true;
      } catch (err) {
        console.error('Error updating element text:', err);
        return false;
      }
    },
    
    /**
     * Safely show a DOM element by removing a hidden class
     * @param {HTMLElement} element - Element to show
     * @param {string} [hiddenClass] - Class that hides the element
     * @returns {boolean} - Whether operation was successful
     */
    showElement: function(element, hiddenClass) {
      if (!element) return false;
      
      try {
        const className = hiddenClass || 'hidden';
        element.classList.remove(className);
        return true;
      } catch (err) {
        console.error('Error showing element:', err);
        return false;
      }
    },
    
    /**
     * Create and return a DOM element
     * @param {string} tagName - HTML tag name
     * @param {Object} [options] - Element options
     * @param {string} [options.className] - CSS class names
     * @param {string} [options.id] - Element ID
     * @param {string} [options.textContent] - Text content
     * @param {string} [options.innerHTML] - Inner HTML
     * @param {Object} [options.attributes] - HTML attributes
     * @returns {HTMLElement} - Created element
     */
    createElement: function(tagName, options) {
      const element = document.createElement(tagName);
      
      if (!options) return element;
      
      if (options.className) element.className = options.className;
      if (options.id) element.id = options.id;
      if (options.textContent) element.textContent = options.textContent;
      if (options.innerHTML) element.innerHTML = options.innerHTML;
      
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }
      
      return element;
    }
  };
  
  // Expose the module to window
  window.SocketUtils = SocketUtils;
})(window); 