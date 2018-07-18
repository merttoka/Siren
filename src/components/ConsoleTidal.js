import React from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2'
import _ from 'lodash'
import { inject, observer } from 'mobx-react';

import { save } from '../keyFunctions.js';

import 'codemirror/lib/codemirror.css';
import '../utils/lexers/haskell.js';
import '../utils/lexers/haskell.css';

// codemirror addons
import 'codemirror/addon/selection/active-line.js';
import 'codemirror/addon/edit/matchbrackets.js';


@inject('consoleStore')
@observer
export default class ConsoleTidal extends React.Component {

  // GHC
  handleGHCSubmit = (editor, event) => {
    const body = event.target.value;
    
    let expr = "";
    if (event.keyCode === 13 && event.ctrlKey) {
      
      if (editor.somethingSelected()) {
        expr = body;
      }
      else {
        const line = editor.getCursor().line;
        const ch = editor.getCursor().ch;
  
        if (editor.getLine(line) !== "") {
          let startLine = line;
          let endLine = line;
    
          // determine line numbers of the code block
          while (_.trim(editor.getLine(startLine)) !== '') { startLine -= 1; }
          while (_.trim(editor.getLine(endLine)) !== '') { endLine += 1; }
    
          // the text
          expr = editor.getRange({ line: startLine, ch: 0 }, { line: endLine, ch: 0 });

          // coloring the background
          let handle = editor.markText(
            { line: startLine, ch: 0 },
            { line: endLine, ch: 0 },
            { className: 'CodeMirror-execution' });
          _.delay(() => { handle.clear(); }, 500);
        }
      }

    }
    else if (event.keyCode === 13 && event.altKey) {
      
      const l = editor.getCursor().line;
      
      expr = editor.getRange({ line: l, ch: 0 }, { line: l, ch: l.length-1 });

      if (expr !== '') { 
        let handle = editor.markText(
          { line: l, ch: 0 },
          { line: l, ch: l.length-1 },
          { className: 'CodeMirror-execution' });
        _.delay(() => { handle.clear(); }, 500);
      }
    }

    // execute the line
    if (expr !== "")
      this.props.consoleStore.submitGHC(expr);

    event.preventDefault();
    return false;
  }

  saveStuff = (editor, e) => { 
    if(e.ctrlKey && (e.which === 83)) {
      e.preventDefault();
      save();
      return false;
    }
  }

  render() {
    console.log("RENDER CONSOLETIDAL.JS");
     
    const options = {
      mode: '_rule_haskell',
      theme: '_style',
      fixedGutter: true,
      scroll: false,
      styleSelectedText: true,
      showToken: true,
      lineWrapping: true,
      lineNumbers: true,
      showCursorWhenSelecting: true,
      // addon options
      styleActiveLine: true,
      matchBrackets: true,
      maxScanLines: 10
    };
    return (<div className={'ConsoleTextBox'}>
      <p>select -> ctrl+enter</p>
      <CodeMirror className={"draggableCancel"}
                  value={this.props.consoleStore.tidal_text}
                  options={options}
                  onBeforeChange={(editor, metadata, value) => {
                    this.props.consoleStore.onChangeTidal(value);
                  }}
                  onChange={() => { }}
                  onKeyDown={this.saveStuff.bind(this)}
                  onKeyUp={this.handleGHCSubmit.bind(this)}
                  />
      </div>);
  }
}
