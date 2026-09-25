import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Alert, View, Image, KeyboardAvoidingView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import KeepAwake from 'react-native-keep-awake';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as Actions from '../actions';

import realm from '../database/realm';
import { WarningMessage, FixedFormLabel, FixedText } from '../components';
import { ACCESS_TOKEN, BUILD_VERSION } from '../resources/constants';
import { User } from '../database/models';
import { GS } from '../resources/styles/globals';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getCheckVersion, loginSync } from '../api';
import { version } from '../../package.json';

const retroluxLogoSource = require('../resources/images/rl.png');

class Login extends Component {
  constructor() {
    super();

    this.state = {
      email: '',
      password: '',
      loggingIn: false,
      loginButtonDisabled: true,
    };
  }

  componentWillUnmount() {
    KeepAwake.deactivate();
  }

  componentDidMount() {
    if (this.state.password.length > 0) this.setState({ loginButtonDisabled: false })
  }

  async onPasswordChanged(password) {
    await this.setState({ password: password });
    this.refreshButtonStatus();
  }

  onEmailChanged(email) {
    this.setState({ email });
    this.refreshButtonStatus();
  }

  setButtonToLoggingIn() {
    this.setState({ loggingIn: true, loginButtonDisabled: true });
  }

  refreshButtonStatus() {
    this.setState({
      loginButtonDisabled: (this.state.email.length === 0 || this.state.password.length === 0),
    });
  }

  resetButton() {
    this.setState({ loggingIn: false, loginbuttonDisabled: false });
  }

  async onLoginPressed() {
    await this.setButtonToLoggingIn();

    if (this.props.connected) {
      KeepAwake.activate();
      this.checkVersionNumber();
    } else {
      this.attemptOfflineLogin();
    }
  }

  async checkVersionNumber() {
    const response = await getCheckVersion();
    const res = await response.json();
    if (res.status === 200) {
      this.attemptOnlineLogin();
    } else {
      Alert.alert('Update Required', 'There is a newer version of Retrolux available. Please update the app and then try your sync again');
      this.resetButton();
      KeepAwake.deactivate();
    }
  }

  async attemptOnlineLogin() {
    const loginData = await loginSync(this.state.email, this.state.password);
    if (!loginData.success) {
      KeepAwake.deactivate();
      this.resetButton();
      return Alert.alert(loginData.error.title, loginData.error.message);
    }
    this.finishOnlogin(loginData.apiAuthToken, loginData.currentUserId);
  }

  async finishOnlogin(apiAuthToken, currentUserId) {
    await AsyncStorage.setItem(ACCESS_TOKEN, apiAuthToken);
    KeepAwake.deactivate();
    const currentUser = await User.findById(currentUserId)
    this.props.setCurrentUser(currentUser);
  }

  async attemptOfflineLogin() {
    let name = this.state.email;
    if (typeof name !== 'string') { name = String(name); }
    name = name.trim();
    name = name.toLowerCase();
    const user = await User.findByEmail(name);

    if (!user) {
      Alert.alert('Unable to Log In Offline', "Sorry but we could not validate your account.\n\nIf this is your first time using the app, please make sure you are connected to the internet for your first log in. If you were not the last user to log in when connected, you'll also need to log in while connected before logging in offline. Or perhaps your email is incorrect?");
      this.resetButton();
    } else if (user.offline_password === this.state.password) {
      await AsyncStorage.setItem(ACCESS_TOKEN, user.api_auth_token);
      this.props.setCurrentUser(user);
    } else if (user.offline_password !== this.state.password) {
      Alert.alert('Unable to Log In', 'Sorry but we were unable to log you in to Retrolux. Perhaps your email address or password are incorrect?');
      this.resetButton();
    }
  }

  renderButtonText() {
    if (this.state.loggingIn) {
      return (
        <ActivityIndicator size="small" color={'white'} />
      );
    }
    return (
      <FixedText style={styles.buttonText}>
          Login
      </FixedText>
    );
  }

  render() {
    const { loggingIn, loginButtonDisabled } = this.state;

    return (
      <View style={styles.loginScreen}>
        <View style={GS.flex1} />
        <View style={GS.flex2}>
          <View style={styles.loginCard}>
            <KeyboardAwareScrollView
              keyboardOpeningTime={100}
              extraScrollHeight={75}
              contentContainerStyle={styles.loginScrollAware}
            >
              <View style={styles.loginInputContainer}>
                <View style={styles.retroluxLogoContainer}>
                  <Image
                    source={retroluxLogoSource}
                    style={styles.retroluxLogo}
                  />
                </View>

                <FixedFormLabel>User Name</FixedFormLabel>
                <TextInput
                  style={styles.loginInput}
                  value={this.state.email}
                  onChangeText={text => this.onEmailChanged(text)}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <FixedFormLabel>Password</FixedFormLabel>
                <TextInput
                  secureTextEntry
                  style={styles.loginInput}
                  value={this.state.password}
                  onChangeText={text => this.onPasswordChanged(text)}
                  placeholder="Enter your password"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  onPress={this.onLoginPressed.bind(this)}
                  style={[
                    styles.button,
                    { justifyContent: 'center' },
                    { backgroundColor: (loginButtonDisabled && !loggingIn) ? 'lightgrey' : '#49D184' },
                  ]}
                  disabled={loginButtonDisabled}
                >
                  {this.renderButtonText()}
                </TouchableOpacity>

                <View style={[GS.row, GS.pt20]}>
                  <FixedText style={[GS.flex1, GS.darkerGray, GS.textCenter]}>
                    {/* Version {version} */}
                    {`Version ${BUILD_VERSION}`}
                  </FixedText>
                </View>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </View>
        <View style={GS.flex1} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  button: {
    marginHorizontal: 20,
    marginTop: 15,
    alignItems: 'center',
    borderRadius: 3,
    height: 45,
    overflow: 'hidden',
    padding: 5,
  },

  loginScrollAware: {
    justifyContent: 'center',
    flexGrow: 1,
  },

  loginInput: {
    marginBottom: 10,
    marginHorizontal: 20,
    borderRadius: 3,
    marginVertical: 5,
    fontSize: 14,
    ...GS.borderThin,
    ...GS.p10,
  },

  retroluxLogoContainer: {
    marginBottom: 10,
    ...GS.centered,
  },

  retroluxLogo: {
    resizeMode: 'contain',
    transform: [{ scale: 0.55 }],
  },

  loginCard: {
    backgroundColor: 'white',
    borderRadius: 3,
    paddingVertical: 30,
    paddingBottom: 50,
    paddingHorizontal: 10,
    ...GS.center,
  },

  loginScreen: {
    paddingVertical: 20,
    ...GS.bgBlue,
    ...GS.center,
    ...GS.rowGrow,
  },

  loginInputContainer: {
    maxWidth: 400,
  },
});

Login.propTypes = {
  connected: PropTypes.bool,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(null, mapDispatchToProps)(Login);
