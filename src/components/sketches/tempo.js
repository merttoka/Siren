// import _ from 'lodash';

export default function sketch (p) {
  let cycleStack,
      cycleOffset,
      cycleNumber,
      subCycleNumber;

  let _w, _h;

  p.setup = function () {
    p.createCanvas(1080, 95);
  };

  p.myCustomRedrawAccordingToNewPropsHandler = function (props) {
    if (props.width && props.height && (_w !== props.width || _h !== props.height)) {
      _w = props.width;
      _h = props.height;
      p.resizeCanvas(_w, _h);
    }

    if (props.cycleStack) {
      cycleStack = props.cycleStack;
      cycleOffset= props.cycleOffset;
      cycleNumber = props.cycleNumber;
      subCycleNumber = props.subCycleNumber;
    }
  };

  p.draw = function () {
    p.background(27, 25); // Menubar Background Color

    if(cycleStack !== undefined && cycleStack !== null) {
      for (var k = 0; k < cycleStack.length; k++) {
        if(cycleStack[k] !== undefined && cycleStack[k] !== null) {

          for(let i = 0 ; i < cycleStack[k].length; i++) {
            let cellH = (p.height/cycleStack[k].length);
            let y = i*cellH;

            // Average ASCII value of word
            let averageASCII = 0;
            cycleStack[k][i]['s'].toUpperCase().split('').forEach(function(alphabet) {
                averageASCII += alphabet.charCodeAt(0);
            });
            averageASCII /= cycleStack[k][i]['s'].split('').length;

            for(let j = 0 ; j < cycleStack[k][i].t.length; j++) {
              let cellW = 5;
              let x  = p.map(cycleStack[k][i]['t'][j]['time']%10.,
                            0, 10,
                            0, p.width);

              p.colorMode(p.HSL, 360, 255, 255);

              // since most characters are between 64-90
              p.noStroke();
              p.fill(p.map(averageASCII, 62, 90, 0, 360),
                     p.map(i, 0, cycleStack[k].length, 80, 255),
                     p.map(j, 0, cycleStack[k][i].t.length, 80, 255));
              p.rect(x-cellW*0.5, y, cellW, cellH);
              p.colorMode(p.RGB);
            }
          }
        }
      }

      // const cycleDuration = ((1.0/p.float(cycleInfo.cps))*cycleOffset)*1000;
      // const timeslider_x = p.map(p.millis(),
      //                            localCycleStartTime, localCycleStartTime+cycleDuration,
      //                            0, p.width);

      // p.noStroke();
      // for(let i = 0 ; i < cycleOffset+1; i++) {
      //     let w  = p.width/cycleOffset;
      //     let x  = i    *w;
      //     // let x_ = (i+1)*w;
      //     p.fill(27);
      //     p.rect(x + w*0.05, p.height-4, w-w*0.1, 2);
      //     p.rect(x-1, 0, 2, p.height);
      // }

      // const timeslider_w = 5;
      // p.fill(60, 50);
      // p.rect(timeslider_x-timeslider_w*0.5, 0, timeslider_w, p.height);

    }

  };

};
