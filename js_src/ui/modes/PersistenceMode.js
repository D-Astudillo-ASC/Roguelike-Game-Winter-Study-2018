import { BaseUIMode } from "./BaseUIMode.js";
import { getCommandFromInput, COMMAND, setKeyBinding } from "../../systems/Commands.js";

export class PersistenceMode extends BaseUIMode {
  enter() {
    setKeyBinding(["universal", "persistence"]);
  }

  render(display) {
    display.clear();
    display.drawText(2, 3, "N for New Game");
    display.drawText(2, 5, "L to Load Game");
  }
      handleInput(eventType, evt) {
        if (eventType === "keyup") {
          const command = getCommandFromInput(eventType, evt);
          
          if (command === COMMAND.NEW_GAME) {
            this.game.startNewGame();
            return true;
          } else if (command === COMMAND.LOAD_GAME) {
            if (this.safeLoadGame()) {
              this.game.switchModes("play");
            }
            return true;
          }
        }
        return false;
      }
} 