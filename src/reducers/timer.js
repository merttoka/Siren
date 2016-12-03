const modelName = 'TIMER';
const INITIAL_STATE = { isActive: false, current: 0 };
export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case 'INC_'+modelName:
      const s = state;
      s.isActive = true;
      s.current++;
      return {...s};
    case 'STOP_'+modelName:
      return {...state, isActive: false, current: 0}
    default:
      return state;
  }
}