/**
 * Instructor Notification Handlers
 * Manages error and notification events for instructor interface
 */
(function (window) {
  'use strict';

  /**
   * Notification handlers for instructor client
   * @namespace
   */
  const NotificationHandlers = {
    /**
     * Handle error event
     * @param {Object} data - Error data
     */
    handleError: function (data) {
      SocketUtils.logEvent('Error', data);

      if (data && data.message) {
        // Display error notification
        InstructorDom.displayStatusMessage(
          `${CONSTANTS.UI_TEXT.ERROR_PREFIX}${data.message}`,
          'error'
        );
      }
    },

    /**
     * Handle admin notification event
     * @param {Object} data - Notification data
     */
    handleAdminNotification: function (data) {
      SocketUtils.logEvent('Admin notification', data);

      if (data && data.message) {
        const type = data.type || CONSTANTS.NOTIFICATION.DEFAULT_TYPE;

        // Display admin notification
        InstructorDom.displayAdminNotification(data.message, type);
      }
    },
  };

  // Expose the module to window
  window.InstructorNotificationHandlers = NotificationHandlers;
})(window);
