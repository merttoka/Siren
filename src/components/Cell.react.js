
import React, { Component } from 'react';
import { connect } from 'react-redux';
import store from '../store';
import _ from 'lodash';

import { fbdeletechannelinscene, fbupdatechannelinscene, updateCell, createCell} from '../actions';

class Cell extends Component {
  constructor(props) {
    super(props)
    this.state = {
        modelName : 'Cell',
        value: '',
        c_key:'',
        s_key:'',
        cid:'',
        className:'playbox',
        index:''
    }
  }

  componentWillMount = () => {
    const ctx = this;
    console.log(this.props.item.cid);
    this.setState({value: this.props.item.vals[this.props.index],cid: this.props.item.cid, c_key:this.props.item.key, index: this.props.index, s_key: this.props.s_key});
    }

    shouldComponentUpdate(nextProps, nextState){
        if  ( nextState.value !== this.state.value  ) {
            return true;
        }
        return false;
        
      }

    //   componentWillUpdate(nextProps, nextState){
    //     if(nextProps.currentStep === nextState.state.index){
    //        this.setState({ className : 'playbox-active'});
    //         //ctx.setState({isActive: true});
    //     }
    //     else{
    //         console.log("here2");
    //         this.setState({ className : 'playbox'});
    //     }
    //   }
    // componentWillUpdate(nextProps, nextState) {
    //     // only update chart if the data has changed
    //     if (nextProps.currentStep === nextState.index) {
    //         this.setState({className : 'playbox' });
    //     }
    //     if (nextProps.currentStep !== this.state.index) {
    //         this.setState({className : 'playbox-active' });
    //     }
    //   }

// componentDidUpdate(prevProps, prevState) {
// const ctx = this;
// const {className} = ctx.state;

// ctx.setState({className:ctx.props.cssname});
// }
  render() {
    const ctx = this;
    const setText = ({ target: { value }}) => {
        console.log(ctx.props);
        const c_cell = { cell_value: value, cid: ctx.state.cid, c_key: ctx.state.c_key, cell_index: ctx.state.index, channels: ctx.props.channel };
        store.dispatch(updateCell(c_cell));
        var val = ctx.props.cell.vals;
        var newArr = [];
        for(var i = 0; i < ctx.props.item.step; i++)
        {
            newArr[i] = val[ctx.state.cid][i];
        }
        
        const nc = { vals: newArr, key: ctx.state.c_key };
        console.log(nc);
        ctx.setState({value: value}); 
       fbupdatechannelinscene('Matrices', nc, ctx.state.s_key);
      }
      const tests = ({ target: { value }}) => {
        
        console.log("JASDSA")
      }
    
//     var className = 'playbox' 
//    if(ctx.props.currentStep === ctx.state.index){
//         className += '-active'
//    }
//    else{
//         className = 'playbox' 
//    }

    return <div key={(ctx.state.c_key +'_'+ctx.state.index).toString()}>
      <textarea className={ctx.state.className} type="text"
                value={ctx.state.value}
                onChange={setText}
                onClick={tests}/>
      </div>
  }
}

export default connect(state => state)(Cell);