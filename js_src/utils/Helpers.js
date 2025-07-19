// Utility functions for the game
import { RNG } from "rot-js";
import { GAME_CONFIG } from "./Constants.js";

// Generate a unique ID (using the current working implementation)
export function uniqueId(prefix = "") {
  return prefix + Math.random().toString(36).substr(2, 9);
}

// Initialize a 2D array
export function init2DArray(width, height, defaultValue = null) {
  const array = [];
  for (let x = 0; x < width; x++) {
    array[x] = [];
    for (let y = 0; y < height; y++) {
      array[x][y] = defaultValue;
    }
  }
  return array;
}

// Get random offset for timing variations (using current implementation)
export function getRandomOffset(range) {
  const offset = Math.floor(RNG.getUniform() * (range + 1));
  return offset;
}

// Generate random seed
export function generateRandomSeed() {
  return (
    GAME_CONFIG.RANDOM_SEED_MIN +
    Math.floor(Math.random() * GAME_CONFIG.RANDOM_SEED_MAX)
  );
}

// Check if localStorage is available
export function isLocalStorageAvailable() {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Safe JSON parse with error handling
export function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return defaultValue;
  }
}

// Deep clone an object
export function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));
  if (typeof obj === "object") {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}
