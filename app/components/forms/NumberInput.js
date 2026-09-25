import React from 'react';
import { StyleSheet, View, TextInput, Text, Alert, TouchableOpacity } from 'react-native';
import FixedText from '../general/FixedText'
import { GS, MID_GRAY, LIGHT_BLUE, PRIMARY_BLUE, LIGHT_GREEN, BLACK_GRAY } from '../../resources/styles/globals';
import { CalculatorInput } from 'react-native-calculator'
// import { CalculatorInput } from '../customCalculator';
import { Icon } from 'react-native-elements';

const NumberInput = props => {

  const {
    error,
    errorMessage,
    onChange,
    hint,
    placeholder,
    target,
    value,
    integer,
    roundTo,
    unitPosition,
    unit,
    needToBeString,
    quickList,
    minimumValue

  } = props

  let validationMessage = null;
  if (error) {
    validationMessage = <FixedText style={{ color: 'red', marginHorizontal: 20, marginTop: 5, fontStyle: 'italic', fontSize: 12 }}>{'*' + errorMessage}</FixedText>;
  } else if (hint) {
    validationMessage = <FixedText style={{ color: '#3E4D53', marginHorizontal: 20, marginTop: 5, fontStyle: 'italic', fontSize: 12 }}>{hint}</FixedText>;
  }

  let unitLocation = null;
  let unitString = null;
  if (unitPosition) {
    unitLocation = unitPosition;
    unitString = unit;
  } else {
    unitLocation = '';
    unitString = '';
  }

  const minValue = minimumValue ? minimumValue : 0

  let quickListFirstThree = []
  let quickListSecondThree = []
  if (!!quickList) {
    const parsedQuickList = JSON.parse(quickList)
    for (let i = 0; i < parsedQuickList.length; i++) {
      const quickItem = parsedQuickList[i];

      if (i < 3) {
        quickListFirstThree.push(
          <TouchableOpacity key={i}
            style={[styles.quickListButton, 
              { marginLeft: (i != 0) ? 7.5 : 0, 
                backgroundColor: (value == quickItem && value) ? PRIMARY_BLUE : 'white',
              }]}
            onPress={() => { onChange(target, quickItem) }}
          >
            <FixedText numberOfLines={1} style={{fontSize: 9, textAlign: 'center', color: (value == quickItem && value) ? 'white' : BLACK_GRAY }}>{quickItem}</FixedText>
          </TouchableOpacity>
        )
      } else {
        quickListSecondThree.push(
          <TouchableOpacity key={i}
            style={[styles.quickListButton, 
              { marginLeft: (i != 3) ? 7.5 : 0, 
                backgroundColor: (value == quickItem && value) ? PRIMARY_BLUE : 'white',
              }]}
            onPress={() => { onChange(target, quickItem) }}
          >
            <FixedText numberOfLines={1} style={{fontSize: 9, textAlign: 'center', color: (value == quickItem && value) ? 'white' : BLACK_GRAY }}>{quickItem}</FixedText>
          </TouchableOpacity>
        )
      }
    }
    // render filler for correct layout maybe need?
    // if (topThree.length % 3 == 2){
    //   topThree.push(
    //     <TouchableOpacity key={'filler'}
    //       style={{ flex: 1, height: 26.5 }}
    //       onPress={() => { null }}>
    //     </TouchableOpacity>
    //   )
    // }
  }

  return (
    <View>
      <View style={{flexDirection: 'row', marginHorizontal: 20}}>

        {unitLocation === 'left' &&
          <View style={[
            styles.unit,
            {
              borderRightWidth: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderColor: error ? 'red' : MID_GRAY
            }]}>
            <Text style={{color: '#3E4D53'}}>{unitString}</Text>
          </View>
        }

        <View style={{flex: 1}}>
          <CalculatorInput
            placeholder={placeholder}
            value={value}
            onBeforeChange={(value, valueAsString) => {
              if (value >= minValue) {
                !!needToBeString ? onChange(target, valueAsString) : onChange(target, value);
                return true
              }
              Alert.alert(`Value needs to be greater than ${minValue}`)
              return false
            }}
            //styles
            fieldContainerStyle={[
              styles.numInput,
              {
                borderColor: error ? 'red' : MID_GRAY,
                borderBottomColor: error ? 'red' : MID_GRAY,
                borderTopLeftRadius: unitLocation === 'left' ? 0 : 5,
                borderBottomLeftRadius: unitLocation === 'left' ? 0 : 5,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0
              }]}
            fieldTextStyle={{ fontSize: 14, color: (!value && value !== 0) ? "#d7d7db" : '#212121'}}
            fontSize={25} // button font size
            width={600}
            displayTextAlign={"right"}
            displayHeight={100}
            modalBackdropStyle={{justifyContent: 'center', alignItems: 'center'}}
            // button styles
            numericButtonBackgroundColor={LIGHT_BLUE}
            numericButtonColor={'white'} // button text color
            actionButtonBackgroundColor={PRIMARY_BLUE}
            actionButtonColor={'white'} // button text color
            acceptButtonBackgroundColor={LIGHT_GREEN}
            displayBackgroundColor={'#FAFAFD'}
            displayColor={'#3E4D53'}
            // to make input integer only
            noDecimal={integer ? true : false}
            roundTo={roundTo ? roundTo : 2}
          />
        </View>

        {unitLocation === 'right' &&
          <View style={[
            styles.unit,
            {
              borderRadius: 0,
              borderLeftWidth: 0,
              borderColor: error ? 'red' : MID_GRAY
            }]}>
            <Text style={{color: '#3E4D53'}}>{unitString}</Text>
          </View>
        }

        <TouchableOpacity
          style={[styles.clear, {borderColor: error ? 'red' : MID_GRAY}]}
          onPress={() => onChange(target, null)}
        >
          <Icon name="times-circle" color={MID_GRAY} iconStyle={{ padding: 5 }} size={15} type={'font-awesome'} />
        </TouchableOpacity>

      </View>

      {!!quickList &&
        <View style={{ marginHorizontal: 20 }}>
          <View style={styles.quickListHolder}>
            {quickListFirstThree.map((quiListItem) => (
              quiListItem
            ))}
          </View>
          <View style={styles.quickListHolder}>
            {quickListSecondThree.map((quiListItem) => (
              quiListItem
            ))}
          </View>
        </View>
      }

      {validationMessage}
    </View>
  )
}

var styles = StyleSheet.create({

  unit: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,
    marginTop: 7.5,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#ECEFF1',
  },

  clear: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,
    marginTop: 7.5,
    paddingVertical: 5,
    paddingHorizontal: 7.5,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderRadius: 5,
    backgroundColor: '#ECEFF1',
  },

  numInput: {
    height: 35,
    backgroundColor: 'white',
    marginTop: 7.5,
    margin: 0,
    padding: 5,
    borderWidth: 1,
    borderBottomColor: MID_GRAY,
    borderRadius: 5,
  },

  quickListButton: {
    flex: 1,
    padding: 2.5,
    ...GS.center,
    ...GS.borderRounded,
    ...GS.borderThin,
    height: 26.5,
  },

  quickListHolder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },

});

export default NumberInput;
