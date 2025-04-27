// screen.js
// Load modules in the correct order
document.write('<script src="/modules/shared/socket-utils.js"></script>');
document.write('<script src="/modules/screen/dom.js"></script>');
document.write('<script src="/modules/screen/game.js"></script>');
// Load the refactored ES module implementation
document.write(
  '<script type="module" src="/modules/screen/index.js"></script>'
);
document.write('<script src="/modules/screen/main.js"></script>');
