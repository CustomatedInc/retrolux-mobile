import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';

import FixedText from '../general/FixedText';
import { GS, YELLOW } from '../../resources/styles/globals';

const WarningMessage = (props) => {
  const {
    message,
    containerStyle,
  } = props;


  return (
    <View style={[styles.warningCard, containerStyle]}>
      <FixedText style={[GS.fontAwesome, GS.darkYellow]}>
        &#xf06a;
      </FixedText>

      <FixedText style={[GS.yellowMessage, styles.message]}>
        {message}
      </FixedText>
    </View>
  );
};

const styles = StyleSheet.create({
  warningCard: {
    marginVertical: 20,
    padding: 20,
    flex: -1,
    ...GS.row,
    ...GS.border,
    borderColor: YELLOW,
    ...GS.borderRounded,
    ...GS.bgLightYellow,
  },

  message: {
    flex: 1,
    marginLeft: 20,
  },
});

WarningMessage.propTypes = {
  message: PropTypes.string.isRequired,
  containerStyle: PropTypes.object,
};

WarningMessage.defaultProps = {
  containerStyle: {},
};

export { WarningMessage };
