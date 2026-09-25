import React from 'react';
import { Text } from 'react-native';

const FixedText = props => {

  const {
    accessible,
    ellipsizeMode,
    nativeID,
    numberOfLines,
    onLayout,
    onLongPress,
    onPress,
    pressRetentionOffset,
    selectable,
    style,
    testID,
    disabled,
    selectionColor,
    testBreakStrategy,
    adjustsFontSizeToFit,
    minimumFontScale,
    suppressHighlighting,
  } = props

  return (
    <Text
      allowFontScaling={false}
      style={style}
      accessible={accessible}
      ellipsizeMode={ellipsizeMode}
      nativeID={nativeID}
      numberOfLines={numberOfLines}
      onLayout={onLayout}
      onLongPress={onLongPress}
      onPress={onPress}
      pressRetentionOffset={pressRetentionOffset}
      selectable={selectable}
      style={style}
      testID={testID}
      disabled={disabled}
      selectionColor={selectionColor}
      testBreakStrategy={testBreakStrategy}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      suppressHighlighting={suppressHighlighting}
    >
      {props.children}
    </Text>
  )
}

export default FixedText;
