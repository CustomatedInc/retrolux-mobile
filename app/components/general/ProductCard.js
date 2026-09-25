import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';

import { GS, GRAY, SPACING_S, SPACING_XS, PALE_GREEN, DARKER_GRAY } from '../../resources/styles/globals';

const ProductCard = (props) => {
  const {
    cardWidth,
    selected,
    product,
    onPress,
  } = props;

  const subCardWidthStyle = { width: cardWidth - 12 };
  const highlightName = product.name.split(/[^A-Za-z0-9!?'".]/).filter(x => x) // does not handle ' and " well

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{
        width: cardWidth,
        borderRadius: 5,
        borderWidth: 3,
        backgroundColor: GRAY,
        margin: SPACING_XS,
        alignItems: 'center',
        borderColor: selected ? PALE_GREEN : GRAY,
        ...GS.flexMinus,
      }, styles.productCardContainer]}
    >
      <Text style={[subCardWidthStyle, styles.headerText]}>
        {highlightName.map((name, i) => {
          return (
            <Text key={i} >
              <Text style={{
                fontWeight: "normal"
              }}>
                {name}
              </Text>
              {i != highlightName.length - 1 && <Text>-</Text> }
            </Text>
          )
        })}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerText: {
    paddingHorizontal: 10,
    paddingVertical: 40,
    fontSize: 18,
    textAlign: 'center',
    alignSelf: 'center',
    ...GS.darkestGray,
    ...GS.centered,
  },

  leftText: {
    color: DARKER_GRAY,
    ...GS.flex1,
  },

  rightText: {
    color: DARKER_GRAY,
    ...GS.flexMinus,
  },

  attributeContainer: {
    padding: SPACING_S,
    ...GS.borderTopThin,
    ...GS.row,
    ...GS.bgLightestGray,
  },

  productCardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

export default ProductCard;
