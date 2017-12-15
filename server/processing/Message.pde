// 'latency', 'cps', 'sound', 'offset', 'begin', 'end', 'speed', 
// 'pan', 'velocity', 'vowel', 'cutoff', 'resonance', 'accelerate', 
// 'shape', 'krio', 'gain', 'cut', 'delay', 'delaytime', 
// 'delayfeedback', 'crush', 'coarse', 'hcutoff', 'hresonance', 'bandqf', 'bandq', 'unit' ]

//orbit, cycle, s, n
//sound
// begin
// end

// legato
// sustain

//length
//accelerate
//cps
//unit
//loop
// delta
//amp
//gain
//channel
//pan
//note
//freq
//midinote
//octave
//latency
//lag
//offset
// cut

public class MessageHolder {

}

public class Message {
  public float time = 0;
  public float cycle = 0;
  public String s = "";
  public int n = 1;
  public int orbit = 0;
  
  public HashMap<String, Float> fields = new HashMap(); 
  
  public Message() {}  
  boolean addField(String key, float value) {
    if(!fields.containsKey(key)) {
      fields.put(key, value);
      return true;
    }
    return false;
  }
  
  String toString() {
    return s+":"+n+" "+cycle+" "+time+" "+orbit + " " + fields.toString();
  }
};