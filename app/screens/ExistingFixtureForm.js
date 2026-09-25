import React, { Component } from 'react';
import {Picker} from '@react-native-picker/picker'
import { Image, StyleSheet, TextInput, TouchableOpacity, ScrollView, Text, View, Alert, FlatList } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import {launchCamera,launchImageLibrary} from 'react-native-image-picker'
import Orientation from 'react-native-orientation';
import Modal from 'react-native-modal';
import PropTypes from 'prop-types';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';

import realm from '../database/realm';
import { PickerModal, ClickableInput, CustomAttributeFormElement, ProductCounter, CameraButtonOverlay, FixedFormLabel, FixedText, FormGroupLabel, ActionButton, StringInput, Form, BottomBar, AreaBreadcrumbs, Tab, ExistingFixtureModal, NumberInput, CustomAttributeListModal, ClassicListModal, ShowPhotoModal, OperatingForm, LocationScopeButton, TableRow, TableCell, AreaPickerModal } from '../components';
import { markEdited } from '../lib/realmActions';
import attachmentActions from '../lib/attachmentActions';
import CameraRollBrowser from './CameraRollBrowser';
import { Area, ExistingFixture, ExistingLighting } from '../database/models';
import { GS, LIGHTER_BLUE, LIGHTEST_BLUE, LIGHT_BLUE, ACTIVE_OPACITY, DARKER_GRAY, MID_GRAY, PRIMARY_BLUE } from '../resources/styles/globals';
import { formatLargeNumber, increment, decrement, isNumber, isEmpty, titleize } from '../lib/numberHelpers';
import Placeholder from 'rn-placeholder';
import memoize from 'fast-memoize';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

const getAreasInProject = memoize((realmAreas) => {
  const areas = [];

  for (const area of realmAreas) {
    const areaObject = { area: area };
    areas.push(areaObject);
  }
  return areas;
});

export default class ExistingFixtureForm extends Component {
  constructor(props) {
    super(props);

    const existingFixture = this.props.existingFixture.toPlainObject();
    const area = this.props.existingFixture.area;

    const existingLighting = realm.objects('ExistingLighting').filtered(`mobile_id = ${existingFixture.mobile_existing_lighting_id}`)[0];
    const schedules = realm.objects('OperatingSchedule');
    const photoAttachments = ExistingFixture.attachments(existingFixture.mobile_id);
    const inheritedPhotoAttachments = ExistingLighting.attachments(existingLighting.mobile_id)
    const existingLightingAttributes = this.props.project.ExistingLightingAttributes();

    const areasInProject = getAreasInProject(Area.inProject(props.project).sorted('name_with_parents', false))

    this.state = {
      area,
      areasInProject: areasInProject,
      areaLocationModalVisible: false,
      existingFixture,
      operatingScheduleModalVisible: false,
      operatingSchedule: existingFixture.mobile_operating_schedule_id ? schedules.filtered(`active = true AND mobile_id = ${existingFixture.mobile_operating_schedule_id}`)[0] : null,
      operatingSchedules: schedules.filtered(`active = true AND mobile_project_id = ${this.props.project.mobile_id}`).sorted('name').map(schedule => Object.assign({}, schedule)),
      operatingSchedulePickerHolder: null,
      photoAttachments,
      inheritedPhotoAttachments,
      photoToDisplay: {},
      showPhotoModalVisible: false,
      existingLighting,
      existingLightingAttributes,
      productDetailsSubsection: 'Primary',
      quantity: String(existingFixture.existing_count),
      activeTab: 'product details',
      formErrors: {},
      primaryAttributes: [],
      additionalAttributes: [],
      existingFixtureModalVisible: false,
      customAttributeListModalVisible: false,
      classicListModalVisible: false,
      listItems: [],
      classicListItems: [],
      listAttribute: {},
      target: '',
      placeholders: {},
      tooltips: {},
      isReady: false,
      photoSection: 'Photos',
      newOperatingScheduleModalVisible: false,
    };

    this.navigateBack = this.navigateBack.bind(this);
    this.backToProductForm = this.backToProductForm.bind(this);
    this.saveProduct = this.saveProduct.bind(this);
    this.setExistingFixtureModalVisible = this.setExistingFixtureModalVisible.bind(this);
    this.changeActiveTab = this.changeActiveTab.bind(this);
    this.refreshExistingLighting = this.refreshExistingLighting.bind(this);
    this.complexSetState = this.complexSetState.bind(this);
    this.openNewOperatingScheduleModalVisible = this.openNewOperatingScheduleModalVisible.bind(this);
    this.pickArea = this.pickArea.bind(this);
    this.areaPickerSearch = this.areaPickerSearch.bind(this);
  }

