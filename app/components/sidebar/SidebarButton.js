import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FixedText } from '../index.js';
import { GS, SECONDARY_BLUE, DARKEST_GRAY } from './../../resources/styles/globals.js';
import { Icon } from 'react-native-elements';

const SidebarButton = props => {

  const {
    name,
    onPress,
    buttonStyle,
    textStyle,
    selected,
    icon,
  } = props

  if (icon) {
    iconInsert =  <Icon
                    name={icon}
                    iconStyle={{ color: selected ? 'white' : DARKEST_GRAY, paddingRight: 10 }}
                    size={15}
                    type={'font-awesome'}
                  />
  } else {
    iconInsert = <View/>
  }

  return(
    <TouchableOpacity
      style={[
        styles.sidebarButton,
        {...buttonStyle},
        { backgroundColor: selected ? SECONDARY_BLUE : 'white', flexDirection: icon ? 'row' : 'column', alignItems: icon ? 'center' : 'flex-start' },
      ]}
      onPress={onPress}>
      {iconInsert}
      <FixedText style={[textStyle, {color: selected ? 'white' : DARKEST_GRAY }]}>{name}</FixedText>
    </TouchableOpacity>
  )

}

var styles = StyleSheet.create({
  sidebarButton: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    ...GS.borderBottomThin,
  },
});

export default SidebarButton;
