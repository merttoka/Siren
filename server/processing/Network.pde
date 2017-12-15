import netP5.*;
import oscP5.*;

OscP5 oscP5;
//NetAddress myRemoteLocation;

void initNetwork() {
  oscP5 = new OscP5(this, 3007);
  //myRemoteLocation = new NetAddress("127.0.0.1",12000);
}

void oscEvent(OscMessage theOscMessage) {
  /* check if theOscMessage has the address pattern we are looking for. */
  if(theOscMessage.checkAddrPattern("/siren")) {
    if(theOscMessage.checkTypetag("s")) {
      String[] splitMessage = split(theOscMessage.get(0).stringValue(), ',');
      
      Message m = new Message();
      m.time = float(splitMessage[0]);
      for(int i = 1; i < splitMessage.length; i+=2) {
        switch(splitMessage[i]) {
          case "s":
            m.s = splitMessage[i+1];            
            break;
          case "n":
            m.n = int(splitMessage[i+1]);
            break;
          case "cycle":
            m.cycle = float(splitMessage[i+1]);
            break;
          case "orbit":
            m.orbit = int(splitMessage[i+1]);
            break;
          default:
            m.addField(splitMessage[i], float(splitMessage[i+1]));
            break;
        }
      }
      if(startCycle == 0) startCycle = int(m.cycle);
      
      println(m);
      return;
    }  
  }
}