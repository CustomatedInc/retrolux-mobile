import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { View, StyleSheet } from 'react-native';
import {Picker} from '@react-native-picker/picker'
import { ScheduleModal } from './ScheduleModal';
import { StringInput, NumberInput } from '../';
import { Cooling } from '../../database/models';
import { GS } from '../../resources/styles/globals';
import FixedFormLabel from '../forms/FixedFormLabel';

class CoolingForm extends Component {
  constructor(props) {
    super(props);

    const newCooling = {
      mobile_project_id: this.props.project.mobile_id,
      system_type: 'air_conditioner',
      fuel_type: 'diesel',
      efficiency_type: 'cop',
    };

    const propsSchedule = this.props.cooling;
    const cooling = propsSchedule ? propsSchedule.toPlainObject() : newCooling;

    this.state = {
      cooling,
      newCooling,
      mode: !this.props.cooling ? 'create' : 'edit',
      nameError: null,
      annualRunTimeError: null,
      efficiencyValueError: null,
      fuelCostError: null,
    };
  }

  componentWillReceiveProps(nextProps) {
    const newCooling = {
      mobile_project_id: this.props.project.mobile_id,
      system_type: 'air_conditioner',
      fuel_type: 'diesel',
      efficiency_type: 'cop',
    };

    const propsSchedule = nextProps.cooling;
    const cooling = !propsSchedule ? newCooling : propsSchedule.toPlainObject();
    this.setState({
      cooling,
      mode: !propsSchedule ? 'create' : 'edit',
    });
  }

  async onSubmit() {
    await this.clearErrors();

    const errors = await Cooling.validate(this.state.cooling);
    this.setState(errors);
    if (Object.keys(errors).length !== 0) { return; }

    const schedule = await Cooling.prepareFormData(this.state.cooling, this.props.project);
    await Cooling.create(schedule, (this.state.mode === 'edit'));

    if (this.state.mode === 'create') {
      this.props.project.checkDefaultMobileSchedule('Cooling', 'mobile_cooling_id', schedule.mobile_id);
    }
    this.dismissForm();
  }

  dismissForm() {
    this.clearErrors();
    this.props.onCancel();
  }

  clearErrors() {
    this.setState({
      nameError: null,
      annualRunTimeError: null,
      efficiencyValueError: null,
      fuelCostError: null,
    });
  }

  async complexSetState(target, value) {
    const update = this.state.cooling;
    update[target] = value;
    await this.setState({ cooling: update });
  }

  render() {
    const {
      cooling,
      nameError,
      annualRunTimeError,
      efficiencyValueError,
      fuelCostError,
    } = this.state;

    return (
      <ScheduleModal
        isVisible={this.props.showForm}
        title={`${_.capitalize(this.state.mode)} Cooling Schedule`}
        onCancel={() => this.dismissForm()}
        onSubmit={() => this.onSubmit()}
      >
        <StringInput
          label="Name"
          placeholder='schedule name'
          value={cooling.name}
          onChange={this.complexSetState.bind(this)} 
          target="name"
          error={nameError != null}
          errorMessage={nameError}
        />
        <View style={{ marginTop: 5 }}>
          <FixedFormLabel>{'Annual Run Time Percentage'}</FixedFormLabel>
          <NumberInput
            target={'annual_run_time'}
            value={cooling.annual_run_time ? String(cooling.annual_run_time) : null}
            placeholder={'pecentage'}
            unit={'%'}
            unitPosition={'right'}
            onChange={this.complexSetState.bind(this)}
            error={annualRunTimeError !== null}
            errorMessage={annualRunTimeError}
            needToBeString={ true }
          />
        </View>
        <View style={{justifyContent: 'space-between',flexDirection: 'row'}}>
          <View style={{ flex: 1, marginTop: 5}}>
            <FixedFormLabel>{'Fuel Cost'}</FixedFormLabel>
            <NumberInput
              target={'fuel_cost'}
              value={cooling.fuel_cost ? String(cooling.fuel_cost) : null}
              placeholder={'fuel cost'}
              unit={'$'}
              unitPosition={'left'}
              onChange={this.complexSetState.bind(this)}
              error={fuelCostError !== null}
              errorMessage={fuelCostError}
              needToBeString={ true }
            />
          </View>
          <View style={{ flex: 1, marginTop: 5 }}>
            <FixedFormLabel>{'Efficiency Value'}</FixedFormLabel>
            <NumberInput
              target={'efficiency_value'}
              value={cooling.efficiency_value ? String(cooling.efficiency_value) : null}
              placeholder={'efficiency value'}
              onChange={this.complexSetState.bind(this)}
              error={efficiencyValueError !== null}
              errorMessage={efficiencyValueError}
              needToBeString={ true }
            />
          </View>
        </View>
        <View>
          <FixedFormLabel labelStyle={{ marginTop: 8 }}>System Type</FixedFormLabel>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={cooling.system_type}
              onValueChange={(itemValue, itemIndex) => this.complexSetState('system_type', itemValue)}
              itemStyle={styles.itemStyle}
              style={{ height: 100 }}
            >
              <Picker.Item label="Air Conditioner" value="air_conditioner" />
              <Picker.Item label="Chilled Water Loop" value="chilled_water_loop" />
              <Picker.Item label="Chiller" value="chiller" />
              <Picker.Item label="Evaporator" value="evaporator" />
              <Picker.Item label="Heat Pump" value="heat_pump" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </View>
        </View>
        <View>
          <FixedFormLabel labelStyle={{ marginTop: 8 }}>Fuel Type</FixedFormLabel>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={cooling.fuel_type}
              onValueChange={(itemValue, itemIndex) => this.complexSetState('fuel_type', itemValue)}
              itemStyle={styles.itemStyle}
              style={{ height: 100 }}
            >
              <Picker.Item label="Diesel (Gal)" value="diesel" />
              <Picker.Item label="Electricity (Rate Schedule)" value="electricity" />
              <Picker.Item label="Gas (Gal)" value="gas" />
              <Picker.Item label="Natural Gas (Therm)" value="natural_gas_therms" />
              <Picker.Item label="Natural Gas (Cubic Feet)" value="natural_gas_cubic_feet" />
              <Picker.Item label="Oil (Gal)" value="oil" />
              <Picker.Item label="Propane (Gal)" value="propane" />
            </Picker>
          </View>
        </View>
        <View>
          <FixedFormLabel labelStyle={{ marginTop: 8 }}>Efficiency Type</FixedFormLabel>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={cooling.efficiency_type}
              onValueChange={(itemValue, itemIndex) => this.complexSetState('efficiency_type', itemValue)}
              itemStyle={styles.itemStyle}
              style={{ height: 100 }}
            >
              <Picker.Item label="COP" value="cop" />
              <Picker.Item label="EER" value="eer" />
              <Picker.Item label="SEER" value="seer" />
            </Picker>
          </View>
        </View>
        <View style={{ marginBottom: 40 }} />
      </ScheduleModal>
    );
  }
}

var styles = StyleSheet.create({
  pickerWrapper: {
    backgroundColor: 'white',
    marginTop: 2,
    marginHorizontal: 20,
    ...GS.borderThin,
    ...GS.borderRounded,
  },

  itemStyle: {
    height: 100,
    fontSize: 16,
  },
});

CoolingForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  showForm: PropTypes.bool.isRequired,
  project: PropTypes.shape({
    checkDefaultMobileSchedule: PropTypes.func.isRequired,
  }).isRequired,
  cooling: PropTypes.object,
};

export { CoolingForm };
