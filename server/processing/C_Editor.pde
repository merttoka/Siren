boolean isPlaying = false;
int current_timestamp = -1;

class SirenEditorCanvas extends Canvas {
  public float x, y, w, h;
  int mx, my;
  
  public SirenEditorCanvas(float x, float y, float w, float h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  public void setup(PGraphics pg) {}  

  public void update(PApplet p) {
    mx = p.mouseX;
    my = p.mouseY;
    
    if (p.mousePressed && mx >= x && mx < x+w && my >= y && my < y+h){
      //try{
        float _h = h/canvas.numberOfSamples;
        int s_index = int((my-y)/_h);
        
        float __h = _h/canvas.sampleList.get(s_index).notes.size();
        int n_index = int((my-(s_index*_h+y))/__h);
        
        float _w = w/(canvas.cycleResolution*canvas.numberOfCycles);
        float t_index = (mx-x)/_w;
        
        String s = canvas.sampleList.get(s_index).s;
        int    n = canvas.sampleList.get(s_index).notes.get(n_index).n;
        
        Message m = canvas.getNote(s_index, n_index, (int)t_index);
        
        if(p.mouseButton == LEFT){
          if(m == null) {
            m = new Message();
            m.assignUpdate(s, n, canvas.startCycle + t_index/canvas.cycleResolution);
            
            for (int i=0; i < numberOfFieldTextfields; i++) {
              println(i,'/',numberOfFieldTextfields);
              if(cp5.get(Textfield.class, "cp5_tf"+i+"_key") != null && 
                 cp5.get(Textfield.class, "cp5_tf"+i+"_value") != null)
                  m.addField(cp5.get(Textfield.class, "cp5_tf"+i+"_key").getText(), 
                             parseFloat(cp5.get(Textfield.class, "cp5_tf"+i+"_value").getText()));
            }
            
            canvas.addNote(s, n, m);
          }
          else { 
            cp5.get(Textfield.class, "cp5_note").setText(str(m.n));
              
            // create and add boxes for each field
            int index = 0;
            remove_optional_fields();
            for(Map.Entry field : m.fields.entrySet()) {
              cp5_addField();
              cp5.get(Textfield.class, "cp5_tf"+index+"_key").setText((String)field.getKey());
              cp5.get(Textfield.class, "cp5_tf"+index+"_value").setText(str((float)field.getValue()));
              index++;
            }
          }
        }
        else if(p.mouseButton == RIGHT)
          canvas.removeNote(s_index, n_index, (int)t_index);
        
      //}
      //catch(Exception e) {print('.');}
    }
    
    if (isPlaying) {
      time += deltaTime;
      
      // trig samples only on integer time
      int timestamp_location = icmap(time, 
                                     0, canvas.maxTime, 
                                     0, canvas.cycleResolution*canvas.numberOfCycles);
      if(timestamp_location > current_timestamp) {
         current_timestamp = timestamp_location;
         
         ArrayList<Message> messages = canvas.getMessagesAt(current_timestamp);
         for(int i = 0; i < messages.size(); i++) {
           Message m = messages.get(i);
           println("Trig");
           
           OscMessage myMessage = new OscMessage("/play2");
           myMessage.add("cps");
           myMessage.add(1.0);
           myMessage.add("cycle");
           myMessage.add(m.cycle);
           myMessage.add("delta");
           myMessage.add(m.delta);
           myMessage.add("cps");
           myMessage.add(m.cps);
           myMessage.add("s");
           myMessage.add(m.s);
           myMessage.add("n");
           myMessage.add(m.n);
           myMessage.add("orbit");
           myMessage.add(m.orbit);
           for(Map.Entry f : m.fields.entrySet()){
             myMessage.add((String)f.getKey());
             myMessage.add((float)f.getValue());
           }
           
           println(myMessage);
           oscP5.send(myMessage, myRemoteLocation); 
         }
      }
        
      if(time > canvas.maxTime) { 
        time -= canvas.maxTime; 
        current_timestamp = -1;
      }
    }
  }

  public void draw(PGraphics pg) {
    try {
    // Background
    pg.fill(27);
    pg.rect(x, y, w, h);
    
    // useful variables
    int extended = canvas.cycleResolution * canvas.numberOfCycles;
    float _w = w/extended;
    float _h = h/canvas.numberOfSamples;
    
    // draw the grid and labels
    for(int i = 0; i < extended; i++) {
      float _x = x + i*_w;
      pg.stroke(255, i%canvas.cycleResolution == 0 ? 35 : 15);
      pg.line(_x, y, _x, y+h);
    }
    for(int i = 0; i < canvas.numberOfSamples; i++) {
      float _y = y + i*_h;
      
      if(isLabels) {
        pg.fill(20);
        pg.stroke(50);
        pg.rect(x-3*marginx, _y+2 , _w, _h - 4);
        pg.pushMatrix();
        pg.textAlign(CENTER, CENTER);
        pg.translate(x-2.5*marginx, _y+_h*0.5);
        pg.rotate(3*HALF_PI);
        pg.fill(150);
        pg.text(canvas.sampleList.get(i).s, 0, 0);
        pg.popMatrix();
      }
      
      pg.stroke(255, 35);
      pg.line(x, _y, x+w, _y);
      for(int j = 0; j < canvas.sampleList.get(i).notes.size(); j++) {
        float __h = _h/canvas.sampleList.get(i).notes.size();
        float __y = _y+j*__h;
        
        if(isLabels) {
          pg.fill(20);
          pg.stroke(50);
          pg.rect(x-1.5*marginx, __y+2 , _w, __h - 4);
          pg.pushMatrix();
          pg.textAlign(CENTER, CENTER);
          pg.translate(x-marginx, __y+__h*0.5);
          pg.rotate(3*HALF_PI);
          pg.fill(150);
          pg.text(canvas.sampleList.get(i).notes.get(j).n, 0, 0);
          pg.popMatrix();
        }
        
        pg.stroke(255, 15);
        pg.line(x, __y , x+w, __y);
      }
    }
    
    // draw notes
    for(int i = 0; i < canvas.sampleList.size(); i++) {
      try{
      SampleContainer s = canvas.sampleList.get(i);
      
      float __h = _h/s.notes.size();
      for(int j = 0; j < s.notes.size(); j++) {
        NoteContainer n = s.notes.get(j);
        float _y = y + i*_h + j*__h;
        
        for(int k = 0; k < n.messages.size(); k++) {
          float _x = x + _w*icmap(n.messages.get(k).cycle, 
                                  canvas.startCycle, 
                                  canvas.startCycle+canvas.numberOfCycles,
                                  0, extended);
          
          pg.stroke(150);
          pg.fill(200);
          pg.rect(_x, _y+2, _w, __h-4);
        }
      } 
      }catch(Exception e) {print("_dn_");}
    } 
 
    // draw timer
    float _x = x + map(time, 0, canvas.maxTime, 0, w);
    pg.stroke(255, isPlaying ? 150 : 50);
    pg.line(_x, y, _x, y+h);
    }
    catch (ConcurrentModificationException e) {
      println("Skipped");
    }
  }
}