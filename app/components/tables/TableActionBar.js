import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GS } from '../../resources/styles/globals';

const TableActionBar = props => {

  const {
    children,
  } = props

  return(
    <View style={styles.actionBar}>
      {children}
    </View>
  )
}

var styles = StyleSheet.create({

  actionBar: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...GS.bgLightGray,
  }
});

export default TableActionBar;