  componentDidMount() {
    this.setAttributes();
    this.setState({
      operatingSchedulePickerHolder: this.state.operatingSchedule,
    });
    this.requestCameraPermission()
    this.requestGalleryPermission()
    setTimeout(() => {
      this.setPlaceholders();
      this.setState({ isReady: true });
    }, 10)
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

  async openNewOperatingScheduleModalVisible(visible) {
    this.setState({
      newOperatingScheduleModalVisible: visible,
      operatingSchedules: realm.objects('OperatingSchedule').filtered(`active = true AND mobile_project_id = ${this.props.project.mobile_id}`).sorted('name').map(schedule => Object.assign({}, schedule))
    });
  }

  async setCustomAttributeListModalVisible(visible, listAttribute) {
    this.setState({
      listItems: !isEmpty(listAttribute) ? await listAttribute.listItems() : [],
      listAttribute: !isEmpty(listAttribute) ? listAttribute : {},
    });
    this.setState({ customAttributeListModalVisible: visible });
  }

  async setClassiceListModalVisible(visible, classicAttribute) {
    if (classicAttribute == 'status') {
      await this.setState({
        classicListItems: ['complete', 'incomplete', 'go_back', 'no_access', 'in_review', 'need_more_information'],
      });
    }
    this.setState({ classicListModalVisible: visible, target: classicAttribute || '' });
  }

  async refreshExistingLighting(existingLighting) {
    await this.setState({ existingLighting: realm.objects('ExistingLighting').filtered(`mobile_id = ${existingLighting.mobile_id}`)[0] });
  }

  async setAttributes() {
    const primaryAttributes = await this.props.project.primaryExistingFixtureAttributes();
    const additionalAttributes = await this.props.project.additionalExistingFixtureAttributes();
    await this.setState({ primaryAttributes, additionalAttributes });
  }

  async setPlaceholders() {
    const { placeholders, tooltips, existingFixture, existingLighting } = this.state;
    const customAttributes = existingFixture.custom_attributes;
    const allAttributes = this.props.project.activeCustomAttributes
      for (let i = 0; i < allAttributes.length; i++) {
        const attribute = allAttributes[i];
        const getAttribute = await this.props.existingFixture.getAttribute(attribute.code_name);
        if (!customAttributes[attribute.code_name] && getAttribute) { // value coming from ExistingLighting
          if (attribute.input_type == 'list') {
            placeholders[attribute.code_name] = `Inheriting: (${this.props.project.labelFromUuidFixtureOrLighting(getAttribute)})`;
          } else {
            placeholders[attribute.code_name] = `Inheriting: (${getAttribute})`;
          }
          tooltips[attribute.code_name] = `${placeholders[attribute.code_name]} from Product Schedule Lighting: (${existingLighting.name}). Only enter a value here if you want to override the Product Schedule value.`;
        } else {
          placeholders[attribute.code_name] = attribute.placeholder;
        }
      }

    this.setState({ placeholders, tooltips });
  }

  setOperatingScheduleModalVisible(visible) {
    this.setState({ operatingScheduleModalVisible: visible });
  }

  setExistingFixtureModalVisible(visible) {
    this.setState({ existingFixtureModalVisible: visible });
  }

  async complexSetState(target, value) {
    const update = this.state.existingFixture;
    update[target] = value;
    await this.setState({ existingFixture: update });
  }

  async complexSetStateForCustomAttributes(target, value) {
    const update = JSON.parse(this.state.existingFixture.custom_attributes);
    update[target] = value;
    await this.setState({
      existingFixture: {
        ...this.state.existingFixture,
        custom_attributes: JSON.stringify(update),
      },
    });
  }

  async changeActiveTab(activeTab) {
    await this.setState({ activeTab });
  }

  async createExistingFixtureAttachment(imageUri, height, width) {
    let diskLocation = await attachmentActions.cameraRollToDisk(imageUri, width, height);
    await attachmentActions.createAttachment(
      'ExistingFixture',
      this.state.existingFixture.mobile_id,
      diskLocation
    )
    await markEdited('ExistingFixture', this.state.existingFixture.mobile_id);
    const photoAttachments = await ExistingFixture.attachments(this.state.existingFixture.mobile_id);
    this.setState({ photoAttachments })
  }

  async takePicture(cameraUri, height, width) {
    try {
      await CameraRoll.saveToCameraRoll(cameraUri)
      this.createExistingFixtureAttachment(cameraUri, height, width)
    } catch (error) {
      Alert.alert('Something went wrong', 'Please try again');
    }
  }

  async incrementQuantity() {
    const newQuantity = await increment(this.state.quantity);
    await this.setState({
      existingFixture: {
        ...this.state.existingFixture,
        existing_count: parseInt(newQuantity),
      },
      quantity: String(newQuantity),
    });
  }

  async decrementQuantity() {
    const newQuantity = await decrement(this.state.quantity);
    await this.setState({
      existingFixture: {
        ...this.state.existingFixture,
        existing_count: parseInt(newQuantity),
      },
      quantity: String(newQuantity),
    });
  }

  async updateQuantity(qty) {
    const valid = await isNumber(qty);
    if (valid) {
      await this.setState({
        existingFixture: {
          ...this.state.existingFixture,
          existing_count: parseInt(qty),
        },
        quantity: qty,
      });
    }
  }

  renderPhotoAttachments(photo) {
    return (
      <TouchableOpacity style={{flexBasis: '50%', padding: 5}} key={photo.mobile_id} onPress={() => this.setShowPhotoModalVisible(true, photo.mobile_id)}>
        <Image source={{ uri: (photo?.mobile_uri??"")!=''? attachmentActions.getCorrectUri(photo.mobile_uri):"", static: true }} style={{ resizeMode: 'cover', height: 150, width: '100%'} } />
      </TouchableOpacity>
    )
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
        photoToDisplay: {},
        showPhotoModalVisible: visible,
      });
    }
  }

  async saveProduct(afterAction) {
    await this.clearErrors();
    // CustomAttribute Validation
    const formErrors = await this.runValidations();
    await this.setState({ formErrors });
    if (Object.keys(formErrors).length !== 0) { return; }

    let currentAreaMobileId = this.props.existingFixture.area.mobile_id
    const existingFixture = await ExistingFixture.prepareFormDataForEdit(this.state);

    await ExistingFixture.create(existingFixture, true); // if true updates else create new
    let nextAreaMobileId = existingFixture.mobile_area_id

    if (currentAreaMobileId != nextAreaMobileId) {
      ExistingFixture.checkToRemovePins(existingFixture.mobile_id, currentAreaMobileId, nextAreaMobileId)
    }

    await ExistingFixture.findAndRunUpdate(existingFixture.mobile_id);

    if (afterAction == 'navigateBack') {
      this.navigateBack();
    } else if (afterAction == 'navigateToFloorPlan') {
      this.props.changeStack('floorplan', this.props.existingFixture.area, this.props.existingFixture, 'existing_count')
    }
  }

  async runValidations() {
    const customAttributes = JSON.parse(this.state.existingFixture.custom_attributes);
    const customAttributeErrors = await ExistingFixture.validateCustomAttributes(customAttributes, this.props.project);
    return { ...customAttributeErrors };
  }

  async saveEditFormSuccess() {
    this.navigateBack();
  }

  clearErrors() {
    this.setState({ formErrors: {} });
  }

  backToProductForm() {
    this.setState({ activeTab: 'product details' });
  }

  navigateBack() {
    if (this.props.backTo === 'edit area') this.props.backToEditingArea(this.state.area);
    if (this.props.backTo === 'inventory') this.props.changeStack('inventory');
  }

  existingLightingInfo(attribute) {
    if (
      attribute.code_name == 'light_source_technology'
      // attribute.code_name == 'watts_per_lamp' ||
      // attribute.code_name == 'lamps_per_fixture' ||
      // attribute.code_name == 'lamp_type' ||
      // attribute.code_name == 'lamp_type_subcategory'
    ) {
      const value = this.state.existingLighting.parsedCustomAttributes[attribute.code_name];
      if (attribute.input_type == 'list' && !!value) {
        return (
          <View key={attribute.uuid} style={{ backgroundColor: LIGHTEST_BLUE }}>
            <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: LIGHTER_BLUE, flexDirection: 'row' }}>
              <FixedText style={{ color: '#424242', flex: 1 }}>{titleize(attribute.code_name)}</FixedText>
              <FixedText style={{ color: '#424242', flex: -1 }}>{attribute.labelFromUuid(value)}</FixedText>
            </View>
          </View>
        );
      } else if (!!value || value === 0) {
        return (
          <View key={attribute.uuid} style={{ backgroundColor: LIGHTEST_BLUE }}>
            <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: LIGHTER_BLUE, flexDirection: 'row' }}>
              <FixedText style={{ color: '#424242', flex: 1 }}>{titleize(attribute.code_name)}</FixedText>
              <FixedText style={{ color: '#424242', flex: -1 }}>{value}</FixedText>
            </View>
          </View>
        );
      }
    }
  }

  async pickArea(mobileId) {
    if (mobileId) {
      const area = await realm.objects('Area').filtered('mobile_id = $0', mobileId)[0]
      this.setState({ area, areaLocationModalVisible: false });
    }
  }

  async areaPickerSearch(text) {
    const areasInProject = await Area.inProject(this.props.project)
    const areas = await areasInProject.filtered(`name_with_parents CONTAINS[c] $0 LIMIT(50)`, text);
    return areas;
  }

  render() {
    const {
      existingFixture,
      productDetailsSubsection,
      formErrors,
      primaryAttributes,
      additionalAttributes,
      existingLightingAttributes,
      photoAttachments,
      inheritedPhotoAttachments,
      photoSection } = this.state;

    const customAttributes = JSON.parse(this.state.existingFixture.custom_attributes);

    if (this.state.activeTab == 'product details') {
      return (
        <Form>
          <View style={{ flex: 1 }}>
            <LocationScopeButton
              project={this.props.project}
            />
            <View style={{ flex: 1, marginTop: 10, marginBottom: 5, marginHorizontal: 10 }}>
              <AreaBreadcrumbs
                style={{ flex: 1 }}
                project={this.props.project}
                area={this.state.area}
                changeEditingArea={this.props.changeEditingArea}
              />
            </View>
            <View style={{ flex: 15, marginHorizontal: 10, marginBottom: 10 }}>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <View style={{ flex: 7 }} >

                  {/* Tab Bar ------------------------------------------------------*/}

                  <View style={[GS.tabContainer, {zIndex: 2}]}>
                    <Tab
                      key={'Primary'}
                      onPress={() => this.setState({ productDetailsSubsection: 'Primary' })}
                      title={'Primary'}
                      activeTab={this.state.productDetailsSubsection === 'Primary'}
                    />

                    {additionalAttributes.length > 0 &&
                      <Tab
                        key={'Additional'}
                        onPress={() => this.setState({ productDetailsSubsection: 'Additional' })}
                        title={'Additional'}
                        activeTab={this.state.productDetailsSubsection === 'Additional'}
                      />
                    }

                    <Tab
                      key={'Notes'}
                      onPress={() => this.setState({ productDetailsSubsection: 'Notes' })}
                      title={'Notes'}
                      activeTab={this.state.productDetailsSubsection === 'Notes'}
                    />
                  </View>

                  {/* Form ---------------------------------------------------------*/}

                  <View style={{ flex: 1, borderRadius: 5, backgroundColor: '#FAFAFD', ...GS.border }}>
                    <View style={{ flexGrow: 1 }}>
                      <KeyboardAwareScrollView keyboardOpeningTime={100} extraScrollHeight={70}>

                        {productDetailsSubsection === 'Primary' &&

                          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>

                            <View style={{flexBasis: '50%'}}>
                              <FixedFormLabel labelStyle={{ marginTop: 8 }}>Area</FixedFormLabel>
                              <ClickableInput
                                onPress={() => this.setState({ areaLocationModalVisible: true })}
                                title={!!this.state.area ? this.state.area.name_with_parents : ""}
                                hint={'If this existing product is tied to mapping, changing the area location to an area with a different map will remove all of its current pins.'}
                              />
                            </View>

                            <View style={{flexBasis: '50%'}}>
                              <FixedFormLabel labelStyle={{ marginTop: 8 }}>Operating Schedule</FixedFormLabel>
                              <View style={{flexDirection: 'row'}}>
                                <View style={{flex: 9}}>
                                  <ClickableInput
                                    onPress={() => this.setOperatingScheduleModalVisible(true)}
                                    title={this.state.operatingSchedule ? this.state.operatingSchedule.name : '<Use Default>'}
                                  />
                                </View>
                                <TouchableOpacity
                                  style={styles.clear}
                                  onPress={() => this.openNewOperatingScheduleModalVisible(true)}
                                >
                                  <Icon name="plus" color={'#FFFFFF'} iconStyle={{ padding: 5 }} size={15} type={'font-awesome'} />
                                </TouchableOpacity>
                              </View>
                            </View>

                            <View style={{flexBasis: '50%'}}>
                              <FixedFormLabel labelStyle={{ marginTop: 8 }}>Status</FixedFormLabel>
                              <ClickableInput
                                onPress={() => this.setClassiceListModalVisible(true, 'status')}
                                title={existingFixture.status ? titleize(existingFixture.status) : ''}
                                placeholder={'select'}
                                listItems={['complete', 'incomplete', 'go_back']}
                                topThreeSetAttribute={this.complexSetState.bind(this)}
                                target={'status'}
                              />
                            </View>

                            {primaryAttributes.map(attribute => (
                              <CustomAttributeFormElement
                                key={attribute.mobile_id}
                                elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '50%', marginTop: 8 }}
                                isReady={this.state.isReady}
                                attribute={attribute}
                                customAttributes={customAttributes}
                                complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
                                setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
                                formErrors={this.state.formErrors}
                                tooltips={this.state.tooltips}
                                placeholders={this.state.placeholders}
                              />
                            ))}

                          </View>

                        }

                        {productDetailsSubsection === 'Additional' && additionalAttributes.length > 0 &&

                          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>

                            {additionalAttributes.map(attribute => (
                              <CustomAttributeFormElement
                                key={attribute.mobile_id}
                                elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '50%', marginTop: 8 }}
                                isReady={this.state.isReady}
                                attribute={attribute}
                                customAttributes={customAttributes}
                                complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
                                setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
                                formErrors={this.state.formErrors}
                                tooltips={this.state.tooltips}
                                placeholders={this.state.placeholders}
                              />
                            ))}

                          </View>

                        }

                        {productDetailsSubsection === 'Notes' &&

                          <View style={{ flex: 1 }} >

                            <FixedFormLabel labelStyle={{ marginTop: 8 }}>Notes</FixedFormLabel>
                            <StringInput
                              multiline
                              label={null}
                              placeholder="Notes"
                              hint={'These may be visible to your customer.'}
                              value={existingFixture.notes ? existingFixture.notes : ''}
                              onChange={this.complexSetState}
                              target="notes"
                            />

                            <FixedFormLabel labelStyle={{ marginTop: 8 }}>Internal Notes</FixedFormLabel>
                            <StringInput
                              multiline
                              label={null}
                              placeholder="Internal Notes"
                              hint={'These will not be visible to your customer.'}
                              value={existingFixture.internal_notes ? existingFixture.internal_notes : ''}
                              onChange={this.complexSetState}
                              target="internal_notes"
                            />

                          </View>

                        }

                      </KeyboardAwareScrollView>
                    </View>
                  </View>
                </View>
                <View style={{ flex: 5, paddingLeft: 10, paddingTop: 5 }}>

                  {/* Product Details -----------------------------------------------------*/}

                  <TouchableOpacity
                    style={{ flex: -1 }}
                    onPress={() => this.setExistingFixtureModalVisible(true)}
                    activeOpacity={ACTIVE_OPACITY}
                  >
                    <View style={{ marginBottom: 20, borderWidth: 2, borderColor: LIGHT_BLUE, ...GS.borderRounded }}>
                      <View style={{ padding: 10, backgroundColor: 'white', ...GS.borderTopRounded, borderBottomWidth: 2, borderBottomColor: LIGHTER_BLUE }}>
                        <FixedText style={{ color: 'black', alignSelf: 'center', fontWeight: 'bold' }}>{`(${this.state.existingLighting.code}) ${this.state.existingLighting.name}`}</FixedText>
                      </View>
                      <View style={{ backgroundColor: LIGHTEST_BLUE, ...GS.borderBottomRounded }}>
                        <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: LIGHTER_BLUE, flexDirection: 'row' }}>
                          <FixedText style={{ color: '#424242', flex: 1 }}>Watts/Product</FixedText>
                          <FixedText style={{ color: '#424242', flex: -1 }}>{this.state.existingLighting.watts_per_product}</FixedText>
                        </View>
                      </View>

                      {existingLightingAttributes.map(attribute => this.existingLightingInfo(attribute))}

                      <View style={{ backgroundColor: LIGHTEST_BLUE, ...GS.borderBottomRounded }}>
                        <View style={{ padding: 8, flexDirection: 'row' }}>
                          <FixedText style={{ color: '#424242', flex: 1 }}>Lamp Hours</FixedText>
                          <FixedText style={{ color: '#424242', flex: -1 }}>{formatLargeNumber(this.state.existingLighting.lm70)}</FixedText>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Product Counter -----------------------------------------------------*/}

                  <ProductCounter
                    quantity={this.state.quantity}
                    onChangeText={text => this.updateQuantity(text)}
                    onIncrement={() => this.incrementQuantity()}
                    onDecrement={() => this.decrementQuantity()}
                    height={80}
                    containerStyle={{ flex: -1 }}
                    textStyle={{ fontSize: 22, fontWeight: 'bold' }}
                  />

                  {/* Photo Tabs -----------------------------------------------------*/}

                  <View style={[GS.tabContainer, { marginTop: 20, zIndex: 2 }]}>
                    <Tab
                      key={'Photos'}
                      onPress={() => this.setState({ photoSection: 'Photos' })}
                      title={'Photos'}
                      activeTab={photoSection === 'Photos'}
                    />
                    <Tab
                      key={'Inherited Photos'}
                      onPress={() => this.setState({ photoSection: 'Inherited Photos' })}
                      title={'Inherited Photos'}
                      activeTab={photoSection === 'Inherited Photos'}
                      notification={inheritedPhotoAttachments.length ? inheritedPhotoAttachments.length : null}
                    />
                    <TouchableOpacity
                      key={'Mapping'}
                      style={{
                        height: 37,
                        paddingHorizontal: 20,
                        ...GS.center,
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderLeftWidth: 2,
                        borderTopWidth: 2,
                        borderRightWidth: 2,
                        borderColor: ExistingFixture.mapppingStyle(existingFixture.mobile_id, existingFixture.existing_count) || DARKER_GRAY
                      }}
                      onPress={() => this.saveProduct('navigateToFloorPlan')}
                    >
                      <FixedText style={{
                        color: DARKER_GRAY,
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}>
                        {"Mapping"}
                      </FixedText>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.photosContainer]}>
                    <ScrollView>

                      {photoSection == 'Photos' &&
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 5 }}>
                          {photoAttachments.map(photo => this.renderPhotoAttachments(photo))}
                        </View>
                      }

                      {photoSection == 'Inherited Photos' &&
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 5 }}>
                          {inheritedPhotoAttachments.map(photo => this.renderPhotoAttachments(photo))}
                        </View>
                      }

                    </ScrollView>
                  </View>

                </View>
              </View>
            </View>

            {/* Photo Modal -----------------------------------------------------*/}

            <ShowPhotoModal 
              isVisible={this.state.showPhotoModalVisible}
              photoToDisplay={this.state.photoToDisplay}
              closeShowPhotoModalVisible={() => this.setShowPhotoModalVisible(false, null)}
            />

            {/* Operating Schedule Modal -----------------------------------------------------*/}

            <OperatingForm
              showForm={this.state.newOperatingScheduleModalVisible}
              onCancel={(operatingId) => {
                if (!!operatingId) {
                  this.setState({ operatingSchedule: realm.objects('OperatingSchedule').filtered(`mobile_id = ${operatingId}`)[0] })
                }
                this.openNewOperatingScheduleModalVisible(false)
              }}
              project={this.props.project}
              existingFixture={this.state.existingFixture}
            />

            {/* Area Modal -----------------------------------------------------*/}

            <AreaPickerModal
              areaPickerSearch={this.areaPickerSearch}
              project={this.props.project}
              isVisible={this.state.areaLocationModalVisible}
              title='Pick an Area'
              confirmButton='confirm'
              onSubmit={this.pickArea}
              onCancel={() => {
                this.setState({ areaLocationModalVisible: false, area: this.state.area })
              }}
              selectedAreaId={this.state.area.mobile_id}
              areas={this.state.areasInProject}
            />

            {/* Operating Schedule Modal -----------------------------------------------------*/}

            <PickerModal
              isVisible={this.state.operatingScheduleModalVisible}
              onSubmit={() => {
                this.setState({ operatingSchedule: this.state.operatingSchedulePickerHolder });
                this.setOperatingScheduleModalVisible(false);
              }}
              title={'Pick an Operating Schedule'}
              closePickerModal={() => this.setOperatingScheduleModalVisible(false)}
            >
              <Picker
                selectedValue={this.state.operatingSchedulePickerHolder ? this.state.operatingSchedulePickerHolder.mobile_id : null}
                onValueChange={(itemValue, itemIndex) => this.setState({ operatingSchedulePickerHolder: realm.objects('OperatingSchedule').filtered(`mobile_id = ${itemValue}`)[0] })}
              >
                <Picker.Item key={0} label={'<Use Default>'} value={null} />
                {this.state.operatingSchedules.map(operatingSchedule => (
                  <Picker.Item key={operatingSchedule.mobile_id} label={operatingSchedule.name} value={operatingSchedule.mobile_id} />
                ))}
              </Picker>
            </PickerModal>

            {/* Existing Fixture Modal -----------------------------------------------------*/}

            <ExistingFixtureModal
              action={'edit'}
              existingFixture={this.state.existingFixture}
              area={this.state.area}
              project={this.props.project}
              isVisible={this.state.existingFixtureModalVisible}
              afterRenderAction={this.refreshExistingLighting}
              closeExistingFixtureModal={() => this.setExistingFixtureModalVisible(false)}
            />

            {/* CustomAttribute List Input Modal -----------------------------------------------------*/}

            <CustomAttributeListModal
              isVisible={this.state.customAttributeListModalVisible}
              closeCustomAttributeListModal={() => this.setCustomAttributeListModalVisible(false, {})}
              onPress={this.complexSetStateForCustomAttributes.bind(this)}
              listItems={this.state.listItems}
              listAttribute={this.state.listAttribute}
              customAttributes={this.state.existingFixture.custom_attributes}
            />

            {/* ClassicAttribute List Input Modal -----------------------------------------------------*/}

            <ClassicListModal
              isVisible={this.state.classicListModalVisible}
              closeClassicListModalVisible={() => this.setClassiceListModalVisible(false, '')}
              onPress={this.complexSetState.bind(this)}
              classicListItems={this.state.classicListItems}
              target={this.state.target}
              model={this.state.existingFixture}
            />

          </View>

          {/* Bottom Bar -----------------------------------------------------*/}

          <BottomBar>
            <View style={{ flex: -1, marginLeft: 10 }}>
              <Button
                buttonStyle={styles.smallButtonStyle}
                style={styles.smallButtonContainerStyle}
                icon={{ name: 'camera-retro', type: 'font-awesome', color: '#90979a', size: 30 }}
                onPress={() => {
                  launchCamera({ mediaType: 'photo' }, (response) => {
                    if (response.didCancel) {
                      console.log('User cancelled image picker');
                    } else if (response.error) {
                      console.log('ImagePicker Error: ', response.error);
                    } else {
                      // this.takePicture(response.uri, response.height, response.width);
                      let assets = response?.assets??[]
                      if(assets.length>0) {
                        let asset = assets[0]
                        this.takePicture(asset.uri, asset.height, asset.width);
                      }
                    }
                  });
                }}
              />
            </View>
            <View style={{ flex: -1, marginLeft: 10 }}>
              <Button
                buttonStyle={styles.smallButtonStyle}
                style={styles.smallButtonContainerStyle}
                icon={{ name: 'picture-o', type: 'font-awesome', color: '#90979a', size: 30 }}
                onPress={() => {
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
                        this.createExistingFixtureAttachment(asset.uri, asset.height, asset.width);
                      }
                    }
                    Orientation.lockToLandscape() // To prevent crash ios 10.3
                  });
                }}
              />
            </View>
            <View style={{ flex: -1, marginLeft: 10 }}>
              <Button
                buttonStyle={styles.smallButtonStyle}
                style={styles.smallButtonContainerStyle}
                icon={{ name: 'map-marker', type: 'font-awesome', color: ExistingFixture.mapppingStyle(this.state.existingFixture.mobile_id, this.state.existingFixture.existing_count) || DARKER_GRAY, size: 30 }}
                onPress={() => this.saveProduct('navigateToFloorPlan')}
              />
            </View>
            <View style={{ flex: 1 }} />
            <View style={{ flex: -1 }} >
              <ActionButton
                alt
                title="cancel"
                onPress={this.navigateBack}
              />
            </View>
            <View style={{ flex: -1, minWidth: 150 }}>
              <ActionButton title="save product" onPress={() => this.saveProduct('navigateBack')} />
            </View>
          </BottomBar>
        </Form>
      );
    } else if (this.state.activeTab == 'browse camera roll') {
      return (
        <CameraRollBrowser
          backFunction={this.changeActiveTab}
          backFunctionStack="product details"
          attachable_type="ExistingFixture"
          attachable_mobile_id={this.state.existingFixture.mobile_id}
        />
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },

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
    backgroundColor: '#FFFFFF',
  },

  smallButtonContainerStyle: {
    width: 80,
    height: 60,
    paddingRight: 5,
    marginLeft: 0,
    marginTop: 10,
  },

  photosContainer: {
    padding: 5,
    backgroundColor: '#FAFAFD',
    flex: 1,
    ...GS.border,
    ...GS.borderRounded,
  },

  clear: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 35,
    marginTop: 7.5,
    marginRight: 20,
    paddingVertical: 5,
    paddingHorizontal: 7.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: MID_GRAY,
    backgroundColor: '#49D184',
  },
});

ExistingFixtureForm.propTypes = {
  backTo: PropTypes.string.isRequired,
  existingFixture: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired,
};
