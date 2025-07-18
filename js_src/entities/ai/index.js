// AI System Index - Export all AI classes
export { BaseAI } from "./BaseAI.js";
export { SmartAI } from "./SmartAI.js";
export { BalancedAI } from "./BalancedAI.js";
export { SimpleAI } from "./SimpleAI.js";

// Factory function for creating AI instances
export function createAI(entity, aiType, config = {}) {
  switch (aiType) {
    case 'smart':
      return new SmartAI(entity, config);
    case 'balanced':
      return new BalancedAI(entity, config);
    case 'simple':
      return new SimpleAI(entity, config);
    default:
      return new BaseAI(entity, config);
  }
} 