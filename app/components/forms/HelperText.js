import React from 'react';
import FixedText from '../general/FixedText';

const HelperText = props => {

  const {
    children
  } = props

  return (
    <FixedText style={{ marginHorizontal: 20, color: '#86939e', fontSize: 12, fontStyle: 'italic' }}>
      {children}
    </FixedText>
  )
}


export default HelperText;
