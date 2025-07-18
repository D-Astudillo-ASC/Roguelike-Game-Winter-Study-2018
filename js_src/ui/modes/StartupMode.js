import { BaseUIMode } from "./BaseUIMode.js";
import { Message } from "../components/MessageSystem.js";
import { getCommandFromInput, COMMAND, setKeyBinding } from "../../systems/Commands.js";

export class StartupMode extends BaseUIMode {
  enter() {
    // Set up key bindings for startup mode
    setKeyBinding(["universal", "startup"]);
    // Send greeting message when entering startup mode
    Message.clear();
    Message.send("Greetings!");
  }

  render(display) {
    // Message.clear();
    display.clear();
    display.drawText(1, 1, "Welcome to the Roguelike Game!");
    display.drawText(1, 3, "Press Enter or Space to start.");
  }

  handleInput(eventType, evt) {
    if (eventType === "keydown") {
      const command = getCommandFromInput(eventType, evt);
      
      if (command === COMMAND.START_GAME) {
        this.game.switchModes("persistence");
        return true;
      }
    }
    return false;
  }
} 