# CSS Architecture

## Overview

The CSS architecture of this application follows a modular approach, organizing styles into logical, role-specific files while maintaining backward compatibility with the legacy single-file approach.

## File Structure

```
client/
├── css/                  # Compiled CSS files (generated)
│   ├── core.css          # Essential styles for all views
│   ├── components.css    # Reusable UI components
│   ├── student.css       # Student-specific styles
│   ├── instructor.css    # Instructor-specific styles
│   └── screen.css        # Screen dashboard styles
├── scss/                 # Source SCSS files
│   ├── _variables.scss   # Color, spacing, typography variables
│   ├── _reset.scss       # CSS reset
│   ├── _global.scss      # Global styles
│   ├── _typography.scss  # Text styles
│   ├── _layout.scss      # Layout utilities
│   ├── _buttons.scss     # Button styles
│   ├── _forms.scss       # Form element styles
│   ├── _utilities.scss   # Utility classes
│   ├── core.scss         # Core styles entry
│   ├── components.scss   # Components entry
│   ├── student.scss      # Student view entry
│   ├── instructor.scss   # Instructor view entry
│   ├── screen.scss       # Screen view entry
│   └── main.scss         # Legacy combined entry
└── style.css             # Legacy compiled CSS (still supported)
```

## Namespacing

To prevent specificity issues and conflicts, each view has its own namespace:

- `.student-view` - Wraps student-specific styles
- `.instructor-view` - Wraps instructor-specific styles 
- `.screen-view` - Wraps screen-specific styles (though screen view already uses body.screen-body)

The main HTML files add these classes to the body element dynamically.

## CSS Loading Strategy

The application supports two CSS loading approaches:

1. **Legacy mode**: Loads the single style.css file
2. **Modular mode**: Loads separate modular CSS files in the following order:
   - core.css (essential styles)
   - components.css (reusable components)
   - [view].css (view-specific styles)

A test mode allows toggling between these approaches for side-by-side comparison.

## CSS Modules

### core.css
Contains essential styles used across all views:
- Variables
- Reset
- Typography 
- Global styles
- Layout utilities
- Common animations

### components.css
Contains reusable UI components:
- Buttons
- Forms
- Cards
- Tables
- Notifications
- Status indicators
- Toggle switches

### view-specific CSS
Each view's CSS focuses exclusively on its own UI needs:
- **student.css**: Team registration, game interface, investment controls
- **instructor.css**: Player list, game controls, results tables
- **screen.css**: Dashboard layout, event log, stats display

## Adding New Styles

When adding new styles:

1. Determine if the style is core, a component, or view-specific
2. Add to the appropriate SCSS file
3. If creating a new component:
   - Add styles to components.scss or create a new _component.scss partial
   - Document the component's usage

## Building CSS

```
# Compile all SCSS to CSS
npm run build:css

# Watch SCSS files for changes during development
npm run watch:css

# Run development server with CSS watching
npm run dev
```

## Testing CSS Changes

The application includes a test mode that allows toggling between legacy and modular CSS:

1. Open any view in the browser
2. A "CSS Test Mode" indicator appears in the bottom-left corner
3. Click "Toggle CSS" to switch between original and modular CSS
4. Check for visual differences or issues

## JavaScript CSS Interactions

Some CSS classes are manipulated directly by JavaScript:

- `.hidden` - Toggled to show/hide elements
- `.player-submitted`, `.player-auto-submitted` - Applied to player items
- `.auto-submitted-row` - Applied to table rows
- `.admin-notification` - Created dynamically for notifications

These classes must remain consistent across CSS modules to ensure proper functionality.

## Animation Dependencies

All animations are defined in core.css to ensure they're available to all components:
- `fadeIn` - Used for notifications
- `flashUpdate` - Used for highlighting updated content
- `pulsate` - Used for drawing attention to UI elements 