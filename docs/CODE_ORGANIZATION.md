# Code Organization Guidelines

## File Length Guidelines

Files in this project should not exceed 200 lines of code (excluding comments and blank lines). This limit helps maintain code readability, testability, and encourages proper modularization.

## How to Split Long Files

When you encounter a file that exceeds the 200-line limit, consider the following strategies for splitting it:

### JavaScript Files

1. **Module Pattern**: Group related functionality into separate modules.
   ```javascript
   // Before: one large file with multiple concerns
   const LargeModule = {
     featureA: function() { /* ... */ },
     featureB: function() { /* ... */ },
     // many more features
   };

   // After: split into multiple files
   // featureA.js
   const FeatureA = {
     method1: function() { /* ... */ },
     method2: function() { /* ... */ },
   };

   // featureB.js
   const FeatureB = {
     method1: function() { /* ... */ },
     method2: function() { /* ... */ },
   };
   ```

2. **Event Handlers**: Group event handlers by type or functionality.
   ```javascript
   // Before: all event handlers in one file
   const AllEventHandlers = {
     handleClick: function() { /* ... */ },
     handleSubmit: function() { /* ... */ },
     handleMouseover: function() { /* ... */ },
     // many more handlers
   };

   // After: split by type
   // userEvents.js
   const UserEventHandlers = {
     handleClick: function() { /* ... */ },
     handleKeyPress: function() { /* ... */ },
   };

   // formEvents.js
   const FormEventHandlers = {
     handleSubmit: function() { /* ... */ },
     handleValidation: function() { /* ... */ },
   };
   ```

3. **Utility Functions**: Move generic utility functions to a shared utilities file.
   ```javascript
   // utils.js
   const Utils = {
     formatNumber: function() { /* ... */ },
     validateInput: function() { /* ... */ },
     // other utilities
   };
   ```

### CSS Files

1. **Component-Based**: Split CSS by component or UI section.
   ```css
   /* Before: one large CSS file */
   
   /* After: split into multiple files */
   /* buttons.css */
   .btn { /* ... */ }
   .btn-primary { /* ... */ }
   
   /* forms.css */
   .form-group { /* ... */ }
   .input { /* ... */ }
   ```

2. **Base vs. Specific**: Separate base styles from specific implementations.
   ```css
   /* base.css */
   body, html { /* ... */ }
   h1, h2, h3 { /* ... */ }
   
   /* specific-components.css */
   .header-nav { /* ... */ }
   .sidebar { /* ... */ }
   ```

## Examples from Our Codebase

### Socket.js Files

Our socket handler files are often lengthy due to the many event handlers. Consider splitting them as follows:

1. Break `client/modules/instructor/socket.js` into:
   - `connectionHandlers.js`: Connection-related events
   - `gameHandlers.js`: Game state events
   - `playerHandlers.js`: Player-related events
   - `roundHandlers.js`: Round-related events
   - `socket.js`: Main socket initialization (imports and uses the above)

### CSS Files

For CSS files like `client/css/student.css`, consider:

1. Breaking into component files:
   - `student-layout.css`: Layout-specific styles
   - `student-forms.css`: Form-related styles
   - `student-components.css`: UI component styles

## Benefits of Smaller Files

- **Readability**: Easier to understand and navigate
- **Maintainability**: Simpler to update specific functionality
- **Collaboration**: Reduces merge conflicts when multiple developers work on the codebase
- **Testing**: Easier to test isolated functionality
- **Performance**: Potentially better for caching and loading in browser environments

## Implementation Strategy

When implementing these changes:

1. Identify logical boundaries in the code
2. Create new files with focused responsibilities
3. Move relevant code to the new files
4. Update imports/references
5. Test thoroughly to ensure functionality is preserved 