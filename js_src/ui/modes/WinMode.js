import { BaseUIMode } from "./BaseUIMode.js";

export class WinMode extends BaseUIMode {
  render(display) {
    display.drawText(1, 1, "Congratulations! You won!");
    display.drawText(1, 3, "Press any key to restart.");
  }

  handleInput(eventType, evt) {
    if (eventType === "keyup") {
      this.game.switchModes("startup");
      return true;
    }
    return false;
  }
} 