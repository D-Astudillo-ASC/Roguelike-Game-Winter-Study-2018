import {Color} from './colors.js';

export class DisplaySymbol{
  constructor(template){
    console.log(this);
    this._chr = template.chr || ' ';
    this._fg = template.fg || Color.FG;
    this._bg = template.bg || Color.BG;
  }
 render(display,console_x,console_y){
   display.draw(console_x,console_y, this._chr, this._fg,this._bg);
 }
}
