import { BaseUIMode } from "./BaseUIMode.js";
import { getCommandFromInput, COMMAND, setKeyBinding } from "../../systems/Commands.js";
import { Message } from "../../ui/components/MessageSystem.js";

export class PauseMode extends BaseUIMode {
  constructor(thegame) {
    super(thegame);
    this.lastResumeTime = 0;
  }

  enter() {
    setKeyBinding(["universal", "pause"]);
    Message.send("Game Paused");
  }

  render(display) {
    display.clear();
    display.drawText(1, 1, "Game Paused");
    display.drawText(1, 3, "Press 'p' or 'ESC' to resume, 'q' to quit.");
    display.drawText(1, 5, "Press 's' to save game, 'l' to load game.");
  }

  handleInput(eventType, evt) {
    if (eventType === "keydown") {
      const command = getCommandFromInput(eventType, evt);
      
      if (command === COMMAND.RESUME) {
        // Prevent rapid resume attempts
        const now = Date.now();
        if (now - this.lastResumeTime < 500) { // Increased to 500ms
          return true;
        }
        this.lastResumeTime = now;
        
        this.game.switchModes("play");
        return true;
      } else if (command === COMMAND.QUIT) {
        // Clear messages and avatar display when quitting
        Message.clear();
        this.game.render();
        this.game.switchModes("startup");
        return true;
      } else if (command === COMMAND.SAVE_GAME) {
        // Save the current game
        this.saveGame();
        this.game.switchModes("play");
        return true;
      } else if (command === COMMAND.LOAD_GAME) {
        // Load the saved game
        if (this.safeLoadGame()) {
          this.game.switchModes("play");
        }
        return true;
      }
    }
    return false;
  }
} 