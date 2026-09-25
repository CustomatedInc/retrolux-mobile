import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';

import { FixedText } from '../';
import { GS } from '../../resources/styles/globals';

const ScheduleModal = (props) => {
  const {
    isVisible,
    title,
    onCancel,
    onSubmit,
    children,
  } = props;
  const { windowHeight, width } = Dimensions.get('window');

  return (
    <Modal
      isVisible={isVisible}
      style={[styles.modalContainer, { height: windowHeight } ]}
    >
      <View style={styles.modal}>
        <View style={styles.titleContainer}>
          <FixedText style={styles.title}>{ title }</FixedText>
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView
          style={styles.scroll}
          >
            {children}
          </ScrollView>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <FixedText style={styles.cancelButtonText}>close</FixedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rightButton} onPress={onSubmit}>
            <FixedText style={styles.rightButtonText}>Confirm</FixedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    alignSelf: 'center',
    width: 600,
    margin: 100,
    marginLeft: 200,
    flex: 1,
  },

  modal: {
    borderRadius: 5,
    backgroundColor: 'white',
    flex: 1,
  },

  titleContainer: {
    flex: -1,
    padding: 20,
    ...GS.borderBottom,
  },

  title: {
    alignSelf: 'center',
    fontSize: 20,
    color: 'grey',
    fontWeight: 'bold',
  },

  scroll: {
    marginHorizontal: 30,
    marginBottom: 20,
    flex: 1,
  },

  buttonsContainer: {
    flexDirection: 'row',
    flex: -1,
  },

  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
    ...GS.bgLightGray,
  },

  cancelButtonText: {
    alignSelf: 'center',
    fontSize: 20,
    ...GS.darkerGray,
  },

  rightButton: {
    flex: 2,
    padding: 15,
    borderBottomRightRadius: 5,
    ...GS.bgLightGreen
  },

  rightButtonText: {
    alignSelf: 'center',
    fontSize: 20,
    color: 'white',
  },
});

ScheduleModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export { ScheduleModal };
