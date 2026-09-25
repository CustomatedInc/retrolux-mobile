import React from 'react';
import { Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native';

import { FixedText } from '../';
import { GS, GREEN } from '../../resources/styles/globals';

const CopyButton = props => {

  const {
    onPress,
  } = props;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, ...GS.center, width: '100%' }}
    >
      <Icon
        name={'copy'}
        iconStyle={{ color: GREEN }}
        size={18}
        type={'font-awesome'}
      />
      <FixedText style={{ fontSize: 8.5, color: GREEN }}>copy</FixedText>
    </TouchableOpacity>
  )
}

export { CopyButton };
