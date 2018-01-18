class Messager {
  constructor(){
    this.message = ' ';
  }



  render(targetDisplay){
    targetDisplay.clear();
    targetDisplay.drawText(2,2,(this.message));
  }

  send(msg){
    this.message = msg;
  }

  delayedSend(msg){
    this.message = msg;
    setTimeout(msg,2000);
  }

  clear(){
    this.message = ' ';
  }


}

export let Message = new Messager();
