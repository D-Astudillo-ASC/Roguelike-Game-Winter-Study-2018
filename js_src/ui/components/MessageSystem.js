// Message system for displaying game messages
class MessageSystem {
  constructor() {
    this.mode = 'single'; // 'play' or 'single'
    this.messageQueue = [];
    this.maxMessages = 5;
    this.fadeDelay = 2000; // ms before fading starts (reduced for testing)
    this.fadeDuration = 2000; // ms fade out duration (reduced for testing)
    this.singleMessage = '';
    this.paused = false;
    this.pauseTime = null;
    this.tickTimer = null;
    this.startTickTimer(); // Always start the timer
  }

  setMode(mode) {
    if (mode !== this.mode) {
      this.mode = mode;
      // this.clear(); // Do not clear messages on mode switch
      this.paused = false;
      this.pauseTime = null;
      // No need to start/stop timer here
    }
  }

  pause() {
    // if (this.mode !== 'play' || this.paused) return;
    this.paused = true;
    this.pauseTime = Date.now();
    // for (const msg of this.messageQueue) {
    //   msg.visibleSoFar = (msg.visibleSoFar || 0) + (this.pauseTime - msg.timestamp);
    // }
  }

  startTickTimer() {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => {
      this.tick();
    }, 50); // Update every 50ms for smooth fading
  }

  stopTickTimer() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  resume() {
    // if (this.mode !== 'play' || !this.paused) return;
    // const now = Date.now();
    // for (const msg of this.messageQueue) {
    //   msg.timestamp = now - (msg.visibleSoFar || 0);
    //   delete msg.visibleSoFar;
    //   if (msg.fading && msg.fadeStart) {
    //     msg.fadeStart = now - (msg.fadeElapsed || 0);
    //     delete msg.fadeElapsed;
    //   }
    // }
    this.paused = false;
    this.pauseTime = null;
  }

  tick() {
    if (this.mode !== 'play' || this.paused) return;
    const now = Date.now();
    // Update all messages for fading
    for (let i = this.messageQueue.length - 1; i >= 0; i--) {
      const msg = this.messageQueue[i];
      const timeVisible = now - msg.timestamp;
      if (timeVisible > this.fadeDelay) {
        msg.fading = true;
        if (!msg.fadeStart) msg.fadeStart = msg.timestamp + this.fadeDelay;
        const fadeElapsed = now - msg.fadeStart;
        msg.alpha = Math.max(0, 1 - fadeElapsed / this.fadeDuration);
        if (msg.alpha <= 0) {
          this.messageQueue.splice(i, 1);
        }
      } else {
        msg.fading = false;
        msg.alpha = 1;
        msg.fadeStart = null;
      }
    }
  }

  render(targetDisplay) {
    if (!targetDisplay) return;
    if (this.mode === 'play') {
      targetDisplay.clear();
      const yStart = 0;
      const xStart = 1;
      const n = this.messageQueue.length;
      for (let i = 0; i < n; i++) {
        const msg = this.messageQueue[i];
        // Non-linear, dramatic fade: newest is white, oldest is very dark gray
        let alpha = 1 - (i / Math.max(1, n - 1));
        alpha = Math.pow(alpha, 1.5); // Steeper fade
        const gray = Math.round(34 + (255 - 34) * alpha); // 34 = #22, 255 = #fff
        const color = `#${gray.toString(16).padStart(2,'0')}${gray.toString(16).padStart(2,'0')}${gray.toString(16).padStart(2,'0')}`;
        targetDisplay.drawText(xStart, yStart + i, `%c{${color}}${msg.text}`);
      }
    } else {
      targetDisplay.clear();
      targetDisplay.drawText(2, 2, this.singleMessage);
    }
  }

  send(msg) {
    if (typeof msg === 'string' && msg.trim()) {
      if (this.mode === 'play') {
        this.messageQueue.unshift({
          text: msg,
          timestamp: Date.now(),
          fading: false,
          alpha: 1
        });
        if (this.messageQueue.length > this.maxMessages) {
          this.messageQueue.pop();
        }
      } else {
        this.singleMessage = msg;
      }
    }
  }

  clear() {
    if (this.mode === 'play') {
      this.messageQueue = [];
    } else {
      this.singleMessage = '';
    }
  }

  delayedSend(msg) {
    this.send(msg);
  }

  getMessageQueue() {
    if (this.mode === 'play') {
      return this.messageQueue.map(m => m.text);
    } else {
      return [this.singleMessage];
    }
  }


}

export const Message = new MessageSystem(); 