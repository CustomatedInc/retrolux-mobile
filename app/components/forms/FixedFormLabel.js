import React from 'react';
import { FixedText } from '../../components';
import { GS } from '../../resources/styles/globals';

const FixedFormLabel = props => {

  const {
    children,
    label,
  } = props;

  return (
    <FixedText
      numberOfLines={1}
      style={{
        fontWeight: '500',
        fontSize: 15,
        marginLeft: 20,
        marginRight: 0,
        marginTop: 8,
        marginBottom: 1,
        ...GS.darkestGray,
      }}
    >
      {children}
    </FixedText>
  )
}

export default FixedFormLabel;
