import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import P5Wrapper from 'react-p5-wrapper';
import sketch from './sketches/tempo';
import './style/Layout.css';

class Canvas extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const ctx = this;
    // const canvasLayout = _.find(ctx.props.layout.windows, ['i', 'canvas']);

    // cycleInfo={ctx.props.click.response.vals}
    // cycleTime={ctx.props.click.response.time}
    // cycleStack={ctx.props.click.response}

    return (<div>
      <P5Wrapper sketch={sketch}
                 />
    </div>);
  }
}
export default connect(state => state)(Canvas);
