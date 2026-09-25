import React, { Component } from 'react';
import { ActivityIndicator,  TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from 'react-native-elements';
import KeepAwake from 'react-native-keep-awake';

import SyncHandler from '../api/SyncHandler';
import FixedText from '../components/general/FixedText';
import sideBarStyles from '../resources/styles/sideBar';
import { GS } from '../resources/styles/globals';
import Help from '../screens/Help';

const ACCESS_TOKEN = 'access_token';

export default class HomeTabs extends Component {
  constructor(props) {
    super(props);

    // handle cases where only one tab is passed
    if (Array.isArray(props.children) == false) {
      var childrenArray = [props.children];
    } else {
      var childrenArray = props.children;
    }

    this.state = {
      activeTab: 0,
      fillerTabs: 7 - childrenArray.length,
      children: childrenArray,
      accessToken: null,
      syncStatus: 'idle',
      showHelpScreen: false,
    };

    this.getToken();
  }

  componentWillUnmount() {
    KeepAwake.deactivate();
  }

  confirmLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout of Retrolux?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, log me out', onPress: () => this.props.onLogOut() },
      ],
      { cancelable: true },
    );
  }

  async getToken() {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN);
    if (!accessToken) {
      this.props.onLogOut();
    } else {
      this.setState({ accessToken });
    }
  }

  async syncProjects() {
    if (this.props.connected) {
      const handler = new SyncHandler();
      handler.start();
    } else {
      Alert.alert('Unable to Sync', 'Sorry but we were unable to sync with Retrolux. It seems you may be offline. If so, please make sure you are connected to the internet, and try again.');
    }
  }

  async navigate(tabIndex) {
    await this.setState({ activeTab: tabIndex, showHelpScreen: false });
  }

  generateFillerTabs() {
    const fillerTabs = [];
    for (let i = 0; i < this.state.fillerTabs; i++) {
      fillerTabs.push(
        <TouchableOpacity
          style={sideBarStyles.tabContainer}
          disabled
          key={i}
        />,
      );
    }
    return fillerTabs;
  }

  generateStaticTabs() {
    const staticTabs = [];

    staticTabs.push(
      <TouchableOpacity
        style={[sideBarStyles.tabContainer]}
        key={0}
        onPress={() => this.setState({ showHelpScreen: true })}
      >
        <Text style={GS.fontAwesome}>&#xf128;</Text>
        <Text style={sideBarStyles.tabText}>Help</Text>
      </TouchableOpacity>,
    );
    if (this.props.screen == 'projects' && this.state.syncStatus == 'idle' && !this.state.showHelpScreen) {
      staticTabs.push(
        <TouchableOpacity
          style={[sideBarStyles.tabContainer]}
          onPress={() => this.syncProjects()}
          key={1}
          activeOpacity={1}
        >
          <Text style={GS.fontAwesome}>&#xf021;</Text>
          <Text style={sideBarStyles.tabText}>Sync</Text>
        </TouchableOpacity>,
      );
    }
    if (this.props.screen == 'projects' && this.state.syncStatus == 'syncing' && !this.state.showHelpScreen) {
      staticTabs.push(
        <View
          style={[sideBarStyles.tabContainer]}
          key={4}
        >
          <ActivityIndicator size="large" color="#ffffff" />
        </View>,
      );
    }
    staticTabs.push(
      <TouchableOpacity
        style={[sideBarStyles.tabContainer]}
        key={2}
        onPress={() => this.confirmLogout()}
      >
        <Text style={GS.fontAwesome}>&#xf08b;</Text>
        <Text style={sideBarStyles.tabText}>Logoff</Text>
      </TouchableOpacity>,
    );
    return staticTabs;
  }

  render() {
    const children = this.state.children;

    return (

      <View style={sideBarStyles.container}>
        <View style={sideBarStyles.tabsContainer}>
          {children.map(({ props: { title, customOnPress, icon, customIcon } }, index) =>
            (<TouchableOpacity
              style={[sideBarStyles.tabContainer]}
              onPress={() => {
                if (customOnPress == undefined) {
                  this.navigate(index);
                } else {
                  customOnPress();
                }
              }
              }
              key={index}
              disabled={title == null && index != 9}
            >
              <View>
                {icon != null ?
                  <Text
                    style={index === this.state.activeTab ? GS.fontAwesomeGreen : GS.fontAwesome}
                  >
                    {icon}
                  </Text>
                  : null}
              </View>
              <View>
                {customIcon != null ?
                  <Text
                    style={index === this.state.activeTab ? GS.fontAwesomeGreen : GS.fontAwesome}
                  >
                    {customIcon}
                  </Text>
                  : null}
              </View>
              <FixedText
                style={[sideBarStyles.tabText,
                  { color: index === this.state.activeTab ? '#49D184' : '#FFFFFF' }]}
              >
                {title}
              </FixedText>
            </TouchableOpacity>),
          )}
          { this.generateFillerTabs() }
          { this.generateStaticTabs() }
        </View>
        <View style={sideBarStyles.contentContainer}>
          {this.state.showHelpScreen &&
            <Help />
          }

          {!this.state.showHelpScreen &&
            children[this.state.activeTab]
          }
        </View>
      </View>
    );
  }
}
