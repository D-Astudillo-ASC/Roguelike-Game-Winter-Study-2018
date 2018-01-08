class Messager {
  constructor(){
    this.message = '';
  }

  render(targetDisplay){
    targetDisplay.clear();
    targetDisplay.drawText(1,1, this.message());
  }

  send(msg){
    this.message = msg;
  }

  /*
  clear(msg){
    this.message = '';
  }*/
}

export let Message = new Messager();
