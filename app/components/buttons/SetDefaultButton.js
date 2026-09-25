import React from 'react';
import { Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native';
import { PRIMARY_BLUE, GS } from '../../resources/styles/globals';

const SetDefaultButton = props => {

  const {
    isChecked,
    onPress,
  } = props;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, ...GS.center, width: '100%' }}
    >

      <Icon
        name={!!isChecked ? 'circle' : 'circle-o'}
        iconStyle={{ color: PRIMARY_BLUE }}
        size={30}
        type={'font-awesome'}
      />

    </TouchableOpacity>
  )
}

export { SetDefaultButton };
