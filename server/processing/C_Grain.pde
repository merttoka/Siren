boolean isPlaying = false;
int current_timestamp = -1;


PImage canvas;

class GrainCanvas extends Canvas {
  public float x, y, w, h;
  int mx, my;
  
  color[] getPixelsAt(int _x) {
    color[] ys = new int[canvas.height];
    
    int j = 0;
    for(int i = _x; i < canvas.pixels.length; i+=canvas.width) {
      ys[j++] = canvas.pixels[i];  
    }
    
    return ys;
  }
  
  public GrainCanvas(float x, float y, float w, float h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    
    canvas = createImage(int(resolution.x), int(resolution.y), ARGB);
  }
  
  public void setup(PGraphics pg) {}  

  public void update(PApplet p) {
    w = p.width - 2*marginx;
    h = p.height - 2*marginy;
    
    mx = p.mouseX;
    my = p.mouseY;
    
    if (mx >= x && mx < x+w && my >= y && my < y+h){
      try {
        int pixdex = int((my-marginy)/(h/resolution.y)) * canvas.width + int((mx-marginx)/(w/resolution.x));
        if(p.mousePressed && p.mouseButton == LEFT) {
          canvas.loadPixels();
          canvas.pixels[pixdex] = color(200);
          canvas.updatePixels();
        }
        else if(p.mousePressed && p.mouseButton == RIGHT) {
          canvas.loadPixels();
          canvas.pixels[pixdex] = color(0, 0);
          canvas.updatePixels();
        }
      } catch(Exception e) {
        print(",");
      }
    }
    
    if (isPlaying) {
      time += deltaTime;
      
      // trig samples only on integer time
      int timestamp_location = int(map(time, 0, maxTime, 0, canvas.width));
      if(timestamp_location > current_timestamp) {
         current_timestamp = timestamp_location;
         
         color[] arr = getPixelsAt(current_timestamp);
         for(int i = 0; i < arr.length; i++) {
           if(arr[i] != 0) {
             println("Trig");
           }
         }
      }
        
      if(time > maxTime) { 
        time -= maxTime; 
        current_timestamp = -1;
      }
    }
  }

  public void draw(PGraphics pg) {
    // Background
    pg.fill(27);
    pg.rect(x, y, w, h);
    
    // draw the grid
    for(int i = 0; i < resolution.x; i++) {
      float _x = x + w/resolution.x*i;
      if(i%cycleRes == 0) pg.stroke(255, 25);
      else                pg.stroke(255, 15);
      pg.line(_x, y, _x, y+h);
    }
    for(int j = 0; j < resolution.y; j++) {
      if(j < resolution.y*0.5)
        pg.stroke(255, map(j, 0, resolution.y*0.5, 2, 15));
      else if (j == resolution.y*0.5)
        pg.stroke(255, 50);
      else
        pg.stroke(255, map(j, resolution.y*0.5, resolution.y, 15, 2));
        
      float _y = y + h/resolution.y*j;
      pg.line(x, _y, x+w, _y);
    }
    
    pg.image(canvas, x, y, w, h);
    
    // draw timer
    float _x = x + map(time, 0, maxTime, 0, w);
    pg.stroke(255, isPlaying ? 150 : 50);
    pg.line(_x, y, _x, y+h);
  }
}