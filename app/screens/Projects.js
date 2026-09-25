import { TouchableOpacity, Image, Modal, ScrollView, View, Text, Alert } from 'react-native';
import { Icon, Button } from 'react-native-elements';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ProjectForm from './ProjectForm';
import { SyncModal, RLButton, EmptyMessage, TableActionBar, TableCell, TableHeader, TableRow, SearchBar } from '../components';
import { ExistingCategoryTreeEntry, Project, Area, Company, User, ProjectUser } from '../database/models';
import realm from '../database/realm';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as Actions from '../actions';
import SyncHandler from '../api/SyncHandler';

class Projects extends Component {
  constructor(props) {
    super(props);

    this.state = {
      availableCompanies: realm.objects('Company'),
      search: null,
      stack: 'projects',
      myProjects: []
    };

    this.backToProjects = this.backToProjects.bind(this);
    this.getUserProjects = this.getUserProjects.bind(this);
    this.openProject = this.openProject.bind(this);

    this.getUserProjects()
    this.checkForRequiredUpdate()
  }

  componentDidMount() {
    this.checkInitialSync();
  }

  checkInitialSync() {
    if (Company.all.length === 0) {
      const handler = new SyncHandler(
        this.props.setSyncStatus,
        this.props.setSubSyncStatus,
        this.props.setFailedUpsyncProjects,
        this.props.setFailedDownSyncProjects,
      )
      handler.start();
    }
  }

  // To test failed/incomplete syncs
  // async removeServerIds(project){
  //   areas = await realm.objects('Area').filtered(`mobile_project_id = ${project.mobile_id}`)

  //   realm.write(() => {
  //     for (let i = 0; i < parseInt(areas.length/2); i++) {
  //       const area = areas[i];
  //       area.server_id = null
  //       area.edited = true
  //       existing_fixtures = area.existingFixtures

  //       for (let j = 0; j < existing_fixtures.length; j++) {
  //         const fixture = existing_fixtures[j];
  //         fixture.server_id = null
  //         fixture.edited = true
  //       }

  //     }
  //   })
  // }


  async checkForRequiredUpdate() {
    let disabledStatus = await this.props.currentUser.checkForCustomAttributes();
    this.props.checkForDisabledStatus(disabledStatus);

    let noCodesDisabledStatus = await this.props.currentUser.checkExistingLightingCode();
    this.props.checkForDisabledStatus(noCodesDisabledStatus);
  }

  async getUserProjects() {
    const allProjects = await Project.all

    if(allProjects.length > 0) {
      const projects = await this.props.currentUser.projects();
      this.props.setUserProjects(projects);
      this.props.setProjectDefaults(projects);
      this.props.setProductDefaults(projects);
      this.setState({myProjects: projects})
    }
  }

  openProject(project) {
    // console.log('project ===> ',project)
    this.changeStack('projects');
    this.props.onOpenProject(project);
  }

  async searchProjects(text) {
    const { myProjects } = this.state;
    // const projectss = await Project.search(text).sorted('name')
    
    this.setState({ search: text })
    const results =  myProjects.filter(item => item.name.toLowerCase().includes(text.toLowerCase()));
    this.props.setUserProjects(results);
  }

  clearSearch() {
    this.setState({ search: null });
  }

  changeStack(stack) {
    this.setState({ stack });
    this.props.setHomeTabsScreen(stack);
  }

  backToProjects() {
    this.setState({ stack: 'projects' });
    this.props.setHomeTabsScreen('projects');
  }

