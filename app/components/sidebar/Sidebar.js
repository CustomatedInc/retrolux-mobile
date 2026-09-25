import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { GS } from './../../resources/styles/globals';

const Sidebar = props => {

  const { children, containerStyle } = props

  return (
    <View style={{flex:1}}>
      <ScrollView style={[styles.sidebar, containerStyle]}>
        {children}
      </ScrollView>
    </View>
  );
}

var styles = StyleSheet.create({
  sidebar: {
    backgroundColor: 'white',
    ...GS.flex1,
    ...GS.border,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
});

export default Sidebar;
