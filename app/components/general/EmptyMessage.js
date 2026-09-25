import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import FixedText from './FixedText';

import { GS, LIGHTEST_GRAY, WHITE, LIGHT_GREEN } from '../../resources/styles/globals';

const EmptyMessage = props => {

  const {
    header,
    message,
    button,
  } = props

  return (
    <View style={{ flex: 1, backgroundColor: LIGHTEST_GRAY, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="info" size={140} color="#dee2e7" />
      <FixedText style={{ color: "#CAD1D8", fontSize: 26, fontWeight: 'bold' }}>{header}</FixedText>
      <FixedText style={{ color: "#bdc6cf", fontSize: 20, marginTop: 10, maxWidth: 600 }}>{message}</FixedText>

      {!!button &&
        <TouchableOpacity
          style={{ backgroundColor: LIGHT_GREEN, marginTop: 25, width: 120, paddingVertical: 10, borderRadius: 20 }}
          onPress={() => button.buttonAction()}
        >
          {!!button.buttonIcon &&
            <Icon
              name={button.buttonIcon}
              iconStyle={{ color: WHITE }}
              size={30}
              type={'font-awesome'}
            />
          }
        </TouchableOpacity>
      }

    </View>
  )
}


export default EmptyMessage;
