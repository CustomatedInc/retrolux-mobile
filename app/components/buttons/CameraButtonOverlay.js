import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { Button } from 'react-native-elements';
// import { GS } from 'RetroluxMobile/app/resources/styles/globals';

const CameraButtonOverlay = props => {

  const {
    onExit,
    onCapture,
  } = props;

  return (
    <View style={{ flex: 1}}>
      <View style={{ flex: -1 }}>
        <Button
          buttonStyle={{ width: 80, height: 60 }}
          style={{ width: 80, height: 55, marginTop: 8, marginLeft: -4 }}
          backgroundColor="transparent"
          icon={{name: 'highlight-off', color: 'white', size: 40 }}
          onPress={onExit}
        />
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end'}}>
        <Button
          buttonStyle= {{ width: 130, height: 60, padding: 1, borderRadius: 100 }}
          style={{ width: 55, height: 55, marginRight: 35, marginTop: -65 }}
          backgroundColor="white"
          icon={{ name: 'camera-retro', type:'font-awesome', color: 'black', size: 50 }}
          onPress={onCapture}
        />
      </View>
    </View>
  )
}

export default CameraButtonOverlay;
