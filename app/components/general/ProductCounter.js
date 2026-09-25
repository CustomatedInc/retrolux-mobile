import React from 'react';
import PropTypes from 'prop-types';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { CalculatorInput } from 'react-native-calculator'
// import { CalculatorInput } from '../customCalculator';
import { GS, PRIMARY_BLUE, ACTIVE_OPACITY, LIGHT_BLUE, LIGHT_GREEN } from './../../resources/styles/globals';

const ProductCounter = (props) => {
  const {
    containerStyle,
    textStyle,
    height,
    quantity,
    quantityInputFlex,
    iconSize,
    onChangeText,
    onIncrement,
    onDecrement,
  } = props;

  const heightStyle = { height: height || 45 };

  return (
    <View style={[styles.qtyContainer, containerStyle]}>
      <TouchableOpacity
        activeOpacity={ACTIVE_OPACITY}
        onPress={onDecrement}
        style={[styles.leftQty, styles.qtyButton, heightStyle]}
      >
        <Icon name="remove" color="white" size={iconSize} />
      </TouchableOpacity>
      <View style={{ flex: quantityInputFlex }}>
        <CalculatorInput
          placeholder={"QTY"}
          value={quantity}
          onBeforeChange={(value, valueAsString) => {
            onChangeText(valueAsString)
            return true
          }}
          //styles
          fieldContainerStyle={[styles.numInput, heightStyle]}
          fieldTextStyle={[textStyle, { color: '#212121', textAlign: 'center' }]}
          // modal styles
          width={600}
          displayTextAlign={"right"}
          displayHeight={100}
          modalBackdropStyle={{ justifyContent: 'center', alignItems: 'center' }}
          displayBackgroundColor={'#FAFAFD'}
          displayColor={'#3E4D53'}
          // modal button styles
          fontSize={25} // button font size
          numericButtonBackgroundColor={LIGHT_BLUE}
          numericButtonColor={'white'} // button text color
          actionButtonBackgroundColor={PRIMARY_BLUE}
          actionButtonColor={'white'} // button text color
          acceptButtonBackgroundColor={LIGHT_GREEN}
          // to make input integer only
          noDecimal
          roundTo={0}
        />
      </View>
      <TouchableOpacity
        activeOpacity={ACTIVE_OPACITY}
        onPress={onIncrement}
        style={[styles.rightQty, styles.qtyButton, heightStyle]}
      >
        <Icon name="add" color="white" size={iconSize} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  numInput: {
    height: '100%',
    backgroundColor: 'white',
    margin: 0,
    padding: 5,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: LIGHT_BLUE,
    borderBottomColor: LIGHT_BLUE,
  },

  qtyContainer: {
    ...GS.rowGrow,
    ...GS.center,
  },

  qtyButton: {
    paddingHorizontal: 5,
    ...GS.center,
    ...GS.flex1,
    backgroundColor: LIGHT_BLUE,
  },

  leftQty: {
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },

  rightQty: {
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },

});

ProductCounter.propTypes = {
  containerStyle: PropTypes.object,
  textStyle: PropTypes.object,
  height: PropTypes.number,
  quantity: PropTypes.string.isRequired,
  quantityInputFlex: PropTypes.number,
  iconSize: PropTypes.number,
  onChangeText: PropTypes.func.isRequired,
  onIncrement: PropTypes.func.isRequired,
  onDecrement: PropTypes.func.isRequired,
};

ProductCounter.defaultProps = {
  containerStyle: {},
  textStyle: {},
  iconSize: 46,
  quantityInputFlex: 2,
  height: null,
}

export { ProductCounter };
