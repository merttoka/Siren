import _ from 'lodash';

export default function sketch (p) {
  let cycleStack,
      cycleOffset,
      cycleNumber,
      subCycleNumber,
      resolution;

  let mouseX, mouseY;
  let _w, _h;

  // store sample names inside
  let max_samples = 5;
  let samples = _.times(max_samples, _.stubString);
  let activeMatrix = '';

  let recordedGrid;

  let isDraw = true;
  let isInteract = false;
  let isCleaned = true;
  let isLabels = true;

  let prevSize = cycleOffset;

  let dragStart = [0, 0];
  let dragEnd = [0, 0];

  p.setup = function () {
    p.createCanvas(1080, 95);
  };

  p.myCustomRedrawAccordingToNewPropsHandler = function (props) {
    if (props.width && props.height && (_w !== props.width || _h !== props.height)) {
      _w = props.width;
      _h = props.height;
      p.resizeCanvas(_w, _h);
    }

    if (props.activeMatrix) {
      if(activeMatrix !== props.activeMatrix) {
        samples = _.times(max_samples, _.stubString);
        activeMatrix = props.activeMatrix;
      }
    }

    if (props.cycleStack) {
      if(cycleStack !== props.cycleStack) {
        cycleStack = props.cycleStack;
        cycleOffset= props.cycleOffset+1;
        cycleNumber = props.cycleNumber;
        subCycleNumber = props.subCycleNumber;

        if(resolution !== props.resolution) {
          recordedGrid = _.times(props.resolution * cycleOffset, function() {return _.times(max_samples, _.stubObject)});
          resolution = props.resolution;
        }

        // Create Vis Matrix
        if(cycleStack !== undefined && cycleStack !== null) {
          if(prevSize > cycleStack.length)  isCleaned = false;
          for (var k = 0; k < cycleStack.length; k++) {
            if(cycleStack[k] !== undefined && cycleStack[k] !== null) {
              for(let i = 0 ; i < cycleStack[k].length; i++) {
                // Manage sample name array
                let index = _.indexOf(samples, cycleStack[k][i]['s']);
                if (index === -1 && _.compact(samples).length >= max_samples) {
                  samples[_.compact(samples).length] = cycleStack[k][i]['s'];
                  max_samples = samples.length;
                }
                if (index === -1 && _.compact(samples).length < max_samples) {
                  samples[_.compact(samples).length] = cycleStack[k][i]['s'];
                }
                index = _.indexOf(samples, cycleStack[k][i]['s'])

                if (index !== -1) {
                  /////
                  // y == index
                  /////
                  for(let j = 0 ; j < cycleStack[k][i].t.length; j++) {
                    if(_.keysIn(cycleStack[k][i]['t'][j]).length !== 0) {

                      /////
                      // x == k*resolution+j  // cycleOffset*resolution
                      /////
                      if (recordedGrid[index])
                      recordedGrid[k*resolution+j][index] = cycleStack[k][i]['t'][j];
                    }
                  }
                }
              }
            }
          }
          prevSize = cycleStack.length;
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
  }

  // MOUSE INTERACTIONS
  p.mouseMoved = function () {
    mouseX = p.mouseX;
    mouseY = p.mouseY;
  }

  p.mousePressed = function () {
    dragStart = [mouseX, mouseY];
  }
  p.mouseReleased = function () {
    dragEnd = [p.mouseX, p.mouseY];

    let x = _.toInteger(p.map(dragStart[0], 0, p.width, 0, (resolution*cycleOffset)))
    let y = _.toInteger(p.map(dragStart[1], 0, p.height, 0, (max_samples)))

    if (_.keysIn(recordedGrid[x][y]).length !== 0) {
      let _x = _.toInteger(p.map(dragEnd[0], 0, p.width, 0, (resolution*cycleOffset)))
      let _y = _.toInteger(p.map(dragEnd[1], 0, p.height, 0, (max_samples)))

      let obj = recordedGrid[x][y];
      obj.s = samples[_y];
      recordedGrid[x][y] = {};
      recordedGrid[_x][_y] = obj;
    }
  }

  p.mouseClicked = function () {
    if(isInteract){
      let x = _.toInteger(p.map(p.mouseX, 0, p.width, 0, (resolution*cycleOffset)))
      let y = _.toInteger(p.map(p.mouseY, 0, p.height, 0, (max_samples)))

      let obj = {};
      if (_.keysIn(recordedGrid[x][y]).length === 0) {
        obj = {
          's': samples[y],
          'n': 1,
          'cps' : 1,
          'cycle': p.map(x%resolution, 0, resolution, 0, 1),
          'speed': 1,
          'delay': 0,
          'delaytime' : 0,
          'end': 1,
          'gain': 1
        };
      }
      recordedGrid[x][y] = obj;
    }
  }

  p.draw = function () {
    p.background(27);

    // Grid lines
    if(cycleOffset){
      for(let rows = 0; rows < max_samples; rows++) {
        p.stroke(255, 5);
        p.line(0, rows*(p.height/max_samples), p.width, rows*(p.height/max_samples));
      }
      for(let cols = 0; cols < resolution*cycleOffset; cols++) {
        p.stroke(255, cols%resolution === 0 ? 20 : 5);
        p.line(cols*(p.width / (cycleOffset*resolution)), 0,
        cols*(p.width / (cycleOffset*resolution)), p.height);
      }
    }

    // Draw
    if (isDraw){
      for(let i = 0; i < resolution*cycleOffset; i++) {
        for(let j = 0; j < max_samples; j++) {
          if(_.keysIn(recordedGrid[i][j]).length !== 0) {
            let w = p.width/(resolution*cycleOffset);
            let h = p.height/(max_samples);
            let x = i * w;
            let y = j * h;
            let obj = recordedGrid[i][j];
            let gain = recordedGrid[i][j].gain !== undefined ? _.toNumber(recordedGrid[i][j].gain) : 1.0
            let speed = recordedGrid[i][j].speed !== undefined ? _.toNumber(recordedGrid[i][j].speed) : 1.0

            // Average ASCII value of word
            let averageASCII = 0;
            obj.s.toUpperCase().split('').forEach(function(alphabet) {
              averageASCII += alphabet.charCodeAt(0);
            });
            averageASCII /= obj.s.split('').length;

            p.colorMode(p.HSL, 360, 255, 255);
            p.noStroke();
            p.fill(p.map(averageASCII, 62, 90, 0, 360),
                    p.map(speed, -1, 2, 20, 255),
                    p.map(gain, 0, 1.4, 80, 255));
            p.rect(x, y, w, h);
            p.colorMode(p.RGB);
          }
        }
      }

    }

    if (isLabels) {
      for(let i = 0; i < max_samples; i++) {
        let h = p.height/(max_samples);
        let y = i * h;
        p.fill(255, 150);
        p.rect(0, y+3, 15, h-3);
        p.push();
        p.fill(0);
        p.translate(7, y+h*0.5);
        p.rotate(p.HALF_PI);
        p.textFont("Courier New");
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(samples[i], 0, 0);
        p.pop();
      }
    }

    // Selection indicator
    if(cycleOffset){
      p.stroke(255);
      p.noFill();
      let w = p.width/(resolution*cycleOffset);
      let h = p.height/(max_samples);
      let x = _.toInteger(p.map(mouseX, 0, p.width, 0, (resolution*cycleOffset))) * w;
      let y = _.toInteger(p.map(mouseY, 0, p.height, 0, (max_samples))) * h;
      p.rect(x,y,w,h);
    }

    // Interaction
    if (isInteract) {
      p.stroke(255);
      p.line(mouseX, 0, mouseX, p.height);
      p.noStroke();
    }


    // needs cleaning
    if (!isCleaned) {
      p.background(27);
      recordedGrid = _.times(resolution * cycleOffset, function() {return _.times(max_samples, _.stubObject)});
      isCleaned = true;
    }
  };
};
