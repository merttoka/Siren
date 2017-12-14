import React, { Component } from 'react';
import { connect } from 'react-redux';

import {sendGlobals,
        fbcreateMatrix,
        fbdelete,
        fborder,
        fbcreatechannelinscene,
        fbupdatechannelinscene,
        fbupdateglobalsinscene,
        fbupdatelayout,
        fbsavelayout,
        fbdeletecustomlayout,
        updateMatrix,
        globalUpdate,
        globalStore,
        createChannel,
        deleteChannel,
        createCell,
        selectCell,
        pasteCell,
        bootCells,
        seekTimer,
        updateLayout,
        forceUpdateLayout,
        stepChannel,
        consoleSubmit,
        consoleSubmitHistory} from '../actions';

import _ from 'lodash';
import Firebase from 'firebase';
import store from '../store';
import Patterns from './Patterns.react';
import Channels from './Channels.react';
import Settings from './Settings.react';
import PatternHistory from './PatternHistory.react';
import Console from './Console.react';
import Canvas from './Canvas.react';
import DebugConsole from './DebugConsole.react';

import { SubMenu, ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { SelectableGroup } from 'react-selectable';
import Dropdown from 'react-dropdown'
import Draggable from 'react-draggable'

// CSS Imports
import './style/Layout.css';
import './style/Home.css';
import './style/Menu.css';
import './style/Dropdown.css';
import './style/ContextMenu.css';

// Key binding
let keymaster = require('keymaster');

// Input system
let MaskedInput = require('react-maskedinput')

// Layouting
let ReactGridLayout = require('react-grid-layout');
let WidthProvider = ReactGridLayout.WidthProvider;
let ResponsiveReactGridLayout = ReactGridLayout.Responsive;
ResponsiveReactGridLayout = WidthProvider(ResponsiveReactGridLayout);

// React Performance measurement
// import ReactPerfTool from 'react-perf-tool';
// import Perf from 'react-addons-perf';
// import 'react-perf-tool/lib/styles.css';

// Channel Types
const channelOptions = ['Tidal', 'Visual', 'Tidal-MIDI', 'SuperCollider']

class Home extends Component {
  constructor(props) {
    super(props);
    this.state={
      matName: "",
      modelName : "Matrices",
      tidalServerLink: 'localhost:3001',
      click : {flag:0,
              times:0,
              current:null,
              isActive:false},
      activeMatrix: '',
      sceneIndex: '',
      parvalues: '',
      globalCommands: '',
      globalTransformations: '',
      globalChannels: '',
      globalsq:'',
      sqActive:false,
      sqActive_UI:false,
      helperindex:0,
      global_helperindex:0,
      username: '',
      storedPatterns: [],
      selectedCellMain: [],
      storedGlobals: [{transform:'', command: '', selectedChannels: ''}],
      pressed : [],
      c_type: '',
      c_name: '',
      c_step: '',
      c_id: 0,
      copyCell: false,
      c_transition: '',
      csize: 1,
      ukey:1,
      controlledPosition: {x: 0, y: 40},
      soloArray: _.times(8, _.stubFalse),
      muteArray: _.times(8, _.stubFalse),
      manual_layout_trig: true,
      default_layout: [{i: "scenes", x: 0, y: 0, w: 3, h: 20, minW: 3, isVisible: true},
                       {i: 'matrix', x: 3, y: 0, w: 13, h: 13, minW: 5, isVisible: true},
                       {i: 'patterns', x: 16, y: 0, w: 8, h: 20, minW: 3, isVisible: true},
                       {i: 'pattern_history', x: 3, y: 13, w: 13, h: 3, minW: 3, isVisible: true},
                       {i: 'channel_add', x: 3, y: 16, w: 3, h: 4, minW: 2, isVisible: true},
                       {i: 'globals', x: 6, y: 16, w: 5, h: 4, minW: 4, isVisible: false},
                       {i: 'console', x: 11, y: 16, w: 5, h: 4, minW: 2, isVisible: true},
                       {i: 'debugconsole', x: 8, y: 21, w: 7, h: 13, minW: 7, isVisible: true},
                       {i: 'setting', x: 0, y: 21, w: 7, h: 13, minW: 7, isVisible: true},
                       {i: 'canvas', x: 0, y: 21, w: 7, h: 13, minW: 7, isVisible: true}]
    }
  }

  // Component functions
  componentDidMount(props,state){
    const ctx = this;

    keymaster('shift+r', ctx.resetLayout.bind(ctx));
    keymaster('shift+f', ctx.makeMatrixFullscreen.bind(ctx));

    keymaster('shift+1', ctx.onLoadCustomLayout.bind(ctx, 'c_1'));
    keymaster('shift+2', ctx.onLoadCustomLayout.bind(ctx, 'c_2'));
    keymaster('shift+3', ctx.onLoadCustomLayout.bind(ctx, 'c_3'));
    keymaster('shift+4', ctx.onLoadCustomLayout.bind(ctx, 'c_4'));
  }
  componentWillUnmount(props, state) {
    const ctx = this;
    keymaster.unbind('shift+r', ctx.resetLayout.bind(ctx));
    keymaster.unbind('shift+f', ctx.makeMatrixFullscreen.bind(ctx));

    keymaster.unbind('shift+1', ctx.onLoadCustomLayout.bind(ctx, 'c_1'));
    keymaster.unbind('shift+2', ctx.onLoadCustomLayout.bind(ctx, 'c_2'));
    keymaster.unbind('shift+3', ctx.onLoadCustomLayout.bind(ctx, 'c_3'));
    keymaster.unbind('shift+4', ctx.onLoadCustomLayout.bind(ctx, 'c_4'));
  }
  componentWillReceiveProps(nextProps) {
    const ctx = this;
    if(nextProps.user !== undefined &&
       nextProps.user.user !== undefined &&
       nextProps.user.user.name !== undefined &&
       ctx.state.username === '')
    {
      ctx.setState({username: nextProps.user.user.name});
      let obj = Firebase.database().ref("/matrices").push({itemToRemove2: nextProps.user.user.name});
      Firebase.database().ref("/matrices").child(obj.key).remove();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    const ctx = this;

    if(prevProps !== ctx.props){
      ctx.setState({storedPatterns:ctx.props.globalparams.storedPatterns});
    }
  }


  ////////////////////////////// UTILITIES ////////////////////////////
  enableDisableClassname(defaultClass) {
    const ctx = this;
    const { activeMatrix } = ctx.state
    if ( activeMatrix !== undefined && activeMatrix !== '' ) {
      return defaultClass + ' enabledView';
    }
    else {
      return defaultClass + ' disabledView';
    }
  }
  executionCss(event, duration = 500) {
    event.persist();
    event.target.className += ' Executed';
    _.delay(function(){ _.replace(event.target.className, ' Executed', ''); },
            duration);
  }
  ////////////////////////////// UTILITIES ///////////////////////////

  ////////////////////////////// HANDLERS ////////////////////////////
  // Add Channel Inputs
  handleChannelName = event => {
    this.setState({c_name: event.target.value});
  }
  handleChannelType = (option) => {
    this.setState( {c_type: option.label} );
  }
  handleChannelStep = event => {
    this.setState({c_step: event.target.value});
  }
  handleChannelTransition = event => {
    this.setState({c_transition: event.target.value});
  }
  handleSubmitAddChannel = event => {
    const body = event.target.value
    const ctx = this;
    if(event.keyCode === 13 && event.ctrlKey && body){
      ctx.executionCss(event);
      ctx.addChannel();
    }
  }

  // Scenes
  handleSceneNameChange({target: { value }}) {
    const ctx = this;
    ctx.setState({ matName: value , sceneSentinel: false});
  }

  // Selection
  handleSelection (selectedKeys) {
    store.dispatch(selectCell(selectedKeys));
  }
  handleUnselection() {
    //store.dispatch(selectCell([]))
  }

  copyCells(){
    const ctx = this;
    const {selectedCellMain, copyCell} = ctx.state;
    let selectedCells =  ctx.props.cell.selectedCells;
    let channels = ctx.props.channel;

    let temparrb = [];
    for (var a = 0 ; a < selectedCells.length; a++){
      let selch = selectedCells[a].split('_')
      _.each(Object.values(channels), function(ch) {
          if (ch.cid === parseInt(selch[0])) {
            let obj = {
              name: ch.name,
              val: ch.vals[parseInt(selch[1])],
              index:parseInt(selch[1]),
              selIndex:a,
              cid: ch.cid,
              key: ch.key
            }
            temparrb[a] = obj;
          }
        })
      }
      console.log(temparrb, "ON SELECTION");
    ctx.setState({selectedCellMain: temparrb, copyCell: true});
  }

  reOrderCells(){
    const ctx = this;
    const {selectedCellMain,copyCell} = ctx.state;
    let channels = ctx.props.channel;
    let selectedCells =  ctx.props.cell.selectedCells;
    let vals = ctx.props.cell.vals;
    const { activeMatrix, ukey } = ctx.state;
    const sceneKey = _.findKey(ctx.props.matrices, ['matName', activeMatrix]);


    console.log(selectedCells, "TARGETS");
    console.log(vals, "VALS");
    console.log(selectedCellMain, "MAIN");

    let temparr = vals;

    for (var a = 0 ; a < selectedCells.length; a++){
      let selch = selectedCells[a].split('_')
      if(vals[parseInt(selch[0])][parseInt(selch[1])]!== undefined){
        if(selectedCellMain[a]['val'] !== undefined){
            //temparr[parseInt(selch[0])][parseInt(selch[1])] = selectedCellMain[a].val;
            _.each(Object.values(channels), function(ch) {
              if (ch.cid === parseInt(selch[0])) {
                let ncell = {
                  name: ch.name,
                  val: selectedCellMain[a]['val'],
                  index:parseInt(selch[1]),
                  sChan: parseInt(selch[0]),
                  cid: ch.cid,
                  key: ch.key

                }
                console.log("FINAL OBJECT", ncell);
                temparr[ncell['sChan']][ncell['index']] = ncell['val'];
                //const c_cell = { cell_value: ncell.val, cid: ncell.cid, c_key: ncell.key, cell_index: ncell.index};

                const nc = { vals: temparr[ncell['sChan']], key: ncell['key'] };
                fbupdatechannelinscene('Matrices', nc, sceneKey);
                store.dispatch(pasteCell(temparr));
               // this.setState({ ukey: Math.random() });
                //store.dispatch(bootCells(c_cell));


              }
            })

          }


      }


    }

    ctx.setState({copyCell:false})
  }





    // const sceneKey = _.findKey(ctx.props.matrices, ['matName', ctx.props.active]);








  // Global Parameters
  handleGlobalTransformations = event => {
    const body=event.target.value
    const ctx=this;

    let temp = body;
    ctx.setState({globalTransformations:temp});
  }
  handleGlobalCommands = event => {
    const ctx=this;
    ctx.setState({ globalCommands: event.target.value });
  }
  handleGlobalChannels = event => {
    const body=event.target.value
    const ctx=this;

    ctx.setState({globalChannels:body});
  }
  handleUpdatePatterns = event => {
    const ctx = this;
    const {tidalServerLink,globalCommands,
          globalTransformations,storedPatterns} = ctx.state;
    const channels = ctx.props.channel;


    if(event.keyCode === 13 && event.ctrlKey){
      ctx.executionCss(event);
      ctx.updatePatterns(tidalServerLink,storedPatterns,globalTransformations,
                        globalCommands,channels);
    }
  }
  handleGlobalsq = event => {
    const ctx = this;
    if(event.keyCode === 13 && event.altKey){
      ctx.setState({sqActive: false, sqActive_UI:false});
      event.target.className = '';

      ctx.executionCss(event);

      ctx.setState({sqActive_UI:true});
      ctx.updateGlobalSq();
    }
    else if(event.keyCode === 13 && event.shiftKey){
      ctx.setState({sqActive: false, sqActive_UI:false});
      event.target.className = '';
    }
  }
  handleGlobalsqDuration = event => {
    const ctx=this;

    ctx.setState({globalsq: event.target.value});
  }
  ////////////////////////////// HANDLERS ////////////////////////////


  ////////////////////////////// SCENES ////////////////////////////
  addScene() {
    const ctx = this;
    let patterns = [],
        globals = [],
        channels = []
    const checkSceneName = function(newName, items) {
      if (newName.length < 1) {
        return false;
      }

      _.each(Object.values(items), function(m, i) {
        if (m.matName === newName) {
          return false;
        }
      })
      return true;
    }

    const { matName, storedGlobals,storedPatterns } = ctx.state;
    const { uid } =ctx.props.user.user;
    const items =ctx.props[ctx.state.modelName.toLowerCase()];
    // const propstoredGlobals = ctx.props.globalparams.storedGlobals;

    globals = storedGlobals;
    if(uid !== null && uid !== undefined){
      // Get active patterns and channels
      // _.each(items, function(d){
      //   if(d.uid === uid && d.matName === activeMatrix){
      //     patterns = d.patterns;
      //     globals = d.storedGlobals;
      //     channels = d.channels;
      //   }
      // })
      // _.each(channels,function(ch){
      //   ch.scene = matName;
      // })

      if ( checkSceneName(matName, items) ) {
        let snd = Object.values(items).length;
        store.dispatch(globalStore(globals, storedPatterns));
        console.log(matName, patterns, channels, uid, storedGlobals);
        fbcreateMatrix(ctx.state.modelName, { matName, patterns, channels, sceneIndex: snd, uid, storedGlobals });
        ctx.setState({sceneIndex: snd, storedGlobals: globals});
        ctx.setState({activeMatrix: matName});
      }
      else {
        alert("Scene title should be unique and longer than 1 character");
      }
    }
  }

  duplicateScene() {
    const ctx = this;
    let patterns = [],
        globals = [],
        channels = []
    const checkSceneName = function(newName, items) {
      if (newName.length < 1) {
        return false;
      }

      _.each(Object.values(items), function(m, i) {
        if (m.matName === newName) {
          return false;
        }
      })
      return true;
    }

    const { matName, storedGlobals,storedPatterns,activeMatrix } = ctx.state;
    const { uid } =ctx.props.user.user;
    const items =ctx.props[ctx.state.modelName.toLowerCase()];
    // const propstoredGlobals = ctx.props.globalparams.storedGlobals;

    globals = storedGlobals;
    if(uid !== null && uid !== undefined){
    //  Get active patterns and channels
      _.each(items, function(d){
        if(d.uid === uid && d.matName === activeMatrix){
          patterns = d.patterns;
          globals = d.storedGlobals;
          channels = d.channels;
        }
      })

      let nc;
      _.each(channels,function(ch){
        nc = { scene: matName,
          cid: ch.cid,
          type: ch.type,
          name: ch.name,
          transition: ch.transition,
          step: ch.step,
          vals: ch.vals
        };
      })

      if ( checkSceneName(matName, items) ) {
        let snd = Object.values(items).length;


        let skey = fbcreateMatrix(ctx.state.modelName, { matName, patterns, channels, sceneIndex: snd, uid, storedGlobals });
        store.dispatch(globalStore(globals, storedPatterns));

        let obj = fbcreatechannelinscene('Matrices', nc, skey)
        nc['key'] = obj;
        //store.dispatch(createChannel(nc));

        ctx.setState({sceneIndex: snd, storedGlobals: globals});
        ctx.setState({activeMatrix: matName});
      }
      else {
        alert("Scene title should be unique and longer than 1 character");
      }
    }
  }

  renderScene(item, dbKey, i) {
    const ctx = this;
    const { activeMatrix } = ctx.state;
    let sglobals = [];
    _.forEach(item.storedGlobals, function(d, i){
      sglobals.push(d);
    });

    const updateMatrix = () => {
      let gpressed = [];
      _.forEach(item.storedGlobals, function(d, i){
        gpressed[i] = false;
      });

      if(sglobals === undefined){
        sglobals = [];
      }
      ctx.setState({ activeMatrix: item.matName,
        matName: item.matName, sceneSentinel: true,  storedGlobals: sglobals,
        globalTransformations: '', globalCommands:'', globalChannels: '',
        pressed:gpressed, sceneIndex:item.key, muteArray: _.times(item.channels.length, _.stubFalse),soloArray: _.times(item.channels.length, _.stubFalse)});
        ctx.updateMatrix(item);

        store.dispatch(globalStore(sglobals));
        store.dispatch(globalUpdate('', '', ''));
        _.forEach(item.channels, function(ch, i){
          const c_cell = { propedcell: ch.vals, cid: ch.cid ,c_key: ch.key, cstep: ch.step};
          store.dispatch(bootCells(c_cell));
          store.dispatch(stepChannel(ch));
        });
      }

      const handleDelete = ({ target: { value }}) => {
        if (confirm('Are you sure you want to delete this?')) {
          const payload = { key: dbKey };
          fbdelete(ctx.state.modelName, payload);

          // re-order all items after deleting successfull
          Firebase.database().ref("/matrices").once('child_removed').then(function(oldChildSnapshot) {
            const items = ctx.props[ctx.state.modelName.toLowerCase()];
            ctx.setState({sceneIndex: (Object.values(items).length)});
            _.forEach(Object.values(items), function(d, i){
              fborder(ctx.state.modelName, {matName: d.matName, patterns: d.patterns, channels: d.channels, sceneIndex: i}, d.key);
            });
          }, function(error) {
            console.error(error);
          });

          ctx.setState({activeMatrix: ''})
          _.each(item.channels, function( ch, key ) {
            store.dispatch(deleteChannel(key));
          })
        }
      }

      const className = activeMatrix === item.matName ? "SceneItem-active" : "SceneItem";
      return item.key && (
        <div key={item.key} className={className+ " draggableCancel"}>
          <div>
            <button onClick={handleDelete}>{'X'}</button>
            <button onClick={updateMatrix}>{item.matName}</button>
          </div>
        </div>
      )
    }
  renderScenes(items) {
      const ctx = this;
      return _.map(items, ctx.renderScene.bind(ctx));
    }
  ////////////////////////////// SCENES ////////////////////////////


  ////////////////////////////// MATRIX ////////////////////////////
  addChannel() {
    const ctx = this
    const { activeMatrix, c_type, c_name, c_step, c_transition } = ctx.state;
    let flag = false;

    _.each(Object.values(ctx.props["matrices"]), function(d){
      if(d.matName === activeMatrix) {
        _.each(d.channels, function(c) {
          if(c.name === c_name) {
            alert('"' + c_name + '" already exists in "' + d.matName + '"');
            flag = true;
          }
        })

        if (flag === false){
          if (c_name === undefined || c_name === '') {
            alert('Invalid name for channel');
          }
          else if (c_step === undefined || c_step === '' || _.toInteger(c_step) <= 0) {
            alert('Invalid step, use numbers only');
          }
          else if (c_type === '' || c_type === undefined ) {
            alert('Invalid type');
          }
          else{
            let _index=0;
            _.each(d.channels, function(chan,i){
              _index++;
            })
            ctx.setState({ c_id : _index });

            let values = {}
            for(let i = 0; i < c_step; i++){
              values[i] = '';
            }

            let nc = { scene: activeMatrix,
              cid: _index,
              type: c_type,
              name: c_name,
              transition: c_transition,
              step: c_step,
              vals: values
            };

            let obj = fbcreatechannelinscene('Matrices', nc, d.key);
            nc['key'] = obj;
            store.dispatch(createChannel(nc));
            const newCell = {cstep: c_step, cid: _index };
            store.dispatch(createCell(newCell));
            ctx.setState({ activeMatrix: d.matName, matName: d.matName });
          }
        }
        else {
          console.log('"' + c_name + '" already exists in "' + d.matName + '"');
        }
      }
    })
  }
  clearMatrix(){
    const ctx = this;
    let { channel, matrices, user} = ctx.props;
    const { activeMatrix } = ctx.state;

    // Get scene key
    let s_key;
    _.each(matrices, function(scene, i){
      if(scene.uid === user.user.uid && scene.matName === activeMatrix)
      {
        s_key = scene.key;
      }
    })
    _.each(channel, function(ch) {
      _.each(ch.vals, function(d, i){
        ch.vals[i] = '';
      })
      ch.transition = ''
      fbupdatechannelinscene('Matrices', ch, s_key);
    })
  }
  updateMatrix(item) {
    store.dispatch(updateMatrix(item));
  }

  onLayoutChangeChannel(items, layout, x) {
    const ctx = this;
    _.each(items, function(j) {
      if(j.key === x.i){
        j.step = x.h - 1;
        let newVals = [];
        for(let a = 0 ; a < j.step; a++){
          if(j.vals[a]!==undefined)  newVals[a] = j.vals[a];
          else                       newVals[a] = ''
        }
        j.vals = newVals;
        const sceneKey = _.findKey(ctx.props.matrices, ['matName', j.scene]);
        fbupdatechannelinscene('Matrices', j, sceneKey);
        store.dispatch(stepChannel(j));
      }
    });
  }

  renderChannel(scene_key, channelLen, item){
    const ctx = this;
    const { activeMatrix,copyCell } = ctx.state;

    return <div key={item.key} data-grid={{i: item.key, x:item.cid*3, y:0, w:3, h: _.toInteger(item.step)+1}}>
      <Channels key={item.key}
        active={activeMatrix}
        scene_key={scene_key}
        item={item}
        paste = {copyCell}
        solo={{isSolo: _.indexOf(ctx.state.soloArray, true) !== -1, soloValue: ctx.state.soloArray[item.cid]}}
        mute={{isMute: _.indexOf(ctx.state.muteArray, true) !== -1, muteValue: ctx.state.muteArray[item.cid]}}
        soloOnClick={function(cid) {
          let temp = _.times(channelLen, _.stubFalse)
          temp[cid] = !ctx.state.soloArray[cid];
          ctx.setState({soloArray: temp});
        }}
        muteOnClick={function(cid) {
          let temp = ctx.state.muteArray;
          temp[cid] = !ctx.state.muteArray[cid];
          ctx.setState({muteArray: temp});
        }}/>
      </div>
    }
  renderPlayer() {
      const ctx = this;
      const { activeMatrix } = ctx.state;
      const sceneKey = _.findKey(ctx.props.matrices, ['matName', activeMatrix]);
      const scene = _.find(ctx.props.matrices, ['key', sceneKey]);
      const onClick = event => {
        const ctx = this;
        // let posX = event.nativeEvent.offsetX,
        let posY = event.nativeEvent.offsetY;

        ctx.setState({controlledPosition: {x: 0, y: _.toInteger(posY/40)*40}});

        store.dispatch(seekTimer(_.toInteger(posY/40)));
      };
      const onDragStop = (event, position) => {
        const ctx = this;
        const {y} = position;
        ctx.setState({controlledPosition: {x: 0 , y: _.toInteger(y/40)*40}});

        store.dispatch(seekTimer(_.toInteger(y/40)));
      }

      let items;
      if (!_.isUndefined(scene)) {
        items = scene.channels;
      }
      const items_length = _.isUndefined(items) ? 0 : items.length;

      let max_step = 0;
      _.each(ctx.props.channel, function(ch,k){
        if(ch.scene === activeMatrix)
          max_step = _.max([ch.step, max_step]);
      });

      return (<div className={"AllChannels draggableCancel"}>
      {activeMatrix && <div className={'MatrixScroll'} style={{height: (max_step)*40}} onDoubleClick={onClick}>
        <Draggable position={ctx.state.controlledPosition} axis="y" bounds="parent" grid={[40, 40]} onStop={onDragStop}>
          <div className="Timeline">
          </div>
        </Draggable>
      </div>}
      <ReactGridLayout
        className={"layout_matrix"}
        cols={36}
        width={2000}
        rowHeight={40}
        margin={[2,0]}
        draggableCancel={'.draggableCancel'}
        verticalCompact={true}
        onResizeStart={ctx.onLayoutChangeChannel.bind(ctx, items)}
        >
        {_.map(items, ctx.renderChannel.bind(ctx, sceneKey, items_length))}
      </ReactGridLayout>
    </div>)
  }
  ////////////////////////////// MATRIX ////////////////////////////


  ////////////////////////////// LAYOUTS ////////////////////////////
  saveLayouttoCustom = (id, e, data) => {
    fbsavelayout("Accounts", this.props.layout.windows, this.props.user.user.uid, data.item);
  }

  onAddlayoutItem(specifier){
    let layouts = this.props.layout.windows;
    store.dispatch(forceUpdateLayout(_.concat(layouts, _.find(this.state.default_layout, ['i', specifier])), layouts.length));
  }
  onRemovelayoutItem(specifier){
    let layouts = this.props.layout.windows;
    if(layouts !== undefined) {
      _.forEach(layouts, function(item, i) {
        if (item.i === specifier) {
          layouts[i].isVisible = false;
        }
      });
      fbupdatelayout("Accounts", layouts, this.props.user.user.uid);
      store.dispatch(forceUpdateLayout(layouts, layouts.length));
    }
  }
  onLayoutChange(layout) {
    const ctx = this;
    let temp_layouts = []
    _.forEach(layout, function(l) {
      const propItem = _.find(ctx.props.layout.windows, ['i', l.i]);
      l.isVisible = propItem.isVisible;
      if(l.isVisible === undefined)
        l.isVisible = true;

      if (ctx.state.manual_layout_trig){
        l.x = propItem.x;
        l.y = propItem.y;
        l.w = propItem.w;
        l.h = propItem.h;
        l.minW = propItem.minW;
      }
      temp_layouts = _.concat(temp_layouts, _.omitBy(l, _.isUndefined));
    })

    ctx.setState({manual_layout_trig: false});
    fbupdatelayout("Accounts", temp_layouts, ctx.props.user.user.uid);
    store.dispatch(updateLayout(temp_layouts));
  }
  onLoadCustomLayout = (layout_id, event) => {
    const layout = Object.values(this.props.user.user.layouts.customs[[layout_id]]);
    if (event.altKey) {
      fbdeletecustomlayout("Accounts", this.props.user.user.uid, layout_id);
    }
    else {
      this.setState({manual_layout_trig: true});
      if (layout !== undefined) {
        store.dispatch(forceUpdateLayout(layout, this.props.layout.windows.length));
      }
    }
  }

  makeMatrixFullscreen() {
    this.setState({manual_layout_trig: true});
    let layouts = this.props.layout.windows
    if(layouts !== undefined) {
      let found = false;
      _.forEach(layouts, function(item, i) {
        if (item.i === 'matrix') {
          layouts[i].y = 0;
          layouts[i].x = 0;
          layouts[i].w = 24;
          layouts[i].h = 20;
          layouts[i].isVisible = true;
          found = true;
        }
        else {
          layouts[i].isVisible = false;
        }
      });

      if (!found) {
        layouts = _.concat(layouts, {i: 'matrix', x: 0, y: 0, w: 24, h: 20, minW: 5, isVisible: true});
      }

      store.dispatch(forceUpdateLayout(layouts, layouts.length));
    }
  }
  resetLayout() {
    this.setState({manual_layout_trig: true});
    store.dispatch(forceUpdateLayout(this.state.default_layout, this.props.layout.windows.length));
  }

  renderLayouts(layoutItem, k) {
    const ctx = this;

    const { activeMatrix, storedPatterns,
            pressed, storedGlobals, globalTransformations, globalCommands,
            globalChannels,c_type, c_name, c_step,
            c_transition,globalsq } = ctx.state

    const layoutVisibility = (ctx.props.user.user.email ? ' enabledView' : ' disabledView')

    const items = ctx.props[ctx.state.modelName.toLowerCase()];
    const maskedInputDurations=  _.repeat("1.1  ", 4);
    const maskedInputPatterns = "1 | " + _.repeat("1  ", 10);
    const getGridParameters = (specifier) => {
      const itemToCopy = _.find(ctx.props.layout.windows, ['i', specifier]);
      let newGridParameters = {x: 0, y:100, h:1, w:1, minW:0, isVisible: false};
      if(itemToCopy){
        newGridParameters.x = itemToCopy.x;
        newGridParameters.y = itemToCopy.y;
        newGridParameters.w = itemToCopy.w;
        newGridParameters.h = itemToCopy.h;
        newGridParameters.minW = itemToCopy.minW;
        newGridParameters.isVisible = itemToCopy.isVisible;
      }
      return newGridParameters;
    }

    if (layoutItem.i === 'matrix') {
      return layoutItem.isVisible && (<div key={'matrix'} className={layoutVisibility} data-grid={getGridParameters('matrix')} >
        <div className={"PanelHeader"}> ■ {'"'+activeMatrix+'"'}
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "matrix")}>X</span>
        </div>
        <SelectableGroup className={'PanelAdjuster'}
          onSelection={ctx.handleSelection.bind(ctx)}
          onNonItemClick={ctx.handleUnselection.bind(ctx)}
          tolerance={5}
          enabled={false}>
          {ctx.renderPlayer()}
        </SelectableGroup>
      </div>);
    }
    else if (layoutItem.i === 'canvas') {
      return layoutItem.isVisible && (<div key={'canvas'} className={layoutVisibility} id={'canvasLayout'} data-grid={getGridParameters('canvas')} >
        <div className={"PanelHeader"}> ■ Canvas
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "canvas")}>X</span>
        </div>

        <Canvas activeMatrix={ctx.state.activeMatrix} serverLink={ctx.state.tidalServerLink}/>
      </div>);
    }
    else if (layoutItem.i === 'scenes') {
      return layoutItem.isVisible && (<div key={"scenes"} className={layoutVisibility} data-grid={getGridParameters('scenes')}>
        <div>
          <div className={"PanelHeader"}> ■ All Scenes
            <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "scenes")}>X</span>
          </div>
          <div className={'Scenes PanelAdjuster'}>
            <input className={'Input draggableCancel'} placeholder={'New Scene Name'} value={ctx.state.matName} onChange={ctx.handleSceneNameChange.bind(ctx)}/>
            <div style={{display: 'inline-flex', justifyContent: 'space-between'}}>
              { <button className={'Button draggableCancel'} onClick={ctx.addScene.bind(ctx)}>Add</button>}
              {<button className={'Button draggableCancel'} onClick={ctx.duplicateScene.bind(ctx)}>Duplicate</button>}
              <button className={'Button draggableCancel'} onClick={ctx.clearMatrix.bind(ctx)}>Clear Grid</button>
            </div>
            <div className={'AllScenes'}>
              <div>
                {ctx.props.user.user.name && ctx.renderScenes(items)}
                {!ctx.props.user.user.name && <div style={{ color: 'rgba(255,255,102,0.75)'}}>Please login to see saved scenes.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>);
    }
    else if (layoutItem.i === 'patterns') {
      return layoutItem.isVisible && (<div key={'patterns'} className={layoutVisibility} data-grid={getGridParameters('patterns')}>
        <div className={"PanelHeader"}> ■ Patterns in <span style={{fontWeight: 'bold'}}>{'"'+activeMatrix+'"'}</span>
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "patterns")}>X</span>
        </div>
        <div className={ctx.enableDisableClassname("AllPatterns PanelAdjuster")} >
          <Patterns active={activeMatrix}/>
        </div>
      </div>);
    }
    else if (layoutItem.i === 'pattern_history') {
      return layoutItem.isVisible && (<div key={'pattern_history'} className={layoutVisibility} data-grid={getGridParameters('pattern_history')}>
        <div className={"PanelHeader"}> ■ Pattern History
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "pattern_history")}>X</span>
        </div>
        <div className={"PanelAdjuster"}>
          <PatternHistory patterns={storedPatterns}/>
        </div>
      </div>);
    }
    else if (layoutItem.i === 'channel_add') {
      return layoutItem.isVisible && (<div key={'channel_add'} className={layoutVisibility} data-grid={getGridParameters('channel_add')}>
        <div className={"PanelHeader"}> ■ Add Channel
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "channel_add")}>X</span>
        </div>
        <div className={ctx.enableDisableClassname('AddChannel PanelAdjuster')}>
          <div>
            <Dropdown className={"draggableCancel"} options={channelOptions} onChange={ctx.handleChannelType.bind(ctx)} value={c_type} placeholder="Type" />
            <input className={"Input draggableCancel"} onChange={ctx.handleChannelName.bind(ctx)} onKeyUp={ctx.handleSubmitAddChannel.bind(ctx)} value={c_name} placeholder="Name " />
            <input className={"Input draggableCancel"} onChange={ctx.handleChannelStep.bind(ctx)} onKeyUp={ctx.handleSubmitAddChannel.bind(ctx)} value={c_step} placeholder="Step "/>
            <input className={"Input draggableCancel"} onChange={ctx.handleChannelTransition.bind(ctx)} onKeyUp={ctx.handleSubmitAddChannel.bind(ctx)} value={c_transition} placeholder="Transition (optional)"/>
          </div>
          <button className={"Button draggableCancel"} onClick={ctx.addChannel.bind(ctx)}>Add</button>
        </div>
      </div>);
    }
    else if (layoutItem.i === 'globals') {
      return layoutItem.isVisible && (<div key={'globals'} className={layoutVisibility} data-grid={getGridParameters('globals')}>
        <div className={"PanelHeader"}> ■ Global Parameters
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "globals")}>X</span>
        </div>
        <div className={ctx.enableDisableClassname("GlobalParams PanelAdjuster")}>
          <p>Sequencer: ⌥ + Enter, ⇧ + Enter</p>
          <div className={'GlobalParamsInputs'}>
            <div className={'GlobalSequencer'}>
              <MaskedInput mask={maskedInputDurations}
                className={"Input draggableCancel"}
                key={'globalsq'}
                onKeyUp={ctx.handleGlobalsq.bind(ctx)}
                onChange={ctx.handleGlobalsqDuration.bind(ctx)}
                value={globalsq}
                placeholder={"Sequencer ( "+maskedInputDurations+")"}/>
            </div>
          </div>

          <p>Execute: ⌃ + Enter</p>
          <div className={"GlobalParamsInputsII"}>
            <div className={"GlobalParamsInputs"}>
              <div>
                <MaskedInput mask={maskedInputPatterns}
                  className={"Input draggableCancel"}
                  key={'globalchannel'}
                  onKeyUp={ctx.handleUpdatePatterns.bind(ctx)}
                  onChange={ctx.handleGlobalChannels.bind(ctx)}
                  value={globalChannels}
                  placeholder={"Channels ( "+maskedInputPatterns+")"}/>
                <input className={"Input draggableCancel"} key={'globaltransform'} onKeyUp={ctx.handleUpdatePatterns.bind(ctx)} onChange={ctx.handleGlobalTransformations.bind(ctx)} value={globalTransformations} placeholder={"Transformation"}/>
                <input className={"Input draggableCancel"} key={'globalcommand'} onKeyUp={ctx.handleUpdatePatterns.bind(ctx)} onChange={ctx.handleGlobalCommands.bind(ctx)} value={globalCommands} placeholder={"Commands"} />
              </div>
              <button className={"Button draggableCancel"} onClick={ctx.record.bind(ctx)}>Rec</button>
            </div>
          </div>
          <p>{"(Select) click,  (save) ⇧ + click, (delete) ⌥ + click"}</p>
          <div className={'StoredGlobalParams'}>
            {_.map(storedGlobals, (c, i) => {
              return <button key={i} id={i} className={"Button " + pressed[i] + " draggableCancel"} onClick={ctx.clicked.bind(ctx)}>{i}</button>
            })}
          </div>
        </div>
      </div>);
    }
    else if (layoutItem.i === 'console') {
      return layoutItem.isVisible && (<div key={'console'} className={layoutVisibility} data-grid={getGridParameters('console')}>
        <div className={"PanelHeader"}> ■ Console
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "console")}>X</span>
        </div>
        <div className={'Console PanelAdjuster'}>
          <Console tidalServerLink={ctx.state.tidalServerLink}/>
        </div>
      </div>);
    }
    else if (layoutItem.i === 'debugconsole') {
      return layoutItem.isVisible && (<div key={'debugconsole'} className={layoutVisibility} data-grid={getGridParameters('debugconsole')}>
        <div className={"PanelHeader"}> ■ Debug Console
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "debugconsole")}>X</span>
        </div>
        <div className={'DebugConsole PanelAdjuster'}>
          <DebugConsole />
        </div>
      </div>);
    }
    else if (layoutItem.i === 'setting') {
      return layoutItem.isVisible && (<div key={'setting'} className={layoutVisibility} data-grid={getGridParameters('setting')}>
        <div className={"PanelHeader"}> ■ Config Settings
          <span className={"PanelClose draggableCancel"} onClick={ctx.onRemovelayoutItem.bind(ctx, "setting")}>X</span>
        </div>
        <Settings className={'PanelAdjuster'} uid={ctx.props.user.user.uid}/>
      </div>);
    }
    else {
      return layoutItem.isVisible && (<div key={layoutItem.i} data-grid={getGridParameters(layoutItem.i)}>
        </div>)
    }
  }
  ////////////////////////////// LAYOUTS ////////////////////////////


  ////////////////////////////// GLOBALS ////////////////////////////


  consoleSubmit(tidalServerLink, value){
    store.dispatch(consoleSubmit(tidalServerLink, value));
  }
  consoleSubmitHistory(tidalServerLink, value, storedPatterns, channels){
    store.dispatch(consoleSubmitHistory(tidalServerLink, value, storedPatterns,channels));
  }

  clicked = event => {
    const ctx=this;
    const {pressed, storedGlobals, globalChannels,
          globalCommands,globalTransformations,sceneIndex,storedPatterns} =ctx.state;
    const globalparams = ctx.props.globalparams;
    const scenes = ctx.props.matrices;

    let pr = pressed;
    for(let sp = 0; sp < pr.length; sp++){
      if(parseInt(event.target.id, 10) === sp){
        pr[sp] = true;
      }
      else {
        pr[sp] = false;
      }
    }
    ctx.setState({ pressed: pr });

    let matkey;
    _.each(scenes , function (sc, i) {
      if(sc.key === sceneIndex){
        ctx.setState({storedGlobals: sc.storedGlobals})
        matkey = sc.key;
      }
    })

    let ttm;
    if (event.altKey) {
      // Delete content of the item
      ttm = storedGlobals;
      ttm[event.target.id] = {transform:'', command:'', selectedChannels:''};

      fbupdateglobalsinscene('Matrices', ttm, matkey);
      store.dispatch(globalUpdate('', '', ''));
      ctx.setState({globalTransformations: '', globalCommands: '', globalChannels: ''})
      ctx.setState({storedGlobals: ttm});
    }
    else if (event.shiftKey) {
      ttm = storedGlobals;
      ttm[event.target.id] = {transform: globalTransformations,
                              command: globalCommands,
                              selectedChannels: globalChannels};
      fbupdateglobalsinscene('Matrices', ttm, matkey);
      store.dispatch(globalStore(ttm, storedPatterns));
      store.dispatch(globalUpdate(globalTransformations, globalCommands, globalChannels));
      ctx.setState({storedGlobals: ttm});
    }
    else {
      ttm = storedGlobals[event.target.id];
      store.dispatch(globalStore(globalparams.storedGlobals,storedPatterns));
      store.dispatch(globalUpdate(ttm.command, ttm.transform, ttm.selectedChannels));
      ctx.setState({globalTransformations:ttm.transform, globalCommands:ttm.command,
                    globalChannels: ttm.selectedChannels, storedGlobals: storedGlobals})
    }
  }
  record = event => {
    const ctx=this;
    const {pressed,globalChannels,globalTransformations,globalCommands,storedGlobals,
          sceneIndex, storedPatterns}=ctx.state;

    let ns;
    let temp = {transform: globalTransformations,
                command: globalCommands,
                selectedChannels:globalChannels};

    if (storedGlobals === undefined){
      ns = [];
      ns[0]  = {transform: '',
                command: '',
                selectedChannels:''};

      ns.push(temp);
    }
    else {
      ns = storedGlobals;
      ns[0]  = {transform: '',
                command: '',
                selectedChannels:''};
      ns.push(temp);
    }

    let pr = pressed;
    for(let pk = 0; pk <= storedGlobals.lenght; pk++){
      if(storedGlobals.lenght-1 === pk){
        pr[pk] = true;
      }
      else {
        pr[pk] = false;
      }
    }

    fbupdateglobalsinscene('Matrices', ns, sceneIndex);
    store.dispatch(globalStore(ns, storedPatterns));
    ctx.setState({storedGlobals: ns, pressed: pr})
  }
  updateGlobalSq(){
    const ctx = this;
    const {globalsq,storedGlobals,sqActive_UI,
           sqActive,helperindex,global_helperindex} = ctx.state;

    // let gbchan = globalChannels.split(" ");
    let gbdur = globalsq.split(" ");

    if(gbdur.length >= helperindex)
      ctx.setState({sqActive:false});

    if(Object.values(storedGlobals).length >= helperindex)
      ctx.setState({global_helperindex:0});

    let compileDuration, selGlobalPair;
    if(sqActive_UI === true){
      if(sqActive === false){
        ctx.setState({helperindex:0});
        compileDuration = gbdur[helperindex] * 1000;
        selGlobalPair = global_helperindex ;
        setTimeout(() => ctx.sequenceGlobals(selGlobalPair),compileDuration);
        ctx.setState({sqActive :true});
      }
      else if (sqActive === true){
        let k = helperindex+1;
        let gk = global_helperindex+1;
        ctx.setState({helperindex:k, global_helperindex:gk});
        compileDuration = gbdur[helperindex] * 1000;
        selGlobalPair = _.random(Object.values(storedGlobals).length-1);
        // if(gk < Object.values(storedGlobals).length){
        //   selGlobalPair = gk;
        // }
        // setTimeout(() => ctx.sequenceGlobals(k),compileDuration);
        setTimeout(() => ctx.sequenceGlobals(selGlobalPair),compileDuration);
      }
    }
  }
  updatePatterns(tidalServerLink,storedPatterns,globalTransformations,
                  globalCommands,channels) {

    const ctx = this;
    const { globalChannels} = ctx.state;
    let tempAr = [] ;
    let gbchan = globalChannels.split(" ");

    if (gbchan === undefined ||gbchan[0] === undefined || gbchan[0] === ' ' || gbchan[0] ==='0' ){
      for (let i = 0; i < storedPatterns.length; i++) {
          if(storedPatterns[i] !== undefined && storedPatterns[i] !== ''){
            let patternbody = storedPatterns[i].substring(_.indexOf(storedPatterns[i], "$")+1);
            let patname = storedPatterns[i].substring(0,_.indexOf(storedPatterns[i], "$")+1 );
            tempAr[i] = patname + globalTransformations + patternbody + globalCommands;
            ctx.consoleSubmit(tidalServerLink, tempAr[i]);
          }
        }
      }
    else {
    _.forEach( gbchan, function(chan, j){
        let i = parseInt(chan, 10) - 1;
        if(storedPatterns[i] !== undefined && storedPatterns[i] !== ''){
          let patternbody = storedPatterns[i].substring(_.indexOf(storedPatterns[i], "$")+1);
          let patname = storedPatterns[i].substring(0,_.indexOf(storedPatterns[i], "$")+1 );
          tempAr[i] = patname + globalTransformations + patternbody + globalCommands;
          ctx.consoleSubmit(tidalServerLink, tempAr[i]);
        }
      });
    }
  }
  sequenceGlobals = (selected_global_index) => {
    const ctx = this;
    const {tidalServerLink, storedGlobals, pressed,storedPatterns} = ctx.state;

    for (let i = 0; i < storedPatterns.length; i++) {
    if(storedPatterns[i] !== undefined && storedPatterns[i] !== ''){
      let pr = pressed;
      for(let sp = 0; sp < pr.length; sp++){
        if(selected_global_index === sp){
          pr[sp] = true;
        }
        else {
          pr[sp] = false;
        }
      }

      let patternbody = storedPatterns[i].substring(_.indexOf(storedPatterns[i], "$")+1);
      let patname = storedPatterns[i].substring(0,_.indexOf(storedPatterns[i], "$")+1 );
      let tr,cm,slc;
      if (storedGlobals[selected_global_index].transform === undefined)
        tr = '';
      else
        tr = storedGlobals[selected_global_index].transform;

      if (storedGlobals[selected_global_index].command === undefined)
        cm = '';
      else
        cm = storedGlobals[selected_global_index].command;

      if (storedGlobals[selected_global_index].selectedChannels=== undefined)
        slc = '';
      else
        slc = storedGlobals[selected_global_index].selectedChannels;


      let pattern = patname + tr + patternbody +cm;
      ctx.consoleSubmit(tidalServerLink, pattern);
      ctx.setState({globalCommands: cm,
                    globalTransformations: tr,
                    globalChannels:slc ,
                    pressed: pr});

      }
    }
   ctx.updateGlobalSq();
  }
  sendGlobals(tidalServerLink,storedPatterns,storedGlobals, vals,channels){

    store.dispatch(sendGlobals(tidalServerLink,storedPatterns,storedGlobals,
                              vals,channels));
  }
  ////////////////////////////// GLOBALS ////////////////////////////

  // Main render method
  render() {
    const ctx=this;
    const copyCell = ctx.state;
    // console.log('Homereact render');
    // console.log(ctx.props.sccommand.commands);

    // Layout height params for fullscreen
    let vertical_n = 20,
        h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 62, // the menubar height
        margin = 7,
        row_height = (h-(vertical_n+1)*margin)/vertical_n;

    let layouts = _.filter(ctx.props.layout.windows, ['isVisible', true, 'i', 'dummy']);
    return <div>
    <ContextMenuTrigger id="global_context" holdToDisplay={-1}>
      <div className={"Home cont"}>
        <ResponsiveReactGridLayout
            className={"layout"}
            layout={layouts}
            breakpoints={{lg: 1200, md: 996, sm: 768, xs: 360}}
            cols={{lg: 24, md: 20, sm: 12, xs: 8}}
            draggableCancel={'.draggableCancel'}
            margin={[margin, margin]}
            rowHeight={row_height}
            onLayoutChange={ctx.onLayoutChange.bind(ctx)}
            verticalCompact={true}
          >
          {_.map(layouts, ctx.renderLayouts.bind(ctx))}
        </ResponsiveReactGridLayout>
      </div>
    </ContextMenuTrigger>

    <ContextMenu id="global_context" className={"draggableCancel"}>
      <MenuItem data={{value: 1}} onClick = {ctx.copyCells.bind(ctx)}>
        Copy Steps
      </MenuItem>
      <MenuItem data={{value: 2}} onClick = {ctx.reOrderCells.bind(ctx)}>
        Paste Steps
    </MenuItem>
      <MenuItem divider />
      <SubMenu title={'Modules'}>
        {_.map(ctx.state.default_layout, function(layoutItem, key) {
          if(_.find(layouts, { 'i': layoutItem.i, 'isVisible': true }) )
            return <MenuItem key={key} onClick={ctx.onRemovelayoutItem.bind(ctx, layoutItem.i)} data={{ item: layoutItem.i }}>{layoutItem.i}<span style={{float: 'right'}}>√</span></MenuItem>;
          else
            return <MenuItem key={key} onClick={ctx.onAddlayoutItem.bind(ctx, layoutItem.i)} data={{ item: layoutItem.i }}>{layoutItem.i}</MenuItem>;
        })}
      </SubMenu>
      <SubMenu title={'Layouts'}>
        <MenuItem onClick={ctx.resetLayout.bind(ctx)} data={{ item: 'reset' }}>Reset<span style={{float: 'right'}}>⇧ + R</span></MenuItem>
        <MenuItem onClick={ctx.makeMatrixFullscreen.bind(ctx)} data={{ item: 'reset' }}>Max. Grid<span style={{float: 'right'}}>⇧ + F</span></MenuItem>
        <MenuItem divider />
        <MenuItem disabled> alt-click to remove </MenuItem>
        {_.map({a:1, b:2, c:3, d:4}, function(i, key) {
          if(ctx.props.user.user.layouts !== undefined && ctx.props.user.user.layouts.customs !== undefined) {
            if(ctx.props.user.user.layouts.customs[["c_"+i]] !== undefined)
              return <MenuItem key={key} onClick={ctx.onLoadCustomLayout.bind(ctx, "c_"+i)} data={{ item: 'c_'+i }}>Cust. {i}<span style={{float: 'right'}}>⇧ + {i}</span></MenuItem>
            else
              return <MenuItem key={key} onClick={ctx.saveLayouttoCustom.bind(ctx, "c_"+i)} data={{ item: 'c_'+i }}>click to save here</MenuItem>
          }
          else
            return <MenuItem key={key} onClick={ctx.saveLayouttoCustom.bind(ctx, "c_"+i)} data={{ item: 'c_'+i }}>click to save here</MenuItem>
        })}
      </SubMenu>
    </ContextMenu>

    </div>
  }
}

export default connect(state => state)(Home);
