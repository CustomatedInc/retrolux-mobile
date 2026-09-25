import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import FixedText from './FixedText';
import { GS, DARKER_GRAY, DARKEST_GRAY, ACTIVE_OPACITY } from './../../resources/styles/globals';

const Tab = props => {
  const {
    title,
    activeTab,
    onPress,
    tabStyle,
    notification
  } = props

  let notificationBadge = null;

  if (!!notification) {
    notificationBadge = <View style={{backgroundColor: 'tomato', borderRadius: 100, padding: 2.5, marginLeft: 5, marginBottom: 5, height: 20, width: 20, ...GS.center}}>
                          <FixedText style={{fontSize: 10, color: 'white'}}>{notification}</FixedText>
                        </View>
  }

  return (
    <TouchableOpacity
      activeOpacity={ACTIVE_OPACITY}
      style={[ styles.tabs, activeTab && styles.activeTab, tabStyle, {flexDirection: notification ? 'row' : 'column'} ]}
      onPress={onPress}
    >
      <FixedText style={[styles.tabText, activeTab && styles.activeTabText]}>
        {title}
      </FixedText>
      {notificationBadge}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  tabs: {
    height: 40,
    paddingHorizontal: 20,
    ...GS.center,
    marginBottom: -1,
  },

  activeTab: {
    ...GS.bgLightestGray,
    ...GS.borderTopRounded,
    ...GS.border,
    borderBottomWidth: 0,
  },

  activeTabText: {
    color: DARKEST_GRAY,
  },

  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: DARKER_GRAY,
  },
});


export { Tab };
