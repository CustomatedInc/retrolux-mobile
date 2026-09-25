import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import { GS, GRAY, BLACK_GRAY } from '../resources/styles/globals';
import { Location, OperatingSchedule, Address } from '../database/models'
import realm from '../database/realm';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DropdownAlert from 'react-native-dropdownalert';
import { STATES } from '../database/models/Address';
import { isEmpty } from '../lib/numberHelpers';

import { FixedFormLabel, StringInput, ActionButton, CustomAttributeFormElement, Form, BottomBar, Tab, ScheduleInput, LocationScopeButton, SearchInputModal, ClickableInput, CustomAttributeListModal } from '../components';

class LocationForm extends Component {
  constructor(props) {
    super(props);

    const primaryAttributes = props.project.primaryLocationAttributes();
    const additionalAttributes = props.project.additionalLocationAttributes();
    let physicalAddress = null;
    const location = props.currentLocationId ? Object.assign({}, realm.objects('Location').filtered(`mobile_id = ${props.currentLocationId}`)[0]) : { custom_attributes: '{}' }

    if (props.currentLocationId) {
      physicalAddress = realm.objects('Location').filtered(`mobile_id = ${props.currentLocationId}`)[0].address;
    }

    let formTabs = ['Primary']
    if (additionalAttributes.length) {
      formTabs.push('Additional')
    }

    this.state = {
      project: props.project,
      location,
      physicalAddress: physicalAddress ? physicalAddress : null,
      physicalAddressOne: physicalAddress ? physicalAddress.address : null,
      physicalAddressTwo: physicalAddress ? physicalAddress.address_2 : null,
      physicalCity: physicalAddress ? physicalAddress.city : null,
      physicalState: physicalAddress ? physicalAddress.state : null,
      physicalZipCode: physicalAddress ? physicalAddress.zip_code : null,
      physicalZipCodeError: null,
      errors: {
        nameError: null,
      },
      primaryAttributes,
      additionalAttributes,
      customAttributeListModalVisible: false,
      listItems: [],
      listAttribute: {},
      isReady: false,
      formErrors: {},
      locationSubsection: 'Primary',
      searchInputModalVisible: false,
      searchCollection: [],
      searchInputTarget: '',
      searchInputTitle: '',
      formTabs,
      searchOnPress: () => {}
    };

    this.saveLocation = this.saveLocation.bind(this);
    this.complexSetState = this.complexSetState.bind(this);
    this.simpleSetState = this.simpleSetState.bind(this);
    this.setSearchInputsModalVisible = this.setSearchInputsModalVisible.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ isReady: true });
    }, 250)
  }

  clearErrors() {
    this.setState({
      errors: {
        nameError: null,
      }
    });
  }

  setSearchInputsModalVisible(visible, title = '', target = '', currentValue = '', onPressFunction, collection = []) {
    this.setState({
      searchInputModalVisible: visible,
      searchInputTarget: target,
      searchInputTitle: title,
      searchInputCurrentValue: currentValue,
      searchOnPress: onPressFunction,
      searchCollection: collection
    });
  }

  async setCustomAttributeListModalVisible(visible, listAttribute) {
    this.setState({
      listItems: !isEmpty(listAttribute) ? await listAttribute.listItems() : [],
      listAttribute: !isEmpty(listAttribute) ? listAttribute : {},
    });
    this.setState({ customAttributeListModalVisible: visible });
  }

  async simpleSetState(target, value) {
    // dynamically setStates when inputs change
    const update = {};
    update[target] = value;
    await this.setState(update);
  }

  async complexSetState(target, value) {
    const update = this.state.location;
    update[target] = value;
    await this.setState({ location: update });
  }

  async complexSetStateForCustomAttributes(target, value) {
    const { location } = this.state;
    const update = JSON.parse(location.custom_attributes);
    update[target] = value;
    await this.setState({
      location: {
        ...location,
        custom_attributes: JSON.stringify(update),
      },
    });
  }

  async runValidations() {
    const custom_attributes = JSON.parse(this.state.location.custom_attributes);
    const customAttributeErrors = await Location.validateCustomAttributes(custom_attributes, this.props.project);
    return { ...customAttributeErrors };
  }

  async validateZipCode(zipCode, errorTarget) {
    if (!zipCode || zipCode.length == 0) { 
      this.simpleSetState(errorTarget, null);
      return;
    }

    if (isNaN(zipCode)) {
      this.simpleSetState(errorTarget, 'zip code can only contain numbers')
    } else if (zipCode.length != 5) {
      this.simpleSetState(errorTarget, 'zip code must contain 5 digits')
    } else {
      this.simpleSetState(errorTarget, null);
    }
  }

  async createOrUpdatePhysicalAddress(location_mobile_id) {
    let mobile_id = !this.state.physicalAddress ? await Address.nextId() : this.state.physicalAddress.mobile_id;
    let edit = !this.state.physicalAddress ? false : true;

    if (
      this.state.physicalAddressOne != null ||
      this.state.physicalAddressTwo != null ||
      this.state.physicalCity != null ||
      this.state.physicalState != null ||
      this.state.physicalZipCode != null
    ) {
      realm.write(() => {
        realm.create('Address', {
          address: this.state.physicalAddressOne,
          address_2: this.state.physicalAddressTwo,
          address_type: 'physical',
          addressable_mobile_id: location_mobile_id,
          addressable_type: 'Location',
          city: this.state.physicalCity,
          mobile_id: mobile_id,
          state: this.state.physicalState,
          zip_code: this.state.physicalZipCode,
        }, edit);
      });
    }
  }

  async saveLocation() {
    this.clearErrors();

    const { location } = this.state;

    const errors = await Location.validate(location);
    if (Object.keys(errors).length !== 0) {
      this.setState({ errors });
      this.dropDownAlertRef.alertWithType('error', 'Location did not save', 'There was a problem saving this location, check the "Primary" tab and make sure all required fields are filled out.');
      return false;
    }

    // Physical Zip Code Validations
    await this.validateZipCode(this.state.physicalZipCode, 'physicalZipCodeError');
    if (this.state.physicalZipCodeError != null) {
      this.dropDownAlertRef.alertWithType('error', 'Location did not save', 'There was a problem saving this location, check the "Primary" tab and make sure all required fields are filled out.');
      return false;
    }

    // CustomAttribute Validation
    const formErrors = await this.runValidations();
    await this.setState({ formErrors });
    if (Object.keys(formErrors).length !== 0) {
      this.dropDownAlertRef.alertWithType('error', 'Location did not save', 'There was a problem saving this location, check the top tabs for red highlights.');
      return false;
    }

    const preppedLocation = await Location.prepareFormData(location, this.props.project)
    await Location.create(preppedLocation, !!preppedLocation.mobile_id);

    const newLocation = await realm.objects('Location').filtered('mobile_id = $0', preppedLocation.mobile_id)[0];
    await newLocation.updateAreaNames();

    await Location.findAndRunUpdate(newLocation.mobile_id);
    await this.createOrUpdatePhysicalAddress(newLocation.mobile_id);

    if (this.props.project.mobile_location_scope_ids.indexOf(newLocation.mobile_id) === -1) {
      realm.write(() => { this.props.project.mobile_location_scope_ids.push(newLocation.mobile_id) })
      this.setState({ project: this.props.project })
    }

    this.dropDownAlertRef.alertWithType('success', 'Success', 'Location succesfully saved.');
  }

  render() {
    const { location } = this.state;
    const project = this.props.project;

    return(
      <Form>
        <View style={{flex: 1}}>

          {/* BreadCrumb Section --------------------------------------------*/}

          <LocationScopeButton project={this.state.project} />
          <View style={{ flex: 1, marginTop: 10, marginHorizontal: 10 }}>
            <View style={styles.breadcrumbBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20 }}>
                  <Text style={{ color: BLACK_GRAY, ...GS.mdFont }}>{(location.name || location.mobile_id) ? location.name : 'New Location'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* End BreadCrumb Section ----------------------------------------*/}

          {/* Middle Section ------------------------------------------------*/}

          <View style={{ flex: 15, flexDirection: 'row' }}>
            <View style={{ flex: 1, margin: 10 }}>
              <View style={[GS.tabContainer]}>
                {this.state.formTabs.map(locationTab => (
                  <Tab
                    key={locationTab}
                    onPress={() => this.setState({ locationSubsection: locationTab })}
                    title={locationTab}
                    activeTab={this.state.locationSubsection === locationTab}
                  />
                ))}
              </View>
              <View style={{ flex: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: '#FAFAFD', ...GS.border, borderTopWidth: 0 }}>
                <View style={{ flexGrow: 1 }}>
                  <KeyboardAwareScrollView
                    keyboardOpeningTime={100}
                    extraScrollHeight={70}
                  >
                    {this.state.locationSubsection == 'Primary' ?

                      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Name</FixedFormLabel>
                            <StringInput
                              label={null}
                              placeholder="location name"
                              value={location.name}
                              target="name"
                              onChange={this.complexSetState}
                              error={this.state.errors.nameError !== null}
                              errorMessage={this.state.errors.nameError}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Facility Type</FixedFormLabel>
                            <ClickableInput
                              onPress={() => this.setSearchInputsModalVisible(true, 'Facility Type', 'facility_type_id', location.facility_type_id, this.complexSetState, realm.objects('FacilityType').sorted('name'))}
                              title={location.facility_type_id ? realm.objects('FacilityType').filtered(`id = ${location.facility_type_id}`)[0].name : ''}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Physical Address</FixedFormLabel>
                            <StringInput
                              value={this.state.physicalAddressOne}
                              target="physicalAddressOne"
                              placeholder="physical address"
                              onChange={this.simpleSetState.bind(this)}
                            />
                          </View>
                        </View>
                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Address 2</FixedFormLabel>
                            <StringInput
                              value={this.state.physicalAddressTwo}
                              target="physicalAddressTwo"
                              placeholder="physical address 2"
                              onChange={this.simpleSetState.bind(this)}
                            />
                          </View>
                        </View>
                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>City</FixedFormLabel>
                            <StringInput
                              value={this.state.physicalCity}
                              target="physicalCity"
                              placeholder="city"
                              onChange={this.simpleSetState.bind(this)}
                            />
                          </View>
                        </View>
                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: 1, flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flex: -1, marginTop: 8 }}>
                                <FixedFormLabel>State</FixedFormLabel>
                                <ClickableInput
                                  onPress={() => this.setSearchInputsModalVisible(true, 'States', 'physicalState', this.state.physicalState, this.simpleSetState, STATES)}
                                  title={this.state.physicalState ? this.state.physicalState : ''}
                                />
                              </View>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flex: -1, marginTop: 8 }}>
                                <FixedFormLabel>Zip Code</FixedFormLabel>
                                <StringInput
                                  value={this.state.physicalZipCode}
                                  target="physicalZipCode"
                                  placeholder="zip code"
                                  onChange={this.simpleSetState.bind(this)}
                                  error={this.state.physicalZipCodeError != null}
                                  errorMessage={this.state.physicalZipCodeError}
                                />
                              </View>
                            </View>
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <ScheduleInput
                            scheduleId={location.mobile_operating_schedule_id}
                            schedules={project.operatingSchedules}
                            scheduleName={'OperatingSchedule'}
                            saveSchedule={this.complexSetState}
                            project={project}
                            defaultScheduleInput={project.defaultOperatingSchedule ? `<Use Default: ${project.defaultOperatingSchedule.name}>` : '<Use Default>'}
                          />
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <ScheduleInput
                            scheduleId={location.mobile_rate_schedule_id}
                            schedules={project.rateSchedules}
                            scheduleName={'RateSchedule'}
                            saveSchedule={this.complexSetState}
                            project={project}
                            defaultScheduleInput={project.defaultRateSchedule ? `<Use Default: ${project.defaultRateSchedule.name}>` : '<Use Default>'}
                          />
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <ScheduleInput
                            scheduleId={location.mobile_cooling_id}
                            schedules={project.coolings}
                            scheduleName={'Cooling'}
                            saveSchedule={this.complexSetState}
                            project={project}
                            defaultScheduleInput={project.defaultCooling ? `<Use Default: ${project.defaultCooling.name}>` : '<Use Default>'}
                          />
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <ScheduleInput
                            scheduleId={location.mobile_heating_id}
                            schedules={project.heatings}
                            scheduleName={'Heating'}
                            saveSchedule={this.complexSetState}
                            project={project}
                            defaultScheduleInput={project.defaultHeating ? `<Use Default: ${project.defaultHeating.name}>` : '<Use Default>'}
                          />
                        </View>

                        {/* Primary Custom Attributes -----------------------------------------------------*/}

                        {this.state.primaryAttributes.map(attribute => (
                          <CustomAttributeFormElement
                            key={attribute.mobile_id}
                            elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '33.33%', marginTop: 8 }}
                            isReady={this.state.isReady}
                            attribute={attribute}
                            customAttributes={JSON.parse(location.custom_attributes)}
                            complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
                            setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
                            formErrors={this.state.formErrors}
                          />
                        ))}

                      </View>

                    : null}

                    {(this.state.locationSubsection == 'Additional' && this.state.additionalAttributes.length) ?
                      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>

                        {/* Additional Custom Attributes -----------------------------------------------------*/}

                        {this.state.additionalAttributes.map(attribute => (
                          <CustomAttributeFormElement
                            key={attribute.mobile_id}
                            elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '33.33%', marginTop: 8 }}
                            isReady={this.state.isReady}
                            attribute={attribute}
                            customAttributes={JSON.parse(location.custom_attributes)}
                            complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
                            setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
                            formErrors={this.state.formErrors}
                          />
                        ))}


                      </View>
                    : null}

                  </KeyboardAwareScrollView>

                </View>
              </View>
            </View>
          </View>

          {/* End Middle Section ---------------------------------------------*/}

        </View>

        {/* Bottom Bar -----------------------------------------------------*/}

        <BottomBar>
          <View style={{ flex: 1 }} />
          <View style={{ flex: -1 }}>
            <ActionButton
              alt
              title="cancel"
              onPress={() => this.props.changeStack('locations')}
            />
          </View>
          <View style={{ flex: -1 }}>
            <ActionButton title="Save" onPress={() => this.saveLocation()} />
          </View>
        </BottomBar>

        {/* End Bottom Bar -------------------------------------------------*/}

        {/* CustomAttribute List Input Modal -------------------------------*/}

        <CustomAttributeListModal
          isVisible={this.state.customAttributeListModalVisible}
          closeCustomAttributeListModal={() => this.setCustomAttributeListModalVisible(false, {})}
          onPress={this.complexSetStateForCustomAttributes.bind(this)}
          listItems={this.state.listItems}
          listAttribute={this.state.listAttribute}
          customAttributes={this.state.location.custom_attributes}
        />

        {/* End CustomAttribute List Input Modal ---------------------------*/}

        {/* SearchInputModal List Input Modal ------------------------------*/}
  
        <SearchInputModal
          isVisible={this.state.searchInputModalVisible}
          closeModal={() => this.setSearchInputsModalVisible(false, '', '', '', () => {}, [])}
          onPress={this.state.searchOnPress}
          target={this.state.searchInputTarget}
          title={this.state.searchInputTitle}
          collection={this.state.searchCollection}
          currentValue={this.state.searchInputCurrentValue}
        />

        {/* End SearchInputModal List Input Modal --------------------------*/}

        {/* DropdownAlert --------------------------------------------------*/}

        <DropdownAlert
          defaultContainer={{ padding: 8, paddingTop: 20, flexDirection: 'row' }}
          ref={ref => this.dropDownAlertRef = ref}
          closeInterval={2000}
          successColor={'#49D184'}
          errorColor={'tomato'}
          imageStyle={{ display: 'none' }}
        />

        {/* End DropdownAlert ----------------------------------------------*/}

      </Form>
    )
  }
}


const styles = StyleSheet.create({
  breadcrumbBox: {
    flex: 1,
    ...GS.bgLightestGray,
    borderRadius: 5,
    flexDirection: 'row',
  },
});

LocationForm.propTypes = {
  project: PropTypes.shape({ mobile_id: PropTypes.number.isRequired }).isRequired,
  changeStack: PropTypes.func.isRequired,
};

export default LocationForm;
