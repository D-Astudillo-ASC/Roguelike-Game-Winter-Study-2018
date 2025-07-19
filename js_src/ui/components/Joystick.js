import { isMobileUI } from "../../utils/isMobileUI.js";

export class Joystick {
  constructor() {
    this.active = false;
    this.center = { x: 0, y: 0 };
    this.radius = 0;
    this.stick = null;
    this.touchId = null;
    this.lastDir = null;
    this.lastMoveTime = 0;
    this.moveCooldown = 100;
    
    // Direction mapping configuration
    this.dirToKey = {
      'up': 'w',
      'down': 's',
      'left': 'a',
      'right': 'd',
      'up-left': ['w','a'],
      'up-right': ['w','d'],
      'down-left': ['s','a'],
      'down-right': ['s','d']
    };

    // Angle to direction mapping
    this.angleRanges = [
      { min: -30, max: 30, dir: 'right' },           // 0° ±30°
      { min: 30, max: 60, dir: 'down-right' },       // 45° ±15°
      { min: 60, max: 120, dir: 'down' },            // 90° ±30°
      { min: 120, max: 150, dir: 'down-left' },      // 135° ±15°
      { min: 150, max: 180, dir: 'left' },           // 180° ±30°
      { min: -180, max: -150, dir: 'left' },         // 180° ±30° (wrapped)
      { min: -150, max: -120, dir: 'up-left' },      // -135° ±15°
      { min: -120, max: -60, dir: 'up' },            // -90° ±30°
      { min: -60, max: -30, dir: 'up-right' }        // -45° ±15°
    ];

    // Bind methods to preserve context
    this.touchStart = this.touchStart.bind(this);
    this.touchMove = this.touchMove.bind(this);
    this.touchEnd = this.touchEnd.bind(this);
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
  }

  // Convert angle to direction using configured ranges
  angleToDir(angle) {
    const deg = angle * 180 / Math.PI;
    
    for (const range of this.angleRanges) {
      if (deg >= range.min && deg < range.max) {
        return range.dir;
      }
    }
    return null;
  }

  // Start joystick interaction
  start(x, y) {
    const pad = document.querySelector('.circular-joystick');
    if (!pad) return;

    const rect = pad.getBoundingClientRect();
    this.center = {
      x: rect.left + rect.width/2,
      y: rect.top + rect.height/2
    };
    this.radius = rect.width/2;
    this.stick = document.getElementById('joystick-stick');
    this.active = true;
    this.lastDir = null;
    this.move(x, y);
  }

  // Handle joystick movement
  move(x, y) {
    const dx = x - this.center.x;
    const dy = y - this.center.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Update visual stick position
    let stickX = dx, stickY = dy;
    if (dist > this.radius * 0.7) {
      stickX = dx * (this.radius * 0.7 / dist);
      stickY = dy * (this.radius * 0.7 / dist);
    }
    
    if (this.stick) {
      this.stick.style.transform = `translate(-50%, -50%) translate(${stickX}px, ${stickY}px)`;
    }

    // Handle direction detection
    if (dist > this.radius * 0.05) { // Ultra responsive dead zone
      const angle = Math.atan2(stickY, stickX);
      const dir = this.angleToDir(angle);
      
      if (dir && dir !== this.lastDir) {
        // Check cooldown before sending movement
        const now = Date.now();
        if (now - this.lastMoveTime >= this.moveCooldown) {
          this.sendDirection(dir);
          this.lastDir = dir;
          this.lastMoveTime = now;
        }
      }
    } else {
      this.sendDirection(null);
      this.lastDir = null;
    }
  }

  // End joystick interaction
  end() {
    this.active = false;
    this.touchId = null;
    this.sendDirection(null);
    
    if (this.stick) {
      this.stick.style.transform = 'translate(-50%, -50%)';
    }
  }

