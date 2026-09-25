import React from 'react';
import { TouchableOpacity } from 'react-native';
import FixedText from '../general/FixedText';
import { PRIMARY_BLUE } from '../../resources/styles/globals';

const RLButton = props => {

  const {
    title,
    onPress,
    backgroundColor,
    buttonStyle,
    color,
  } = props;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        marginLeft: 8,
        height: 45,
        borderRadius: 5,
        backgroundColor: backgroundColor ? backgroundColor : PRIMARY_BLUE,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        ...buttonStyle,
      }}
    >
      <FixedText style={{ color: color || 'white', fontWeight: 'bold', fontSize: 10 }}>{title}</FixedText>
    </TouchableOpacity>
  )
}

export default RLButton;
