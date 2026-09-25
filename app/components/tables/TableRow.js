import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, StyleSheet } from 'react-native';

import { GS } from '../../resources/styles/globals';

const TableRow = (props) => {
  const {
    altColor,
    children,
    rowStyle,
    bottomBorder,
    onPressRow,
    noVertPadding,
  } = props;

  return (
    <TouchableOpacity
      onPress={onPressRow}
      style={[
        styles.tableRow,
        rowStyle,
        altColor && styles.tableRowStripe,
        bottomBorder && styles.borderBottom
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({

  tableRow: {
    height: 60,
    flexDirection: 'row',
    paddingHorizontal: 5,
  },

  tableRowStripe: {
    ...GS.bgLightGray,
    paddingLeft: 25,
  },

  borderBottom: {
    ...GS.borderBottomThin,
  },
});

TableRow.propTypes = {
  altColor: PropTypes.bool,
  bottomBorder: PropTypes.bool,
  onPressRow: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

TableRow.defaultProps = {
  altColor: false,
  bottomBorder: false,
};

export default TableRow;
