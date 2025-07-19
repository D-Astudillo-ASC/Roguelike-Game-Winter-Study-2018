import { BaseUIMode } from "./BaseUIMode.js";
import { Message } from "../components/MessageSystem.js";
import { getCommandFromInput, COMMAND, setKeyBinding } from "../../systems/Commands.js";
import { isMobileUI } from '../../utils/isMobileUI.js';

export class StartupMode extends BaseUIMode {
  enter() {
    // Set up key bindings for startup mode
    setKeyBinding(["universal", "startup"]);
    // Send greeting message when entering startup mode
    Message.clear();
    Message.send("Greetings!");
    // Add resize listener to show/hide mobile start button on rotation/resize
    this._resizeHandler = () => {
      const btn = document.getElementById('mobile-start-btn');
      if (!btn) return;
      const isMobile = isMobileUI();
      if (!isMobile) {
        btn.style.display = 'none';
      } else {
        if (this.game && this.game.curMode === this) {
          btn.style.display = 'block';
        }
      }
    };
    window.addEventListener('resize', this._resizeHandler);
  }

  render(display) {
    // Message.clear();
    display.clear();
    display.drawText(1, 1, "Welcome to Weed Strike - Roguelike!");
    // Remove the line: display.drawText(1, 3, "Press Enter or Space to start.");
    // Show mobile start button if on mobile
    const btn = document.getElementById('mobile-start-btn');
    const isMobile = isMobileUI();
    if (isMobile) {
      if (btn) btn.style.display = 'block';
      if (btn && !btn._bound) {
        btn._bound = true;
        btn.onclick = () => {
          btn.style.display = 'none';
          this.game.switchModes("persistence");
        };
      }
    } else {
      if (btn) btn.style.display = 'none';
      display.drawText(1, 3, "Press Enter or Space to start.");
    }
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

  exit() {
    // Remove resize listener
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    // Always hide buttons when exiting, regardless of mobile state
    const btn = document.getElementById('mobile-start-btn');
    if (btn) btn.style.display = 'none';
  }
} 