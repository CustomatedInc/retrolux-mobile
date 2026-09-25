import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import Modal from 'react-native-modal';

import FixedText from '../general/FixedText';
import { GS } from '../../resources/styles/globals';

const MODAL_HEIGHT = Dimensions.get('window').height - 400;
const MODAL_WIDTH = Dimensions.get('window').width - 400;

const PickerModal = (props) => {
  const {
    isVisible,
    children,
    onSubmit,
    title,
    closePickerModal,
  } = props;

  return (
    <Modal isVisible={isVisible} style={styles.modalContainer}>
      <View style={styles.modal}>
        <View style={styles.titleContainer}>
          <FixedText style={styles.title}>{title}</FixedText>
        </View>
        <View style={{ flex: 1 }}>
          {children}
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={closePickerModal}>
            <FixedText style={styles.cancelButtonText}>close</FixedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onSubmit}>
            <FixedText style={styles.buttonText}>confirm</FixedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    alignSelf: 'center',
    width: MODAL_WIDTH,
    flex: 1,
  },

  modal: {
    borderRadius: 8,
    backgroundColor: 'white',
    flex: -1,
    maxHeight: MODAL_HEIGHT,
    minHeight: MODAL_HEIGHT
  },

  titleContainer: {
    height: 65,
    padding: 20,
    ...GS.borderBottom,
  },

  title: {
    alignSelf: 'center',
    fontSize: 20,
    color: 'grey',
    fontWeight: 'bold',
  },

  buttonsContainer: {
    flexDirection: 'row',
    height: 70,
  },

  button: {
    flex: 2,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomRightRadius: 8,
    ...GS.bgLightGreen,
  },

  cancelButton: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    ...GS.bgLightGray,
  },

  buttonText: {
    fontSize: 20,
    color: 'white',
  },

  cancelButtonText: {
    fontSize: 20,
    ...GS.darkerGray,
  },
});

PickerModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

export { PickerModal };
