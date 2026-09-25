import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from 'react-native-elements';
import {launchCamera,launchImageLibrary} from 'react-native-image-picker';
import Orientation from 'react-native-orientation';
import DropdownAlert from 'react-native-dropdownalert';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Alert,  Image,  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ActionButton, FloorPlanButton, AreaBreadcrumbs, BottomBar, ClickableInput, DeleteButton, EmptyMessage, ExistingFixtureModal, FixedFormLabel, FixedText, Form, PickerModal, ProductCounter, StringInput, NumberInput, TapInput, Tab, TableCell, TableHeader, TableRow, ShowPhotoModal, OperatingForm, LocationScopeButton, AreaPickerModal, CustomAttributeFormElement, CustomAttributeListModal } from '../components';
import {Picker} from '@react-native-picker/picker'
import realm from '../database/realm';
import CameraRollBrowser from './CameraRollBrowser';
import { markEdited } from '../lib/realmActions';
import attachmentActions from '../lib/attachmentActions';
import { isNumber, isEmpty } from '../lib/numberHelpers';
import { Area, ExistingFixture } from '../database/models';
import { GS, LIGHT_BLUE, MID_GRAY, DARKER_GRAY, WHITE, BLACK_GRAY, PRIMARY_BLUE } from '../resources/styles/globals';
import memoize from 'fast-memoize';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
const getParentAreas = memoize((realmAreas) => {
  const areas = [{ area: { code : '', mobile_id: 0, name_with_parents: 'No Parent' } }];

  for (const area of realmAreas) {
    const areaObject = { area: area };
    areas.push(areaObject);
  }
  return areas;
});

export default class AreaForm extends Component {
  constructor(props) {
    super(props);
    let edit = false;
    let area = { custom_attributes: '{}' };
    if (props.project.mobile_location_scope_ids.length == 1) {
      area.mobile_location_id = props.project.mobile_location_scope_ids[0];
    }
    let existingFixtures = null;
    let photoAttachments = [];
    let stack = 'area form';
    let editingExistingFixture = null;

    if (props.stack) {
      stack = props.stack;
    }

    if (props.editingExistingFixture) {
      editingExistingFixture = props.editingExistingFixture;
    }

    if (props.area) {
      edit = true;
      area = realm.objects('Area').filtered(`mobile_id = ${props.area.mobile_id}`)[0].toPlainObject();
      existingFixtures = ExistingFixture.inArea(area.mobile_id);
      photoAttachments = Area.attachments(area.mobile_id);
    }

    const parentAreaId = edit ? area.mobile_parent_id : null;
    const locationId = edit ? area.mobile_location_id : props.project.mobile_location_scope_ids.length == 1 ? props.project.mobile_location_scope_ids[0] : null;
    const operatingSchedule = edit && area.mobile_operating_schedule_id ? realm.objects('OperatingSchedule').filtered(`active = true AND mobile_id = ${area.mobile_operating_schedule_id}`)[0] : null;
    const rateSchedule = edit && area.mobile_rate_schedule_id ? realm.objects('RateSchedule').filtered(`active = true AND mobile_id = ${area.mobile_rate_schedule_id}`)[0] : null;
    const cooling = edit && area.mobile_cooling_id ? realm.objects('Cooling').filtered(`active = true AND mobile_id = ${area.mobile_cooling_id}`)[0] : null;
    const heating = edit && area.mobile_heating_id ? realm.objects('Heating').filtered(`active = true AND mobile_id = ${area.mobile_heating_id}`)[0] : null;

    const primaryAttributes = props.project.primaryAreaAttributes();
    const additionalAttributes = props.project.additionalAreaAttributes();

    this.state = {
      stack,
      photoAttachments,
      photoToDisplay: {},
      parentAreas: [],
      locations: props.project.mobile_location_scope_ids.length > 0 ? this.props.project.scoped_locations : this.props.project.locations,
      editingExistingFixture,
      operatingScheduleModalVisible: false,
      rateScheduleModalVisible: false,
      coolingModalVisible: false,
      heatingModalVisible: false,
      subsection: 'Existing Products',
      areaSubsection: 'Primary',
      area,
      breadcrumbParents: null,
      cooling,
      coolings: props.project.coolings,
      existingFixtures: edit ? existingFixtures : null,
      existingFixtureModalVisible: !!this.props.openExistingFixtureModal,
      heating,
      heatings: props.project.heatings,
      mode: edit ? 'edit' : 'new',
      nameError: null,
      operatingSchedule,
      operatingSchedules: props.project.operatingSchedules,
      parentArea: edit && area.mobile_parent_id ? realm.objects('Area').filtered(`mobile_id = ${area.mobile_parent_id}`)[0] : null,
      parentAreaId,
      locationId,
      location: edit && area.mobile_location_id ? realm.objects('Location').filtered(`active = true AND mobile_id = ${area.mobile_location_id}`)[0] : null,
      parentAreaModalVisible: false,
      locationModalVisible: false,
      showPhotoModalVisible: false,
      rateSchedule,
      rateSchedules: props.project.rateSchedules,
      parentError: null,
      subAreas: false,
      locationIdHolder: locationId,
      operatingSchedulePickerHolder: operatingSchedule,
      newOperatingScheduleModalVisible: false,
      rateSchedulePickerHolder: rateSchedule,
      coolingSchedulePickerHolder: cooling,
      heatingSchedulePickerHolder: heating,
      loadingSpinner: false,
      primaryAttributes,
      additionalAttributes,
      customAttributeListModalVisible: false,
      listItems: [],
      listAttribute: {},
      formErrors: {},
      isReady: false,
    };

    // bind methods
    this.updateProducts = this.updateProducts.bind(this);
    this.complexSetState = this.complexSetState.bind(this);
    this.backToAreaForm = this.backToAreaForm.bind(this);
    this.backToAreas = this.backToAreas.bind(this);
    this.backToInventory = this.backToInventory.bind(this);
    this.setParentAreaModalVisible = this.setParentAreaModalVisible.bind(this);
    this.setLocationModalVisible = this.setLocationModalVisible.bind(this);
    this.setOperatingScheduleModalVisible = this.setOperatingScheduleModalVisible.bind(this);
    this.openNewOperatingScheduleModalVisible = this.openNewOperatingScheduleModalVisible.bind(this);
    this.setRateScheduleModalVisible = this.setRateScheduleModalVisible.bind(this);
    this.setCoolingModalVisible = this.setCoolingModalVisible.bind(this);
    this.setHeatingModalVisible = this.setHeatingModalVisible.bind(this);
    this.setExistingFixtureModalVisible = this.setExistingFixtureModalVisible.bind(this);
    this.changeStack = this.changeStack.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onAddSubArea = this.onAddSubArea.bind(this);
    this.onAddAnother = this.onAddAnother.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.openPhotoCapture = this.openPhotoCapture.bind(this);
    this.openCameraRollBrowser = this.openCameraRollBrowser.bind(this);
    this.setParentAreas = this.setParentAreas.bind(this);
    this.pickParent = this.pickParent.bind(this);
    this.areaPickerSearch = this.areaPickerSearch.bind(this);
  }

