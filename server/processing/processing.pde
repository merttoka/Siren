float prevTime = millis();
float time = 0;
float deltaTime = 0;

int startCycle = 0;

int cycleRes = 12;
int totalCycle = 8;
float maxTime = totalCycle*1000;

PVector resolution = new PVector(cycleRes*totalCycle, 1);

void setup() {
  size(800, 400);
  
  frameRate(30);
  noSmooth();
  
  initNetwork();
  initControls();
}

void draw() {
  background(50);
  deltaTime = millis() - prevTime;
 
  // App drawing
 
  prevTime = millis();
}