import React from 'react';
import { Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native';

import { FixedText } from '../';
import { GS, PRIMARY_BLUE } from '../../resources/styles/globals';

const EditButton = props => {

  const {
    onPress,
  } = props;

  return (

    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, ...GS.center, width: '100%' }}
    >
      <Icon
        name={'edit'}
        iconStyle={{ color: PRIMARY_BLUE }}
        size={20}
        type={'font-awesome'}
      />
      <FixedText style={{ fontSize: 8.5, color: PRIMARY_BLUE }}>edit</FixedText>
    </TouchableOpacity>
  )
}

export { EditButton };
