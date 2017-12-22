boolean isLabels = true;
boolean isContextVisible = false;

int selectableIndex = 0;

void keyPressed(KeyEvent e) {
  // toogle playing 
  if(key == ' ') {
    isPlaying = !isPlaying;
  }
  // clears canvas 
  else if(key == 'c') {
    canvas.nuke(-1);
  }
  else if(key == 'l') {
    isLabels = !isLabels;
  }
  
  if(key == '+' || key == '-' || key == '[' || key == ']') {
    switch(key) {
      case '=':
        canvas.numberOfCycles++;
        break;
      case '-':
        canvas.numberOfCycles--; 
        break;
      case '[':
        canvas.cycleResolution--;
        break;
      case ']':
        canvas.cycleResolution++;
        break;
      default:
        break;
    }
    canvas.maxTime = canvas.numberOfCycles * 1000;
    canvas.restructureMessages();
  }
  
  
  // Scrubbing right and left 
  if(keyCode == LEFT) {
    int coeff = e.isShiftDown() ? 2 : 1;
    coeff *= isPlaying ? 2 : 1;
    time -= coeff*deltaTime;
    time = constrain(time, 0, canvas.maxTime);
    current_timestamp = icmap(time, 0, canvas.maxTime, 0, canvas.cycleResolution*canvas.numberOfCycles);
  }
  else if(keyCode == RIGHT) {
    int coeff = e.isShiftDown() ? 2 : 1;
    time += coeff*deltaTime;
    time = constrain(time, 0, canvas.maxTime);
  }
}


void cp5_samples(int n) {
  selectableIndex = n;
  println(selectableIndex);
}

public void cp5_add() {
  String selectedSample = (String)cp5.get(ScrollableList.class, "cp5_samples").getItem(selectableIndex).get("name");
  String selectedNote = (String)cp5.get(Textfield.class,"cp5_note").getText();
  
  canvas.addNote(selectedSample, int(selectedNote), null);
}