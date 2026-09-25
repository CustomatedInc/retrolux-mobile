import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { GS, GRAY } from '../../resources/styles/globals';
import FixedFormLabel from '../forms/FixedFormLabel'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { presentOrZero } from '../../lib/numberHelpers';

import { ScheduleModal } from './ScheduleModal';
import { StringInput, Tab, NumberInput } from '../';
import { RateSchedule } from '../../database/models';

class RateForm extends Component {
  constructor(props) {
    super(props);

    const newRateSchedule = {
      mobile_project_id: this.props.project.mobile_id,
      rate_type: 'blended',
      rate_customer: '0.0',
      demand_utilization: 100
    };

    const propsSchedule = this.props.rateSchedule;
    const rateSchedule = propsSchedule ? propsSchedule.toPlainObject() : newRateSchedule;

    this.state = {
      rateSchedule,
      newRateSchedule,
      mode: !this.props.rateSchedule ? 'create' : 'edit',
      nameError: null,
      costError: null,
      costSimpleError: null,
      demandSimpleError: null,
      rateCustomerError: null,
      demandThrottleError: null,
      rateEscalatorError: null,
    };
  }

  componentWillReceiveProps(nextProps) {
    const newRateSchedule = {
      mobile_project_id: this.props.project.mobile_id,
      rate_type: 'blended',
      rate_customer: '0.0',
      demand_utilization: 100
    };

    const propsSchedule = nextProps.rateSchedule;
    const rateSchedule = !propsSchedule ? newRateSchedule : propsSchedule.toPlainObject();
    this.setState({
      rateSchedule,
      mode: !propsSchedule ? 'create' : 'edit',
    });
  }

  async onSubmit() {
    await this.clearErrors();

    const errors = await RateSchedule.validate(this.state.rateSchedule);
    this.setState(errors);
    if (Object.keys(errors).length !== 0) { return; }

    const schedule = await RateSchedule.prepareFormData(this.state.rateSchedule, this.props.project);
    await RateSchedule.create(schedule, (this.state.mode === 'edit'));

    if (this.state.mode === 'create') {
      this.props.project.checkDefaultMobileSchedule('RateSchedule', 'mobile_rate_schedule_id', schedule.mobile_id);
    }
    this.dismissForm();
  }

  dismissForm() {
    this.clearErrors();
    this.props.onCancel();
  }

  clearErrors() {
    this.setState({
      costError: null,
      nameError: null,
      costSimpleError: null,
      demandSimpleError: null,
      rateCustomerError: null,
      demandThrottleError: null,
      rateEscalatorError: null,
     });
  }

  async complexSetState(target, value) {
    const update = this.state.rateSchedule;
    update[target] = value;
    await this.setState({ rateSchedule: update });
  }