  componentDidMount() {
    realm.addListener('change', this.updateProducts);
    this.setParentAreas();
    this.requestCameraPermission()
    this.requestGalleryPermission()
    setTimeout(() => {
      this.setState({ isReady: true });
    }, 250)
  }

  componentWillUnmount() {
    realm.removeAllListeners();
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

  async setParentAreas() {
    try {
      const parentAreas = await Area.potentialParentAreas(this.state.area, this.props.project);
      this.setState({ parentAreas: getParentAreas(parentAreas.sorted('name_with_parents', false)) });
    } catch (e) {
      console.log('Error setting parent areas', e.stack);
    }
  }

  async setCustomAttributeListModalVisible(visible, listAttribute) {
    this.setState({
      listItems: !isEmpty(listAttribute) ? await listAttribute.listItems() : [],
      listAttribute: !isEmpty(listAttribute) ? listAttribute : {},
    });
    this.setState({ customAttributeListModalVisible: visible });
  }

  updateProducts() {
    if (this.state.mode == 'edit') {
      const existingFixtures = ExistingFixture.inArea(this.state.area.mobile_id);
      this.setState({
        existingFixtures,
      });
    }
  }

  async createAreaAttachment(imageUri, height, width) {
    const diskLocation = await attachmentActions.cameraRollToDisk(imageUri, width, height);
    console.log('diskLocation ',diskLocation)
    await attachmentActions.createAttachment(
      'Area',
      this.state.area.mobile_id,
      diskLocation,
    );
    await markEdited('Area', this.state.area.mobile_id);
    const photoAttachments = await Area.attachments(this.state.area.mobile_id);
    this.setState({ photoAttachments, subsection: 'Photos' });
  }

  async openCameraRollBrowser() {
    if (this.state.area) {
      const newArea = await this.submitForm();
      if (!newArea) { return; }
    }

    Orientation.unlockAllOrientations(); // To prevent crash ios 10.3

    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        console.log('image response ',response)
        // return
        const assets = response?.assets??[]
        if(assets.length>0) {
          const asset = assets[0]
          this.createAreaAttachment(asset.uri, asset.height, asset.width);
        }
        
      }
      Orientation.lockToLandscape(); // To prevent crash ios 10.3
    });
  }

  async openPhotoCapture() {
    if (this.state.area) {
      const newArea = await this.submitForm();
      if (!newArea) { return; }
    }

    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        console.log('launchCamera response ',response)
        const assets = response?.assets??[]
        if(assets.length>0) {
          const asset = assets[0]
          this.takePicture(asset.uri, asset.height, asset.width);
        }
        
      }
    });
  }

  async takePicture(cameraUri, height, width) {
    try {
      await CameraRoll.saveToCameraRoll(cameraUri);
      console.log(cameraUri, height, width)
      this.createAreaAttachment(cameraUri, height, width);
    } catch (error) {
      console.log('error ',error)
      Alert.alert('Something went wrong', 'Please try again');
    }
  }

  setOperatingScheduleModalVisible(visible) {
    this.setState({ operatingScheduleModalVisible: visible });
  }

  setRateScheduleModalVisible(visible) {
    this.setState({ rateScheduleModalVisible: visible });
  }

  setCoolingModalVisible(visible) {
    this.setState({ coolingModalVisible: visible });
  }

  setHeatingModalVisible(visible) {
    this.setState({ heatingModalVisible: visible });
  }

  async setExistingFixtureModalVisible(visible) {
    if (visible && !!this.state.area) {
      const success = await this.submitForm();
      if (success) {
        this.setState({ existingFixtureModalVisible: visible });
      } else {

      }
    } else {
      this.setState({ existingFixtureModalVisible: visible });
    }
  }

  setLocationModalVisible(visible) {
    if (visible == true) {
      this.setState({ locationIdHolder: this.state.locationId });
    }
    this.setState({ locationModalVisible: visible });
  }

  setParentAreaModalVisible(visible) {
    this.setState({ parentAreaModalVisible: visible });
  }

  async changeStack(stack) {
    await this.setState({ stack });
  }

  backToAreaForm() {
    this.setState({ stack: 'area form' });
  }

  async complexSetState(target, value) {
    const update = this.state.area;
    update[target] = value;
    this.setState({ area: update });
  }

  async complexSetStateForCustomAttributes(target, value) {
    const { area } = this.state;
    const update = JSON.parse(area.custom_attributes);
    update[target] = value;
    await this.setState({
      area: {
        ...area,
        custom_attributes: JSON.stringify(update),
      },
    });
  }

  backToAreas() {
    // this calls the change stack function in './Home.js'
    this.props.changeStack('areas');
  }

  backToInventory() {
    // this calls the change stack function in './Home.js'
    this.props.changeStack('inventory');
  }

  async refreshAreaForm(parentArea) {

    let parentAreas = await Area.potentialParentAreas({}, this.props.project)

    let parentAreaId = null;
    if (parentArea) {
      parentAreaId = parentArea.mobile_id;
      locationId = parentArea.mobile_location_id;
    } else if (this.state.parentArea) {
      parentArea = this.state.parentArea;
      parentAreaId = parentArea.mobile_id;
      locationId = parentArea.mobile_location_id;
    } else {
      locationId = this.state.locationId;
    }

    await this.setState({
      areaSubsection: 'Primary',
      area: { mobile_parent_id: parentAreaId, mobile_location_id: locationId, custom_attributes: '{}' },
      cooling: null,
      coolings: this.props.project.coolings,
      existingFixtures: null,
      heating: null,
      heatings: this.props.project.heatings,
      mode: 'new',
      operatingSchedule: null,
      operatingSchedules: this.props.project.operatingSchedules,
      parentArea,
      parentAreaId,
      location: locationId ? realm.objects('Location').filtered('mobile_id = $0', locationId)[0] : null,
      locationId,
      parentAreaModalVisible: false,
      locationModalVisible: false,
      parentAreas: getParentAreas(parentAreas),
      photoAttachments: [],
      photoToDisplay: {},
      rateSchedule: null,
      rateSchedules: this.props.project.rateSchedules,
      subAreas: false,
    });

    // refresh from edit mode fails without unmounting component:
    this.props.changeStack('new area');
  }

  confirmDeactivation(product) {
    Alert.alert(
      'Are You Sure?',
      'You cannot undo this action',
      [
        { text: 'Yes, delete it.', onPress: () => product.deactivate(), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: false },
    );
  }

  clearErrors() {
    this.setState({
      nameError: null,
      parentError: null,
    });
  }

  async editProduct(existingFixture) {
    const success = await this.submitForm();

    if (success && !!this.state.area) {
      this.props.editAreaProduct(existingFixture);
    } else {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }

  onAddAnother() {
    this.onSubmit('add another');
  }

  onAddSubArea() {
    this.onSubmit('add sub-area');
  }

  onSave() {
    this.onSubmit('back to areas');
  }

  async onSubmit(afterAction) {
    afterAction = afterAction || 'back to areas';
    const success = await this.submitForm();

    if (success) {
      if (afterAction === 'back to areas') {
        this.dropDownAlertRef.alertWithType('success', 'Success', 'Area succesfully saved.');
      } else if (afterAction === 'add another') {
        this.refreshAreaForm();
      } else if (afterAction === 'add sub-area') {
        this.refreshAreaForm(this.state.area);
      }
    }
  }

  async submitForm() {
    await this.clearErrors();

    const areaBeforeSave = this.state.area;
    areaBeforeSave.mobile_operating_schedule_id = this.state.operatingSchedule ? this.state.operatingSchedule.mobile_id : null;
    areaBeforeSave.mobile_rate_schedule_id = this.state.rateSchedule ? this.state.rateSchedule.mobile_id : null;
    areaBeforeSave.mobile_cooling_id = this.state.cooling ? this.state.cooling.mobile_id : null;
    areaBeforeSave.mobile_heating_id = this.state.heating ? this.state.heating.mobile_id : null;
    areaBeforeSave.mobile_parent_id = this.state.parentAreaId ? this.state.parentAreaId : null;

    if (areaBeforeSave.mobile_parent_id) {
      const parent = await realm.objects('Area').filtered(`mobile_id = ${areaBeforeSave.mobile_parent_id}`)[0];
      areaBeforeSave.mobile_location_id = parent.mobile_location_id;
    } else {
      areaBeforeSave.mobile_location_id = this.state.locationId ? this.state.locationId : null;
    }

    const errors = await Area.validate(this.state.area);
    this.setState(errors);
    if (Object.keys(errors).length !== 0) {
      this.dropDownAlertRef.alertWithType('error', 'Area did not save', 'There was a problem saving this area, check the top left tabs and make sure all required fields are filled out.');
      return false;
    }

    // CustomAttribute Validation
    const formErrors = await this.runValidations();
    await this.setState({ formErrors });
    if (Object.keys(formErrors).length !== 0) { return false; }

    await this.setState({ area: areaBeforeSave });

    var preparedArea = await Area.prepareFormData(this.state.area, this.props.project);

    await Area.didIlluminanceChange(areaBeforeSave.mobile_id, preparedArea);
    await Area.didParentChange(areaBeforeSave.mobile_id, preparedArea);
    const resetParents = await Area.didLocationChange(areaBeforeSave.mobile_id, preparedArea);
    const updatedName = await Area.updateNameWithParents(areaBeforeSave, preparedArea);

    await Area.create(updatedName, (this.state.mode === 'edit'));

    const newArea = await realm.objects('Area').filtered(`mobile_id = ${preparedArea.mobile_id}`)[0];
    await newArea.updateChildNames(newArea.name_with_parents)
    const existingFixtures = await realm.objects('ExistingFixture').filtered(`mobile_area_id = '${newArea.mobile_id}' AND active = true`);

    await Area.findAndRunUpdate(newArea.mobile_id);

    this.setState({
      area: newArea.toPlainObject(),
      mode: 'edit',
      existingFixtures,
      // loadingSpinner: false,
      photoAttachments: Area.attachments(newArea.mobile_id),
    });

    if (resetParents) {
      this.setParentAreas()
    }

    return true;
  }

  async runValidations() {
    const custom_attributes = JSON.parse(this.state.area.custom_attributes);
    const customAttributeErrors = await Area.validateCustomAttributes(custom_attributes, this.props.project);
    return { ...customAttributeErrors };
  }

  async setSubAreaTab() {
    if (!this.state.subAreas) { // to prevent the re-render of subareas
      await this.setState({ subAreas: this.renderAreaChildren(this.state.area) });
    }
    this.setState({ subsection: 'Sub-Areas' });
  }

  renderAreaSectionTabs() {
    return (
      <View style={[GS.tabContainer]}>
        {['Primary', 'Additional', 'Notes'].map(areaTab => (
          <Tab
            key={areaTab}
            onPress={() => this.setState({ areaSubsection: areaTab })}
            title={areaTab}
            activeTab={this.state.areaSubsection === areaTab}
          />
        ))}
      </View>
    );
  }

  async openNewOperatingScheduleModalVisible(visible) {
    if (this.state.area) {
      const newArea = await this.submitForm();
      if (!newArea) { return; }
    }
    this.setState({ newOperatingScheduleModalVisible: visible });
  }

  renderAreaSubsection() {
    const area = this.state.area;

    if (this.state.areaSubsection == 'Primary') {
      return (
        <KeyboardAwareScrollView
          keyboardOpeningTime={100}
          extraScrollHeight={70}
        >
          <View style={{ flex: -1, marginTop: 8 }}>
            <FixedFormLabel>Name</FixedFormLabel>
            <StringInput
              label={null}
              placeholder="area name"
              value={area.name}
              target="name"
              onChange={this.complexSetState}
              error={this.state.nameError !== null}
              errorMessage={this.state.nameError}
            />
          </View>
          <View style={{ flex: -1, marginTop: 8 }}>
            <FixedFormLabel>Parent Area</FixedFormLabel>
            <ClickableInput
              onPress={() => this.setParentAreaModalVisible(true)}
              title={this.state.parentArea ? this.state.parentArea.name_with_parents : 'No Parent'}
              error={this.state.parentError !== null}
              errorMessage={this.state.parentError}
              hint={'If this area is tied to mapping, changing the parent to an area with a different map will remove all tied and child pins.'}
            />
          </View>
          {(!this.state.parentAreaId && this.props.project.mobile_location_scope_ids.length != 1) ?
            <View style={{ flex: -1, marginTop: 8 }}>
              <FixedFormLabel>Area Location</FixedFormLabel>
              <ClickableInput
                onPress={() => this.setLocationModalVisible(true)}
                title={this.state.location ? this.state.location.name : 'No Location'}
              />
            </View>
          : null}
          <View style={{ flex: -1, marginTop: 8 }}>
            <FixedFormLabel>Operating Schedule</FixedFormLabel>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 9 }}>
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

          {/* Primary Custom Attributes -----------------------------------------------------*/}
  
          {this.state.primaryAttributes.map(attribute => (
            <CustomAttributeFormElement
              key={attribute.mobile_id}
              elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '33%', marginTop: 8 }}
              isReady={this.state.isReady}
              attribute={attribute}
              customAttributes={JSON.parse(area.custom_attributes)}
              complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
              setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
              formErrors={this.state.formErrors}
            />
          ))}

        </KeyboardAwareScrollView>
      );
    } else if (this.state.areaSubsection == 'Additional') {
      return (
        <KeyboardAwareScrollView
          keyboardOpeningTime={100}
          extraScrollHeight={50}
        >

          {/* Additional Custom Attributes -----------------------------------------------------*/}
  
          {this.state.additionalAttributes.map(attribute => (
            <CustomAttributeFormElement
              key={attribute.mobile_id}
              elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '33%', marginTop: 8 }}
              isReady={this.state.isReady}
              attribute={attribute}
              customAttributes={JSON.parse(area.custom_attributes)}
              complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
              setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
              formErrors={this.state.formErrors}
            />
          ))}

          <View style={{ flex: -1, marginTop: 8 }}>
            <FixedFormLabel>Rate Schedule</FixedFormLabel>
            <ClickableInput
              onPress={() => this.setRateScheduleModalVisible(true)}
              title={this.state.rateSchedule ? this.state.rateSchedule.name : '<Use Default>'}
            />
          </View>
          <View style={{ flex: -1, marginTop: 8 }}>
            <FixedFormLabel>Cooling</FixedFormLabel>
            <ClickableInput
              onPress={() => this.setCoolingModalVisible(true)}
              title={this.state.cooling ? this.state.cooling.name : '<Use Default>'}
            />
          </View>
          <View style={{ flex: -1, marginTop: 8 }}>
            <FixedFormLabel>Heating</FixedFormLabel>
            <ClickableInput
              onPress={() => this.setHeatingModalVisible(true)}
              title={this.state.heating ? this.state.heating.name : '<Use Default>'}
            />
          </View>
        </KeyboardAwareScrollView>
      );
    } else if (this.state.areaSubsection == 'Notes') {
      return (
        <KeyboardAwareScrollView
          keyboardOpeningTime={100}
          extraScrollHeight={50}
        >
          <View style={{ flex: -1, marginTop: 8 }}>
            <FixedFormLabel>Notes</FixedFormLabel>
            <StringInput
              multiline
              label={null}
              placeholder="notes"
              target="notes"
              value={area.notes}
              onChange={this.complexSetState}
            />
          </View>
        </KeyboardAwareScrollView>
      );
    }
  }

  renderSectionTabs() {
    return (
      <View style={[GS.tabContainer]}>
        {['Existing Products', 'Sub-Areas', 'Photos', 'Mapping'].map(tab => (
          <View key={tab}>

            {tab == 'Mapping' ?
              <TouchableOpacity
                style={{
                  height: 40,
                  paddingHorizontal: 20,
                  ...GS.center,
                  marginBottom: -1,
                  borderTopLeftRadius: 5,
                  borderTopRightRadius: 5,
                  borderLeftWidth: 2,
                  borderTopWidth: 2,
                  borderRightWidth: 2,
                  borderColor: Area.mapppingStyle(this.state.area.mobile_id) || DARKER_GRAY,
                }}
                onPress={() => this.navigateToFloorPlan()}
              >
                <FixedText style={{
                  color: DARKER_GRAY,
                  fontWeight: 'bold',
                  fontSize: 14,
                }}
                >
                  {'Mapping'}
                </FixedText>
              </TouchableOpacity>
            : null}

            {tab != 'Mapping' ?
              <Tab
                key={tab}
                onPress={() => (tab == 'Sub-Areas' ? this.setSubAreaTab() : this.setState({ subsection: tab }))}
                title={tab}
                activeTab={this.state.subsection === tab}
              />
            : null}
          </View>
        ))}
      </View>
    );
  }

  renderSubsection() {
    if (this.state.subsection == 'Existing Products') {
      return (
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: '#FFFFFF' }}>
            <TableHeader
              headerCells={[
                { flex: 0.75, title: 'Code', textAlign: 'center' },
                { flex: 3, title: 'Item' },
                { flex: 1, title: 'Mapping', textAlign: 'center' },
                { flex: 1, title: 'Delete', textAlign: 'center' },
                { title: 'Count', flex: 2, textAlign: 'center' },
              ]}
            />
          </View>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {this.renderExistingFixtureRows(this.state.existingFixtures)}
          </View>
        </View>
      );
    } else if (this.state.subsection == 'Sub-Areas') {
      if (this.state.subAreas == false) {
        subAreasInject = (<View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <EmptyMessage header="No Sub Areas" message="Press the button below to create one." />
        </View>);
      } else {
        subAreasInject = (<ScrollView style={{ flex: 1 }}>
          {this.state.subAreas}
        </ScrollView>);
      }
      return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <TableHeader
            headerCells={[
              { title: 'Sub-Areas', flex: 3 },
              { flex: 1, title: 'Mapping', textAlign: 'center' },
              { title: 'Products', flex: 1, textAlign: 'center' },
            ]}
          />
          {subAreasInject}
        </View>
      );
    } else if (this.state.subsection == 'Photos') {
      const photos = this.state.photoAttachments;
      const thumbnails = [];

      if (photos == null || photos.length == 0) {
        return (
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <EmptyMessage header="No Photos Yet" message="Press the button in bottom left corner take one." />
          </View>
        );
      }

      for (i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        // console.log('photo ===> ',photo)
        thumbnails.push(
          <TouchableOpacity style={{ flexBasis: '50%', padding: 5 }} key={i} onPress={() => this.setShowPhotoModalVisible(true, photo.mobile_id)}>
            <Image source={{ uri:(photo?.mobile_uri??"")!=''? attachmentActions.getCorrectUri(photo.mobile_uri):"", static: true }} style={{ resizeMode: 'cover', width: '100%', height: 200 }} />
            <TouchableOpacity
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 5,
                borderColor: photo.mapping_style || '#90979a',
                borderWidth: 1,
                flexDirection: 'row',
                marginTop: 5,
              }}
              onPress={() => this.navigateToFloorPlan(photo)}
            >
              <Icon
                name={'map-marker'}
                iconStyle={{ color: photo.mapping_style || '#90979a', paddingRight: 5 }}
                size={15}
                type={'font-awesome'}
              />
            </TouchableOpacity>
          </TouchableOpacity>,
        );
      }
      return (
        <View style={{ flex: 1, backgroundColor: WHITE }}>
          <ScrollView>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 5, backgroundColor: WHITE }}>
              {thumbnails}
            </View>
          </ScrollView>
        </View>
      );
    }
  }

  async navigateToFloorPlan(attachment = null) {
    if (this.state.area) {
      const success = await this.submitForm();
      if (!success) { return; }
    }
    const area = realm.objects('Area').filtered(`mobile_id = ${this.state.area.mobile_id}`)[0];
    if (attachment) {
      this.props.changeStack('floorplan', area, attachment, 'location');
    } else {
      this.props.changeStack('floorplan', area, area, 'location');
    }
  }

  async setShowPhotoModalVisible(visible, photoId) {
    if (visible) {
      const photo = await realm.objects('Attachment').filtered(`mobile_id = '${photoId}'`)[0];
      await this.setState({
        showPhotoModalVisible: visible,
        photoToDisplay: photo,
      });
    } else {
      await this.setState({
        showPhotoModalVisible: visible,
        photoToDisplay: {},
      });
    }
  }

  async checkUpdateQuantity(newQty, existingFixture) {
    if (newQty == '') { newQty = 0; }
    const valid = await isNumber(newQty);
    if (valid) { await existingFixture.updateQuantity(newQty); }
  }

  renderAreaChildren(area) {
    if (!area.mobile_id) { return false; }
    const subAreas = [];
    let noSubArea = false;
    let subArea;
    let i = 0;

    while (noSubArea == false) {
      subArea = realm.objects('Area').filtered(`mobile_parent_id = ${area.mobile_id} AND active = true`)[i];
      if (subArea) {
        subAreas.push(subArea);
        i++;
      } else {
        noSubArea = true;
      }
    }

    if (subAreas.length > 0) {
      const childrenAreas = subAreas.map(sub_area => (
        <View key={`section-${sub_area.mobile_id}`}>
          <TableRow
            key={`row-${sub_area.mobile_id}`}
            onPressRow={() => this.props.changeEditingArea(sub_area)}
            altColor={false}
            bottomBorder
            rowStyle={{ height: 40, paddingVertical: 10 }}
          >
            <TableCell flex={3} type="text" text={sub_area.name} />
            <TableCell flex={1} alignItems="center">
              {!!sub_area.findFloorPlan ?
                <FloorPlanButton mapStyle={sub_area.mapping_style} onPress={() => this.props.changeStack('floorplan', sub_area, sub_area, 'location')} />
              : null}
            </TableCell>
            <TableCell flex={1} type="text" alignItems="center" text={sub_area.productsCount} />
          </TableRow>
        </View>
      ));
      return (childrenAreas);
    }
    return false;
  }

  async setSchedule(itemValue, pickerScheduleHolder, scheduleName) {
    if (!itemValue) {
      this.setState({ [pickerScheduleHolder]: null });
    } else {
      const newSchedule = await realm.objects(scheduleName).filtered(`mobile_id = ${itemValue}`)[0];
      this.setState({ [pickerScheduleHolder]: newSchedule });
    }
  }

  renderExistingFixtureRows(existingFixtures) {
    rows = [];
    realmArea = realm.objects('Area').filtered('mobile_id = $0', this.state.area.mobile_id)[0];

    if (existingFixtures == null || existingFixtures.length == 0) {
      return <EmptyMessage header="No Fixtures Yet" message="Press the button below to add one" />;
    }

    sortedExistingFixtures = existingFixtures.sorted('created_at', true);
    for (let i = 0; i < sortedExistingFixtures.length; i++) {
      const existingFixture = sortedExistingFixtures[i];

      rows.push(
        <TableRow
          key={`row-${i}`}
          onPressRow={() => this.editProduct(existingFixture)}
          altColor={false}
          bottomBorder
          rowStyle={{ height: 70, paddingVertical: 7.5 }}
        >
          <TableCell flex={0.75} type="text" alignItems="center" text={existingFixture.code} />
          <TableCell flex={3} type="text" text={existingFixture.product_name} />
          <TableCell flex={1} alignItems="center">
            {!!realmArea.findFloorPlan ?
              <FloorPlanButton mapStyle={existingFixture.mapping_style} onPress={() => this.props.changeStack('floorplan', realmArea, existingFixture, 'existing_count')} />
            : null}
          </TableCell>
          <TableCell flex={1} alignItems="center">
            <DeleteButton onPress={() => this.confirmDeactivation(existingFixture)} />
          </TableCell>
          <TableCell flex={2} alignItems="center">
            <ProductCounter
              quantity={String(existingFixture.existing_count)}
              onChangeText={text => this.checkUpdateQuantity(text, existingFixture)}
              onIncrement={() => existingFixture.incrementProductCount()}
              onDecrement={() => existingFixture.decrementProductCount()}
              containerStyle={{ flex: 1 }}
              height={55}
              quantityInputFlex={1}
              iconSize={25}
              textStyle={{ fontSize: 12, fontWeight: 'bold' }}
            />
          </TableCell>
        </TableRow>,
      );
    }

    return (
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        keyboardOpeningTime={100}
        extraScrollHeight={0}
      >
        {rows}
      </KeyboardAwareScrollView>
    );
  }

  async pickParent(mobileId) {
    let parentArea = null
    if (mobileId != 0) { // 0 is no parent from AreaPickerModal
      parentArea = await realm.objects('Area').filtered('mobile_id = $0', mobileId)[0]
    }

    this.setState({
      area: {...this.state.area, mobile_parent_id: mobileId },
      parentAreaId: mobileId,
      parentArea,
      parentAreaModalVisible: false
    });
  }

  async areaPickerSearch(text) {
    const parentAreas = await Area.potentialParentAreas(this.state.area, this.props.project)
    const areas = await parentAreas.filtered(`name_with_parents CONTAINS[c] $0 LIMIT(50)`, text);
    return areas;
  }

  render() {
    if (this.state.stack == 'area form') {
      return (
        <Form>

          {this.state.loadingSpinner ?

            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}} >
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />
            </View>

          : null}

          {!this.state.loadingSpinner ?

            <View style={{flex: 1}}>
              <View style={{ flex: 1 }}>
                <LocationScopeButton
                  project={this.props.project}
                />
                <View style={{ flex: 1, marginTop: 10, marginBottom: 5, marginHorizontal: 10 }}>
                  <AreaBreadcrumbs
                    project={this.props.project}
                    area={this.state.area}
                    changeEditingArea={this.props.changeEditingArea}
                  />
                </View>
                <View style={{ flex: 15, flexDirection: 'row' }}>
                  <View style={{ flex: 5, marginBottom: 10, marginLeft: 10, marginRight: 20 }}>
                    {this.renderAreaSectionTabs()}
                    <View style={{ flex: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: '#FAFAFD', ...GS.border, borderTopWidth: 0 }}>
                      <View style={{ flexGrow: 1 }}>
                        {this.renderAreaSubsection()}
                      </View>
                    </View>
                  </View>
                  <View style={{ flex: 8, marginBottom: 10, marginRight: 10 }}>
                    {this.renderSectionTabs()}
                    <View style={{ flex: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: '#FAFAFD', ...GS.border, borderTopWidth: 0 }}>
                      <View style={{ flexGrow: 1 }}>
                        {this.renderSubsection()}
                      </View>
                      <View style={{ flex: -1, flexDirection: 'row', ...GS.borderTop }}>
                        <TouchableOpacity
                          onPress={() => this.setExistingFixtureModalVisible(true)}
                          style={[GS.bgBlue, { flex: 1, borderRadius: 5, margin: 10, padding: 15, alignItems: 'center' }]}
                        >
                          <FixedText style={{ color: WHITE, fontWeight: 'bold' }}>Add Product</FixedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={this.onAddSubArea}
                          style={[GS.bgBlue, { flex: 1, borderRadius: 5, margin: 10, padding: 15, alignItems: 'center' }]}
                        >
                          <FixedText style={{ color: WHITE, fontWeight: 'bold' }}>Add Sub-Area</FixedText>
                        </TouchableOpacity>
                      </View>
                    </View>
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
                    onPress={this.openPhotoCapture}
                  />
                </View>
                <View style={{ flex: -1,marginLeft: 10 }}>
                  <Button
                    buttonStyle={styles.smallButtonStyle}
                    style={styles.smallButtonContainerStyle}
                    icon={{ name: 'picture-o', type: 'font-awesome', color: '#90979a', size: 30 }}
                    onPress={this.openCameraRollBrowser}
                  />
                </View>
                <View style={{ flex: -1, marginLeft: 10 }}>
                  <Button
                    buttonStyle={styles.smallButtonStyle}
                    style={styles.smallButtonContainerStyle}
                    icon={{ name: 'map-marker', type: 'font-awesome', color: Area.mapppingStyle(this.state.area.mobile_id) || '#90979a', size: 30 }}
                    onPress={() => this.navigateToFloorPlan()}
                  />
                </View>
                <View style={{ flex: 1 }} />
                <View style={{ flex: -1 }}>
                  <ActionButton
                    alt
                    title="cancel"
                    onPress={this.backToAreas}
                  />
                </View>
                <View style={{ flex: -1 }}>
                  <ActionButton title="Save" onPress={this.onSave} />
                </View>
                <View style={{ flex: -1 }}>
                  <ActionButton
                    title="Save & Add New"
                    onPress={this.onAddAnother}
                    backgroundColor={LIGHT_BLUE}
                  />
                </View>
              </BottomBar>

            </View>

          : null}

          {/* Operating Schedule Modal -----------------------------------------------------*/}

          <OperatingForm
            showForm={this.state.newOperatingScheduleModalVisible}
            onCancel={(operatingId) => {
              if (operatingId) {
                this.setState({ operatingSchedule: realm.objects('OperatingSchedule').filtered(`mobile_id = ${operatingId}`)[0] });
              }
              this.openNewOperatingScheduleModalVisible(false);
            }}
            project={this.props.project}
            area={this.state.area}
          />

          {/* Photo Modal -----------------------------------------------------*/}
 
          <ShowPhotoModal
            isVisible={this.state.showPhotoModalVisible}
            photoToDisplay={this.state.photoToDisplay}
            closeShowPhotoModalVisible={() => this.setShowPhotoModalVisible(false, null)}
          />

          {/* CustomAttribute List Input Modal -------------------------------*/}

          <CustomAttributeListModal
            isVisible={this.state.customAttributeListModalVisible}
            closeCustomAttributeListModal={() => this.setCustomAttributeListModalVisible(false, {})}
            onPress={this.complexSetStateForCustomAttributes.bind(this)}
            listItems={this.state.listItems}
            listAttribute={this.state.listAttribute}
            customAttributes={this.state.area.custom_attributes}
          />

          {/* Parent Picker Modal -----------------------------------------------------*/}

          <AreaPickerModal
            areaPickerSearch={this.areaPickerSearch}
            project={this.props.project}
            isVisible={this.state.parentAreaModalVisible}
            title='Pick an Area'
            confirmButton='confirm'
            onSubmit={this.pickParent}
            onCancel={() => {
              this.setParentAreaModalVisible(false);
              this.setState({ parentAreaId: this.state.parentAreaId });
            }}
            selectedAreaId={this.state.parentAreaId ? this.state.parentAreaId : 0}
            areas={this.state.parentAreas}
          />

          {/* Location Picker Modal -----------------------------------------------------*/}

          <PickerModal
            isVisible={this.state.locationModalVisible}
            onSubmit={async () => {
              const location = await realm.objects('Location').filtered('mobile_id = $0', this.state.locationIdHolder)[0];
              this.setState({ locationId: this.state.locationIdHolder, location });
              this.setLocationModalVisible(false);
            }}
            title={'Pick a Location'}
            closePickerModal={() => this.setLocationModalVisible(false)}
          >
            <Picker
              selectedValue={this.state.locationIdHolder}
              onValueChange={(itemValue, itemIndex) => this.setState({ locationIdHolder: itemValue })}
            >
              <Picker.Item label={'No Location'} value={null} />
              {this.state.locations.map(location => (
                <Picker.Item key={location.mobile_id} label={location.name} value={location.mobile_id} />
              ))}
            </Picker>
          </PickerModal>

          {/* Operating Schedule Picker Modal -----------------------------------------------------*/}

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
              onValueChange={(itemValue, itemIndex) => this.setSchedule(itemValue, 'operatingSchedulePickerHolder', 'OperatingSchedule')}
            >
              <Picker.Item key={0} label={'<Use Default>'} value={null} />
              {this.state.operatingSchedules.map(operatingSchedule => (
                <Picker.Item key={operatingSchedule.mobile_id} label={operatingSchedule.name} value={operatingSchedule.mobile_id} />
              ))}
            </Picker>
          </PickerModal>

          {/* Rate Schedule Picker Modal -----------------------------------------------------*/}

          <PickerModal
            isVisible={this.state.rateScheduleModalVisible}
            onSubmit={() => {
              this.setState({ rateSchedule: this.state.rateSchedulePickerHolder });
              this.setRateScheduleModalVisible(false);
            }}
            title={'Pick a Rate Schedule'}
            closePickerModal={() => this.setRateScheduleModalVisible(false)}
          >
            <Picker
              selectedValue={this.state.rateSchedulePickerHolder ? this.state.rateSchedulePickerHolder.mobile_id : null}
              onValueChange={(itemValue, itemIndex) => this.setSchedule(itemValue, 'rateSchedulePickerHolder', 'RateSchedule')}
            >
              <Picker.Item key={0} label={'<Use Default>'} value={null} />
              {this.state.rateSchedules.map(rateSchedule => (
                <Picker.Item key={rateSchedule.mobile_id} label={rateSchedule.name} value={rateSchedule.mobile_id} />
              ))}
            </Picker>
          </PickerModal>

          <PickerModal
            isVisible={this.state.coolingModalVisible}
            onSubmit={() => {
              this.setState({ cooling: this.state.coolingSchedulePickerHolder });
              this.setCoolingModalVisible(false);
            }}
            title={'Pick a Cooling'}
            closePickerModal={() => this.setCoolingModalVisible(false)}
          >
            <Picker
              selectedValue={this.state.coolingSchedulePickerHolder ? this.state.coolingSchedulePickerHolder.mobile_id : null}
              onValueChange={(itemValue, itemIndex) => this.setSchedule(itemValue, 'coolingSchedulePickerHolder', 'Cooling')}
            >
              <Picker.Item key={0} label={'<Use Default>'} value={null} />
              {this.state.coolings.map(cooling => (
                <Picker.Item key={cooling.mobile_id} label={cooling.name} value={cooling.mobile_id} />
              ))}
            </Picker>
          </PickerModal>

          <PickerModal
            isVisible={this.state.heatingModalVisible}
            onSubmit={() => {
              this.setState({ heating: this.state.heatingSchedulePickerHolder });
              this.setHeatingModalVisible(false);
            }}
            title={'Pick a Heating'}
            closePickerModal={() => this.setHeatingModalVisible(false)}
          >
            <Picker
              selectedValue={this.state.heatingSchedulePickerHolder ? this.state.heatingSchedulePickerHolder.mobile_id : null}
              onValueChange={(itemValue, itemIndex) => this.setSchedule(itemValue, 'heatingSchedulePickerHolder', 'Heating')}
            >
              <Picker.Item key={0} label={'<Use Default>'} value={null} />
              {this.state.heatings.map(heating => (
                <Picker.Item key={heating.mobile_id} label={heating.name} value={heating.mobile_id} />
              ))}
            </Picker>
          </PickerModal>
          <ExistingFixtureModal
            action={'new'}
            existingFixture={null}
            changeStack={this.props.changeStack}
            editAreaProduct={this.props.editAreaProduct}
            existingLightingId={this.props.existingLightingId}
            area={this.state.area}
            project={this.props.project}
            isVisible={this.state.existingFixtureModalVisible}
            afterRenderAction={this.renderExistingFixtureRows}
            closeExistingFixtureModal={() => this.setExistingFixtureModalVisible(false)}
          />
          <DropdownAlert
            defaultContainer={{ padding: 8, paddingTop: 20, flexDirection: 'row' }}
            ref={ref => this.dropDownAlertRef = ref}
            closeInterval={2000}
            successColor={'#49D184'}
            errorColor={'tomato'}
            imageStyle={{ display: 'none' }}
            // successImageSrc={retroluxLogoSource} custom icon if wated
          />
        </Form>
      );
    } else if (this.state.stack == 'browse camera roll') {
      return (
        <CameraRollBrowser
          backFunction={this.changeStack}
          backFunctionStack="area form"
          attachable_type="Area"
          attachable_mobile_id={this.state.area.mobile_id}
        />
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    height: 35,
    paddingHorizontal: 10,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B3B3B3',
  },
  activeTab: {
    backgroundColor: '#E0E0E0',
  },
  activeTabText: {
    color: '#03A9F4',
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#0287C3',
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
    backgroundColor: "#FFFFFF",
  },
  smallButtonContainerStyle: {
    width: 80,
    height: 60,
    paddingRight: 5,
    marginLeft: 0,
    marginTop: 10,
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
  selectButton: {
    flex: 1,
    height: 35,
    padding: 5,
    borderColor: '#BAC2C6',
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -1,
  },
});

AreaForm.propTypes = {
  project: PropTypes.object.isRequired,
  changeEditingArea: PropTypes.func.isRequired,
};
