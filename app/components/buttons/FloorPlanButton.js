import React from 'react';
import { Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native';

import { FixedText } from '../';
import { GS, SECONDARY_BLUE } from '../../resources/styles/globals';

const FloorPlanButton = props => {

  const {
    onPress,
    mapStyle,
  } = props;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, ...GS.center, width: '100%' }}
    >
      <Icon
        name={'map-marker'}
        iconStyle={{ color: mapStyle }}
        size={22}
        type={'font-awesome'}
      />
      <FixedText style={{ fontSize: 8.5, color: mapStyle }}>mapping</FixedText>
    </TouchableOpacity>
  )
}

export { FloorPlanButton };
