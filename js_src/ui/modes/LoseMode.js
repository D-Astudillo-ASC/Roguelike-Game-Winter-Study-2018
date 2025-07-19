import { BaseUIMode } from "./BaseUIMode.js";
import { Message } from "../components/MessageSystem.js";
import { isMobileUI } from '../../utils/isMobileUI.js';

export class LoseMode extends BaseUIMode {
  enter() {
    // Clear any lingering messages when entering lose mode
    Message.clear();
    Message.send("You have been killed!");
    // Add resize listener to show/hide mobile restart button on rotation/resize
    this._resizeHandler = () => {
      const btn = document.getElementById('mobile-restart-btn');
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
    display.drawText(1, 1, "Game Over! You died!");
    const isMobile = isMobileUI();
    if (isMobile) {
      const btn = document.getElementById('mobile-restart-btn');
      if (btn) btn.style.display = 'block';
      if (btn && !btn._bound) {
        btn._bound = true;
        btn.onclick = () => {
          btn.style.display = 'none';
          this.game.switchModes('startup');
        };
      }
    } else {
      const btn = document.getElementById('mobile-restart-btn');
      if (btn) btn.style.display = 'none';
      display.drawText(1, 3, "Press any key to restart.");
    }
  }

  exit() {
    // Remove resize listener
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    // Always hide restart button when exiting, regardless of mobile state
    const btn = document.getElementById('mobile-restart-btn');
    if (btn) btn.style.display = 'none';
  }

  handleInput(eventType, evt) {
    if (eventType === "keydown") {
      this.game.switchModes("startup");
      return true;
    }
    return false;
  }
} 