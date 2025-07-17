import { RNG } from "rot-js";

export function init2DArray(xdim, ydim, fillValue) {
  const arr = new Array(xdim);
  for (let x = 0; x < xdim; x++) {
    arr[x] = new Array(ydim);
    for (let y = 0; y < ydim; y++) {
      arr[x][y] = fillValue;
    }
  }
  return arr;
}

export function getRandomOffset(range) {
  const offset = Math.floor(RNG.getUniform() * (range + 1));
  return offset;
}

export function uniqueId(prefix = "") {
  return prefix + Math.random().toString(36).substr(2, 9);
}