  render() {
    const { stack, availableCompanies } = this.state;
    const { userProjects, disabled } = this.props;

    if (stack === 'projects') {
      return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>

          {disabled &&

            <TouchableOpacity style={{flex: 1}} onPress={() => Alert.alert('Please sync (bottom left corner), a new update has been released and syncing is required to make sure nothing breaks.')}>
              <View style={{ flex: 1}} pointerEvents={"none"}>
                <TableActionBar>
                  <View style={{ flex: 1 }}>
                    <SearchBar
                      value={this.state.search}
                      onChangeText={text => this.searchProjects(text)}
                      onClear={() => this.clearSearch()}
                      placeholder="search for a project"
                    />
                  </View>
                  <View style={{ flex: -1 }}>
                    {availableCompanies.length > 0 &&
                      <RLButton title="+ project" onPress={() => this.changeStack('new project')} />
                    }
                  </View>
                </TableActionBar>
                {this.renderIndexContent(userProjects)}
              </View>
            </TouchableOpacity>

          }

          {!disabled &&

            <View style={{ flex: 1}}>
              <TableActionBar>
                <View style={{ flex: 7 }}>
                  <SearchBar
                    value={this.state.search}
                    onChangeText={text => this.searchProjects(text)}
                    onClear={() => this.clearSearch()}
                    placeholder="search for a project"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  {availableCompanies.length > 0 &&
                    <RLButton title="+ project" onPress={() => this.changeStack('new project')} buttonStyle={{ flex: 1 }} />
                  }
                </View>
              </TableActionBar>
              {this.renderIndexContent(userProjects)}
            </View>

          }

          <SyncModal
            setSyncStatus={this.props.setSyncStatus}
            syncStatus={this.props.syncStatus}
            refreshSyncStatus={this.props.refreshSyncStatus}
            companiesSyncStatus={this.props.companiesSyncStatus}
            categoryTreeSyncStatus={this.props.categoryTreeSyncStatus}
            existingLightingsSyncStatus={this.props.existingLightingsSyncStatus}
            attachmentsSyncStatus={this.props.attachmentsSyncStatus}
            uploadProjectsSyncStatus={this.props.uploadProjectsSyncStatus}
            projectsSyncStatus={this.props.projectsSyncStatus}
            errorMsg={this.props.errorMsg}
            failedUpSyncProjects={this.props.failedUpSyncProjects}
            failedDownSyncProjects={this.props.failedDownSyncProjects}
            isLongSync={this.props.isLongSync}
            projectsToSyncCount={this.props.projectsToSyncCount}
            syncedProjects={this.props.syncedProjects}
          />

        </View>
      );
    } else if (stack === 'new project') {
      return (
        <View style={{ flex: 1 }}>
          <ProjectForm changeStack={this.backToProjects} openProject={this.openProject} />
        </View>
      );
    }
  }

  renderRows(projects) {
    const rows = [];
    for (let i = 0; i < projects.length; i++) {
      let project = projects[i];
      rows.push(
        <TableRow onPressRow={() => this.openProject(project)} altColor={false} bottomBorder key={i}>
          <TableCell type="text" flex={4} text={project.name} key={`3-${i}`} />
          <TableCell type="text" flex={1} text={project.areasCount} alignItems="center" />
        </TableRow>,
      );

    }

    return (
      <ScrollView>
        {rows}
      </ScrollView>
    );
  }

  renderIndexContent(projects) {
    if (projects.length > 0) {
      return (
        <View style={{ flex: 15 }}>
          <TableHeader
            headerCells={[
              { flex: 4, title: 'Project' },
              { flex: 1, title: 'Areas', textAlign: 'center' },
            ]}
          />
          {this.renderRows(projects)}
        </View>
      );
    }

    return (
      <View style={{ borderTopWidth: 2, borderTopColor: 'lightgrey', flex: 15 }}>
        <EmptyMessage
          header={this.state.search ? 'No Projects Found' : 'No Projects Yet'}
        message={this.state.search ? '' : "If you're not seeing your projects, try pressing the sync button on the sidebar. If you haven't created a project before, press the '+ project' button above."}
        />
      </View>
    );
  }
}

Projects.propTypes = {
  setHomeTabsScreen: PropTypes.func.isRequired,
  onOpenProject: PropTypes.func.isRequired,
};

// REDUX ---------------------------------------------------------------------/

function mapStateToProps(state, props) {
  return {
    syncStatus: state.syncReducer.syncStatus,
    errorMsg: state.syncReducer.errorMsg,
    companiesSyncStatus: state.syncReducer.companiesSyncStatus,
    categoryTreeSyncStatus: state.syncReducer.categoryTreeSyncStatus,
    existingLightingsSyncStatus: state.syncReducer.existingLightingsSyncStatus,
    attachmentsSyncStatus: state.syncReducer.attachmentsSyncStatus,
    projectsSyncStatus: state.syncReducer.projectsSyncStatus,
    uploadProjectsSyncStatus: state.syncReducer.uploadProjectsSyncStatus,
    failedUpSyncProjects: state.syncReducer.failedUpSyncProjects,
    failedDownSyncProjects: state.syncReducer.failedDownSyncProjects,
    currentUser: state.currentUserReducer.currentUser,
    userProjects: state.currentUserReducer.userProjects,
    disabled: state.currentUserReducer.disabled,
    isLongSync: state.syncReducer.isLongSync,
    projectsToSyncCount: state.syncReducer.projectsToSyncCount,
    syncedProjects: state.syncReducer.syncedProjects,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Projects);
