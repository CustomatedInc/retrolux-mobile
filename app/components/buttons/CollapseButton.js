import React from 'react';
import { Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native';

import { FixedText } from '../';
import { GS, SECONDARY_BLUE } from '../../resources/styles/globals';

const CollapseButton = props => {

  const {
    onPress,
    toggle
  } = props;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, ...GS.center, width: '100%' }}
    >

      {!!toggle &&
        <Icon
          name={'caret-down'}
          iconStyle={{ color: SECONDARY_BLUE }}
          size={30}
          type={'font-awesome'}
        />
      }

      {!toggle &&
        <Icon
          name={'caret-right'}
          iconStyle={{ color: SECONDARY_BLUE }}
          size={30}
          type={'font-awesome'}
        />
      }

    </TouchableOpacity>
  )
}

export { CollapseButton };
