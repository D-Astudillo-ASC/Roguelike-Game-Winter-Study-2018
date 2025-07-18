import { BaseUIMode } from "./BaseUIMode.js";
import { Message } from "../components/MessageSystem.js";

export class LoseMode extends BaseUIMode {
  enter() {
    // Clear any lingering messages when entering lose mode
    Message.clear();
  }

  render(display) {
    display.drawText(1, 1, "Game Over! You died!");
    display.drawText(1, 3, "Press any key to restart.");
  }

  handleInput(eventType, evt) {
    if (eventType === "keydown") {
      this.game.switchModes("startup");
      return true;
    }
    return false;
  }
} 