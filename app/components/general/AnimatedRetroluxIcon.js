import React from 'react';
import { Easing, Animated } from 'react-native';

const AnimatedRetroluxIcon = props => {
  return (
    <Animated.Image
      style={{transform: [{rotate: spin}, { scale: 0.55 }] }}
      source={require('../../resources/images/logo.png')}
    />
  );
}

export default AnimatedRetroluxIcon;

const spinValue = new Animated.Value(0);

const spin = spinValue.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg']
});

Animated.loop(
  Animated.timing(
    spinValue,
    {
      toValue: 1,
      duration: 1300,
      easing: Easing.back(1.20158),
      useNativeDriver: true
    }
  )
).start();


