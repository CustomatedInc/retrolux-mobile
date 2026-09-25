import {createStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import reactotron from './ReactotronConfig';
import reducers from '../app/reducers/index';

// Combine middleware and Reactotron enhancer
const enhancer = compose(applyMiddleware(thunk));

const store = createStore(reducers, enhancer);

export default store;

// import { createStore, applyMiddleware } from 'redux';
// import thunk from 'redux-thunk';
// import reducers from '../app/reducers';

// const store = createStore(reducers, applyMiddleware(thunk));
// export default store;

