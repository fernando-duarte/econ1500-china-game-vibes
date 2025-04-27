// student.js
// Load modules in the correct order
document.write('<script src="/modules/shared/socket-utils.js"></script>');
document.write('<script src="/modules/student/dom.js"></script>');
document.write('<script src="/modules/student/game.js"></script>');
// Load handler modules before socket.js
document.write(
  '<script src="/modules/student/connectionHandlers.js"></script>'
);
document.write('<script src="/modules/student/teamHandlers.js"></script>');
document.write('<script src="/modules/student/gameStateHandlers.js"></script>');
document.write('<script src="/modules/student/roundHandlers.js"></script>');
document.write('<script src="/modules/student/resultHandlers.js"></script>');
document.write('<script src="/modules/student/utilityHandlers.js"></script>');
document.write('<script src="/modules/student/socket.js"></script>');
document.write('<script src="/modules/student/main.js"></script>');
