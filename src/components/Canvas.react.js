import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import store from '../store';
import io from 'socket.io-client';

import P5Wrapper from 'react-p5-wrapper';
import sketch from './sketches/tempo';

import './style/Layout.css';

import { saveScBootInfo } from '../actions'

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

    // Move these to canvas.react and send boot and tidalMenu with props
    socket_sc.on('connect', (reason) => {
      console.log("connect: ", reason);
      store.dispatch(saveScBootInfo({boot: 1, tidalMenu: true}));
    });
    socket_sc.on('disconnect', (reason) => {
      console.log("connect: ", reason);
      store.dispatch(saveScBootInfo({boot: 0, tidalMenu: false}));
    });
    socket_sc.on("/sclog", data => {
      ctx.setState({cycleInfo: data.sclog,
                    cycleNumber: data.number,
                    subCycleNumber: data.subCycleNumber,
                    cycleOffset: data.cycleOffset});

      if(_.startsWith(data.sclog, 'SIREN')) {
        store.dispatch(saveScBootInfo({boot: 1, tidalMenu: true}));
      }
    })
  }

  render() {
    const ctx = this;
    // const canvasLayout = _.find(ctx.props.layout.windows, ['i', 'canvas']);

    return (<div>
      <P5Wrapper sketch={sketch}
                 cycleStack={ctx.state.cycleInfo}
                 cycleOffset={ctx.state.cycleOffset}
                 cycleNumber={ctx.state.cycleNumber}
                 subCycleNumber={ctx.state.subCycleNumber}/>
    </div>);
  }
}
export default connect(state => state)(Canvas);
