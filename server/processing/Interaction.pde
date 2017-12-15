void keyPressed(KeyEvent e) {
  // toogle playing 
  if(key == ' ') {
    isPlaying = !isPlaying;
  }
  // clears canvas 
  else if(key == 'c') {
    canvas.loadPixels();
    for (int i = 0; i < canvas.pixels.length; i++) canvas.pixels[i] = color(0,0);
    canvas.updatePixels();
  }
  // saves current canvas
  else if(key == 's') {
    canvas.save("images/export"+millis()+".jpg");
  }
  
  // Scrubbing right and left 
  if(keyCode == LEFT) {
    int coeff = e.isShiftDown() ? 2 : 1;
    coeff *= isPlaying ? 2 : 1;
    time -= coeff*deltaTime;
    time = constrain(time, 0, maxTime);
    current_timestamp = int(map(time, 0, maxTime, 0, canvas.width));
  }
  else if(keyCode == RIGHT) {
    int coeff = e.isShiftDown() ? 2 : 1;
    time += coeff*deltaTime;
    time = constrain(time, 0, maxTime);
  }
}