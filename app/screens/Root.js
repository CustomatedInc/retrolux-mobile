import React, { Component } from "react";
import {  StatusBar, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'
import Orientation from 'react-native-orientation';
import { bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';
import NetInfo from '@react-native-community/netinfo'; // Import the new NetInfo

import * as Actions from '../actions';
import store from '../store';
import Login from './Login';
import Home from './Home';
import { User } from '../database/models';

const ACCESS_TOKEN = 'access_token';

class Root extends Component {

  constructor(props) {
    super(props);
    this.state = {
      checkedCurrentUser: false,
      connected: true // Default to connected, will be updated based on actual network state
    };

    this.handleConnectivityChange = this.handleConnectivityChange.bind(this);

    Orientation.lockToLandscape();
    this.resetCurrentUser();

    // Fetch current network state once on mount
    NetInfo.fetch().then(state => {
      // console.log('state.isConnected ',state.isConnected)
      this.setState({ connected: state.isConnected });
    });

    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      // console.log('state.isConnected ',state.isConnected)
      this.handleConnectivityChange(state.isConnected);
    });
  }

  async resetCurrentUser() {
    const apiAuthToken = await AsyncStorage.getItem(ACCESS_TOKEN);

    if (apiAuthToken) {
      const currentUser = await User.findByToken(apiAuthToken);
      if (currentUser) this.props.setCurrentUser(currentUser);
    }

    this.setState({ checkedCurrentUser: true });
  }

  componentWillUnmount() {
    // Unsubscribe from the network state listener when component unmounts
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  async handleConnectivityChange(isConnected) {
    await this.setState({ connected: isConnected });
  }

  render() {
    StatusBar.setBarStyle('light-content', true);
    const { loggedIn } = this.props;

    if (!this.state.checkedCurrentUser) {
      return <View style={{ flex: 1, backgroundColor: 'white' }} />;
    } else if (!loggedIn) {
      return <Login connected={this.state.connected} />;
    } else {
      return <Home connected={this.state.connected} />;
    }
  }
}

function mapStateToProps(state, props) {
  return {
    loggedIn: state.currentUserReducer.loggedIn,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Root);
