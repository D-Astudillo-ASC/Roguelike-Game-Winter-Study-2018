class Messager {
  constructor(){
    this.message = ' ';
    this.message1 = ' ';
    this.message2 = ' ';
  }

  render(targetDisplay){
    targetDisplay.clear();
    targetDisplay.drawText(2,2,(this.message));
    targetDisplay.drawText(2,3,(this.message1));
    //targetDisplay.drawText(2,4,(this.message2));
  }

  send(msg){
    this.message2 = this.message1;
    this.message1 = this.message;
    this.message = msg;
  }

  // add(){
  //   let messageLog = [];
  //   this.message = msg;
  //   messageLog.push(msg);
  // }
  clear(){
    this.message2 = ' ';
    this.message1 = ' ';
    this.message = ' ';
  }


}

export let Message = new Messager();
