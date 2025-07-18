import { Game } from "./systems/Game.js";

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
};
