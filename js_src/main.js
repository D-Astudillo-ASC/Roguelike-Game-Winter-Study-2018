import { Game } from "./systems/Game.js";
import { Display } from "rot-js";

window.onload = function () {
  Game.init();

  // Add the containers to our HTML page
  document
    .getElementById("ws-main-display")
    .appendChild(Game.getDisplay("main").getContainer());
  document
    .getElementById("ws-avatar-display")
    .appendChild(Game.getDisplay("avatar").getContainer());
  document
    .getElementById("ws-message-display")
    .appendChild(Game.getDisplay("message").getContainer());

  Game.bindEvent("keypress");
  Game.bindEvent("keydown");
  Game.bindEvent("keyup");
  Game.render();

  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      Game.handleResize();
    }, 250);
  });

  // Handle orientation changes
  window.addEventListener('orientationchange', function() {
    setTimeout(function() {
      Game.handleResize();
    }, 500);
  });
};
