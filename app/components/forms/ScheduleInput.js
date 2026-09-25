import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {Picker} from '@react-native-picker/picker'
import { ClickableInput, FixedFormLabel, PickerModal, OperatingForm } from '../';
import { Icon } from 'react-native-elements';
import { MID_GRAY } from '../../resources/styles/globals';
import realm from '../../database/realm';

class ScheduleInput extends Component {

  constructor(props) {
    super(props);

    let label =  '';
    let pickerTitle = '';
    let target = '';

    switch (props.scheduleName) {
      case 'OperatingSchedule':
        label = 'Operating Schedule';
        pickerTitle = 'Pick an Operating Schedule';
        target = 'mobile_operating_schedule_id';
        break;

      case 'RateSchedule':
        label = 'Rate Schedule';
        pickerTitle = 'Pick a Rate Schedule';
        target = 'mobile_rate_schedule_id';
        break;

      case 'Cooling':
        label = 'Cooling Schedule';
        pickerTitle = 'Pick a Cooling Schedule';
        target = 'mobile_cooling_id';
        break;

      case 'Heating':
        label = 'Heating Schedule';
        pickerTitle = 'Pick a Heating Schedule';
        target = 'mobile_heating_id';
        break;
    }

    const currentSchedule = props.scheduleId ? realm.objects(props.scheduleName).filtered(`mobile_id = $0`, props.scheduleId)[0] : null
    const inputText = currentSchedule ? currentSchedule.name : props.defaultScheduleInput
    const holder = currentSchedule

    this.state = {
      label,
      pickerTitle,
      target,
      inputText,
      modalVisible: false,
      newModalVisible: false,
      holder,
      schedules: props.schedules
    };

    this.openNewScheduleModalVisible = this.openNewScheduleModalVisible.bind(this);
  }

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  async setSchedule(itemValue) {
    if (!itemValue) {
      this.setState({ holder: null, inputText: this.props.defaultScheduleInput });
    } else {
      const newSchedule = await realm.objects(this.props.scheduleName).filtered(`mobile_id = ${itemValue}`)[0];
      this.setState({ holder: newSchedule, inputText: newSchedule.name });
    }
  }

  async openNewScheduleModalVisible(visible) {
    if (this.state.area) {
      const newArea = await this.submitForm();
      if (!newArea) { return; }
    }
    this.setState({ newModalVisible: visible });
  }

  render() {
    const { target, label, pickerTitle, newModalVisible, modalVisible, holder } = this.state;

    return(
      <View style={{ flex: -1, marginTop: 8 }}>
        <FixedFormLabel>{label}</FixedFormLabel>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 9 }}>
            <ClickableInput
              onPress={() => this.setModalVisible(true)}
              title={this.state.inputText}
            />
          </View>

          {this.props.scheduleName == 'OperatingSchedule' ?
            <TouchableOpacity
              style={styles.newScheduleButton}
              onPress={() => this.openNewScheduleModalVisible(true)}
            >
              <Icon name="plus" color={'#FFFFFF'} iconStyle={{ padding: 5 }} size={15} type={'font-awesome'} />
            </TouchableOpacity>
          : null}

        </View>

        {/* Picker Modal -----------------------------------------------------*/}

        <PickerModal
          isVisible={modalVisible}
          onSubmit={() => {
            this.props.saveSchedule(target, holder ? holder.mobile_id : null ) 
            this.setModalVisible(false);
          }}
          title={pickerTitle}
          closePickerModal={() => {
            this.setModalVisible(false)
            const currentSchedule = this.props.scheduleId ? realm.objects(this.props.scheduleName).filtered(`mobile_id = $0`, this.props.scheduleId)[0] : null
            const inputText = currentSchedule ? currentSchedule.name : this.props.defaultScheduleInput
            const holder = currentSchedule
            this.setState({ inputText, holder })
          }}
        >
          <Picker
            selectedValue={holder ? holder.mobile_id : null}
            onValueChange={(itemValue, itemIndex) => this.setSchedule(itemValue)}
          >
            <Picker.Item key={0} label={this.props.defaultScheduleInput} value={null} />
            {this.state.schedules.map(schedule => (
              <Picker.Item key={schedule.mobile_id} label={schedule.name} value={schedule.mobile_id} />
            ))}
          </Picker>
        </PickerModal>


        {/* Operating Schedule Modal -----------------------------------------------------*/}

        {this.props.scheduleName == 'OperatingSchedule' ?
          <OperatingForm
            showForm={newModalVisible}
            onCancel={(operatingId) => {
              if (operatingId) {
                this.props.saveSchedule(target, operatingId)
              }
              this.openNewScheduleModalVisible(false);
            }}
            project={this.props.project}
          />
        : null}

      </View>
    )
  }
};

const styles = StyleSheet.create({
  newScheduleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,
    marginTop: 7.5,
    marginRight: 20,
    paddingVertical: 5,
    paddingHorizontal: 7.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: MID_GRAY,
    backgroundColor: '#49D184',
  }
});

ScheduleInput.propTypes = {
  scheduleName: PropTypes.string.isRequired,
  project: PropTypes.shape({ mobile_id: PropTypes.number.isRequired }).isRequired,
  saveSchedule: PropTypes.func.isRequired,
};

export default ScheduleInput;
