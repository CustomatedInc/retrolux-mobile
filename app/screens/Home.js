import React, {Component} from "react";
import {  View, Alert, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from "react-native-elements";
import realm from '../database/realm';

import HomeTabs from '../navigation/HomeTabs';
import ProjectTabs from '../navigation/ProjectTabs';
import Projects from './Projects';
import ProjectForm from './ProjectForm';
import AreaStack from '../navigation/AreaStack';
import LocationStack from '../navigation/LocationStack';
import Schedules from './Schedules'
import ExistingLightingStack from '../navigation/ExistingLightingStack'
import Modal from 'react-native-modal';
import { GS, DARKEST_GRAY } from "../resources/styles/globals";

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as Actions from '../actions';

import { ACCESS_TOKEN, PREVIOUS_TOKEN, ENVIRONMENT_URL } from '../resources/constants';

const AREAS_TAB = 4;
const retroluxLogoSource = require('../resources/images/logo.png');

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accessToken: null,
      homeTabsScreen: "projects",
      stack: "projects",
      activeProjectTab:""
    }

    this.getToken();
  }

  componentDidMount() {
    if (ENVIRONMENT_URL == 'http://localhost:3000') { console.tron(realm.path) }
  }

  async onLogOut() {
    let previousUserToken = await AsyncStorage.getItem(ACCESS_TOKEN);
    await AsyncStorage.setItem(PREVIOUS_TOKEN, previousUserToken);
    AsyncStorage.removeItem(ACCESS_TOKEN);
    this.props.removeCurrentUser();
  }

  async getToken() {
    try {
      let accessToken = await AsyncStorage.getItem(ACCESS_TOKEN);
      if(!accessToken) {
        this.redirect('login');
      } else {
        this.setState({accessToken: accessToken})
      }
    } catch(error) {
      console.log("Something went wrong: " + error);
    }
  }

  async onOpenProject(project) {
    await this.setState({project: project})
    await this.setState({stack: "project"})
  }

  async resetActiveProjectTab() {
    // this forces the ProjectTabs component to switch tabs
    console.log('onArea tab called',this.state.activeProjectTab)
    // this.setState({ activeProjectTab: AREAS_TAB })
    this.setState((prevState) => ({
      activeProjectTab: prevState.activeProjectTab === AREAS_TAB ? "" : AREAS_TAB
    }));
  }

  setHomeTabsScreen(screen) {
    this.setState({ homeTabsScreen: screen });
  }

  backToProjects() {
    this.setState({ stack: "projects" })
  }

  async changeSidebarTab(tabNumber) {
    this.setState({ activeProjectTab: tabNumber })
  }

  render() {
    const { stack } = this.state;
    const { loadScreen } = this.props;

    return(
      <View style={{flex: 1}}>

        {stack == "projects" ?

          <HomeTabs screen={this.state.homeTabsScreen} connected={this.props.connected} onLogOut={this.onLogOut.bind(this)}>
            <Projects title="Projects" customIcon='&#xf0f7;' setHomeTabsScreen={this.setHomeTabsScreen.bind(this)} onOpenProject={this.onOpenProject.bind(this)} style={{flex:1}}/>
          </HomeTabs>

        : null}

        {stack == "project" ?

          <ProjectTabs key={this.state.activeProjectTab} activeTab={this.state.activeProjectTab} project={this.state.project} connected={this.props.connected} onLogOut={this.onLogOut.bind(this)}>
            <View title="Projects" customIcon='building-o' customOnPress={this.backToProjects.bind(this)}/>
            <ProjectForm title="Details" icon='cogs' project={this.state.project} changeStack={this.resetActiveProjectTab.bind(this)}/>

            <Schedules title="Schedules" icon='clock-o' project={this.state.project}/>
            <LocationStack title='Locations' icon='sitemap' project={this.state.project} stack={'locations'} changeSidebarTab={this.changeSidebarTab.bind(this)}/>
            <AreaStack title='Areas' icon='object-group' project={this.state.project} changeSidebarTab={this.changeSidebarTab.bind(this)} stack={'areas'}/>
            <ExistingLightingStack title={"Product\nSchedule"} icon='list' project={this.state.project} stack={'index'}/>
            <AreaStack title='Inventory' icon='lightbulb-o' project={this.state.project} changeSidebarTab={this.changeSidebarTab.bind(this)} stack={'inventory'}/>
          </ProjectTabs>

        : null}

        <Modal isVisible={loadScreen} style={{...GS.center, flex: 1}}>
          <View style={styles.modal} pointerEvents={'none'}>
            <View >
              <Image source={retroluxLogoSource} style={styles.logo} />
            </View>
            <View style={{alignItems: 'center'}}>
              <Text style={styles.headerFont}>Creating Project</Text>
              <Text style={styles.messageFont}>Please do not turn off iPad or exit application. This may take a few moments. Thank you for your patience.</Text>
            </View>
          </View>
        </Modal>

      </View>
    )
  }

}

var styles = StyleSheet.create({
  modal: {
    borderRadius: 8,
    backgroundColor: 'white',
    width: 425,
    height: 400,
    padding: 20,
    alignItems: 'center',
  },

  headerFont: {
    fontSize: 50,
    fontWeight: 'bold',
    color: DARKEST_GRAY,
    textAlign: 'center'
  },

  messageFont: {
    fontSize: 14,
    textAlign: 'center',
  },

  logo: {
    resizeMode: 'contain',
    transform: [{ scale: 0.5 }]
  }
})

function mapStateToProps(state, props) {
  return {
    loadScreen: state.syncReducer.loadScreen,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);

