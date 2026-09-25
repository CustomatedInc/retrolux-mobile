import React from 'react';
import { Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native';

import { FixedText } from '../';
import { GS } from '../../resources/styles/globals';

const DeleteButton = props => {

  const {
    onPress,
  } = props;

  return (

    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, ...GS.center, width: '100%' }}
    >
      <Icon
        name={'trash'}
        iconStyle={{ color: 'tomato' }}
        size={20}
        type={'font-awesome'}
      />
      <FixedText style={{ fontSize: 8.5, color: 'tomato' }}>delete</FixedText>
    </TouchableOpacity>
  )
}

export { DeleteButton };
