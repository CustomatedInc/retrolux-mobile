import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FixedText } from '../index.js'
import { GS, GRAY } from './../../resources/styles/globals.js';

const SidebarLabel = props => {

  const {
    label,
    children,
  } = props

  return (
    <View>
      <View style={styles.labelContainer}>
        <FixedText style={GS.blueHeader}>{label}</FixedText>
      </View>
      <View>
        {children}
      </View>
    </View>
  );
}

var styles = StyleSheet.create({
  labelContainer: {
    paddingHorizontal: 25,
    paddingVertical: 15,
    ...GS.borderBottomThin,
    ...GS.bgLightestGray,
  },
});

export default SidebarLabel;
