// COLORS
export const LIGHTEST_BLUE = '#F0FAFE';
export const LIGHTER_BLUE = '#DBEFF8';
export const LIGHT_BLUE = '#63bbe3';
export const PRIMARY_BLUE = '#219FD8';
export const SECONDARY_BLUE = '#1C83B1';

export const LIGHT_GREEN = '#49D184';
export const PALE_GREEN = '#6DDA9C';
export const GREEN = '#33CF6C';

export const LIGHTEST_GRAY = '#FAFAFD';
export const LIGHT_GRAY = '#ECEFF1';
export const GRAY = '#E2E7EA';
export const MID_GRAY = '#BAC2C6';
export const DARK_GRAY = '#CFD8DC';
export const DARKER_GRAY = '#768C9A';
export const DARKEST_GRAY = '#3E4D53';
export const BLACK_GRAY = '#384449';

export const RED = '#E53935';

export const LIGHT_YELLOW = '#FCF8E3';
export const YELLOW = '#FAD291';
export const DARK_YELLOW = '#F6AE38';
export const WHITE = 'white'

// FONT
export const FONT_GRAY = '#37474F'
export const BOLD = '800';
export const FONT_SM = 12;
export const FONT_MD = 14;
export const FONT_LG = 16;
export const FONT_XL = 20;

// SPACING
export const SPACING_XS = 5;
export const SPACING_S = 10;
export const SPACING_M = 20;

// OTHER
export const TINTED = 'rgba(0,0,0,0.5)';
export const ACTIVE_OPACITY = 0.7; // used for TouchableOpacity
export const BORDER_RADIUS = 5;

export const GS = {
  /* UTILITY MIXINS
   *
   */
  white: { color: WHITE },
  gray: { color: GRAY },
  darkerGray: { color: DARKER_GRAY },
  darkestGray: { color: DARKEST_GRAY },
  darkYellow: { color: DARK_YELLOW },

  bgWhite: { backgroundColor: WHITE },
  bgBlue: { backgroundColor: PRIMARY_BLUE },
  bgLightBlue: { backgroundColor: LIGHT_BLUE },
  bgLightestBlue: { backgroundColor: LIGHTEST_BLUE },
  bgLightestGray: { backgroundColor: LIGHTEST_GRAY },
  bgLightGray: { backgroundColor: LIGHT_GRAY },
  bgGray: { backgroundColor: GRAY },
  bgMidGray: { backgroundColor: MID_GRAY },
  bgDarkestGray: { backgroundColor: DARKEST_GRAY },
  bgBlackGray: { backgroundColor: BLACK_GRAY },
  bgLightYellow: { backgroundColor: LIGHT_YELLOW },
  bgLightGreen: { backgroundColor: LIGHT_GREEN },
  bgRed: { backgroundColor: RED },

  smFont: { fontSize: FONT_SM },
  mdFont: { fontSize: FONT_MD },
  lgFont: { fontSize: FONT_LG },

  flex1: { flex: 1 },
  flex2: { flex: 2 },
  flex3: { flex: 3 },
  flexShrink: { flex: -1 },
  flexGrow: { flexGrow: 1 },

  p5: { padding: 5 },

  p10: { padding: 10 },
  px10: { paddingHorizontal: 10 },
  py10: { paddingVertical: 10 },
  pl10: { paddingLeft: 10 },

  p20: { padding: 20 },
  px20: { paddingHorizontal: 20 },
  pt20: { paddingTop: 20 },

  mt5: { marginTop: 5 },

  m10: { margin: 10 },
  mt10: { marginTop: 10 },
  mx10: { marginHorizontal: 10 },
  ml10: { marginLeft: 10 },

  m20: { margin: 20 },
  mx20: { marginHorizontal: 20 },
  mt20: { marginTop: 20 },
  mr20: { marginRight: 20 },
  mb20: { marginBottom: 20 },

  textCenter: { textAlign: 'center' },

  justify: { justifyContent: 'center' },
  center: { justifyContent: 'center', alignItems: 'center' },

  row: { flexDirection: 'row' },
  rowGrow: { flex: 1, flexDirection: 'row' },
  rowShrink: { flex: -1, flexDirection: 'row' },

  border: { borderWidth: 2, borderColor: GRAY },
  borderTop: { borderTopWidth: 2, borderTopColor: GRAY },
  borderBottom: { borderBottomWidth: 2, borderBottomColor: GRAY },
  borderLeft: { borderLeftWidth: 2, borderLeftColor: GRAY },

  borderThin: { borderWidth: 1, borderColor: MID_GRAY },
  borderBottomThin: { borderBottomWidth: 1, borderBottomColor: GRAY },
  borderTopThin: { borderTopWidth: 1, borderTopColor: GRAY },

  borderRounded: {
    borderRadius: BORDER_RADIUS,
  },

  borderTopRounded: {
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
  },

  borderBottomRounded: {
    borderBottomRightRadius: BORDER_RADIUS,
    borderBottomLeftRadius: BORDER_RADIUS,
  },

  /* REUSED COMPONENT STYLES
   *
   */
  blueHeader: {
    color: SECONDARY_BLUE,
    fontWeight: BOLD,
    fontSize: FONT_LG,
  },

  redHeader: {
    color: RED,
    fontWeight: BOLD,
    fontSize: FONT_LG,
  },

  yellowMessage: {
    color: DARK_YELLOW,
    fontWeight: BOLD,
  },

  grayHeading: {
    fontWeight: BOLD,
    color: DARKER_GRAY,
    fontSize: FONT_XL,
  },

  graySubheading: {
    fontWeight: BOLD,
    color: DARKER_GRAY,
    fontSize: FONT_MD,
  },

  fontAwesome: {
    fontFamily: 'fontawesome',
    fontSize: 25,
    color: 'white',
  },

  fontAwesomeGreen: {
    fontFamily: 'fontawesome',
    fontSize: 25,
    color: LIGHT_GREEN,
  },

  formSectionContainer: {
    backgroundColor: 'white',
    flex: 1,
    borderWidth: 2,
    borderColor: GRAY,
    borderRadius: BORDER_RADIUS,
    paddingBottom: 20,
  },

  tabContainer: {
    height: 40,
    flexDirection: 'row',
    paddingTop: 5,
  },
};
