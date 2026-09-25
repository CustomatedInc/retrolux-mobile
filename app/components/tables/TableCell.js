import React from 'react';
import { Text, View } from 'react-native';
import { FixedText } from '../../components';

const TableCell = props => {

  const {
    children,
    flex,
    justifyContent,
    alignItems,
    text,
    type,
    indentLevel,
    required,
    backgroundColor,
    fontSize,
    fontColor
  } = props

  let indent = 0
  if (indentLevel) { indent = indentLevel * 25 }
  if (indent > 100) { indent = 100 }

  notComplete = (required && (!text && text !== 0)) ? true : false

  if (type == 'text') {
    cellContent = <FixedText style={{ fontSize: fontSize || 12, color: fontColor ? fontColor : notComplete ? 'white' : '#37474F' }}>{text}</FixedText>
  } else {
    cellContent = children
  }

  return (
    <View style={{
      flex: type == 'button' ? -1 : flex || 1,
      justifyContent: justifyContent || 'center',
      alignItems: alignItems || 'flex-start',
      paddingLeft: alignItems ? 0 : 10,
      marginLeft: indent,
      backgroundColor: backgroundColor ? backgroundColor : notComplete ? 'tomato' : 'white'
    }}>
      {cellContent}
    </View>
  )
}

export default TableCell;
