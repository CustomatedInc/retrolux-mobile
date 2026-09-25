import React, { Component } from 'react';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import realm from '../../database/realm';
// import { GS, WHITE, LIGHT_GREEN } from 'RetroluxMobile/app/resources/styles/globals';
import { truncateString } from '../../lib/numberHelpers';
import { Area } from '../../database/models';
import { Text, TouchableOpacity, View, TouchableWithoutFeedback, StyleSheet } from 'react-native';

class FloorPlanHeader extends Component {

  constructor(props) {
    super(props);

    this.state = {
      currentPin: props.currentPin,
      backgroundColor: '#ffffff',
      showSyncButton: false,
      textColor: '#ffffff',
      highlightColor: '#ffffff',
      prevProps: {}
    };
  }

  componentDidMount() {
    this.getBackgroundColor(this.props.currentPin)
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const prevProps = prevState.prevProps || {};
    const currentPin = prevProps.currentPin != nextProps.currentPin ? nextProps.currentPin : prevState.currentPin;
    return { prevProps: nextProps, currentPin }
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.currentPin != this.state.currentPin){
      this.getBackgroundColor(this.state.currentPin)
    }
  }

  neededPinCount(currentPin) {
    if (currentPin.pinnable_type != 'Area') { return ;}
    neededPinCount = 1
    areaPinsFields = ['first_illuminance', 'second_illuminance', 'third_illuminance', 'fourth_illuminance', 'fifth_illuminance']

    for (let i = 0; i < areaPinsFields.length; i++) {
      const field = areaPinsFields[i];
      let areaAttributes = JSON.parse(currentPin.pinnable.custom_attributes)
      if ((areaAttributes.hasOwnProperty(field)) && (areaAttributes[field] || areaAttributes[field] === 0)) {
        neededPinCount++
      }
    }

    return neededPinCount
  }

  getBackgroundColor(currentPin) {
    syncButton = false
    switch (currentPin.pinnable_type) {
      case 'Area':
        currentPinCount = currentPin.pinnable.pins.length
        neededPinCount = this.neededPinCount(currentPin)
        if (currentPinCount < neededPinCount) {
          bgColor = '#fff2cc'
          textColor = '#5f4703'
          highlightColor = '#f8e5ac'
        } else if (currentPinCount > neededPinCount) {
          bgColor = '#f8cecc'
          textColor = '#7e2722'
          highlightColor = '#eeb7b4'
        } else if (currentPinCount == neededPinCount) {
          bgColor = '#d5e8d4'
          textColor = '#185715'
          highlightColor = '#c0dabf'
        }
        break;
      case 'ExistingFixture':
        currentPinCount = currentPin.pinnable.pins.length
        existingCount = currentPin.pinnable.existing_count
        if (currentPinCount < existingCount) {
          bgColor = '#fff2cc'
          textColor = '#5f4703'
          highlightColor = '#f8e5ac'
          syncButton = true
        } else if (currentPinCount > existingCount) {
          bgColor = '#f8cecc'
          textColor = '#7e2722'
          highlightColor = '#eeb7b4'
          syncButton = true
        } else if (currentPinCount == existingCount) {
          bgColor = '#d5e8d4'
          textColor = '#185715'
          highlightColor = '#c0dabf'
        }
        break;
      case 'Attachment':
        if (!!currentPin.pin) {
          bgColor = '#d5e8d4'
          textColor = '#185715'
          highlightColor = '#c0dabf'
        } else {
          bgColor = '#fff2cc'
          textColor = '#5f4703'
          highlightColor = '#f8e5ac'
        }
        break;
    }

    this.setState({
      backgroundColor: bgColor,
      textColor: textColor,
      highlightColor: highlightColor,
      showSyncButton: syncButton,
    })
  }

  async syncExistingCount() {
    await realm.write(() => {
      this.state.currentPin.pinnable.existing_count = this.state.currentPin.pinnable.pins.length
    })
    this.getBackgroundColor(this.state.currentPin)
  }

  async changePinnableSubType(newSubType) {
    currentPin = {
      'pinnable': this.state.currentPin.pinnable,
      'pinnable_type': this.state.currentPin.pinnable_type,
      'pinnable_sub_type': newSubType,
      'pin': await this.state.currentPin.pinnable.getPin(newSubType)
    }

    this.props.setCurrentPinViaPinnable(currentPin)
  }

  render() {
    const currentPinnable = this.state.currentPin.pinnable;
    const areaAttributes = currentPinnable.custom_attributes ? JSON.parse(currentPinnable.custom_attributes) : {};

    return (
      <View style={[styles.headerHolder, { backgroundColor: this.state.backgroundColor }]}>

        {this.state.currentPin.pinnable_type == 'Area' &&
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <View>
              <TouchableOpacity onPress={() => this.props.changeEditingArea(currentPinnable)} >
                <Text style={{ color: this.state.textColor }}>{truncateString(currentPinnable.name, 30)}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center'}}>

              <TouchableOpacity
                style={{ flexDirection: 'row', paddingVertical: 1.5, paddingHorizontal: 7.5, borderRadius: 5, backgroundColor: this.state.currentPin.pinnable_sub_type == 'location' ? this.state.highlightColor : null }}
                onPress={() => this.changePinnableSubType('location') }
              >
                <Icon
                  name={'object-group'}
                  iconStyle={{ color: this.state.textColor }}
                  size={18}
                  type={'font-awesome'}
                />
              </TouchableOpacity>

              {['first_illuminance', 'second_illuminance', 'third_illuminance', 'fourth_illuminance', 'fifth_illuminance'].map((illuminance) => (
                <View key={illuminance}>
                  {(areaAttributes.hasOwnProperty(illuminance)) && (areaAttributes[illuminance] || areaAttributes[illuminance] === 0) &&
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 1.5, paddingHorizontal: 7.5, borderRadius: 5, marginLeft: 20, backgroundColor: this.state.currentPin.pinnable_sub_type == illuminance ? this.state.highlightColor : null }}
                      onPress={() => this.changePinnableSubType(illuminance) }
                    >
                      <View>
                        {illuminance == 'first_illuminance' && <Text style={{ color: this.state.textColor }}>1st</Text> }
                        {illuminance == 'second_illuminance' && <Text style={{ color: this.state.textColor }}>2nd</Text> }
                        {illuminance == 'third_illuminance' && <Text style={{ color: this.state.textColor }}>3rd</Text> }
                        {illuminance == 'fourth_illuminance' && <Text style={{ color: this.state.textColor }}>4th</Text> }
                        {illuminance == 'fifth_illuminance' && <Text style={{ color: this.state.textColor }}>5th</Text> }
                      </View>
                      <Icon
                        name={'sun-o'}
                        iconStyle={{ color: this.state.textColor, marginLeft: 2.5 }}
                        size={18}
                        type={'font-awesome'}
                      />
                    </TouchableOpacity>
                  }
                </View>
              ))}

            </View>

          </View>
        }

        {this.state.currentPin.pinnable_type == 'ExistingFixture' &&
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <View>
              <TouchableOpacity onPress={() => this.props.editAreaProduct(currentPinnable)} >
                <Text style={{ color: this.state.textColor }}>{`(${currentPinnable.code}) ${currentPinnable.product_name}`}</Text>
              </TouchableOpacity>
            </View>

            <View style={{flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: this.state.textColor }}>Count {currentPinnable.pins.length}/{currentPinnable.existing_count}</Text>

              {!!this.state.showSyncButton &&
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20, paddingVertical: 1.5, paddingHorizontal: 7.5, borderRadius: 5, backgroundColor: this.state.highlightColor }}
                  onPress={() => this.syncExistingCount()}
                >
                  <Text style={{ color: this.state.textColor }}>Match</Text>
                  <Icon
                    name={'refresh'}
                    iconStyle={{ color: this.state.textColor, marginLeft: 5,  }}
                    size={18}
                    type={'font-awesome'}
                  />
                </TouchableOpacity>
              }

            </View>
          </View>
        }

        {this.state.currentPin.pinnable_type == 'Attachment' &&
          <View>
            <TouchableOpacity onPress={() => this.props.changeEditingArea(currentPinnable.attachable)} >
              <Text style={{ color: this.state.textColor }}>Attachment ({currentPinnable.attachable.name})</Text>
            </TouchableOpacity>
          </View>
        }
      </View>
    )
  }
}

const styles = StyleSheet.create({
  headerHolder: {
    height: 30,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 2.5,
    marginBottom: 10,
    borderRadius: 5,
    justifyContent: 'center'
  }
});

FloorPlanHeader.propTypes = {
  currentPin: PropTypes.object.isRequired,
  setCurrentPinViaPinnable: PropTypes.func.isRequired,
  changeEditingArea: PropTypes.func.isRequired,
  editAreaProduct: PropTypes.func.isRequired,
};

export default FloorPlanHeader;
