import React, { Component } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image, Dimensions, Alert, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import { GS, LIGHT_GREEN } from './../../resources/styles/globals';
import { FixedText, StringInput, FixedFormLabel } from '../../components';
import Modal from 'react-native-modal';
import attachmentActions from '../../lib/attachmentActions';
import realm from '../../database/realm'
import { Attachment } from '../../database/models';

class ShowPhotoModal extends Component {

  constructor(props) {
    super(props);

    const { width } = Dimensions.get('window');
    const modalWidth = width - 200;

    const photo = Object.assign({}, props.photoToDisplay)

    this.state = {
      photo: photo,
      modalWidth: modalWidth,
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.photoToDisplay != prevProps.photoToDisplay) {
      this.setState({ photo: Object.assign({}, this.props.photoToDisplay) })
    }
  }

  async complexSetState(target, value) {
    const update = this.state.photo;
    update[target] = value;
    await this.setState({ photo: update });
  }

  async saveAttachment() {
    const photo = this.state.photo;
    photo['edited'] = true;
    await Attachment.create(photo, true);
    this.props.closeShowPhotoModalVisible();
  }

  confirmDeactivation(mobile_id) {
    const buttons = [
      { text: 'Yes, delete it.', onPress: () => this.deactivateAttachment(mobile_id), style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ];

    Alert.alert('Are you sure you want to delete this photo?', "", buttons, { cancelable: false });
  }

  async deactivateAttachment(mobile_id) {
    await this.props.closeShowPhotoModalVisible()
    const photo = await realm.objects('Attachment').filtered('mobile_id = $0', mobile_id)[0]
    await photo.deactivate()
  }

  renderPhoto(photo) {
    if (Object.keys(photo).length > 0) {
      return (
        <Image
          key={photo.mobile_id}
          source={{
            uri: (photo?.mobile_uri??"")!=''?attachmentActions.getCorrectUri(photo.mobile_uri):"",
            static: true,
          }}
          style={{ marginVertical: 15, resizeMode: 'contain', width: '100%', height: 420 }}
        />
      )
    } else {
      return ( <View/> )
    }
  }

  render() {
    const { photo } = this.state;
    return (
      <Modal
        avoidKeyboard
        isVisible={this.props.isVisible}
        animationInTiming={200}
        animationOutTiming={200}
        backdropTransitionInTiming={200}
        backdropTransitionOutTiming={200}
        style={[styles.modalContainer, {width: this.state.modalWidth}]}
      >
        <View style={styles.titleContainer}>
          <FixedText style={styles.title}>{"Edit Photo"}</FixedText>
          <TouchableOpacity
            onPress={this.props.closeShowPhotoModalVisible}
          >
            <Icon
              name={'close'}
              iconStyle={{ color: "#E2E7EA", paddingVertical: 5, paddingRight: 15 }}
              size={20}
              type={'font-awesome'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.modal}>

          {/* Main Content -----------------------------------------------------*/}

          <View style={{flex: 10, padding: 15}}>
            <ScrollView style={{ flex: 1 }}>
              <View style={{flex: 1, flexDirection: 'row'}}>
                <View style={{flexBasis: '75%'}}>
                  {this.renderPhoto(photo)}
                </View>

                <View style={{flexBasis: '25%'}}>
                  <View style={{ flex: -1 }}>
                    <FixedFormLabel labelStyle={{ marginTop: 8 }}>{"Name"}</FixedFormLabel>
                    <StringInput
                      value={photo.name}
                      onChange={this.complexSetState.bind(this)}
                      target={"name"}
                      placeholder={"photo name"}
                    />
                  </View>
                  <View style={{ flex: -1 }}>
                    <FixedFormLabel labelStyle={{ marginTop: 8 }}>{"Notes"}</FixedFormLabel>
                    <StringInput
                      multiline
                      value={photo.description}
                      onChange={this.complexSetState.bind(this)}
                      target={"description"}
                      placeholder={"photo notes"}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Bottom Action Buttons -----------------------------------------------------*/}

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => this.props.closeShowPhotoModalVisible()}>
              <FixedText style={styles.cancelButtonText}>{'cancel'}</FixedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, {backgroundColor: 'tomato'}]} onPress={() => this.confirmDeactivation(photo.mobile_id)}>
              <Icon
                name={'trash'}
                iconStyle={{ color: 'white' }}
                size={20}
                type={'font-awesome'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => this.saveAttachment()}>
              <Icon
                name={'save'}
                iconStyle={{ color: 'white', paddingRight: 5 }}
                size={20}
                type={'font-awesome'}
              />
              <FixedText style={styles.actionButtonText}>{'Save'}</FixedText>
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
    marginHorizontal: 100,
    marginVertical: 10,
    flex: 1,
  },

  modal: {
    borderBottomRightRadius: 8,
    borderBottomLeftRadius: 8,
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
    backgroundColor: LIGHT_GREEN,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
  },

  title: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },

  buttonsContainer: {
    padding: 15,
    flexDirection: 'row',
    backgroundColor: 'white',
    ...GS.borderTop,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
    height: 70,
  },

  cancelButton: {
    flex: 1,
    flexGrow: 1,
    borderRadius: 5,
    ...GS.bgLightGray,
    ...GS.center,
    marginRight: 10,
  },

  cancelButtonText: {
    alignSelf: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    ...GS.darkerGray,
  },

  actionButton: {
    flex: 5,
    borderRadius: 5,
    backgroundColor: LIGHT_GREEN,
    ...GS.center,
    flexDirection: 'row',
  },

  actionButtonText: {
    alignSelf: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    color: 'white',
  },

});

export default ShowPhotoModal;