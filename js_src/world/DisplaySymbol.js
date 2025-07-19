// Base class for displayable symbols
import { Colors } from "../utils/Colors.js";

export class DisplaySymbol {
  constructor(template = {}) {
    this.chr = template.chr || " ";
    this.fg = template.fg || Colors.FG;
    this.bg = template.bg || Colors.BG;
  }

  // Render this symbol to a display (maintains current API)
  render(display, console_x, console_y) {
    if (display && typeof display.draw === "function") {
      display.draw(console_x, console_y, this.chr, this.fg, this.bg);
    }
  }

  // Create a copy of this symbol
  clone() {
    return new DisplaySymbol({
      chr: this.chr,
      fg: this.fg,
      bg: this.bg,
    });
  }

  // Set the character
  setChar(chr) {
    this.chr = chr;
  }

  // Set the foreground color
  setForeground(fg) {
    this.fg = fg;
  }

  // Set the background color
  setBackground(bg) {
    this.bg = bg;
  }

  // Get the character
  getChar() {
    return this.chr;
  }

  // Get the foreground color
  getForeground() {
    return this.fg;
  }

  // Get the background color
  getBackground() {
    return this.bg;
  }
}
