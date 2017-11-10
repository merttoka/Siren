import _ from 'lodash';
const modelName = 'SCCOMMAND';
const INITIAL_STATE = { commands: [], debugconsole: '',scpat: '' };
export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'FETCH_'+modelName:
      state.commands.push(action.payload)
      return state;
    case 'DEBUG_'+modelName:
      const c = state;
      let console_len = 20;
      c.debugconsole = _.concat(c.debugconsole,Object.values(action.payload));
      if(c.debugconsole.length > console_len){
        c.debugconsole = _.drop( c.debugconsole , console_len);
      }
      return c;
    case 'UPDATE_'+modelName:
      if (action.payload !== ''){
        state.scpat = action.payload;
      }
      return state;
    default:
      return state;
  }
}
