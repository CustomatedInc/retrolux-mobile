import React from 'react';
import { Divider } from 'react-native-elements';
import { View } from 'react-native';
import { FixedText } from '../../components';

const FormGroupLabel = props => {

  const {
    children,
    label,
    divider,
  } = props;

  let dividingLine = null;
  if (divider || divider == undefined) {
    dividingLine = <Divider style={{ backgroundColor: '#E0E0E0', marginTop: 5, height: 1.5,  marginHorizontal: 20 }} />
  }

  return (
    <View>
      <FixedText
        style={{
          fontWeight: 'bold',
          fontSize: 18,
          color: '#546E7A',
          marginHorizontal: 20,
          marginTop: 15,
          marginBottom: 1,
        }}
      >
        {children}
      </FixedText>
      {dividingLine}
    </View>
  )
}

export default FormGroupLabel;
