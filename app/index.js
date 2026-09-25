import React, { Component } from 'react';
import { Provider } from 'react-redux';
import store from './store';
import Root from './screens/Root';
import { ENVIRONMENT_URL } from "../app/resources/constants";
// import { RealmProvider } from './database/realm';

const ACCESS_TOKEN = 'access_token';

let REACTOTRON;
if (ENVIRONMENT_URL === "https://app.retrolux.com") { REACTOTRON = require('./ReactotronConfig') };

type Props = {};
export default class App extends Component<Props> {

  constructor(props) {
    super(props);
  }

  render() {
    return(
     
      <Provider store={store}>
         {/* <RealmProvider> */}
        <Root />
        {/* </RealmProvider> */}
      </Provider>
      
    )
  }
}