  // Send direction as keyboard events
  sendDirection(dir) {
    const allKeys = ['w','a','s','d'];
    
    if (!dir) {
      // Release all keys
      allKeys.forEach(k => {
        window.dispatchEvent(new KeyboardEvent('keyup', {key: k}));
      });
      return;
    }

    const keys = this.dirToKey[dir];
    
    if (Array.isArray(keys)) {
      // Diagonal movement - press multiple keys
      allKeys.forEach(k => {
        if (keys.includes(k)) {
          window.dispatchEvent(new KeyboardEvent('keydown', {key: k}));
        } else {
          window.dispatchEvent(new KeyboardEvent('keyup', {key: k}));
        }
      });
    } else {
      // Single direction - press one key
      allKeys.forEach(k => {
        if (k === keys) {
          window.dispatchEvent(new KeyboardEvent('keydown', {key: k}));
        } else {
          window.dispatchEvent(new KeyboardEvent('keyup', {key: k}));
        }
      });
    }
  }

  // Touch event handlers
  touchStart(e) {
    if (this.active) return;
    const touch = e.touches[0];
    this.touchId = touch.identifier;
    this.start(touch.clientX, touch.clientY);
  }

  touchMove(e) {
    if (!this.active) return;
    
    let touch = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        touch = e.touches[i];
        break;
      }
    }
    
    if (!touch) return;
    this.move(touch.clientX, touch.clientY);
  }

  touchEnd(e) {
    let stillActive = false;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === this.touchId) {
        stillActive = true;
        break;
      }
    }
    
    if (!stillActive) {
      this.end();
    }
  }

  // Mouse event handlers
  mouseDown(e) {
    if (this.active) return;
    e.preventDefault();
    this.start(e.clientX, e.clientY);
    
    window.addEventListener('mousemove', this.mouseMoveBound = this.mouseMove.bind(this));
    window.addEventListener('mouseup', this.mouseUpBound = this.mouseUp.bind(this));
  }

  mouseMove(e) {
    if (!this.active) return;
    this.move(e.clientX, e.clientY);
  }

  mouseUp(e) {
    this.end();
    window.removeEventListener('mousemove', this.mouseMoveBound);
    window.removeEventListener('mouseup', this.mouseUpBound);
  }

  // Setup joystick event listeners
  setup() {
    const pad = document.querySelector('.circular-joystick');
    if (!pad) return;

    const shouldShow = isMobileUI();
    pad.style.display = (shouldShow && Game.curModeName === 'play') ? 'flex' : 'none';
    
    if (!(shouldShow && Game.curModeName === 'play')) return;

    // Add event listeners
    pad.addEventListener('touchstart', this.touchStart, {passive: false});
    pad.addEventListener('touchmove', this.touchMove, {passive: false});
    pad.addEventListener('touchend', this.touchEnd, {passive: false});
    pad.addEventListener('touchcancel', this.touchEnd, {passive: false});
    pad.addEventListener('mousedown', this.mouseDown);
  }

  // Remove joystick event listeners
  teardown() {
    const pad = document.querySelector('.circular-joystick');
    if (!pad) return;

    pad.style.display = 'none';
    
    // Remove event listeners
    pad.removeEventListener('touchstart', this.touchStart);
    pad.removeEventListener('touchmove', this.touchMove);
    pad.removeEventListener('touchend', this.touchEnd);
    pad.removeEventListener('touchcancel', this.touchEnd);
    pad.removeEventListener('mousedown', this.mouseDown);
    
    this.end();
  }

  // Update joystick visibility based on mode
  updateVisibility() {
    if (isMobileUI() && Game.curModeName === 'play') {
      this.setup();
    } else {
      this.teardown();
    }
  }

  // Configuration methods for easy tuning
  setMoveCooldown(cooldown) {
    this.moveCooldown = cooldown;
  }

  setDeadZone(deadZone) {
    this.deadZone = deadZone;
  }

  // Get current joystick state
  getState() {
    return {
      active: this.active,
      lastDir: this.lastDir,
      center: this.center,
      radius: this.radius
    };
  }
} 