  render() {
    const { rateSchedule } = this.state;
    const RATE_TYPES = ['blended', 'simple'];

    return (
      <ScheduleModal
        isVisible={this.props.showForm}
        title={`${_.capitalize(this.state.mode)} Rate Schedule`}
        onCancel={() => this.dismissForm()}
        onSubmit={() => this.onSubmit()}
      >
        <StringInput
          label="Name"
          placeholder="schedule name"
          value={rateSchedule.name}
          onChange={this.complexSetState.bind(this)}
          target="name"
          error={this.state.nameError !== null}
          errorMessage={this.state.nameError}
        />
        <View style={styles.tabSectionContainer}>
          <View style={styles.tabContainer}>
            {RATE_TYPES.map(type => (
              <Tab
                key={type}
                onPress={() => this.complexSetState('rate_type', type)}
                title={type}
                activeTab={rateSchedule.rate_type === type}
              />
            ))}
          </View>
        </View>

        <View style={styles.tabBox}>
          { (rateSchedule.rate_type === 'blended') &&
            <View style={{ marginTop: 5 }}>
              <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Blended Electricity Rate'}</FixedFormLabel>
              <NumberInput
                target={'kwh_cost'}
                value={presentOrZero(rateSchedule.kwh_cost) ? String(rateSchedule.kwh_cost) : null}
                placeholder={'$/kWh'}
                unit={'$/kWh'}
                unitPosition={'right'}
                onChange={this.complexSetState.bind(this)}
                error={this.state.costError !== null}
                errorMessage={this.state.costError}
                integer={false}
                roundTo={3}
              />
            </View>
          }

          { (rateSchedule.rate_type === 'simple') &&
            <View style={{ marginTop: 5 }}>
              <View style={{flex: 1, marginBottom: 10}}>
                <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Energy Rate'}</FixedFormLabel>
                <NumberInput
                  target={'kwh_cost_simple'}
                  value={presentOrZero(rateSchedule.kwh_cost_simple) ? String(rateSchedule.kwh_cost_simple) : null}
                  placeholder={'$/kWh'}
                  unit={'$/kWh'}
                  unitPosition={'right'}
                  onChange={this.complexSetState.bind(this)}
                  error={this.state.costSimpleError !== null}
                  errorMessage={this.state.costSimpleError}
                  integer={false}
                  roundTo={3}
                />
              </View>
              <View style={{flex: 1, marginBottom: 10}}>
                <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Demand Rate'}</FixedFormLabel>
                <NumberInput
                  target={'kw_demand_cost'}
                  value={presentOrZero(rateSchedule.kw_demand_cost) ? String(rateSchedule.kw_demand_cost) : null}
                  placeholder={'$/kW'}
                  unit={'$/kW'}
                  unitPosition={'right'}
                  onChange={this.complexSetState.bind(this)}
                  error={this.state.demandSimpleError !== null}
                  errorMessage={this.state.demandSimpleError}
                  integer={false}
                  roundTo={3}
                />
              </View>
              <View style={{flex: 1, marginBottom: 10}}>
                <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Customer Rate'}</FixedFormLabel>
                <NumberInput
                  target={'rate_customer'}
                  value={presentOrZero(rateSchedule.rate_customer) ? String(rateSchedule.rate_customer) : null}
                  placeholder={'$/month'}
                  unit={'$/Month'}
                  unitPosition={'right'}
                  onChange={this.complexSetState.bind(this)}
                  error={this.state.rateCustomerError !== null}
                  errorMessage={this.state.rateCustomerError}
                  integer={false}
                  roundTo={3}
                />
              </View>
              <View style={{flex: 1, marginBottom: 10}}>
                <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Demand Reduction'}</FixedFormLabel>
                <NumberInput
                  target={'demand_utilization'}
                  value={presentOrZero(rateSchedule.demand_utilization) ? rateSchedule.demand_utilization : null}
                  placeholder={'percent reduction'}
                  hint={'Set the amount of demand reduction to include in your proposal.'}
                  unit={'%'}
                  unitPosition={'right'}
                  onChange={this.complexSetState.bind(this)}
                  error={this.state.demandThrottleError !== null}
                  errorMessage={this.state.demandThrottleError}
                  integer={true}
                />
              </View>
            </View>
          }
        </View>
        <View style={{ marginTop: 7 }}>
          <FixedFormLabel labelStyle={{ justifyContent: 'center' }}>{'Rate Escalator'}</FixedFormLabel>
          <NumberInput
            target={'rate_escalator'}
            value={presentOrZero(rateSchedule.rate_escalator) ? String(rateSchedule.rate_escalator) : null}
            placeholder={'inheriting project default'}
            unit={'%'}
            unitPosition={'right'}
            onChange={this.complexSetState.bind(this)}
            error={this.state.rateEscalatorError !== null}
            errorMessage={this.state.rateEscalatorError}
            integer={false}
            minimumValue={-100}
            roundTo={3}
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

RateForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  showForm: PropTypes.bool.isRequired,
  project: PropTypes.shape({
    checkDefaultMobileSchedule: PropTypes.func.isRequired,
  }).isRequired,
  rateSchedule: PropTypes.object,
};

export { RateForm };
