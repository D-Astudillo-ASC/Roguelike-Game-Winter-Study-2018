class UIMode {
  constructor(thegame){
    console.log("created" +this.constructor.name);
    this.game = thegame;
  }

  enter(){
    console.log("entering" +this.constructor.name);
  }
  exit(){
    console.log("exiting" +this.constructor.name);
  }
  handleInput(eventType, evt){
    console.log("handling input for" +this.constructor.name);
  }
  render(display) {
    console.log("rendering" + this.constructor.name);
    display.drawText(2,2,"rendering" + this.constructor.name);
  }

}

export class StartupMode extends UIMode {
  render(display){
  display.drawText(2,2, "Welcome");
  display.drawText(2,3,"Press any key to continue");
  }

  handleInput(eventType, evt){
    if(eventType == 'keyup'){
    this.game.switchModes('play');
    return true;
    }
  }
}


export class PlayMode extends UIMode {
  render(display){
    display.clear();
    display.drawText(2,3," w to win, l to lose");
  }

    handleInput(eventType, evt){
    if(eventType == 'keyup'){
      console.dir(evt);
      if(evt.key == 'w')
      {

        this.game.switchModes('win');
        return true;
      }

      if (evt.key == 'l')
      {
        this.game.switchModes('lose');
        return true;
      }

    }
  }
}
export class WinMode extends UIMode {

  render(display){
    display.clear();
    display.drawText(2,2,"Victory!!!");
  }
}
export class LoseMode extends UIMode {
  render(display){
    display.clear();
    display.drawText(2,2,"You lose!");
  }
}
