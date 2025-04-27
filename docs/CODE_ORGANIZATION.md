# Code Organization Guidelines

These guidelines help keep our codebase clean, modular, and easy to maintain. Adhering to them improves readability, reduces merge conflicts, and streamlines testing.

---

## 1. File Length Limit

- **Max length:** 200 lines of actual code (comments and blank lines excluded).  
- **Enforcement:** The `scripts/check-file-length.js` pre-commit hook will reject any file exceeding this limit.

---

## 2. Breaking Up Oversized Files

When a file grows beyond 200 lines, split it along logical boundaries. Here are common patterns:

### 2.1 JavaScript

1. **By Feature/Module**  
   - **Before:** One large file with many unrelated functions.  
   - **After:**  
     ```
     /features/
       ├─ feature-A/
       │   ├─ index.js        ← exports public API
       │   └─ implementation.js
       └─ feature-B/
           ├─ index.js
           └─ implementation.js
     ```

2. **By Event Handlers**  
   - Group handlers by domain:
     ```
     /events/
       ├─ connectionHandlers.js
       ├─ gameStateHandlers.js
       ├─ roundHandlers.js
       └─ investmentHandlers.js
     /socket.js               ← imports & wires up handlers
     ```

3. **Shared Utilities**  
   - Move generic helpers into a central utilities module:
     ```js
     // utils/format.js
     export function formatNumber(num) { /* … */ }

     // utils/validate.js
     export function validateInput(value) { /* … */ }
     ```

### 2.2 CSS/SCSS

1. **Component-Based Split**  
   - Put each component’s styles in its own file:
     ```
     /scss/
       ├─ base.scss            ← global resets, typography
       ├─ buttons.scss
       ├─ forms.scss
       └─ layout.scss
     ```

2. **Abstract vs. Specific**  
   - **Abstract (base):** variables, mixins, global settings.  
   - **Specific:** layout or component styles.

---

## 3. Example: Student Socket Handlers

Suppose `client/modules/student/socket.js` has grown too large:

**Refactored Structure**  
```
client/modules/student/
├─ socket.js               ← initializes socket and imports handlers
├─ connectionHandlers.js   ← onConnect, onDisconnect
├─ gameStateHandlers.js    ← onGameStart, onGameOver
├─ roundHandlers.js        ← onRoundStart, onRoundEnd
└─ investmentHandlers.js   ← onSubmitInvestment, onValidate
```

Each file exports only the functions it needs; `socket.js` combines them into one cohesive API.

---

## 4. Benefits of Smaller Files

- **Readability:** Focused scope makes code easier to understand.  
- **Maintainability:** Changes affect fewer lines and fewer conflicts.  
- **Testability:** You can write unit tests for each module in isolation.  
- **Collaboration:** Multiple developers can work in parallel with less overlap.  
- **Performance:** Smaller modules can be cached and loaded more efficiently.

---

## 5. Implementation Checklist

1. **Identify Boundaries**  
   - Group related code (features, handlers, utilities).  
2. **Create New Files**  
   - Follow the directory conventions above.  
3. **Move Code**  
   - Copy and adapt functions, keeping tests green.  
4. **Update Imports**  
   - Ensure all `import`/`require` paths point to the new locations.  
5. **Test Everything**  
   - Run existing tests and add new ones for split modules.  
6. **Validate File Length**  
   - Execute `npm run check-file-length` (or `scripts/check-file-length.js`) and fix any violations.

---

Adhering to these guidelines will keep our codebase modular, testable, and easy to navigate. Thank you for helping maintain high-quality standards!

