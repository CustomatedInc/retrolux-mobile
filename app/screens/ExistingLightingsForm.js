import React, { Component } from 'react';
import { Alert, View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { Button } from 'react-native-elements';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker'
import Orientation from 'react-native-orientation';
import PropTypes from 'prop-types';

import { GS } from '../resources/styles/globals';
import { Tab, BottomBar, ActionButton, StringInput, FixedFormLabel, CustomAttributeFormElement, NumberInput, ClickableInput, CustomAttributeListModal, ClassicListModal, EmptyMessage, ShowPhotoModal } from '../components';
import { ExistingLighting } from '../database/models';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { isEmpty, titleize } from '../lib/numberHelpers';
import CameraRollBrowser from './CameraRollBrowser';
import attachmentActions from '../lib/attachmentActions';
import realm from '../database/realm'
import { markEdited } from '../lib/realmActions';
import { bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';
import * as Actions from '../actions';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

class ExistingLightingsForm extends Component {
  constructor(props) {
    super(props);

    const existingLighting = props.existingLighting ? props.existingLighting : { custom_attributes: '{}' };
    existingLighting.code = props.existingLighting && props.existingLighting.code ? props.existingLighting.code : ExistingLighting.nextCode(props.project)

    const photoAttachments = props.existingLighting ? ExistingLighting.attachments(props.existingLighting.mobile_id) : []

    this.state = {
      existingLighting,
      additionalAttributes: props.additionalAttributes || props.project.additionalExistingLightingAttributes(),
      area: props.area || null,
      existingLightingSubsection: 'Primary',
      formErrors: {},
      mode: props.mode,
      primaryAttributes: props.primaryAttributes || props.project.primaryExistingLightingAttributes(),
      photoAttachments,
      classicListModalVisible: false,
      customAttributeListModalVisible: false,
      listItems: [],
      classicListItems: [],
      listAttribute: {},
      target: '',
      showPhotoModalVisible: false,
      photoToDisplay: {},
      showCameraDetails: false,
      showCameraRoll: false,
      addingPhotos: [],
      isReady: false,
    };
  }

  componentDidMount() {
    this.requestCameraPermission()
    this.requestGalleryPermission()
    setTimeout(() => {
      this.setState({ isReady: true });
    }, 250)
  }

  async setShowPhotoModalVisible(visible, photoId) {
    if (visible) {
      let photo = await realm.objects('Attachment').filtered(`mobile_id = '${photoId}'`)[0];
      await this.setState({
        photoToDisplay: photo,
        showPhotoModalVisible: visible
      });
    } else {
      await this.setState({
        showPhotoModalVisible: visible,
        photoToDisplay: {},
      });
    }
  }

  async setCustomAttributeListModalVisible(visible, listAttribute) {
    this.setState({
      listItems: !isEmpty(listAttribute) ? await listAttribute.listItems() : [],
      listAttribute: !isEmpty(listAttribute) ? listAttribute : {},
    })
    this.setState({ customAttributeListModalVisible: visible })
  }

  async setClassiceListModalVisible(visible, classicAttribute) {
    if (classicAttribute == 'existing_product_type') {
      await this.setState({
        classicListItems: [ 'luminaire', 'lamp', 'accessories', 'retrofit_kit', 'ballast', 'driver' ]
      })
    }
    this.setState({ classicListModalVisible: visible, target: classicAttribute ? classicAttribute : '' })
  }

  async showCameraRoll(visible) {
    this.setState({ showCameraRoll: visible })
  }

  async createExistingLightingAttachment(imageUri, height, width) {
    let diskLocation = await attachmentActions.cameraRollToDisk(imageUri, width, height);
    await attachmentActions.createAttachment(
      'ExistingLighting',
      this.state.existingLighting.mobile_id,
      diskLocation
    )
    await markEdited('ExistingLighting', this.state.existingLighting.mobile_id);
    const photoAttachments = await ExistingLighting.attachments(this.state.existingLighting.mobile_id)
    this.setState({ photoAttachments, existingLightingSubsection: 'Photos' })
  }

  async openCameraRollBrowser() {
    if (!!this.state.existingLighting) {
      await this.submitForm(true);
      if (Object.keys(this.state.formErrors).length !== 0) {
        return
      }
    }

    Orientation.unlockAllOrientations() // To prevent crash ios 10.3

    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        const assets = response?.assets??[]
        if(assets.length>0) {
          const asset = assets[0]
          this.createExistingLightingAttachment(asset.uri, asset.height, asset.width)
        }
      }
      Orientation.lockToLandscape() // To prevent crash ios 10.3
    });
  }

  async openPhotoCapture() {
    if (!!this.state.existingLighting) {
      await this.submitForm(true);
      if (Object.keys(this.state.formErrors).length !== 0) {
        return
      }
    }

    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
       // post an error message to error_log api when reponse.error happens.
        console.log('ImagePicker Error: ', response.error);
      } else {
        const assets = response?.assets??[]
        if(assets.length>0) {
          const asset = assets[0]
          this.takePicture(asset.uri, asset.height, asset.width);
        }
      }
    });
  }

  requestCameraPermission = async () => {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;
  
    const result = await check(permission);
  
    if (result === RESULTS.GRANTED) {
      console.log("Camera permission already granted");
    } else {
      const response = await request(permission);
      if (response === RESULTS.GRANTED) {
        console.log("Camera permission granted");
      } else {
        Alert.alert("Permission Denied", "Camera access is required to take a photo.");
      }
    }
  };

  requestGalleryPermission = async () => {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.PHOTO_LIBRARY
      : PERMISSIONS.ANDROID.READ_MEDIA_IMAGES; // For Android 13+
  
    const result = await check(permission);
  
    if (result === RESULTS.GRANTED) {
      console.log("✅ Gallery permission already granted");
    } else {
      const response = await request(permission);
      if (response === RESULTS.GRANTED) {
        console.log("✅ Gallery permission granted");
      } else {
        Alert.alert("Permission Denied", "Photo library access is required.");
      }
    }
  };

  async takePicture(cameraUri, height, width) {
    try {
      await CameraRoll.saveToCameraRoll(cameraUri)
      this.createExistingLightingAttachment(cameraUri, height, width)
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again');
    }
  }

  // attachLater(fullImageObject) {
  //   this.setState({ addingPhotos: [...this.state.addingPhotos, fullImageObject], photoAttachments: [...this.state.photoAttachments, fullImageObject] })
  // }

  // async attachPhoto(addingPhotos, lightingId) {
  //   if (!!addingPhotos) {
  //     for (let i = 0; i < addingPhotos.length; i++) {
  //       const photo = addingPhotos[i];
  //       let location = await attachmentActions.cameraRollToDisk(photo.uri, photo.width, photo.height);
  //       if (!!location) {
  //         await attachmentActions.createAttachment(
  //           'ExistingLighting',
  //           lightingId,
  //           location
  //         )
  //         markEdited('ExistingLighting', lightingId)
  //       }
  //     }
  //   } else {
  //     return;
  //   }
  // }

  async submitForm(continueToEdit) {
    await this.clearErrors();
    const formErrors = await this.runValidations();
    await this.setState({ formErrors });
    if (Object.keys(formErrors).length !== 0) { 
      this.setState({ existingLightingSubsection: 'Primary' });
      return;
    }

    const existingLighting = await ExistingLighting.prepareFormData(this.state.existingLighting, this.props.project, this.state.mode);
    await ExistingLighting.create(existingLighting, (this.state.mode === 'edit')); // if true updates else create new

    // Set project productFilters to default values.
    await this.props.setProductDefault(this.props.project, 'productSortDecending', false);
    await this.props.setProductDefault(this.props.project, 'productSearchText', null);
    await this.props.setProductDefault(this.props.project, 'selectedEntry', null);
    await this.props.setProductDefault(this.props.project, 'companyFavoriteClicked', false);

    // await this.attachPhoto(this.state.addingPhotos, existingLighting.mobile_id)

    await ExistingLighting.findAndRunUpdate(existingLighting.mobile_id)
    if (continueToEdit) {
      this.refreshForm(existingLighting.mobile_id);
      return;
    }
    this.saveEditFormSuccess(existingLighting.mobile_id);
  }

  async runValidations() {
    const errors = await ExistingLighting.validate(this.state.existingLighting, this.props.project, this.state.mode);
    const customAttributes = JSON.parse(this.state.existingLighting.custom_attributes);
    if (!isEmpty(customAttributes)) {
      customAttributeErrors = await ExistingLighting.validateCustomAttributes(customAttributes, this.props.project);
    } else {
      customAttributeErrors = {};
    }
    return { ...errors, ...customAttributeErrors };
  }

  async saveEditFormSuccess(existingLightingId) {
    try {
      this.clearErrors();
      
      if (this.state.area) {
        const areaFromRealm = realm.objects('Area').filtered(`mobile_id = ${this.state.area.mobile_id}`);
        
        if (areaFromRealm.length > 0) {
          this.props.changeEditingArea(
            areaFromRealm[0], 
            true, // openExistingFixtureModal = true to show quantity selection modal
            existingLightingId
          );
        } else {
          this.props.changeStack('index');
        }
      } else {
        this.props.changeStack('index');
      }
    } catch (error) {
      this.props.changeStack('index');
    }
  }

  async refreshForm(lightingId) {
    let newExistingLighting = await ExistingLighting.find(lightingId);
    newExistingLighting = newExistingLighting.toPlainObject();

    let newPhotoAttachments = await ExistingLighting.attachments(newExistingLighting.mobile_id)
    await this.setState({
      existingLighting: newExistingLighting,
      additionalAttributes: this.state.additionalAttributes,
      area: this.state.area ? this.state.area : null,
      formErrors: {},
      mode: 'edit',
      primaryAttributes: this.state.primaryAttributes,
      photoAttachments: newPhotoAttachments,
      classicListModalVisible: false,
      customAttributeListModalVisible: false,
      listItems: [],
      classicListItems: [],
      listAttribute: {},
      target: '',
      showPhotoModalVisible: false,
      photoToDisplay: {},
      showCameraDetails: false,
      showCameraRoll: false,
      addingPhotos: []
    })
  }

  clearErrors() {
    this.setState({ formErrors: {} });
  }

  async complexSetState(target, value) {
    const update = this.state.existingLighting;
    update[target] = value;
    await this.setState({ existingLighting: update });
  }

  async complexSetStateForCustomAttributes(target, value) {
    const update = JSON.parse(this.state.existingLighting.custom_attributes);
    update[target] = value;
    await this.setState({
      existingLighting: {
        ...this.state.existingLighting,
        custom_attributes: JSON.stringify(update),
      },
    });
  }

  async goBack() {
    if (this.props.fromFavorites) { // from ProductForm.js
      this.props.changeStack('retrolux favorites', this.state.area ? this.state.area : null)
    } else if (this.state.area) { // from AreaStack.js
      this.props.changeEditingArea(realm.objects('Area').filtered(`mobile_id = ${this.state.area.mobile_id}`)[0], true); // true = re-open modal
    } else { // from ExistingLightingStack.js
      this.props.changeStack('index');
    }
  }

  // async saveToEditPhotoPopUp() {
  //   let subMessage = 'To edit a photo you first need to save this product schedule item.';

  //   const buttons = [
  //     { text: 'Save', onPress: () => this.submitForm(true), style: 'destructive' },
  //     { text: 'cancel', style: 'cancel' },
  //   ];

  //   Alert.alert('Save Product Schedule?', subMessage, buttons, { cancelable: false });
  // }

  renderAttachments(photos){
    const thumbnails = [];

    if (photos == null || photos.length == 0) {
      return (
        <View style={{ flex: 1, ...GS.center}}>
          <EmptyMessage header="No Photos Yet" message="Press button in bottom left corner take one." />
        </View>
      );
    }

    for (i = 0; i < photos.length; i += 1) {
      const photo = photos[i];
      thumbnails.push(
        // need to add the ability to edit the recently added photo.
        <TouchableOpacity key={i} onPress={() => this.setShowPhotoModalVisible(true, photo.mobile_id)} style={{flexBasis: '25%', padding: 5}}>
          {photo.mobile_uri && <Image source={{ uri: (photo?.mobile_uri??"")!=''? attachmentActions.getCorrectUri(photo.mobile_uri):"", static: true }} style={{ resizeMode: 'cover', width: '100%', height: 200 }} /> }
          {photo.uri && <Image source={{ uri: photo.uri, static: true }} style={{ resizeMode: 'cover', width: '100%', height: 200 }} /> }
        </TouchableOpacity>,
      );
    }

    return (thumbnails);
  }

  renderFillers(length) {
    if (length % 3 == 2) {
      return (
        <View style={{flexBasis: '33%', marginTop: 8}}/>
      )
    } else if (length % 3 == 1) {
      return(
        <View style={{flexBasis: '33%', marginTop: 8}}/>
      )
    }
  }

  render() {
    const { existingLighting, existingLightingSubsection, formErrors } = this.state;
    const { additionalAttributes, primaryAttributes, photoAttachments } = this.state;
    const customAttributes = JSON.parse(this.state.existingLighting.custom_attributes)

    if (this.state.showCameraRoll == false) {
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, marginHorizontal: 20, marginBottom: 20, marginTop: 15 }}>
  
            {/* Tab Bar ------------------------------------------------------*/}
  
            <View style={[GS.tabContainer, {zIndex: 2}]}>
              {['Primary', 'Additional', 'Photos'].map(existingLightinglTab => (
                <Tab
                  tabStyle={{ minWidth: 150 }}
                  key={existingLightinglTab}
                  onPress={() => this.setState({ existingLightingSubsection: existingLightinglTab })}
                  title={existingLightinglTab}
                  activeTab={this.state.existingLightingSubsection === existingLightinglTab}
                />
              ))}
            </View>
  
            {/* Form ---------------------------------------------------------*/}
  
            <View style={{ flex: 1, borderRadius: 5, backgroundColor: '#FAFAFD', ...GS.border }}>
              <View style={{ flexGrow: 1 }}>

                {existingLightingSubsection === 'Primary' &&
                  <KeyboardAwareScrollView keyboardOpeningTime={100} extraScrollHeight={75}>
  
                    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
  
                      {/* Regular Attributes -----------------------------------------------------*/}

                      <View style={{flexBasis: '33%', marginTop: 8}}>
                        <View style={{flexDirection: 'row'}}>
                          <FixedFormLabel labelStyle={{ marginTop: 8 }}>Name</FixedFormLabel>
                          <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                        </View>
                        <StringInput
                          label={null}
                          placeholder={'Name'}
                          value={existingLighting.name}
                          onChange={this.complexSetState.bind(this)}
                          target="name"
                          error={!!formErrors.nameError}
                          errorMessage={formErrors.nameError}
                        />
                      </View>
  
                      <View style={{flexBasis: '33%', marginTop: 8}}>
                        <View style={{flexDirection: 'row'}}>
                          <FixedFormLabel labelStyle={{ marginTop: 8 }}>Product Code</FixedFormLabel>
                          <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                        </View>
                        <StringInput
                          autoCapitalize={"none"}
                          label={null}
                          placeholder={'product code'}
                          value={existingLighting.code}
                          onChange={this.complexSetState.bind(this)}
                          target="code"
                          error={!!formErrors.codeError}
                          errorMessage={formErrors.codeError}
                        />
                      </View>

                      <View style={{flexBasis: '33%', marginTop: 8}}>
                        <View style={{flexDirection: 'row'}}>
                          <FixedFormLabel labelStyle={{ marginTop: 8 }}>Product Type</FixedFormLabel>
                          <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                        </View>
                        <ClickableInput
                          onPress={() => this.setClassiceListModalVisible(true, 'existing_product_type')}
                          title={existingLighting.existing_product_type ? titleize(existingLighting.existing_product_type) : ''}
                          placeholder={'select'}
                          error={!!formErrors.existing_product_type}
                          errorMessage={formErrors.existing_product_type}
                          listItems={['luminaire', 'lamp', 'accessories']}
                          topThreeSetAttribute={this.complexSetState.bind(this)}
                          target={'existing_product_type'}
                        />
                      </View>
  
                      <View style={{flexBasis: '33%', marginTop: 8}}>
                        <View style={{flexDirection: 'row'}}>
                          <FixedFormLabel labelStyle={{ marginTop: 8 }}>Watts Per Product</FixedFormLabel>
                          <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                        </View>
                        <NumberInput
                          target={"watts_per_product"}
                          value={existingLighting.watts_per_product}
                          placeholder={'watts per product'}
                          unit={'Watts'}
                          unitPosition={'right'}
                          onChange={this.complexSetState.bind(this)}
                          error={!!formErrors.watts_per_product}
                          errorMessage={formErrors.watts_per_product}
                          integer={false}
                        />
                      </View>
  
                      <View style={{flexBasis: '33%', marginTop: 8}}>
                        <View style={{flexDirection: 'row'}}>
                          <FixedFormLabel labelStyle={{ marginTop: 8 }}>Lamp Life</FixedFormLabel>
                          <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                        </View>
                        <NumberInput
                          target={"lm70"}
                          value={existingLighting.lm70}
                          placeholder={'lamp life hours'}
                          hint={"Incandescent: 1000 hours, Fluorescent: 20,000 hours, HID: 10,000 hours, LED: 50,000 hours"}
                          unit={'Hours'}
                          unitPosition={'right'}
                          onChange={this.complexSetState.bind(this)}
                          error={!!formErrors.lm70}
                          errorMessage={formErrors.lm70}
                          integer={true}
                          quickList={"[1000, 10000, 20000, 50000, 75000, 100000]"}
                        />
                      </View>
  
                      {/* Primary Custom Attributes -----------------------------------------------------*/}
  
                      {primaryAttributes.map(attribute => (
                         <CustomAttributeFormElement
                          key={attribute.mobile_id}
                          elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '33%', marginTop: 8 }}
                          isReady={this.state.isReady}
                          attribute={attribute}
                          customAttributes={customAttributes}
                          complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
                          setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
                          formErrors={this.state.formErrors}
                        />
                      ))}
  
                      {this.renderFillers(primaryAttributes.length + 4)}
  
                    </View>
                  </KeyboardAwareScrollView>
                }
    
                {/* Additional Custom Attributes Tab -----------------------------------------------------*/}

                {existingLightingSubsection === 'Additional' &&
                  <KeyboardAwareScrollView keyboardOpeningTime={100} extraScrollHeight={75}>
                    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>

                      {additionalAttributes.map(attribute => (
                        <CustomAttributeFormElement
                          key={attribute.mobile_id}
                          elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '33%', marginTop: 8 }}
                          isReady={this.state.isReady}
                          attribute={attribute}
                          customAttributes={customAttributes}
                          complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
                          setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
                          formErrors={this.state.formErrors}
                        />
                      ))}

                      {this.renderFillers(additionalAttributes.length)}
                    </View>
                  </KeyboardAwareScrollView>
                }

                {/* Attachments Tab ----------------------------------------------------- */}

                {existingLightingSubsection === 'Photos' &&
                  <ScrollView contentContainerStyle={{ flex: (photoAttachments.length > 0) ? 0 : 1 }}>
                    <View style={{flex: 1, padding: 5, flexDirection: 'row', flexWrap: 'wrap'}}>
                      {this.renderAttachments(photoAttachments)}
                    </View>
                  </ScrollView>
                }
              </View>
            </View>
          </View>
  
          {/* Bottom Bar -----------------------------------------------------*/}
  
          <BottomBar>
            <View style={{ flex: -1, marginLeft: 10 }}>
              <Button
                buttonStyle={styles.smallButtonStyle}
                style={styles.smallButtonContainerStyle}
                icon={{ name: 'camera-retro', type: 'font-awesome', color: '#90979a', size: 30 }}
                onPress={() => { this.openPhotoCapture() }}
              />
            </View>
            <View style={{ flex: -1, marginLeft: 10 }}>
              <Button
                buttonStyle={styles.smallButtonStyle}
                style={styles.smallButtonContainerStyle}
                icon={{ name: 'picture-o', type: 'font-awesome', color: '#90979a', size: 30 }}
                onPress={() => { this.openCameraRollBrowser() }}
              />
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ flex: -1 }}>
              <ActionButton
                alt
                title="cancel"
                onPress={() => this.goBack()}
              />
            </View>
            <View style={{ flex: -1 }}>
              <ActionButton
                icon={"save"}
                title="Save"
                onPress={() => this.submitForm(false)}
              />
            </View>
          </BottomBar>
  
          {/* CustomAttribute List Input Modal -----------------------------------------------------*/}
  
          <CustomAttributeListModal
            isVisible={this.state.customAttributeListModalVisible}
            closeCustomAttributeListModal={() => this.setCustomAttributeListModalVisible(false, {})}
            onPress={this.complexSetStateForCustomAttributes.bind(this)}
            listItems={this.state.listItems}
            listAttribute={this.state.listAttribute}
            customAttributes={this.state.existingLighting.custom_attributes}
          />
  
          {/* ClassicAttribute List Input Modal -----------------------------------------------------*/}
  
          <ClassicListModal 
            isVisible={this.state.classicListModalVisible}
            closeClassicListModalVisible={() => this.setClassiceListModalVisible(false, '')}
            onPress={this.complexSetState.bind(this)}
            classicListItems={this.state.classicListItems}
            target={this.state.target}
            model={this.state.existingLighting}
          />
  
          {/* Show Photo Modal -----------------------------------------------------*/}
  
          <ShowPhotoModal 
            isVisible={this.state.showPhotoModalVisible}
            photoToDisplay={this.state.photoToDisplay}
            closeShowPhotoModalVisible={() => this.setShowPhotoModalVisible(false, null)}
          />

        </View>
      );
    } else if (this.state.showCameraRoll == true) {
      return (
        <CameraRollBrowser
          backFunction={this.showCameraRoll.bind(this)}
          backFunctionStack={false}
          attachLater={this.attachLater.bind(this)}
          attachable_type={'attachLater'}
          attachable_mobile_id={'attachLater'}
        />
      )
    }
  }
}

const styles = StyleSheet.create({
  smallButtonStyle: {
    paddingRight: 5,
    width: 80,
    height: 60,
    marginRight: 0,
    marginLeft: 0,
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
  },

  smallButtonContainerStyle: {
    width: 80,
    height: 60,
    paddingRight: 5,
    marginLeft: 0,
    marginTop: 10,
  }
});

ExistingLightingsForm.propTypes = {
  additionalAttributes: PropTypes.object,
  area: PropTypes.object,
  changeStack: PropTypes.func.isRequired,
  mode: PropTypes.string.isRequired,
  primaryAttributes: PropTypes.object,
  project: PropTypes.object.isRequired,
  renderExistingLightingsRows: PropTypes.func,
};

function mapStateToProps(state, props) {
  return {
    currentUser: state.currentUserReducer.currentUser,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ExistingLightingsForm);
