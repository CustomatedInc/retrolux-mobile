import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { Icon } from 'react-native-elements';
import { DARKER_GRAY, LIGHT_GREEN, RED, DARK_YELLOW } from './../../resources/styles/globals';

const StatusMessage = props => {
  const {
    title,
    status,
  } = props

  return (
    <View>
      {status !== 'idle' &&
        <View style={{ flexDirection: 'row' }}>
          {status === 'syncing' &&
            <ActivityIndicator size="small" />
          }

          {status === 'complete' &&
            <Icon name='check-circle' size={20} color={LIGHT_GREEN} />
          }

          {status === 'warning' &&
            <Icon name='warning' size={20} color={DARK_YELLOW} />
          }

          {status === 'error' &&
            <Icon name='error' size={20} color={RED} />
          }

          <Text style={styles.statusMessageStyle}>{title}</Text>
        </View>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  statusMessageStyle: {
    lineHeight: 35,
    fontSize: 22,
    marginLeft: 10,
    color: DARKER_GRAY,
  },
});

export { StatusMessage };
