import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import store from '../store';
import io from 'socket.io-client';

import { saveScBootInfo } from '../actions'

import './style/Layout.css';

import P5Wrapper from 'react-p5-wrapper';
import vis_sketch from './sketches/tempo';

import GL from "gl-react";
import GLReactDOM from "gl-react-dom";

class Canvas extends Component {
  constructor(props) {
    super(props)
    this.state = {
      socket_sc: io('http://localhost:3006/'),  // Port 3005 is skipped because
      cycleInfo: [],                             // a HTC Vive process is using it
      cycleNumber: 0,
      subCycleNumber: 0,
      cycleOffset: 0
    }
  }

  componentDidMount() {
    const ctx = this;
    const { socket_sc } = ctx.state;

    socket_sc.on('connect', (reason) => {
      console.log("connect: ", reason);
      store.dispatch(saveScBootInfo({boot: 1, tidalMenu: true}));
    });
    socket_sc.on('disconnect', (reason) => {
      console.log("connect: ", reason);
      store.dispatch(saveScBootInfo({boot: 0, tidalMenu: false}));
    });
    socket_sc.on("/sclog", data => {
      ctx.setState({cycleInfo: data.sclog});
                    // cycleNumber: data.number,
                    // subCycleNumber: data.subCycleNumber,
                    // cycleOffset: data.cycleOffset});

      if(_.startsWith(data.sclog, 'SIREN')) {
        store.dispatch(saveScBootInfo({boot: 1, tidalMenu: true}));
      }
    })
  }

  updateDimensions() {
    const element = document.getElementById('canvasLayout');
    if(element && element !== null){
      const w = element.clientWidth;
      const h = element.clientHeight;

      return {w: w, h: h-25};
    }
  }

  render() {
    const ctx = this;

    let dimensions = ctx.updateDimensions();
    let width = dimensions ? dimensions.w: 600;
    let height = dimensions ? dimensions.h: 90;

    // SINGLE MESSAGE STRUCTURE
    // {time, args}

    // STACK MESSAGE STRUCTURE
    // 0: Array(2)
    //   0:
    //     s: "hh"
    //     t: Array(1)
    //       0:
    //         cycle: 902,
    //         delta: 0.5,
    //         time: 901.41357317311

    let msg = ctx.state.cycleInfo;
    console.log(msg);
    let time = msg['time'] !== undefined ? msg['time'] : 0;
    let rate = Math.sin(time)/2; //msg['cycleInfo'] !== undefined ? _.toNumber(msg['cycleInfo']['delta']) : 0.5;
    let depth = msg['cycleInfo'] !== undefined ? _.toNumber(msg['cycleInfo']['delta']) : 0.5;

    const shaders = GL.Shaders.create({
      blobby: {
        frag: `
          precision highp float;

          uniform float time;
          uniform vec2 resolution;
          uniform float depth;
          uniform float rate;

          #define N 16

          void main( void ) {
            vec2 v = (gl_FragCoord.xy-(resolution*0.5))/min(resolution.y,resolution.x)*10.0;
            float t = time * 0.3,r=2.0;
            for (int i=1;i<N;i++){
              float d = (3.14159265 / float(N))*(float(i)*14.0);
              r += length(vec2(rate*v.y,rate*v.x))+1.21;
              v = vec2(v.x+cos(v.y+cos(r)+d)+cos(t),v.y-sin(v.x+cos(r)+d)+sin(t));
            }
            r = (sin(r*0.09)*0.5)+0.5;
            r = pow(r, depth);
            gl_FragColor = vec4(r,pow(max(r-0.55,0.0)*2.2,2.0),pow(max(r-4.875,0.1)*3.0,6.0), 1.0 );
          }`

      },
      sinewave: {
        frag: `
          precision highp float;

          uniform float time;
          uniform vec2 resolution;
          uniform vec2 colorMult;
          uniform float coeffx;
          uniform float coeffy;
          uniform float coeffz;

          void main( void ) {

          	vec2 position = gl_FragCoord.xy / resolution.xy;

          	float color = 0.0;
          	color += sin( position.x * cos( time / 15.0 ) * 10.0 )  +  cos( position.y * cos( time / 15.0 ) * coeffx );
          	color += sin( position.y * sin( time / 10.0 ) * coeffz )  +  cos( position.x * sin( time / 25.0 ) * coeffy );
          	color += sin( position.x * sin( time / 50.0 ) * coeffx )  +  sin( position.y * sin( time / 35.0 ) * coeffz );

          	color *= sin( time / 10.0 ) * 0.5;

          	float r = color;
          	float g = color * colorMult.y;
          	float b = sin( color + time / 2.0 ) * colorMult.x;

          	gl_FragColor = vec4(r, g, b, 1.0 );

          }`
      }
    });
    const Blobby = GL.createComponent(
      ({ time, resolution, depth, rate }) =>
      <GL.Node
        shader={shaders.blobby}
        uniforms={{ time, resolution, depth, rate }}
      />
     );
    const Sinewave = GL.createComponent(
       ({ time, resolution, colorMult, coeffx, coeffy, coeffz }) =>
       <GL.Node
         shader={shaders.sinewave}
         uniforms={{ time, resolution, colorMult, coeffx, coeffy, coeffz }}
       />
      );
    const {Surface} = GLReactDOM;
    // <Blobby time={time}
    //   resolution={[width, height]}
    //   depth={depth}
    //   rate={rate}/>
    return (<div>
      <Surface width={width}
               height={height}>
         <Sinewave time={time}
                  resolution={[width, height]}
                  colorMult={[depth*5, 2-depth*2]}
                  coeffx={15*(Math.sin((Math.cos(time)+1)*2)+1)}
                  coeffy={3.53*(Math.tan(Math.sqrt(time)*1.4362)+1)+5*(Math.cos(time)+1)}
                  coeffz={10.0}/>
      </Surface>
    </div>);
  }
  // <P5Wrapper sketch={vis_sketch}
  //   width={width}
  //   height={height}
  //   cycleStack={ctx.state.cycleInfo}
  //   cycleOffset={ctx.state.cycleOffset}
  //   cycleNumber={ctx.state.cycleNumber}
  //   subCycleNumber={ctx.state.subCycleNumber}/>
}
export default connect(state => state)(Canvas);
