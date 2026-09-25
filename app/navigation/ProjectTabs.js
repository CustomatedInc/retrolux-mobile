import React, {Component} from 'react';
import {  StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Icon, Card,  Text } from 'react-native-elements';
import FixedText from '../components/general/FixedText'
import sideBarStyles from '../resources/styles/sideBar';
import { GS, LIGHT_GREEN, PRIMARY_BLUE } from '../resources/styles/globals'
import Help from '../screens/Help';

const ACCESS_TOKEN = 'access_token'
const AREAS_TAB = 4;

export default class ProjectTabs extends Component {

  constructor(props) {
    super(props);

    // handle cases where only one tab is passed
    if (Array.isArray(props.children) == false) {
      var childrenArray = [props.children];
    } else {
      var childrenArray = props.children;
    }

    this.state = {
      activeTab: props.activeTab || AREAS_TAB,
      fillerTabs: 7 - childrenArray.length,
      children: childrenArray,
      accessToken: null,
      showHelpScreen: false,
      prevProps: {}
    }

    this.getToken();
  }

  static getDerivedStateFromProps(nextProps, prevState){
    const prevProps = prevState.prevProps || {};
    const activeTab = !!nextProps.activeTab && (prevProps.activeTab != nextProps.activeTab) ? nextProps.activeTab : prevState.activeTab;
    return { prevProps: nextProps, activeTab }
  }

  confirmLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout of Retrolux?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Yes, log me out', onPress: () => this.props.onLogOut()},
      ],
      { cancelable: true }
    )
  }

  async getToken() {
    try {
      let accessToken = await AsyncStorage.getItem(ACCESS_TOKEN);
      if(!accessToken) {
        this.props.onLogOut();
      } else {
        this.setState({accessToken: accessToken})
      }
    } catch(error) {
      console.log("Something went wrong: " + error);
    }
  }

  async navigate(tabIndex) {
    await this.setState({ activeTab: null }) // fixes the transition between areas and inventory tabs - because they use the same Areas screen.
    await this.setState({ activeTab: tabIndex, showHelpScreen: false });
  }

  generateFillerTabs() {
    var fillerTabs = [];
    for(let i = 0; i < this.state.fillerTabs; i++){
      fillerTabs.push(
        <TouchableOpacity
          style={[sideBarStyles.tabContainer,
          i === this.state.fillerTabs - 1 ? sideBarStyles.staticTabBorderBottom : null ]}
          disabled={true} key={i}
        />
      )
    }
    return fillerTabs
  }

  generateStaticTabs() {
    var staticTabs = [];

    staticTabs.push(
      <TouchableOpacity
        style={[sideBarStyles.tabContainer]}
        key={0}
        onPress={() => this.setState({ showHelpScreen: true })}
      >
        <Text style={GS.fontAwesome}>&#xf128;</Text>
        <Text style={sideBarStyles.tabText}>Help</Text>
      </TouchableOpacity>,
      <TouchableOpacity
        style={[sideBarStyles.tabContainer]}
        key={2}
        onPress={() => this.confirmLogout() }
      >
        <Text style={GS.fontAwesome}>&#xf08b;</Text>
        <Text style={sideBarStyles.tabText}>Logoff</Text>
      </TouchableOpacity>
    )
    return staticTabs
  }

  render() {
    const { activeTab, children } = this.state;

    return(

      <View style={sideBarStyles.container}>
        <View style={[sideBarStyles.tabsContainer]}>
          {children.map(({ props: { title, customOnPress, icon, customIcon } }, index) =>
            <TouchableOpacity
              
              style={sideBarStyles.tabContainer}
              onPress={() => {
                if (customOnPress == undefined){
                  this.navigate(index);
                } else {
                  customOnPress()
                }}}
              key={index}
              disabled={ title == null && index != 9 }
            >
              <View>
                  {icon != null ?
                    <Icon
                      name={icon}
                      iconStyle={{
                        color: index != activeTab && (title == 'Locations' && this.props.project.mobile_location_scope_ids.length > 0) ? PRIMARY_BLUE :
                               index == activeTab ?  LIGHT_GREEN : 'white'
                      }}
                      size={25}
                      type={'font-awesome'}
                    />
                  : null}
              </View>
              <View>
                {customIcon != null ?
                  <Icon
                    name={customIcon}
                    iconStyle={ {color: index == activeTab ?  LIGHT_GREEN : 'white'} }
                    size={25}
                    type={'font-awesome'}
                  />
                : null}
              </View>
              <FixedText
                style={[sideBarStyles.tabText,
                  {
                    color: index != activeTab && (title == 'Locations' && this.props.project.mobile_location_scope_ids.length > 0) ? PRIMARY_BLUE :
                           index == activeTab ?  '#49D184' : 'white'
                  }
                ]}
              >
                {title}
              </FixedText>
            </TouchableOpacity>
          )}
          { this.generateFillerTabs() }
          { this.generateStaticTabs() }
        </View>
        <View style={sideBarStyles.contentContainer}>
          {this.state.showHelpScreen &&
            <Help />
          }

          {!this.state.showHelpScreen &&
            children[activeTab]
          }
        </View>
      </View>
    );
  }
}
