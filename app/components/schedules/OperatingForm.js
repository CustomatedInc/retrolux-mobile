import React, { Component } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { GS, GRAY } from '../../resources/styles/globals';
import FixedFormLabel from '../forms/FixedFormLabel'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { roundTo, presentOrZero } from '../../lib/numberHelpers';

import { ScheduleModal } from './ScheduleModal';
import { StringInput, Tab, NumberInput } from '../';
import { OperatingSchedule, Area } from '../../database/models';
import realm from '../../database/realm'

class OperatingForm extends Component {
  constructor(props) {
    super(props);

    const newOperatingSchedule = {
      mobile_project_id: this.props.project.mobile_id,
      hour_type: 'annual'
    };

    const propsSchedule = this.props.operatingSchedule;
    const operatingSchedule = propsSchedule ? propsSchedule.toPlainObject() : newOperatingSchedule;

    this.state = {
      area: this.props.area ? this.props.area : null,
      existingFixture: this.props.existingFixture ? this.props.existingFixture : null,
      operatingSchedule,
      newOperatingSchedule,
      mode: !this.props.operatingSchedule ? 'create' : 'edit',
      nameError: null,
      annualHoursError: null,
      mondayError: null,
      tuesdayError: null,
      wednesdayError: null,
      thursdayError: null,
      fridayError: null,
      saturdayError: null,
      sundayError: null,
      weeksPerYearError: null,
      controlsReductionError: null
    };
  }

  componentWillReceiveProps(nextProps) {
    const newOperatingSchedule = {
      mobile_project_id: this.props.project.mobile_id,
      hour_type: 'annual'
    };

    const propsSchedule = nextProps.operatingSchedule;
    const operatingSchedule = !propsSchedule ? newOperatingSchedule : propsSchedule.toPlainObject();

    this.setState({
      operatingSchedule,
      mode: !propsSchedule ? 'create' : 'edit',
    });
  }

  async onSubmit() {
    await this.clearErrors();
    const errors = await OperatingSchedule.validate(this.state.operatingSchedule);
    this.setState(errors);
    if (Object.keys(errors).length !== 0) { return; }

    const schedule = await OperatingSchedule.prepareFormData(this.state.operatingSchedule, this.props.project);
    await OperatingSchedule.create(schedule, (this.state.mode === 'edit'));

    if (this.state.mode === 'create') {
      this.props.project.checkDefaultMobileSchedule(
        'OperatingSchedule',
        'mobile_operating_schedule_id',
        schedule.mobile_id,
      );
    }

    this.dismissForm(schedule.mobile_id);
  }

  dismissForm(operatingScheduleId = null) {
    this.clearErrors();
    this.props.onCancel(operatingScheduleId);
  }

  clearErrors() {
    this.setState({
      annualHoursError: null,
      nameError: null,
      mondayError: null,
      tuesdayError: null,
      wednesdayError: null,
      thursdayError: null,
      fridayError: null,
      saturdayError: null,
      sundayError: null,
      weeksPerYearError: null,
      controlsReductionError: null
    });
  }

  async complexSetState(target, value) {
    const update = this.state.operatingSchedule;
    update[target] = value;
    await this.setState({ operatingSchedule: update });
  }

