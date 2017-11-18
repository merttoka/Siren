import _ from 'lodash';

export default function sketch (p) {
  let cycleStack,
      cycleOffset,
      cycleNumber,
      subCycleNumber;

  let _w, _h;

  // store sample names inside
  let max_samples = 5;
  let samples = _.times(max_samples, _.stubString);
  let activeMatrix = '';

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
      cycleStack = props.cycleStack;
      cycleOffset= props.cycleOffset+1;
      cycleNumber = props.cycleNumber;
      subCycleNumber = props.subCycleNumber;
      // console.log(cycleStack);
    }
  };

  p.draw = function () {
    p.background(27); // Menubar Background Color

    for(let rows = 0; rows < max_samples; rows++) {
      p.stroke(255, 5);
      p.line(0, rows*(p.height/max_samples), p.width, rows*(p.height/max_samples));
    }

    if(cycleStack !== undefined && cycleStack !== null) {
      for (var k = 0; k < cycleStack.length; k++) {
        if(cycleStack[k] !== undefined && cycleStack[k] !== null) {
          let x_off = k * (p.width / cycleOffset);

          // draw the grid -- cyclestart
          p.stroke(255, 20);
          p.line(x_off, 0, x_off, p.height);
          let segmentNumber = cycleStack[k][0].t.length;
          for(let cols = 0; cols < segmentNumber; cols++) {
            p.stroke(255, 5);
            p.line(x_off+cols*(p.width / cycleOffset)/segmentNumber, 0,
                   x_off+cols*(p.width / cycleOffset)/segmentNumber, p.height);
          }

          for(let i = 0 ; i < cycleStack[k].length; i++) {
            let index = _.indexOf(samples, cycleStack[k][i]['s']);
            // ignore drawing
            if (index === -1 && _.compact(samples).length >= max_samples) {
              continue;
            }

            if (index === -1 && _.compact(samples).length < max_samples) {
              samples[_.compact(samples).length] = cycleStack[k][i]['s'];
            }
            index = _.indexOf(samples, cycleStack[k][i]['s'])

            // draw
            if (index !== -1) {
              let cellH = (p.height/max_samples);
              let y = index*cellH;

              // Average ASCII value of word
              let averageASCII = 0;
              cycleStack[k][i]['s'].toUpperCase().split('').forEach(function(alphabet) {
                averageASCII += alphabet.charCodeAt(0);
              });
              averageASCII /= cycleStack[k][i]['s'].split('').length;

              for(let j = 0 ; j < cycleStack[k][i].t.length; j++) {
                if(_.keysIn(cycleStack[k][i]['t'][j]).length !== 0) {

                  let cellW = (p.width / cycleOffset)/cycleStack[k][i].t.length;
                  let x  = x_off + j*cellW;

                  p.colorMode(p.HSL, 360, 255, 255);

                  // since most characters are between 64-90
                  p.noStroke();
                  p.fill(p.map(averageASCII, 62, 90, 0, 360),
                  p.map(i, 0, cycleStack[k].length, 80, 255),
                  p.map(j, 0, cycleStack[k][i].t.length, 80, 255));
                  p.rect(x, y, cellW, cellH);
                  p.colorMode(p.RGB);

                  // if (cycleStack[k][i]['t'][j]['cycle']%1.0 === 0) {
                  //   p.fill(200);
                  //   p.rect(x-2, 0, 4, p.height);
                  // }

                }

              }
            }
          }
        }
      }
    }

  };

};
