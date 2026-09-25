import React from 'react';
import { StyleSheet, View, TextInput, Text } from 'react-native';
import { Icon, FormValidationMessage } from 'react-native-elements';
import FixedFormLabel from './FixedFormLabel'
import HelperText from './HelperText'
import FixedText from '../general/FixedText'
import { GS, MID_GRAY } from '../../resources/styles/globals';

const StringInput = props => {

  const {
    error,
    errorMessage,
    helperText,
    keyboardType,
    label,
    onChange,
    placeholder,
    hint,
    target,
    value,
    multiline,
    autoCapitalize
  } = props

  let validationMessage = null;
  if (error) {
    validationMessage = <FixedText style={{ color: 'red', marginHorizontal: 20, marginTop: 2, fontStyle: 'italic', fontSize: 12 }}>{'*' + errorMessage}</FixedText>;
  } else if (hint) {
    validationMessage = <FixedText style={{ color: '#3E4D53', marginHorizontal: 20, marginTop: 2, fontStyle: 'italic', fontSize: 12 }}>{hint}</FixedText>;
  }

  let helperMessage = null;
  if (helperText != null && helperText != undefined) {
    helperMessage = <HelperText>{helperText}</HelperText>
  }

  let formLabel = null;
  if (label) {
    formLabel = <FixedFormLabel labelStyle={{ marginTop: 8 }}>{label}</FixedFormLabel>
  } else {
    formLabel = <View style={{ marginTop: 5 }}/>
  }

  return (
    <View>
      {formLabel}
      {helperMessage}
      <View style={{ flexDirection: 'row' }}>
        <TextInput
          autoCapitalize={ autoCapitalize ? autoCapitalize : 'sentences' }
          multiline={ multiline ? true : null }
          maxHeight={ multiline ? 250 : null }
          style={[styles.stringInput, { borderColor: error ? 'red' : MID_GRAY, minHeight: multiline ? 70 : 37, height: multiline ? null : 37 }]}
          value={value}
          keyboardType={keyboardType || 'default'}
          onChangeText={(text) => onChange(target, text)}
          placeholder={placeholder || null}
        />
      </View>
      {validationMessage}
    </View>
  )
}

var styles = StyleSheet.create({

  stringInput: {
    backgroundColor: '#fff',
    marginTop: 2,
    marginBottom: 0,
    marginLeft: 20,
    marginRight: 20,
    padding: 5,
    fontSize: 14,
    flex: 1,
    ...GS.borderThin,
    ...GS.borderRounded,
  }
});

export default StringInput;
