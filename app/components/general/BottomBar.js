import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { GS, SECONDARY_BLUE } from './../../resources/styles/globals';

const BottomBar = props => {

  const {
    children
  } = props


  return(
    <View style={styles.bottomBar}>
      {children}
    </View>
  );
}

var styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: SECONDARY_BLUE,
    flexDirection: 'row'
  },

});

export { BottomBar };
