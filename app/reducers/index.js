import { combineReducers } from 'redux';
import { syncReducer } from './syncReducer'
import { currentUserReducer } from './currentUserReducer'

const rootReducer = combineReducers({
  syncReducer,
  currentUserReducer,
})

export default rootReducer;
