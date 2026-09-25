import { StyleSheet } from 'react-native';

import { GS, DARKER_GRAY } from './globals';

const sideBarStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 25,
    ...GS.bgDarkestGray,
  },

  tabsContainer: {
    width: 60,
    flex: -1,
    borderTopWidth: 1,
    borderTopColor: DARKER_GRAY,
    ...GS.bgDarkestGray,
  },

  tabContainer: {
    flex: 1,
    paddingHorizontal: 2.5,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 8,
    paddingTop: 2,
  },

  contentContainer: {
    flex: 1,
    ...GS.bgLightGray,
  },
});

export default sideBarStyles;
