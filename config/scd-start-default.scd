(
s.options.numInputBusChannels = 8;
s.options.numOutputBusChannels = 16;
s.options.numBuffers = 2048 * 32;
s.options.maxNodes = 1024 * 32;
s.options.memSize = 131072 * 16;
s.quit;

s.waitForBoot {

 ~dirt = SuperDirt(2, s);
 ~dirt.loadSoundFiles("/home/mert/Dropbox/Whalehouse/99s/*");

 ~dirt.start(57120, (0,2 .. 9));
  "SUPERDIRT LOADED".postln;
  1.wait;
  "SIREN LOADED".postln;

  OSCFunc.trace(true);
  s.sendMsg("/notify", 0);
  };
)
