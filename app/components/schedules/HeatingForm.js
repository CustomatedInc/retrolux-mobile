import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { View, StyleSheet } from 'react-native';
import {Picker} from '@react-native-picker/picker'
import { ScheduleModal } from './ScheduleModal';
import { StringInput, NumberInput } from '../';
import { Heating } from '../../database/models';
import { GS } from '../../resources/styles/globals';
import FixedFormLabel from '../forms/FixedFormLabel';

class HeatingForm extends Component {
  constructor(props) {
    super(props);

    const newHeating = {
      mobile_project_id: this.props.project.mobile_id,
      system_type: 'boiler',
      fuel_type: 'diesel',
      efficiency_type: 'cop',
    };

    const propsSchedule = this.props.heating;
    const heating = propsSchedule ? propsSchedule.toPlainObject() : newHeating;

    this.state = {
      heating,
      newHeating,
      mode: !this.props.heating ? 'create' : 'edit',
      nameError: null,
      annualRunTimeError: null,
      efficiencyValueError: null,
      fuelCostError: null,
    };
  }

  componentWillReceiveProps(nextProps) {
    const newHeating = {
      mobile_project_id: this.props.project.mobile_id,
      system_type: 'boiler',
      fuel_type: 'diesel',
      efficiency_type: 'cop',
    };

    const propsSchedule = nextProps.heating;
    const heating = !propsSchedule ? newHeating : propsSchedule.toPlainObject();
    this.setState({
      heating,
      mode: !propsSchedule ? 'create' : 'edit',
    });
  }

  async onSubmit() {
    await this.clearErrors();

    const errors = await Heating.validate(this.state.heating);
    this.setState(errors);
    if (Object.keys(errors).length !== 0) { return; }

    const schedule = await Heating.prepareFormData(this.state.heating, this.props.project);
    await Heating.create(schedule, (this.state.mode === 'edit'));

    if (this.state.mode === 'create') {
      this.props.project.checkDefaultMobileSchedule('Heating', 'mobile_heating_id', schedule.mobile_id);
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
    const update = this.state.heating;
    update[target] = value;
    await this.setState({ heating: update });
  }

  render() {
    const {
      heating,
      nameError,
      annualRunTimeError,
      efficiencyValueError,
      fuelCostError,
    } = this.state;

    return (
      <ScheduleModal
        isVisible={this.props.showForm}
        title={`${_.capitalize(this.state.mode)} Heating Schedule`}
        onCancel={() => this.dismissForm()}
        onSubmit={() => this.onSubmit()}
      >
        <StringInput
          label="Name"
          placeholder='schedule name'
          value={heating.name}
          onChange={this.complexSetState.bind(this)}
          target="name"
          error={nameError != null}
          errorMessage={nameError}
        />
        <View style={{ marginTop: 5 }}>
          <FixedFormLabel>{'Annual Run Time Percentage'}</FixedFormLabel>
          <NumberInput
            target={'annual_run_time'}
            value={heating.annual_run_time ? String(heating.annual_run_time) : null}
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
              value={heating.fuel_cost ? String(heating.fuel_cost) : null}
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
              value={heating.efficiency_value ? String(heating.efficiency_value) : null}
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
              selectedValue={heating.system_type}
              onValueChange={(itemValue, itemIndex) => this.complexSetState('system_type', itemValue)}
              itemStyle={styles.itemStyle}
              style={{ height: 100 }}
            >
              <Picker.Item label="Boiler" value="boiler" />
              <Picker.Item label="Electric Resistive" value="electric_resistive" />
              <Picker.Item label="Forced Air" value="forced_air" />
              <Picker.Item label="Furnace" value="furnace" />
              <Picker.Item label="Heat Pump" value="heat_pump" />
            </Picker>
          </View>
        </View>
        <View>
          <FixedFormLabel labelStyle={{ marginTop: 8 }}>Fuel Type</FixedFormLabel>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={heating.fuel_type}
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
              selectedValue={heating.efficiency_type}
              onValueChange={(itemValue, itemIndex) => this.complexSetState('efficiency_type', itemValue)}
              itemStyle={styles.itemStyle}
              style={{ height: 100 }}
            >
              <Picker.Item label="COP" value="cop" />
              <Picker.Item label="AFUE" value="afue" />
              <Picker.Item label="HSPF" value="hspf" />
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

HeatingForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  showForm: PropTypes.bool.isRequired,
  project: PropTypes.shape({
    checkDefaultMobileSchedule: PropTypes.func.isRequired,
  }).isRequired,
  heating: PropTypes.object,
};

export { HeatingForm };
