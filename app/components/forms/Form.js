import React from 'react';
import { View } from 'react-native';
import { GS } from './../../resources/styles/globals';

const Form = props => {

  const {
    children,
  } = props

  return (
    <View style={[GS.flex1, GS.bgLightGray, { flexGrow: 1 }]}>
      {children}
    </View>
  )
}


export default Form;
