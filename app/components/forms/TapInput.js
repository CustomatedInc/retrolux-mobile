import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { PRIMARY_BLUE, WHITE, BLACK_GRAY } from '../../resources/styles/globals';

const TapInput = props => {

  const {
    helperText,
    label,
    onChange,
    hint,
    target,
    value,
    types
  } = props

  return (
    <View style={styles.tapInputContainer}>
      {types.map((type, index) => (
        <TouchableOpacity
          key={type}
          style={[styles.selectButton,
            { borderTopLeftRadius: index == 0 ? 5 : 0,
            borderBottomLeftRadius: index == 0 ? 5 : 0,
            borderBottomRightRadius: index == types.length - 1 ? 5 : 0,
            borderTopRightRadius: index == types.length - 1 ? 5 : 0,
            backgroundColor: value == type ? PRIMARY_BLUE : WHITE }
          ]}
          onPress={() => onChange(target, value == type ? null : type)}
        >
          <Text style={{ color: value == type ? WHITE : BLACK_GRAY, fontSize: 10 }}>{
          typeof type === 'boolean' ? (type ? 'Yes' : 'No') : type.replace(/_/g, ' ')
          }</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

var styles = StyleSheet.create({

  tapInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 7.5
  },

  selectButton: {
    flex: 1,
    height: 35,
    padding: 5,
    borderColor: '#BAC2C6',
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -1,
  }
});

export default TapInput;
