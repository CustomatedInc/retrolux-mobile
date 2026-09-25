import React from 'react';
import { StyleSheet, View, TextInput, Text } from 'react-native';
import { Icon, FormValidationMessage } from 'react-native-elements';
import HelperText from './HelperText'

const AddressInput = props => {

  const {
    addressOneTarget,
    addressOneValue,
    addressTwoTarget,
    addressTwoValue,
    cityTarget,
    cityValue,
    editable,
    error,
    errorMessage,
    helperText,
    keyboardType,
    label,
    onChange,
    stateTarget,
    stateValue,
    zipCodeTarget,
    zipCodeValue
  } = props

  let textColor = '#000000';
  if (!editable) { textColor = '#86939E' }

  let validationMessage = null;
  if (error) {
    validationMessage = <FormValidationMessage labelStyle={{ marginTop: 0, fontStyle: 'italic', fontSize: 12 }}>{'*' + errorMessage}</FormValidationMessage>;
  }

  return (
    <View>
      <Text>{label}</Text>
      <View style={{ borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FFF', marginVertical: 5, marginHorizontal: 20, borderRadius: 3}}>
        <TextInput
          editable={editable}
          onChangeText={(text) => onChange(addressOneTarget, text)}
          placeholder="Address 1"
          style={{ color: textColor, backgroundColor: editable ? '#FFF' : '#F5F7F8', fontSize: 15, padding: 5, height: 35, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}
          value={addressOneValue}
        />
        <TextInput
          editable={editable}
          onChangeText={(text) => onChange(addressTwoTarget, text)}
          placeholder="Address 2"
          style={{ color: textColor, backgroundColor: editable ? '#FFF' : '#F5F7F8', fontSize: 15, padding: 5, height: 35, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}
          value={addressTwoValue}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            editable={editable}
            placeholder="City"
            style={{ color: textColor, backgroundColor: editable ? '#FFF' : '#F5F7F8', fontSize: 15, padding: 5, height: 35, flex: 3, borderRightWidth: 1, borderRightColor: '#E0E0E0' }}
            onChangeText={(text) => onChange(cityTarget, text)}
            value={cityValue}
          />
          <TextInput
            editable={editable}
            placeholder="State"
            style={{ color: textColor, backgroundColor: editable ? '#FFF' : '#F5F7F8', fontSize: 15, padding: 5, height: 35, flex: 1, borderRightWidth: 1, borderRightColor: '#E0E0E0' }}
            onChangeText={(text) => onChange(stateTarget, text)}
            value={stateValue}
          />
          <TextInput
            editable={editable}
            placeholder="Zip Code"
            maxLength={5}
            onChangeText={(text) => onChange(zipCodeTarget, text)}
            style={{ color: textColor, backgroundColor: editable ? '#FFF' : '#F5F7F8', fontSize: 15, padding: 5, height: 35, flex: 2 }}
            value={zipCodeValue}
          />
        </View>
      </View>
    </View>
  )
}

var styles = StyleSheet.create({

  stringInput: {
    backgroundColor: '#fff',
    borderRadius: 3,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 20,
    marginRight: 5,
    height: 35,
    padding: 10,
    fontSize: 14,
    flex: 1
  }
});

export default AddressInput;
