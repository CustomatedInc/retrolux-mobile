import React, { Component } from 'react';
import { Picker, TouchableOpacity, StyleSheet, View, Text, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import { GS, GRAY, GREEN } from './../../resources/styles/globals';
import { FixedText, TableRow, TableCell } from '../../components';
import Modal from 'react-native-modal';


class ExistingLightingModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      existingLightings: props.project.activeExistingLightings,
    };
  }

  renderExistingLightingsRows() {
    existingLightingsRows = []
    for (let i = 0; i < this.state.existingLightings.length; i++) {
      const existingLighting = this.state.existingLightings[i];
      if (existingLighting.mobile_id === this.props.existingLightingDeactivate.mobile_id) { continue; }
      existingLightingsRows.push(
        <TableRow altColor={false} key={i} onPressRow={() => this.props.updateExistingFixtures(existingLighting)} rowStyle={{borderLeftWidth: 1, borderRightWidth: 1, borderTopWidth: i === 0 ? 1 : 0, borderColor: GRAY}} bottomBorder >
          <TableCell type="text" flex={10} text={existingLighting.name} />
          <TableCell alignItems={'center'} flex={1}>
            <Icon
              name={'plus'}
              iconStyle={{ color: GREEN, padding: 15 }}
              size={20}
              type={'font-awesome'}
            />
          </TableCell>
        </TableRow>
      )
    }
    return existingLightingsRows
  }

  render() {
    return (
      <Modal isVisible={this.props.isVisible} style={styles.modalContainer}>
        <View style={styles.modal}>
          <View style={styles.titleContainer}>
            <FixedText style={styles.title}>{`Changing ${this.props.editingExistingFixtures.length} Existing Products`}</FixedText>
            <TouchableOpacity
              onPress={this.props.closeExistingLightingModal}
            >
              <Icon
                name={'close'}
                iconStyle={{ color: "#E2E7EA", paddingVertical: 5, paddingRight: 15 }}
                size={20}
                type={'font-awesome'}
              />
            </TouchableOpacity>
          </View>
          <View style={{flex: 10, padding: 15 }}>

            { this.state.existingLightings.length <= 1 &&

              <View>
                <FixedText style={styles.deleteMessage}>
                  {"There are existing products in this project that depend on this lighting. To delete this lighting, you'll need to create a new lighting to transfer the existing products to and then delete this one again."}
                </FixedText>
              </View>
            
            }

            { this.state.existingLightings.length > 1 &&

              <View>
                <FixedText style={styles.deleteMessage}>
                  {"There are existing products in your project that depend on this lighting. To remove, you will need to move those products to another lighting."}
                </FixedText>
                <FixedText style={styles.selectMessage}>
                  {"Please select a new lighting from the list below:"}
                </FixedText>
              </View>

            }

            <ScrollView style={{flex: 1}}>
              {this.renderExistingLightingsRows()}
            </ScrollView>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={this.props.closeExistingLightingModal}>
              <FixedText style={styles.cancelButtonText}>cancel</FixedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }
}

const styles = StyleSheet.create({
  modalContainer: {
    alignSelf: 'center',
    justifyContent: "center",
    width: 600,
    marginHorizontal: 100,
    marginLeft: 200,
    marginTop: 25,
    marginBottom: 25,
    flex: 1,
  },

  deleteMessage: {
    fontWeight: '400',
    fontSize: 18,
    marginBottom: 10,
    ...GS.darkestGray,
  },

  selectMessage: {
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 10,
    ...GS.darkestGray,
  },

  modal: {
    borderRadius: 8,
    backgroundColor: 'white',
    flex: 1,
  },

  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingLeft: 15,
    paddingRight: 0,
    paddingVertical: 15,
    ...GS.borderBottom,
    backgroundColor: '#49d184',
    borderTopRightRadius: 5,
    borderTopLeftRadius: 5,
  },

  title: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },

  buttonsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    ...GS.borderTop,
  },

  cancelButton: {
    flex: 1,
    // padding: 15,
    borderRadius: 8,
    ...GS.bgLightGray,
    ...GS.center
  },

  cancelButtonText: {
    alignSelf: 'center',
    fontSize: 15,
    ...GS.darkerGray,
  },
});

export default ExistingLightingModal;