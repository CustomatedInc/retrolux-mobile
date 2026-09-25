import React from 'react';
import { StyleSheet, TouchableOpacity, View  } from 'react-native';
import FixedText from '../general/FixedText';
import { Icon } from 'react-native-elements';
// import { GS, DARKEST_GRAY, SECONDARY_BLUE, LIGHT_BLUE, LIGHT_GREEN } from 'RetroluxMobile/app/resources/styles/globals';
import { GS, DARKEST_GRAY, SECONDARY_BLUE, LIGHT_BLUE, LIGHT_GREEN } from './../../resources/styles/globals';

const ActionButton = props => {

  const {
    alt,
    backgroundColor,
    onPress,
    title,
    icon,
    insertStyle
  } = props

  if (icon) {
    iconInsert =  <Icon
                    name={icon}
                    iconStyle={{ color: alt ? SECONDARY_BLUE : 'white', paddingRight: 5 }}
                    size={20}
                    type={'font-awesome'}
                  />
  } else {
    iconInsert = <View/>
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.buttonStyle,
        insertStyle,
        { backgroundColor: alt ? 'white' : backgroundColor || LIGHT_GREEN },
        {
          borderWidth: alt ? 2 : 0,
          borderColor: alt ? LIGHT_BLUE : 'white',
          flexDirection: icon ? 'row' : 'column',
        }
      ]}
    >
      { iconInsert }
      <FixedText style={[styles.textStyle, { color: alt ? SECONDARY_BLUE : 'white' }]}>{title}</FixedText>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonStyle: {
    margin: 10,
    marginLeft: 0,
    height: 60,
    borderRadius: 5,
    paddingHorizontal: 15,
    ...GS.center,
  },

  textStyle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ActionButton;