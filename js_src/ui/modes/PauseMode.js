import { BaseUIMode } from "./BaseUIMode.js";
import { getCommandFromInput, COMMAND, setKeyBinding } from "../../systems/Commands.js";
import { Message } from "../../ui/components/MessageSystem.js";
import { isMobileUI } from '../../utils/isMobileUI.js';

export class PauseMode extends BaseUIMode {
  constructor(thegame) {
    super(thegame);
    this.lastResumeTime = 0;
  }

  enter() {
    setKeyBinding(["universal", "pause"]);
    Message.send("Game Paused");
    // Add resize listener to show/hide mobile pause buttons on rotation/resize
    this._resizeHandler = () => {
      const btns = document.getElementById('mobile-pause-btns');
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

  render(display) {
    display.clear();
    display.drawText(1, 1, "Game Paused");
    // Show mobile pause menu buttons if on mobile
    const isMobile = isMobileUI();
    if (isMobile) {
      const btns = document.getElementById('mobile-pause-btns');
      const resumeBtn = document.getElementById('mobile-resume-btn');
      const saveBtn = document.getElementById('mobile-save-btn');
      const loadBtn = document.getElementById('mobile-load-btn');
      const quitBtn = document.getElementById('mobile-quit-btn');
      if (btns) btns.style.display = 'flex';
      if (resumeBtn && !resumeBtn._bound) {
        resumeBtn._bound = true;
        resumeBtn.onclick = () => {
          btns.style.display = 'none';
          this.game.switchModes('play');
        };
      }
      if (saveBtn && !saveBtn._bound) {
        saveBtn._bound = true;
        saveBtn.onclick = () => {
          btns.style.display = 'none';
          this.saveGame();
          this.game.switchModes('play');
        };
      }
      if (loadBtn && !loadBtn._bound) {
        loadBtn._bound = true;
        loadBtn.onclick = () => {
          btns.style.display = 'none';
          if (this.safeLoadGame()) {
            this.game.switchModes('play');
          }
        };
      }
      if (quitBtn && !quitBtn._bound) {
        quitBtn._bound = true;
        quitBtn.onclick = () => {
          btns.style.display = 'none';
          Message.clear();
          this.game.render();
          this.game.switchModes('startup');
        };
      }
    } else {
      const btns = document.getElementById('mobile-pause-btns');
      if (btns) btns.style.display = 'none';
      display.drawText(1, 3, "Press 'p' or 'ESC' to resume, 'q' to quit.");
      display.drawText(1, 5, "Press 's' to save game, 'l' to load game.");
    }
  }
  exit() {
    // Remove resize listener
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }
    // Always hide buttons when exiting, regardless of mobile state
    const btns = document.getElementById('mobile-pause-btns');
    if (btns) btns.style.display = 'none';
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