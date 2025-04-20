/**
 * client/components/ConnectionStatus.js
 * Connection status indicator with debounced updates
 */

/**
 * Connection status indicator component
 * @param {Object} props
 * @param {string} props.status - Current connection status
 * @returns {JSX.Element|null} The component or null if hidden
 */
const ConnectionStatus = ({ status }) => {
  let displayStatus = status;
  let visible = true;
  let hideTimer = null;
  
  // Define status properties
  const statusConfig = {
    connected: { text: 'Connected', className: 'status-connected' },
    connecting: { text: 'Connecting...', className: 'status-connecting' },
    disconnected: { text: 'Disconnected - Reconnecting...', className: 'status-disconnected' },
    replaced: { text: 'Connected on another device', className: 'status-replaced' },
    failed: { text: 'Connection failed', className: 'status-failed' }
  };
  
  // Create auto-hiding functionality if status is connected
  if (status === 'connected') {
    // Auto-hide after 5 seconds
    hideTimer = setTimeout(() => {
      visible = false;
      // Force DOM update by manipulating the element directly
      const container = document.querySelector('.connection-status-container');
      if (container) container.style.display = 'none';
    }, 5000);
  }
  
  // Don't render if not visible
  if (!visible) return null;
  
  const config = statusConfig[displayStatus] || statusConfig.connecting;
  
  // Handle dismissing the status
  const handleDismiss = () => {
    if (displayStatus !== 'disconnected' && displayStatus !== 'failed') {
      // Force DOM update
      const container = document.querySelector('.connection-status-container');
      if (container) container.style.display = 'none';
    }
  };
  
  return `
    <div class="connection-status-container">
      <div class="connection-status ${config.className}">
        ${config.text}
        ${displayStatus !== 'disconnected' && displayStatus !== 'failed' ? 
          '<button class="dismiss-btn" onclick="handleDismiss()">×</button>' : ''}
      </div>
    </div>
  `;
};

// Initialize the connection status component
function initConnectionStatus() {
  // Create container if it doesn't exist
  let container = document.querySelector('.connection-status-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'connection-status-container';
    document.body.appendChild(container);
  }
  
  // Create update method
  return {
    update: (status, immediate = false, autohide = false) => {
      const shouldDebounce = !immediate && status !== 'disconnected' && status !== 'failed';
      
      // For negative statuses, update immediately
      if (!shouldDebounce) {
        renderStatus(status);
      } else {
        // For positive states, delay to prevent flickering
        setTimeout(() => {
          renderStatus(status);
          
          // Auto-hide if requested and status is positive
          if (autohide && (status === 'connected')) {
            setTimeout(() => {
              container.style.display = 'none';
            }, 5000);
          }
        }, 1000);
      }
    }
  };
}

// Render the status in the container
function renderStatus(status) {
  const container = document.querySelector('.connection-status-container');
  if (!container) return;
  
  // Make container visible
  container.style.display = 'flex';
  
  // Define status properties
  const statusConfig = {
    connected: { text: 'Connected', className: 'status-connected' },
    connecting: { text: 'Connecting...', className: 'status-connecting' },
    disconnected: { text: 'Disconnected - Reconnecting...', className: 'status-disconnected' },
    replaced: { text: 'Connected on another device', className: 'status-replaced' },
    failed: { text: 'Connection failed', className: 'status-failed' }
  };
  
  const config = statusConfig[status] || statusConfig.connecting;
  
  container.innerHTML = `
    <div class="connection-status ${config.className}">
      ${config.text}
      ${status !== 'disconnected' && status !== 'failed' ? 
        '<button class="dismiss-btn" onclick="document.querySelector(\'.connection-status-container\').style.display = \'none\'">×</button>' : ''}
    </div>
  `;
}

// Add to window for global access
window.connectionStatus = window.connectionStatus || initConnectionStatus(); 