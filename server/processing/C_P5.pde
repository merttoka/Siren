import controlP5.*;
import java.util.*;

ControlP5 cp5;
Canvas gc;

int marginx = 10;
int marginy = 10;

void initControls() {
  cp5 = new ControlP5(this);
  
  // Canvas
  gc = new GrainCanvas(marginx, marginy, 
                       width-2*marginx, height-2*marginy);
  gc.pre();
  cp5.addCanvas(gc);
}