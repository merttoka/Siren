import _ from 'lodash';
import store from '../../store';
import { consoleSubmit, resetClick, sendScPattern } from '../../actions'

export default function sketch (p) {
  // primary data
  let message,
      totalCycleCount = 8,
      cycleResolution = 12,
      cycleIndex = 0,
      subCycleIndex = 0;

  // data management
  let samples = [];
  let startCycleNumber = 0;
  let activeMatrix = '';
    
  // interaction variables
  let mouseX, mouseY;
  let _w, _h;
  let draw_w, draw_h; 
  let isDraw = true;
  let isInteract = false;
  let isLabels = true;
  let dragStart = [0, 0];
  let dragEnd = [0, 0];

  // playback variables
  let isPlay = false;
  let isPaused = true;
  let time = 0;
  let playbackArray = [];
  let serverLink = '';

  p.setup = function () {
    p.createCanvas(1080, 95);
  };

  p.myCustomRedrawAccordingToNewPropsHandler = function (props) {
    // resizing
    if (props.width && props.height && (_w !== props.width || _h !== props.height)) {
      _w = props.width;
      _h = props.height;
      draw_w = _w - 40;
      draw_h = _h;
      p.resizeCanvas(_w, _h);
    }

    if (props.serverLink && serverLink !== props.serverLink) {
      serverLink = props.serverLink;
      store.dispatch(sendScPattern(serverLink, "~d1 = ~dirt.orbits[0];"));
    }

    // clear data on scene change
    if (props.activeMatrix) {
      if(activeMatrix !== props.activeMatrix) {
        startCycleNumber = 0;
        samples = [];
        activeMatrix = props.activeMatrix;
      }
    }

    // on message -- form a matrix
    if (props.message && message !== props.message && props.message.s !== undefined) {
      message = props.message;

      if (startCycleNumber === 0) {
        startCycleNumber = _.toInteger(message.cycle)
      }
      // clean current view
      if (startCycleNumber + totalCycleCount - 1 < _.toInteger(message.cycle)) {
        startCycleNumber = _.toInteger(message.cycle);
        
        samples = [];
        
        console.log('refresh: ', samples);
      }
      
      // sample[i] = {s: 'bd', n: [{no: 0, time: [{}x96]]}

      cycleIndex = _.toInteger(_.toNumber(message.cycle) - startCycleNumber);
      subCycleIndex = _.toInteger(_.toNumber(message.cycle)%1.0 * cycleResolution);
      
      let _n = message.n === undefined ? 0 : _.toInteger(message.n);
      let xcoord = cycleIndex*cycleResolution+subCycleIndex;
      
      let _index = _.findIndex(samples, ['s', message.s]);
      // console.log(' ## _index', _index);
      if(_index === -1){
        // console.log(' # adding sample: ', message.s);
      
        samples[samples.length] = {s: message.s, n: [{no: _n, time: []}]};
        samples = _.sortBy(samples, 's');
      }
      else {
        // console.log(' # modifying sample: ', message.s);
        
        let sampleNumberArray = samples[_index].n;
        let _subindex = _.findIndex(sampleNumberArray, ['no', _n]);
        // console.log('_subindex', _subindex);
      
        if(_subindex === -1) {
          // console.log(' # adding n to '+ message.s+': ', _n);
        
          let _t = [];
          _t[xcoord] = message;
          samples[_index].n[sampleNumberArray.length] = {no: _n, time: _t}
        }
        else {
          // console.log(' # modifying n in '+ message.s+': ', _n);

          let _t = samples[_index].n[_subindex].time;
          _t[xcoord] = message;
          samples[_index].n[_subindex].time = _t;
        }
      }
    }
  };

  // KEYBOARD INTERACTIONS
  p.keyPressed = function () {
    if (p.keyCode === p.SHIFT)  isInteract = true;
  }
  p.keyReleased = function () {
    if (p.keyCode === p.SHIFT)  isInteract = false;
  }
  p.keyTyped = function () {
    if (p.key === 'l')  isLabels = !isLabels;
    // if (p.key === ' ') {
    //   isPlay = !isPlay;
    //   isPaused = !isPaused;

    //   if ( isPlay ) {
    //     store.dispatch(resetClick());
    //     store.dispatch(consoleSubmit(serverLink, "hush"));
    //     store.dispatch(sendScPattern(serverLink, "OSCFunc.trace(false);"));
    //   }
    // }
  }

  // MOUSE INTERACTIONS
  p.mouseMoved = function () {
    mouseX = p.mouseX;
    mouseY = p.mouseY;
  }

  // p.mousePressed = function () {
  //   dragStart = [mouseX, mouseY];
  // }
  // p.mouseReleased = function () {
  //   dragEnd = [p.mouseX, p.mouseY];

  //   let h = p.height/(maxSamples);

  //   let x = _.toInteger(p.map(dragStart[0], 0, p.width, 0, (cycleResolution*totalCycleCount)))
  //   let y = _.toInteger(p.map(dragStart[1], 0, p.height, 0, (maxSamples)))
  //   if(grid[x][y]) {
  //     let z = _.toInteger(p.map(dragStart[1], h*y, h*(y+1), 0, grid[x][y].length))
  
  //     if (grid[x][y].length !== 0) {
  //       let _x = _.toInteger(p.map(dragEnd[0], 0, p.width, 0, (cycleResolution*totalCycleCount)))
  //       let _y = _.toInteger(p.map(dragEnd[1], 0, p.height, 0, (maxSamples)))
  //       let _z = _.toInteger(p.map(dragEnd[1], h*_y, h*(_y+1), 0, grid[_x][_y].length))
  
  //       let obj = grid[x][y][z];
  //       obj.s = samples[_y];
  //       obj.n = samplesNumbers[_y][_z];
  //       grid[x][y][z] = {};
  //       grid[_x][_y][_z] = obj;

  //       console.log(_z);
  //     }
  //   }
  // }

  // p.mouseClicked = function () {
  //   if(isInteract){
  //     let h = p.height/(maxSamples);
      
  //     let x = _.toInteger(p.map(p.mouseX, 0, p.width, 0, (cycleResolution*totalCycleCount)))
  //     let y = _.toInteger(p.map(p.mouseY, 0, p.height, 0, (maxSamples)))
  //     if(grid[x][y]) {
  //       let z = _.toInteger(p.map(p.mouseY, h*y, h*(y+1), 0, grid[x][y].length))
  
  //       let obj = {};
  //       if (grid[x][y].length === 0) {
  //         obj = {
  //           's': samples[y],
  //           'n': 0,
  //           'cps' : 1,
  //           'cycle': p.map(x%cycleResolution, 0, cycleResolution, 0, 1),
  //           'speed': 1,
  //           'delay': 0,
  //           'delaytime' : 0,
  //           'end': 1,
  //           'gain': 1
  //         };
  //       }
  //       grid[x][y][z] = obj;
  //     }
  //   }
  // }

  p.draw = function () {
    p.background(30);

    // Get max sample number
    // let maxSamples = 

    // Grid lines
    if(true){
      for(let rows = 0; rows < samples.length; rows++) {
        p.stroke(255, 15);
        p.line(0, rows*(p.height/samples.length), p.width, rows*(p.height/samples.length));
      }
      for(let cols = 0; cols < cycleResolution*totalCycleCount; cols++) {
        p.stroke(255, cols%cycleResolution === 0 ? 30 : 5);
        p.line(cols*(p.width / (totalCycleCount*cycleResolution)), 0,
               cols*(p.width / (totalCycleCount*cycleResolution)), p.height);
        
        // Highlight some portions of the grid

      }
    }

      // delete array on tmex 
    // let time_x = p.map(time%(totalCycleCount*1000), 0, totalCycleCount*1000, 0, p.width);
    // p.stroke(150);
    // p.line(time_x, 0, time_x, p.height);
    // if (!isPaused) {
    //   let item_x = _.toInteger(p.map(time_x, 0, p.width, 0, (totalCycleCount*cycleResolution)));

    //   let objs = grid[item_x]
    //   if(objs) {
    //     for(let a = 0; a < objs.length; a++) {
    //       for(let b = 0; b < objs[a].length; b++) {
    //         if(objs[a][b] && _.indexOf(playbackArray, objs[a][b]) === -1)
    //         {
    //           playbackArray[playbackArray.length] = objs[a][b];
                          
    //           // [ 'latency', 'cps', 'sound', 'offset', 'begin', 'end', 'speed', 'pan', 'velocity', 'vowel', 'cutoff', 'resonance', 'accelerate', 'shape', 'krio', 'gain', 'cut', 'delay', 'delaytime', 'delayfeedback', 'crush', 'coarse', 'hcutoff', 'hresonance', 'bandqf', 'bandq', 'unit' ]
    //           let pattern = "sound: \"" + objs[a][b].s + ":"+ objs[a][b].n +"\"";
    //           store.dispatch(sendScPattern(serverLink, "~d1.(("+ pattern +"));"));

    //           console.log(objs[a][b]);
    //         }
    //       }
    //     }
    //   }
    //   time += 1000/p.frameRate();
    // }

    // Draw
    if (isDraw){

      // sample[i] = {s: 'bd', n: [{no: 0, time: [{}x96]]}
      for(let i = 0; i < samples.length; i++) {
        let _ns = samples[i].n;
        
        let w = p.width/(totalCycleCount*cycleResolution);
        let h = p.height/(samples.length);
        
        for (let j = 0; j < _ns.length; j++) {
          let _h = h / _ns.length;

          let y = i * h + j * _h;
          for (let k = 0; k < (totalCycleCount*cycleResolution); k++) {
            if (_ns[j].time && _ns[j].time[k]){
              let x = k * w;
  
              p.stroke(0);
              p.fill(200);
              p.rect(x, y, w, _h);
            }
          }
        }
      }        

      
      // for(let i = 0; i < (totalCycleCount*cycleResolution); i++) {
      //   if(grid[i] !== undefined) {
      //     for(let j = 0; j < samples.length; j++) {
      //       let obj = _.find(grid[i], ['s', samples[j].s])

      //       for(let k = 0; obj && k < samples[j].n.length; k++) {
      //         if(obj.n[k]){
      //           let x = i * w;
                
      //         }
      //       }
      //     }

      //   }
      // }
    }

    if (isLabels) {
      // console.log(samples);
      for(let i = 0; i < samples.length; i++) {
        let h = p.height/(samples.length);
        let y = i * h;
        p.fill(255, 150);
        p.rect(0, y+3, 15, h-3);
        p.push();
        p.fill(0);
        p.translate(7, y+h*0.5);
        p.rotate(p.HALF_PI);
        // p.textFont("Courier New", 10);
        // p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(samples[i].s, 0, 0);
        p.pop();
        for (let j = 0; j < samples[i].n.length; j++) {
          let _h = h / samples[i].n.length;
          p.fill(255, 100);
          p.rect(17, y+j*_h+2, 15, _h-3);
          p.push();
          p.fill(0);
          p.translate(24, y+j*_h+_h*0.5);
          p.rotate(p.HALF_PI);
          // p.textFont("Courier New", 10);
          // p.textStyle(p.BOLD);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(samples[i].n[j].no, 0, 0);
          p.pop();
          
          
        }
      }
    }

    // const getObject = function(mx, my) {
    //   let w = p.width/(cycleResolution*totalCycleCount);
    //   let h = p.height/(samples.length);
    //   let sampleIndex = _.toInteger(my/h);
    //   let numbers = samples[sampleIndex].n;
    //   let _h = h / numbers.length;
    //   let numberIndex = _.toInteger((my - sampleIndex*h)/_h);
    //   let x = _.toInteger(p.map(mx, 0, p.width, 0, (cycleResolution*totalCycleCount)));
    //   return numbers[numberIndex].time[x]    
    // } 
    // const getObjectPosition = function(mx, my) {
    //   let w = p.width/(cycleResolution*totalCycleCount);
    //   let h = p.height/(samples.length);
    //   let sampleIndex = _.toInteger(my/h);
    //   if(samples[sampleIndex]){
    //     let numbers = samples[sampleIndex].n;
    //     let _h = h / numbers.length;
    //     let numberIndex = _.toInteger((my - sampleIndex*h)/_h);
    //     if(numbers.time[numberIndex]) {
    //       let x = _.toInteger(p.map(mx, 0, p.width, 0, (cycleResolution*totalCycleCount)));
    //       return [x, sampleIndex*h+numberIndex*_h, w, _h]    
    //     }
    //   }
    // } 

    // // Selection indicator
    // if(true){
    //   p.stroke(255);
    //   p.noFill();
      
    //   let pos = getObjectPosition(mouseX, mouseY);
    //   if(pos) {
    //     p.rect(pos[0], pos[1], pos[2], pos[3]);
    //   }
    // }

    // Interaction
    if (isInteract) {
      p.stroke(255);
      p.line(mouseX, 0, mouseX, p.height);
      p.noStroke();
    }
  };
};
