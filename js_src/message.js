class Messager {
  constructor(){
    this.message = ' ';
  }

  render(targetDisplay){
    targetDisplay.clear();
    targetDisplay.drawText(2,3,(this.message));
  }

  send(msg){
    this.message = msg;
  }

  // add(){
  //   let messageLog = [];
  //   this.message = msg;
  //   messageLog.push(msg);
  // }
  clear(){
    this.message = ' ';
  }


}

export let Message = new Messager();
