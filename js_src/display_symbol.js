import {Color} from './colors.js';

export class DisplaySymbol{
  constructor(template){
    this._chr = template.chr || ' ';
    this._fg = template.fg || Color.FG;
    this._bg = template.bg || Color.BG;
  }
 render(display,console_x,console_y){
   display.draw(console_x,console_y, this.chr, this.fg,this.bg);
 }
}
