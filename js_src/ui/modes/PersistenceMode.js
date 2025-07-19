import { BaseUIMode } from "./BaseUIMode.js";
import { getCommandFromInput, COMMAND, setKeyBinding } from "../../systems/Commands.js";
import { isMobileUI } from '../../utils/isMobileUI.js';

export class PersistenceMode extends BaseUIMode {
  enter() {
    setKeyBinding(["universal", "persistence"]);
    // Add resize listener to show/hide mobile persistence buttons on rotation/resize
    this._resizeHandler = () => {
      const btns = document.getElementById('mobile-persistence-btns');
      if (!btns) return;
      const isMobile = isMobileUI();
      if (!isMobile) {
        btns.style.display = 'none';
      } else {
        if (this.game && this.game.curMode === this) {
          btns.style.display = 'flex';
        }
      }
    };
    window.addEventListener('resize', this._resizeHandler);
  }

  exit() {
    // Remove resize listener
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    // Always hide buttons when exiting, regardless of mobile state
    const btns = document.getElementById('mobile-persistence-btns');
    if (btns) btns.style.display = 'none';
  }

  render(display) {
    // Show mobile persistence buttons if on mobile
    const isMobile = isMobileUI();
    if (isMobile) {
      const btns = document.getElementById('mobile-persistence-btns');
      const newBtn = document.getElementById('mobile-newgame-btn');
      const loadBtn = document.getElementById('mobile-loadgame-btn');
      // display.clear();
      if (btns) btns.style.display = 'flex';
      if (newBtn && !newBtn._bound) {
        newBtn._bound = true;
        newBtn.onclick = () => {
          btns.style.display = 'none';
          this.game.startNewGame();
        };
      }
      if (loadBtn && !loadBtn._bound) {
        loadBtn._bound = true;
        loadBtn.onclick = () => {
          btns.style.display = 'none';
          if (this.safeLoadGame()) {
            this.game.switchModes("play");
          }
        };
      }
    } else {
      const btns = document.getElementById('mobile-persistence-btns');
      if (btns) btns.style.display = 'none';
      display.clear();
      display.drawText(1, 1, "N for New Game");
      display.drawText(1, 3, "L to Load Game");
    }
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