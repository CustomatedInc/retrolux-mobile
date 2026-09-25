import React, { Component } from 'react';
import { Alert, StyleSheet, View, ScrollView } from 'react-native';
import PropTypes from 'prop-types';

import realm from '../database/realm';
import { SECONDARY_BLUE, LIGHT_BLUE, GS } from '../resources/styles/globals';
import {
  CoolingIndex,
  CoolingForm,
  HeatingIndex,
  HeatingForm,
  RateIndex,
  RateForm,
  OperatingForm,
  Tab,
  OperatingIndex,
  RLButton,
  BottomBar
} from '../components';

const SCHEDULE_TYPES = ['Operating', 'Rate', 'Cooling', 'Heating'];

class Schedules extends Component {
  constructor(props) {
    super(props);

    this.state = {
      scheduleType: 'Operating',
      operatingSchedules: this.props.project.operatingSchedules,
      rateSchedules: this.props.project.rateSchedules,
      coolings: this.props.project.coolings,
      heatings: this.props.project.heatings,
      modalVisible: false,
    };

    this.editSchedule = this.editSchedule.bind(this);
    this.confirmDeactivation = this.confirmDeactivation.bind(this);
    this.copySchedule = this.copySchedule.bind(this);
    this.setScheduleType = this.setScheduleType.bind(this);

    this.addScheduleListener()
  }

  addScheduleListener() {
    const project = this.props.project

    realm.addListener('change', () => {
      this.setState({
        operatingSchedules: project.operatingSchedules,
        rateSchedules: project.rateSchedules,
        coolings: project.coolings,
        heatings: project.heatings,
      });
    });
  }

  componentWillUnmount() {
    realm.removeAllListeners();
  }

  setScheduleType(type) {
    this.setState({ scheduleType: type });
  }

  async editSchedule(schedule) {
    const { state, state: { scheduleType } } = this;
    const scheduleTypeKey = scheduleType.toLowerCase();
    this.setState({
      ...state,
      modalVisible: true,
      [scheduleTypeKey]: schedule,
    });
  }

  confirmDeactivation(schedule) {
    const deleteButton = {
      text: 'Yes, delete it.',
      onPress: () => this.deactivateSchedule(schedule),
      style: 'destructive',
    };
    const cancelButton = { text: 'Cancel', style: 'cancel' };

    Alert.alert(
      'Are You Sure?',
      'You cannot undo this action',
      [deleteButton, cancelButton],
      { cancelable: false },
    );
  }

  async deactivateSchedule(schedule) {
    await schedule.deactivate();
    const project = this.props.project;
    const type = this.state.scheduleType;

    if (type === 'Operating') {
      project.checkDefaultOperating(schedule.mobile_id);
    } else if (type === 'Rate') {
      project.checkDefaultRate(schedule.mobile_id);
    } else if (type === 'Cooling') {
      project.checkDefaultCooling(schedule.mobile_id);
    } else if (type === 'Heating') {
      project.checkDefaultHeating(schedule.mobile_id);
    }
  }

  async copySchedule(schedule) {
    await schedule.copy();
  }

  hideModal() {
    this.setState({ modalVisible: false });
    this.clearForms();
  }

  clearForms() {
    this.setState({
      operating: null,
      rate: null,
      cooling: null,
      heating: null,
    });
  }

  createSchedule(scheduleType) {
    this.clearForms();
    this.setState({ modalVisible: true, scheduleType: scheduleType });
  }

  render() {
    const { scheduleType, modalVisible } = this.state;
    return (
      <View style={styles.mainContainer}>
            <View style={styles.tabSectionContainer}>
              <View style={styles.tabContainer}>
                {SCHEDULE_TYPES.map(type => (
                  <Tab
                    key={type}
                    onPress={() => this.setScheduleType(type)}
                    title={type}
                    activeTab={scheduleType === type}
                  />
                ))}
              </View>
            </View>
            <View style={GS.flexGrow}>
              { (this.state.scheduleType === 'Operating') &&
                <OperatingIndex
                  schedules={this.state.operatingSchedules}
                  onEdit={this.editSchedule}
                  onDeactivate={this.confirmDeactivation}
                  copyAction={this.copySchedule}
                  project={this.props.project}
                />
              }

              {(this.state.scheduleType === 'Rate') &&
                <RateIndex
                  schedules={this.state.rateSchedules}
                  onEdit={this.editSchedule}
                  onDeactivate={this.confirmDeactivation}
                  copyAction={this.copySchedule}
                  project={this.props.project}
                />
              }

              {(this.state.scheduleType === 'Cooling') &&
                <CoolingIndex
                  schedules={this.state.coolings}
                  onEdit={this.editSchedule}
                  onDeactivate={this.confirmDeactivation}
                  copyAction={this.copySchedule}
                  project={this.props.project}
                />
              }

              {(this.state.scheduleType === 'Heating') &&
                <HeatingIndex
                  schedules={this.state.heatings}
                  onEdit={this.editSchedule}
                  onDeactivate={this.confirmDeactivation}
                  copyAction={this.copySchedule}
                  project={this.props.project}
                />
              }
            </View>
          <BottomBar>
            <View style={styles.scheduleButtonHolder}>
              {SCHEDULE_TYPES.map(type => (
                <RLButton
                key={type}
                backgroundColor={'white'}
                buttonStyle={{marginVertical: 10, marginRight: 10, marginLeft: 0, borderWidth: 2, padding: 8, borderColor: LIGHT_BLUE, height: 60, width: 90}}
                color={SECONDARY_BLUE}
                title={`+ ${type.toLowerCase()}`}
                onPress={() => this.createSchedule(type)}
              />
              ))}
            </View>
          </BottomBar>

        <OperatingForm
          showForm={modalVisible && scheduleType === 'Operating'}
          onCancel={() => this.hideModal()}
          project={this.props.project}
          operatingSchedule={this.state.operating}
        />

        <RateForm
          showForm={modalVisible && scheduleType === 'Rate'}
          onCancel={() => this.hideModal()}
          project={this.props.project}
          rateSchedule={this.state.rate}
        />

        <CoolingForm
          showForm={modalVisible && scheduleType === 'Cooling'}
          onCancel={() => this.hideModal()}
          project={this.props.project}
          cooling={this.state.cooling}
        />

        <HeatingForm
          showForm={modalVisible && scheduleType === 'Heating'}
          onCancel={() => this.hideModal()}
          project={this.props.project}
          heating={this.state.heating}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: 'white',
    ...GS.flex1,
  },

  scheduleButtonHolder: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  tabSectionContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    ...GS.bgLightGray,
  },

  tabContainer: {
    height: 40,
    flexDirection: 'row',
    paddingTop: 5,
  },
});

Schedules.propTypes = {
  project: PropTypes.shape({
    operatingSchedules: PropTypes.object,
    rateSchedules: PropTypes.object,
    coolings: PropTypes.object,
    heatings: PropTypes.object,
  }).isRequired,
};

export default Schedules;