  render() {
    const { operatingSchedule } = this.state;
    const HOUR_TYPES = ['annual', 'weekly'];

    return (
      <ScheduleModal
        isVisible={this.props.showForm}
        title={`${_.capitalize(this.state.mode)} Operating Schedule`}
        onCancel={() => this.dismissForm()}
        onSubmit={() => this.onSubmit()}
      >
        <StringInput
          label="Name"
          placeholder="schedule name"
          value={operatingSchedule.name}
          onChange={this.complexSetState.bind(this)}
          target="name"
          error={this.state.nameError !== null}
          errorMessage={this.state.nameError}
        />
        <View style={styles.tabSectionContainer}>
          <View style={styles.tabContainer}>
            {HOUR_TYPES.map(type => (
              <Tab
                key={type}
                onPress={() => this.complexSetState('hour_type', type)}
                title={type}
                activeTab={operatingSchedule.hour_type === type}
              />
            ))}
          </View>
        </View>
        <View style={styles.tabBox}>
          { (operatingSchedule.hour_type === 'annual') &&
            <View style={{ marginTop: 5 }}>
              <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Annual Hours'}</FixedFormLabel>
              <NumberInput
                target={'annual_hours'}
                value={presentOrZero(operatingSchedule.annual_hours) ? operatingSchedule.annual_hours : null}
                placeholder={'annual hours'}
                unit={'hours'}
                unitPosition={'right'}
                onChange={this.complexSetState.bind(this)}
                error={this.state.annualHoursError !== null}
                errorMessage={this.state.annualHoursError}
                integer={true}
                quickList={"[500, 2080, 2340, 2920, 4380, 8760]"}
              />
            </View>
          }

          { (operatingSchedule.hour_type === 'weekly') &&
            <View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }}>
                <View style={{flex: 1}}>
                  <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Monday'}</FixedFormLabel>
                  <NumberInput
                    target={'monday'}
                    value={presentOrZero(operatingSchedule.monday) ? roundTo(operatingSchedule.monday, 2) : null}
                    placeholder={'hours/day'}
                    onChange={this.complexSetState.bind(this)}
                    error={this.state.mondayError !== null}
                    errorMessage={this.state.mondayError}
                    integer={false}
                    quickList={"[8, 12, 24]"}
                  />
                </View>
                <View style={{flex: 1}}>
                  <FixedFormLabel labelStyle={{ marginTop: 8 }}>{'Tuesday'}</FixedFormLabel>
                  <NumberInput
                    target={'tuesday'}
                    value={presentOrZero(operatingSchedule.tuesday) ? roundTo(operatingSchedule.tuesday, 2) : null}
                    placeholder={'hours/day'}
                    onChange={this.complexSetState.bind(this)}
                    error={this.state.tuesdayError !== null}
                    errorMessage={this.state.tuesdayError}
                    integer={false}
                    quickList={"[8, 12, 24]"}
                  />
                </View>
                <View style={{flex: 1}}>
                  <FixedFormLabel labelStyle={{ marginTop: 8 }}>{'Wednesday'}</FixedFormLabel>
                  <NumberInput
                    target={'wednesday'}
                    value={presentOrZero(operatingSchedule.wednesday) ? roundTo(operatingSchedule.wednesday, 2) : null}
                    placeholder={'hours/day'}
                    onChange={this.complexSetState.bind(this)}
                    error={this.state.wednesdayError !== null}
                    errorMessage={this.state.wednesdayError}
                    integer={false}
                    quickList={"[8, 12, 24]"}
                  />
                </View>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <View style={{flex: 1}}>
                  <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Thursday'}</FixedFormLabel>
                  <NumberInput
                    target={'thursday'}
                    value={presentOrZero(operatingSchedule.thursday) ? roundTo(operatingSchedule.thursday, 2) : null}
                    placeholder={'hours/day'}
                    onChange={this.complexSetState.bind(this)}
                    error={this.state.thursdayError !== null}
                    errorMessage={this.state.thursdayError}
                    integer={false}
                    quickList={"[8, 12, 24]"}
                  />
                </View>
                <View style={{flex: 1}}>
                  <FixedFormLabel labelStyle={{ marginTop: 8 }}>{'Friday'}</FixedFormLabel>
                  <NumberInput
                    target={'friday'}
                    value={presentOrZero(operatingSchedule.friday) ? roundTo(operatingSchedule.friday, 2) : null}
                    placeholder={'hours/day'}
                    onChange={this.complexSetState.bind(this)}
                    error={this.state.fridayError !== null}
                    errorMessage={this.state.fridayError}
                    integer={false}
                    quickList={"[8, 12, 24]"}
                  />
                </View>
                <View style={{flex: 1}}>
                  <FixedFormLabel labelStyle={{ marginTop: 8 }}>{'Saturday'}</FixedFormLabel>
                  <NumberInput
                    target={'saturday'}
                    value={presentOrZero(operatingSchedule.saturday) ? roundTo(operatingSchedule.saturday, 2) : null}
                    placeholder={'hours/day'}
                    onChange={this.complexSetState.bind(this)}
                    error={this.state.saturdayError !== null}
                    errorMessage={this.state.saturdayError}
                    integer={false}
                    quickList={"[8, 12, 24]"}
                  />
                </View>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <View style={{flex: 1}}>
                  <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Sunday'}</FixedFormLabel>
                  <NumberInput
                    target={'sunday'}
                    value={presentOrZero(operatingSchedule.sunday) ? roundTo(operatingSchedule.sunday, 2) : null}
                    placeholder={'hours/day'}
                    hint={' \n '}
                    onChange={this.complexSetState.bind(this)}
                    error={this.state.sundayError !== null}
                    errorMessage={this.state.sundayError}
                    integer={false}
                    quickList={"[8, 12, 24]"}
                  />
                </View>
                <View style={{flex: 2}}>
                  <FixedFormLabel labelStyle={{ marginTop: 8 }}>{'Weeks Per Year'}</FixedFormLabel>
                  <NumberInput
                    target={'weeks_per_year'}
                    value={presentOrZero(operatingSchedule.weeks_per_year) ? roundTo(operatingSchedule.weeks_per_year, 2) : null}
                    placeholder={'hours/day'}
                    hint={'Add daily hours and weeks per year.\nWe will calculate the annual hours for you.'}
                    onChange={this.complexSetState.bind(this)}
                    error={this.state.weeksPerYearError !== null}
                    errorMessage={this.state.weeksPerYearError}
                    integer={false}
                    quickList={"[26, 48, 52]"}
                  />
                </View>
              </View>
            </View>
          }

        </View>
        <View style={{ flex: -1, marginTop: 7 }}>
          <FixedFormLabel>{'Controls Reduction'}</FixedFormLabel>
          <NumberInput
            target={'controls_reduction'}
            value={operatingSchedule.controls_reduction ? roundTo(operatingSchedule.controls_reduction, 2) : 0.0}
            placeholder={'percent reduction'}
            onChange={this.complexSetState.bind(this)}
            error={this.state.controlsReductionError !== null}
            errorMessage={this.state.controlsReductionError}
            integer={false}
            unit={'%'}
            unitPosition={'right'}
            hint={'Enter a percentage without % (and enter 6 for 6%, not .06).'}
            quickList={"[10, 25, 33, 50, 75, 100]"}
          />
        </View>
      </ScheduleModal>
    );
  }
}

const styles = StyleSheet.create({
  tabSectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },

  tabContainer: {
    height: 40,
    flexDirection: 'row',
    paddingTop: 5,
  },

  tabBox: {
    zIndex: -1,
    borderWidth: 2,
    borderColor: GRAY,
    borderRadius: 5,
    backgroundColor: '#FAFAFD',
    paddingVertical: 15,
    marginHorizontal: 20
  }
});

OperatingForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  showForm: PropTypes.bool.isRequired,
  project: PropTypes.shape({
    checkDefaultMobileSchedule: PropTypes.func.isRequired,
  }).isRequired,
  operatingSchedule: PropTypes.object,
};

export { OperatingForm };
