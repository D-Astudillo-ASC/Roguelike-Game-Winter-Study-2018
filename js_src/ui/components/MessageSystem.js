// Message system for displaying game messages
class MessageSystem {
  constructor() {
    this.message = " ";
    this.messageQueue = [];
    this.maxMessages = 5;
  }

  // Render the current message to a display
  render(targetDisplay) {
    if (!targetDisplay) return;
    
    targetDisplay.clear();
    targetDisplay.drawText(2, 2, this.message);
  }

  // Send an immediate message
  send(msg) {
    if (typeof msg === 'string' && msg.trim()) {
      this.message = msg;
    }
  }

  // Send a delayed message (currently just sends immediately)
  delayedSend(msg) {
    this.send(msg);
    // TODO: Implement proper delayed sending
    // setTimeout(() => this.send(msg), 2000);
  }

  // Clear the current message
  clear() {
    this.message = " ";
  }

  // Add message to queue (for future enhancement)
  addToQueue(msg) {
    this.messageQueue.push(msg);
    if (this.messageQueue.length > this.maxMessages) {
      this.messageQueue.shift();
    }
  }

  // Get current message
  getCurrentMessage() {
    return this.message;
  }

  // Get message queue
  getMessageQueue() {
    return [...this.messageQueue];
  }
}

// Export singleton instance
export const Message = new MessageSystem(); 