import React, { Component } from 'react';
import { Alert, Switch, Text, View, ActivityIndicator } from 'react-native';
import {Picker} from '@react-native-picker/picker'
import UUIDGenerator from 'react-native-uuid-generator';

import realm from '../database/realm';
import { PickerModal, ClickableInput, FixedFormLabel, CustomAttributeFormElement, FormGroupLabel, ActionButton, StringInput, NumberInput, Form, BottomBar, TapInput, SearchInputModal, Tab, CustomAttributeListModal } from '../components';
import { Project, Address, ProjectUser, Company, Location } from '../database/models';
import { validatePercentage, isEmpty } from '../lib/numberHelpers';
import { GS, PALE_GREEN, PRIMARY_BLUE } from '../resources/styles/globals';
import { STATES } from '../database/models/Address';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import KeepAwake from 'react-native-keep-awake';
import { CheckBox } from 'react-native-elements'

const APPLY_TAX_ON_TYPES = ['no_sales_tax', 'product_only', 'gross_price']
const TAX_TYPES = ['sales_tax', 'use_tax']
const MARKUP_TYPES = ['markup', 'margin']

class ProjectForm extends Component {
  constructor(props) {
    super(props);

    let edit = false;
    let project = null;

    let physicalAddress = null;
    let companyProjectStatus = null;

    if (props.project) {
      edit = true;
      project = props.project;
      companyProjectStatus = realm.objects('CompanyProjectStatus').filtered(`server_id= ${project.company_project_status_id}`)[0];
      physicalAddress = props.project.address;

    }

    const companies = props.currentUser.companies;
    const company = !project ? (!!companies[0] ? companies[0] : null) : null;
    const company_id = !project ? (!!companies[0] ? companies[0].server_id : null) : null;
    const company_idPickerHolder = !project ? company_id : null;

    const primaryAttributes = project ? project.primaryProjectAttributes() : [];
    const additionalAttributes = project ? project.additionalProjectAttributes() : [];

    this.projects = realm.objects('Project');

    this.state = {
      projectSubsection: 'Project Attributes',
      companyModalVisible: false,
      lightingTemplateModalVisible: false,
      doorTemplateModalVisible: false,
      lighting_template: edit && project.company_id ? null : company.default_lighting_template,
      lighting_templateHolderId: edit && project.company_id ? null : company.default_lighting_template ? company.default_lighting_template.id : null,
      lighting_templates: edit && project.company_id ? [] : company.lightingTemplates,
      door_template: edit && project.company_id ? null : company.default_door_template,
      door_templateHolderId: edit && project.company_id ? null : company.default_door_template ? company.default_door_template.id : null,
      door_templates: edit && project.company_id ? [] : company.doorTemplates,
      statusModalVisible: false,
      allCompanyAccess: edit && (project.all_company_access != null) ? project.all_company_access : false,
      applyTaxOn: edit && project.apply_tax_on ? project.apply_tax_on : null,
      companies: companies,
      company_id: edit && project.company_id ? project.company_id : company_id,
      company: edit && project.company_id ? realm.objects('Company').filtered(`server_id = ${project.company_id}`)[0] : company,
      maintenanceLaborRate: edit ? project.maintenance_labor_rate : null,
      maintenanceLaborRateError: null,
      markupPercentage: edit ? project.markup : null,
      markupPercentageError: null,
      markupType: edit && project.markup_type ? project.markup_type : null,
      mode: edit ? 'edit' : 'new',
      name: edit && project.name ? project.name : null,
      nameError: null,
      physicalAddress: edit && physicalAddress ? physicalAddress : null,
      physicalAddressOne: edit && physicalAddress ? physicalAddress.address : null,
      physicalAddressTwo: edit && physicalAddress ? physicalAddress.address_2 : null,
      physicalCity: edit && physicalAddress ? physicalAddress.city : null,
      physicalState: edit && physicalAddress ? physicalAddress.state : null,
      physicalZipCode: edit && physicalAddress ? physicalAddress.zip_code : null,
      physicalZipCodeError: null,
      probabilityPercentage: edit ? project.probability : null,
      probabilityPercentageError: null,
      project: edit ? project : null,
      status: edit && companyProjectStatus ? companyProjectStatus.name : 'Lead',
      statuses: ['Lead', 'Qualify', 'Bidding', 'Proposal', 'Active', 'Ordered', 'Delivered', 'Paid', 'Closed Won', 'Closed Lost', 'Dead File', 'Other'],
      status_error: null,
      taxRate: edit ? project.tax_rate : null,
      taxRateError: null,
      taxType: edit && project.tax_type ? project.tax_type : null,
      statusPickerHolder: edit && companyProjectStatus ? companyProjectStatus.name : 'Lead',
      company_idPickerHolder: company_idPickerHolder,
      loadingSpinner: false,
      primaryAttributes: primaryAttributes,
      additionalAttributes: additionalAttributes,
      customAttributeListModalVisible: false,
      listItems: [],
      listAttribute: {},
      formErrors: {},
      isReady: false,
      searchInputModalVisible: false,
      searchCollection: [],
      searchInputTarget: '',
      searchInputTitle: '',
      facility_type_id: edit ? project.facility_type_id : null,
      utility_id: edit ? project.utility_id : null,
      companyMeasureTypes: edit && project.company_id ? [] : company.measure_types ,
      projectMeasureTypes: edit && project.company_id ? Array.from(project.measure_types) : company.measure_types.length > 1 ? [] : [company.measure_types[0]],
    };

    this.setCompanyModalVisible = this.setCompanyModalVisible.bind(this);
    this.setStatusModalVisible = this.setStatusModalVisible.bind(this);
    this.setSearchInputsModalVisible = this.setSearchInputsModalVisible.bind(this);

    this.setDoorTemplateModalVisible = this.setDoorTemplateModalVisible.bind(this);
    this.setLightingTemplateModalVisible = this.setLightingTemplateModalVisible.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ isReady: true });
    }, 250)
  }

  async selectCompany(company_id) {
    const company = realm.objects('Company').filtered(`server_id = ${company_id}`)[0];

    const defaultLight = company.default_lighting_template;
    const defaultDoor = company.default_door_template;

    await this.setState({
      company_id,
      company: company,
      lighting_template: defaultLight,
      lighting_templateHolderId: defaultLight ? defaultLight.id : null,
      lighting_templates: company.lightingTemplates,
      door_template: defaultDoor,
      door_templateHolderId: defaultDoor ? defaultDoor.id : null,
      door_templates: company.doorTemplates,
      projectMeasureTypes: company.measure_types.length > 1 ? [] : [company.measure_types[0]],
      companyMeasureTypes: company.measure_types,
    });
  }

  setCompanyModalVisible(visible) {
    this.setState({ companyModalVisible: visible });
  }

  setLightingTemplateModalVisible(visible) {
    this.setState({ lightingTemplateModalVisible: visible });
  }

  setDoorTemplateModalVisible(visible) {
    this.setState({ doorTemplateModalVisible: visible });
  }

  setStatusModalVisible(visible) {
    this.setState({ statusModalVisible: visible });
  }

  setSearchInputsModalVisible(visible, title = '', target = '', currentValue = '', collection = []) {
    this.setState({
      searchInputModalVisible: visible,
      searchInputTarget: target,
      searchInputTitle: title,
      searchInputCurrentValue: currentValue,
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

  backToProjects() {
    
    this.props.changeStack();
  }

  // TODO: this should be moved into a validationActions class
  validateNumber(number, errorTarget) {
    const numbers = '0123456789.,';
    let error = false;

    if (number === '' || number === null) {
      return;
    }

    for (let i = 0; i < number.length; i++) {
      if (numbers.indexOf(number[i]) > -1) {
        null;
      } else {
        error = true;
      }
    }

    if (error === true) {
      this.simpleSetState(errorTarget, 'must only contain numbers');
    } else {
      this.simpleSetState(errorTarget, null);
    }
  }

  async validateName(name, errorTarget) {
    let existingProjects = await realm.objects('Project');
    let matchingNamedProjects = await existingProjects.filtered(`name= "${name}"`);

    if (this.state.mode === 'edit' && this.state.project.name === this.state.name) {
      return;
    }

    if (matchingNamedProjects.length > 0) {
      this.simpleSetState(errorTarget, 'must be unique');
    } else if (!this.state.name) {
      this.simpleSetState(errorTarget, 'this field is required');
    } else {
      this.simpleSetState(errorTarget, null);
    }
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

  async runValidations() {
    const custom_attributes = JSON.parse(this.state.project.custom_attributes);
    const customAttributeErrors = await Project.validateCustomAttributes(custom_attributes, this.props.project);
    return { ...customAttributeErrors };
  }

  async isMissingCompanyTemplate() {
    const { company, projectMeasureTypes } = this.state;

    if (!company || projectMeasureTypes.length == 0) return true

    const companyTemplates = this.getTemplates();

    if (companyTemplates.length == 0) return true
    return false
  }

  async onSubmit() {
    if((this.state.mode === 'new') && await this.isMissingCompanyTemplate()) {
      Alert.alert('Unable to Save', 'It looks like you have not selected a Project Measure Type. Please select and try again.');
      return;
    }
    KeepAwake.activate();

    // CustomAttribute Validation
    if (this.state.mode === 'edit') {
      const formErrors = await this.runValidations();
      await this.setState({ formErrors });
      if (Object.keys(formErrors).length !== 0) { return; }
    }

    await this.validateNumber(this.state.maintenanceLaborRate, 'maintenanceLaborRateError');
    await this.validateNumber(this.state.markupPercentage, 'markupPercentageError');
    await this.validateNumber(this.state.probabilityPercentage, 'probabilityPercentageError');
    await this.validateNumber(this.state.taxRate, 'taxRateError');
    await this.validateName(this.state.name, 'nameError');
    await this.validateZipCode(this.state.physicalZipCode, 'physicalZipCodeError');

    let probabilityRangeValid;
    if (this.state.probabilityPercentage) {
      probabilityRangeValid = await validatePercentage(this.state.probabilityPercentage);
    } else {
      probabilityRangeValid = true;
    }

    if (probabilityRangeValid) {
      await this.setState({ probabilityPercentageError: null });
    } else {
      await this.setState({ probabilityPercentageError: 'must be between 0 and 100' });
    }

    if (
      this.state.maintenanceLaborRateError === null &&
      this.state.markupPercentageError === null &&
      this.state.nameError === null &&
      this.state.probabilityPercentageError === null &&
      this.state.taxRateError === null &&
      this.state.physicalZipCodeError === null
    ) {

      companyProjectStatus = realm.objects('CompanyProjectStatus').filtered(`company_id = '${this.state.company_id}' AND name = '${this.state.status}'`)[0];

      if (this.state.mode === 'new') {
        this.setState({ loadingSpinner: true })
        const mobile_id = await Project.nextId();
        const uuid = await UUIDGenerator.getRandomUUID();

        const companyTemplates = this.getTemplates();
        let customAttributes = "";
        for (let l = 0; l < companyTemplates.length; l++) {
          const template = companyTemplates[l];
          const attributes = await template.cleanAttributes('project');
          if (companyTemplates.length > 1) {
            if (attributes != '{}') {
              customAttributes += attributes
            }
          } else {
            customAttributes += attributes
          }
        }

        try {
          Project.create({
            active: true,
            all_company_access: this.state.allCompanyAccess,
            apply_tax_on: this.state.applyTaxOn,
            company_id: this.state.company_id,
            company_project_status_id: companyProjectStatus.server_id,
            edited: false,
            maintenance_labor_rate: this.state.maintenanceLaborRate,
            markup: this.state.markupPercentage,
            markup_type: this.state.markupType,
            mobile_id,
            name: this.state.name,
            probability: this.state.probabilityPercentage,
            server_id: null,
            tax_rate: this.state.taxRate,
            tax_type: this.state.taxType,
            facility_type_id: this.state.facility_type_id,
            utility_id: this.state.utility_id,
            uuid,
            custom_attributes: customAttributes.replace('}{', ', '),
            measure_types: this.state.projectMeasureTypes
          });

          this.createProjectUser(mobile_id)
          await this.generateCustomAttributes(mobile_id);
          await this.createPhysicalAddress(mobile_id);
          await Location.generateFromProject(mobile_id, this.getTemplates());

          const userProjects = await this.props.currentUser.projects();
          this.props.setUserProjects(userProjects)
          this.props.setProjectDefaults(userProjects);
          this.props.setProductDefaults(userProjects);

          const newlyCreatedProject = await realm.objects('Project').filtered('mobile_id = $0', mobile_id)[0]
          this.props.openProject(newlyCreatedProject)
        } catch (error) {
          this.setState({ loadingSpinner: false });
        }
      } 
      else if (this.state.mode === 'edit') {
        try {
          realm.write(() => {
            realm.create('Project', {
              ...this.state.project,
              active: true,
              all_company_access: this.state.allCompanyAccess,
              apply_tax_on: this.state.applyTaxOn,
              company_id: this.state.company_id,
              company_project_status_id: companyProjectStatus.server_id,
              edited: true,
              maintenance_labor_rate: this.state.maintenanceLaborRate,
              markup: this.state.markupPercentage,
              markup_type: this.state.markupType,
              name: this.state.name,
              probability: this.state.probabilityPercentage,
              tax_rate: this.state.taxRate,
              tax_type: this.state.taxType,
              facility_type_id: this.state.facility_type_id,
              utility_id: this.state.utility_id,
            }, true);
          });

          this.state.physicalAddress ? this.editPhysicalAddress() : this.createPhysicalAddress(this.state.project.mobile_id);

          this.backToProjects();
          // this.props.openProject(this.props.project)
        } catch (error) {}
      }
    }
    KeepAwake.deactivate();
  }

  async createProjectUser(mobile_project_id) {
    const mobile_id = await ProjectUser.nextId()
    ProjectUser.create({
      mobile_project_id,
      mobile_id,
      user_id: this.props.currentUser.id,
      status: 'active',
      role: 'admin'
    })
  }

  async complexSetStateForCustomAttributes(target, value) {
    const update = JSON.parse(this.state.project.custom_attributes);
    update[target] = value;
    await this.setState({
      project: {
        ...this.state.project,
        custom_attributes: JSON.stringify(update),
      },
    });
  }

  getTemplates() {
    const { projectMeasureTypes, lighting_template, door_template } = this.state;
    const companyTemplates = [];

    for (let i = 0; i < projectMeasureTypes.length; i++) {
      const measure_type = projectMeasureTypes[i];
      if (measure_type == 'lighting') {
        companyTemplates.push(lighting_template);
      } else if (measure_type == 'door') {
        companyTemplates.push(door_template);
      }
    }

    return companyTemplates.filter(n => n)
  }

  async generateCustomAttributes(mobileProjectId) {
    const companyTemplates = this.getTemplates();

    for (let j = 0; j < companyTemplates.length; j++) {
      const template = companyTemplates[j];
      await template.copyTemplateToNewProject(mobileProjectId, null)
    }
  }

  editPhysicalAddress() {
    realm.write(() => {
      realm.create('Address', {
        address: this.state.physicalAddressOne,
        address_2: this.state.physicalAddressTwo,
        city: this.state.physicalCity,
        mobile_id: this.state.physicalAddress.mobile_id,
        state: this.state.physicalState,
        zip_code: this.state.physicalZipCode,
      }, true);
    });
  }

  async createPhysicalAddress(project_id) {
    physicalAddressId = await Address.nextId();

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
          addressable_mobile_id: project_id,
          addressable_type: 'Project',
          city: this.state.physicalCity,
          mobile_id: physicalAddressId,
          server_id: null,
          state: this.state.physicalState,
          zip_code: this.state.physicalZipCode,
        });
      });
    }
  }

  renderPicker(companies) {
    const returnCompanies = []
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      returnCompanies.push( <Picker.Item key={company.server_id} label={company.name} value={company.server_id} /> )
    }
    return returnCompanies
  } 

  setMeasureTypes(measure_type) {
    let measures = this.state.projectMeasureTypes
    if (measures.indexOf(measure_type) == -1) {
      measures.push(measure_type)
    } else {
      measures.splice(measures.indexOf(measure_type), 1)
    }
    this.setState({ projectMeasureTypes: measures })
  }

  render() {
    return (
      <Form>
        {this.state.loadingSpinner &&
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}} >
            <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          </View>
        }

        {!this.state.loadingSpinner &&

          <View style={{ flex: 15, flexDirection: 'row' }}>
            <View style={{ flex: 1, margin: 10 }}>
              <View style={[GS.tabContainer]}>
                {['Project Attributes', 'Details', 'Sales Attributes'].map(projectTab => (
                  <Tab
                    key={projectTab}
                    onPress={() => this.setState({ projectSubsection: projectTab })}
                    title={projectTab}
                    activeTab={this.state.projectSubsection === projectTab}
                  />
                ))}
              </View>

              <View style={{ flex: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: '#FAFAFD', ...GS.border, borderTopWidth: 0 }}>
                <View style={{ flexGrow: 1 }}>
                  <KeyboardAwareScrollView
                    keyboardOpeningTime={100}
                  >
                    {this.state.projectSubsection == 'Project Attributes' &&

                      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <View style={{flexDirection: 'row'}}>
                              <FixedFormLabel labelStyle={{ marginTop: 8 }}>Company</FixedFormLabel>
                              <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                            </View>
                            <ClickableInput
                              onPress={() => { this.state.project === null && this.setCompanyModalVisible(true); }}
                              title={this.state.company ? this.state.company.name : ''}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Project Name</FixedFormLabel>
                            <StringInput
                              value={this.state.name}
                              target="name"
                              onChange={this.simpleSetState.bind(this)}
                              error={this.state.nameError != null}
                              errorMessage={this.state.nameError}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                          </View>
                        </View>

                        {/* Measures/Templates Section ------------------------------------------------*/}

                        {this.state.mode != 'edit' &&
                          <View style={{ flexBasis: '33.33%' }}>
                            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                              <FixedFormLabel>Measure Types</FixedFormLabel>
                              <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                            </View>
                            <View style={{ flexDirection: "row" }}>
                              {['lighting'].map(measure_type => (
                                <CheckBox
                                  containerStyle={{ marginLeft: 20, marginRight: 0, marginTop: 7.5, margin: 0, marginBottom: 5 }}
                                  key={measure_type}
                                  center
                                  title={measure_type}
                                  checkedColor={PRIMARY_BLUE}
                                  checkedIcon='circle'
                                  uncheckedIcon='circle-o'
                                  checked={this.state.projectMeasureTypes.indexOf(measure_type) != -1}
                                  onPress={() => { this.setMeasureTypes(measure_type) }}
                                />
                              ))}
                            </View>
                          </View>
                        }

                        {(this.state.mode != 'edit' && this.state.projectMeasureTypes.indexOf('lighting') != -1) &&
                          <View style={{ flexBasis: '33.33%' }}>
                            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                              <FixedFormLabel>Lighting Template</FixedFormLabel>
                              <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                            </View>
                            <ClickableInput
                              onPress={() => { this.state.project === null && this.setLightingTemplateModalVisible(true); }}
                              title={this.state.lighting_template ? this.state.lighting_template.name : ''}
                            />
                          </View>
                        }
                        {/* Door Template stuff */}
                        {/* {(this.state.mode != 'edit' && this.state.projectMeasureTypes.indexOf('door') != -1) &&
                          <View style={{ flexBasis: '33.33%' }}>
                            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                              <FixedFormLabel>Door Template</FixedFormLabel>
                              <Text style={{marginTop: 8, marginLeft: 5, color: 'tomato'}}>*</Text>
                            </View>
                            <ClickableInput
                              onPress={() => { this.state.project === null && this.setDoorTemplateModalVisible(true); }}
                              title={this.state.door_template ? this.state.door_template.name : ''}
                              hint={'You can create additional door audit templates on the Retrolux website.'}
                            />
                          </View>
                        } */}

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Project Status</FixedFormLabel>
                            <ClickableInput
                              onPress={() => this.setStatusModalVisible(true)}
                              title={this.state.status}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Facility Type</FixedFormLabel>
                            <ClickableInput
                              onPress={() => this.setSearchInputsModalVisible(true, 'Facility Type', 'facility_type_id', this.state.facility_type_id, realm.objects('FacilityType').sorted('name'))}
                              title={this.state.facility_type_id ? realm.objects('FacilityType').filtered(`id = ${this.state.facility_type_id}`)[0].name : ''}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Utility Name</FixedFormLabel>
                            <ClickableInput
                              onPress={() => this.setSearchInputsModalVisible(true, 'Utility Name', 'utility_id', this.state.utility_id, realm.objects('EncentivUtility').sorted('name'))}
                              title={this.state.utility_id ? realm.objects('EncentivUtility').filtered(`id = ${this.state.utility_id}`)[0].name : ''}
                            />
                          </View>
                        </View>

                        {/* Address Section ------------------------------------------------*/}

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
                          <View style={{ flex: -1, marginTop: 8, flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                              <FixedFormLabel>State</FixedFormLabel>
                              <ClickableInput
                                onPress={() => this.setSearchInputsModalVisible(true, 'States', 'physicalState', this.state.physicalState, STATES)}
                                title={this.state.physicalState ? this.state.physicalState : ''}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
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

                        {/* Primary Custom Attributes ---------------------------------------------*/}
  
                        {this.state.primaryAttributes.map(attribute => (
                          <CustomAttributeFormElement
                            key={attribute.mobile_id}
                            elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '33%', marginTop: 8 }}
                            isReady={this.state.isReady}
                            attribute={attribute}
                            customAttributes={JSON.parse(this.state.project.custom_attributes)}
                            complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
                            setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
                            formErrors={this.state.formErrors}
                          />
                        ))}

                      </View>
                    }

                    {/* Details Tab ---------------------------------------------------*/}

                    {this.state.projectSubsection == 'Details' &&

                      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Apply Tax On</FixedFormLabel>
                            <TapInput
                              types={APPLY_TAX_ON_TYPES}
                              onChange={this.simpleSetState.bind(this)}
                              target={'applyTaxOn'}
                              value={this.state.applyTaxOn}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Tax Type</FixedFormLabel>
                            <TapInput
                              types={TAX_TYPES}
                              onChange={this.simpleSetState.bind(this)}
                              target={'taxType'}
                              value={this.state.taxType}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Tax Rate</FixedFormLabel>
                            <NumberInput
                              target={'taxRate'}
                              value={this.state.taxRate}
                              placeholder={'enter a tax rate'}
                              unit={'%'}
                              unitPosition={'right'}
                              onChange={this.simpleSetState.bind(this)}
                              error={this.state.taxRateError != null}
                              errorMessage={this.state.taxRateError}
                              hint={'Enter a percentage without % (and enter 6 for 6%, not .06).'}
                              needToBeString
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Maintenance Labor Rate</FixedFormLabel>
                            <NumberInput
                              target={'maintenanceLaborRate'}
                              value={this.state.maintenanceLaborRate}
                              placeholder={'hourly rate ($/hr)'}
                              unit={'$'}
                              unitPosition={'left'}
                              onChange={this.simpleSetState.bind(this)}
                              error={this.state.maintenanceLaborRateError != null}
                              errorMessage={this.state.maintenanceLaborRateError}
                              hint={'Hourly Rate ($/hr)'}
                              needToBeString
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Margin Type</FixedFormLabel>
                            <TapInput
                              types={MARKUP_TYPES}
                              onChange={this.simpleSetState.bind(this)}
                              target={'markupType'}
                              value={this.state.markupType}
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Markup/Margin Percentage</FixedFormLabel>
                            <NumberInput
                              target={'markupPercentage'}
                              value={this.state.markupPercentage}
                              placeholder={'product markup or margin percentage'}
                              unit={'%'}
                              unitPosition={'right'}
                              onChange={this.simpleSetState.bind(this)}
                              error={this.state.markupPercentageError != null}
                              errorMessage={this.state.markupPercentageError}
                              hint={'Enter a percentage without % (and enter 6 for 6%, not .06).'}
                              needToBeString
                            />
                          </View>
                        </View>

                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Grant company-wide access?</FixedFormLabel>
                            <Switch
                              onTintColor={PALE_GREEN}
                              style={{ marginLeft: 20, marginTop: 5 }}
                              value={this.state.allCompanyAccess}
                              onValueChange={value => this.simpleSetState('allCompanyAccess', value)}
                            />
                          </View>
                        </View>

                      </View>
                    }

                    {/* Sales Attributes Tab ---------------------------------------------------*/}

                    {this.state.projectSubsection == 'Sales Attributes' &&

                      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>


                        <View style={{ flexBasis: '33.33%' }}>
                          <View style={{ flex: -1, marginTop: 8 }}>
                            <FixedFormLabel>Probability Percentage</FixedFormLabel>
                            <NumberInput
                              target={'probabilityPercentage'}
                              value={this.state.probabilityPercentage}
                              placeholder={'probability the project will be completed (%)'}
                              unit={'%'}
                              unitPosition={'right'}
                              onChange={this.simpleSetState.bind(this)}
                              error={this.state.probabilityPercentageError != null}
                              errorMessage={this.state.probabilityPercentageError}
                              hint={'Enter whole number without % (i.e. enter 6 for 6%, not .06).'}
                              needToBeString
                            />
                          </View>
                        </View>

                        {this.state.additionalAttributes.map(attribute => (
                          <CustomAttributeFormElement
                            key={attribute.mobile_id}
                            elementLayout={{ paddingHorizontal: this.state.isReady ? 0 : 20, flexBasis: '33%', marginTop: 8 }}
                            isReady={this.state.isReady}
                            attribute={attribute}
                            customAttributes={JSON.parse(this.state.project.custom_attributes)}
                            complexSetStateForCustomAttributes={this.complexSetStateForCustomAttributes.bind(this)}
                            setCustomAttributeListModalVisible={this.setCustomAttributeListModalVisible.bind(this)}
                            formErrors={this.state.formErrors}
                          />
                        ))}

                      </View>
                    }
                  </KeyboardAwareScrollView>
                </View>
              </View>
            </View>
          </View>
        }

        {!this.state.loadingSpinner &&
          <BottomBar>
            <View style={{ flex: 1 }} />
            <ActionButton alt title="cancel" onPress={() => {
              if (!this.state.loadingSpinner) {
                this.backToProjects();
              }
            }} />
            <ActionButton title="submit" onPress={() => {
              if (!this.state.loadingSpinner) {
                this.onSubmit();
              }
            }} />
          </BottomBar>
        }

        {/*************************** CompanyId Modals *************************/}

        {this.state.mode != 'edit' &&
          <PickerModal
            isVisible={this.state.companyModalVisible}
            onSubmit={() => {
              this.selectCompany(this.state.company_idPickerHolder)
              this.setCompanyModalVisible(false);
            }}
            title={'Pick a Company'}
            closePickerModal={() => this.setCompanyModalVisible(false)}
          >
            <Picker
              selectedValue={this.state.company_idPickerHolder}
              onValueChange={(itemValue, itemIndex) => this.setState({company_idPickerHolder: itemValue})}
            >
              {this.state.companies.length > 0 &&
                this.renderPicker(this.state.companies)
              }
              {this.state.companies.length < 1 &&
                <Picker.Item label={"No companies. Try syncing."} value={null} />
              }
            </Picker>
          </PickerModal>
        }

        {/* CustomAttribute List Input Modal -------------------------------*/}

        {this.state.mode == 'edit' &&
          <CustomAttributeListModal
            isVisible={this.state.customAttributeListModalVisible}
            closeCustomAttributeListModal={() => this.setCustomAttributeListModalVisible(false, {})}
            onPress={this.complexSetStateForCustomAttributes.bind(this)}
            listItems={this.state.listItems}
            listAttribute={this.state.listAttribute}
            customAttributes={this.state.project.custom_attributes}
          />
        }

        {/* End CustomAttribute List Input Modal ---------------------------*/}

        {/*************************** Template Modals *************************/}

        {this.state.mode != 'edit' &&
          <PickerModal
            isVisible={this.state.lightingTemplateModalVisible}
            onSubmit={() => {
              this.setState({ lighting_template: realm.objects('CompanyTemplate').filtered(`id = ${this.state.lighting_templateHolderId}`)[0] });
              this.setLightingTemplateModalVisible(false);
            }}
            title={'Pick a Template'}
            closePickerModal={() => this.setLightingTemplateModalVisible(false)}
          >
            <Picker
              selectedValue={this.state.lighting_templateHolderId}
              onValueChange={(itemValue, itemIndex) => this.setState({ lighting_templateHolderId: itemValue })}
            >
              {this.state.lighting_templates.map(template => (
                <Picker.Item key={template.id} label={template.name} value={template.id} />
              ))}
            </Picker>
          </PickerModal>
        }

        {this.state.mode != 'edit' &&
          <PickerModal
            isVisible={this.state.doorTemplateModalVisible}
            onSubmit={() => {
              this.setState({ door_template: realm.objects('CompanyTemplate').filtered(`id = ${this.state.door_templateHolderId}`)[0] });
              this.setDoorTemplateModalVisible(false);
            }}
            title={'Pick a Template'}
            closePickerModal={() => this.setDoorTemplateModalVisible(false)}
          >
            <Picker
              selectedValue={this.state.door_templateHolderId}
              onValueChange={(itemValue, itemIndex) => this.setState({ door_templateHolderId: itemValue })}
            >
              {this.state.door_templates.map(template => (
                <Picker.Item key={template.id} label={template.name} value={template.id} />
              ))}
            </Picker>
          </PickerModal>
        }

        {/************************* Status Modal ***********************/}

        <PickerModal
          isVisible={this.state.statusModalVisible}
          onSubmit={() => {
            this.setState({ status: this.state.statusPickerHolder });
            this.setStatusModalVisible(false);
          }}
          title={'Pick a Status'}
          closePickerModal={() => this.setStatusModalVisible(false)}
        >
          <Picker
            selectedValue={this.state.statusPickerHolder}
            onValueChange={(itemValue, itemIndex) => this.setState({ statusPickerHolder: itemValue })}
          >
            {this.state.statuses.map(status => (
              <Picker.Item key={status} label={status} value={status} />
            ))}
          </Picker>
        </PickerModal>

        {/* SearchInputModal List Input Modal -----------------------------------------------------*/}
  
        <SearchInputModal
          isVisible={this.state.searchInputModalVisible}
          closeModal={() => this.setSearchInputsModalVisible(false, '', '', '', [])}
          onPress={this.simpleSetState.bind(this)}
          target={this.state.searchInputTarget}
          title={this.state.searchInputTitle}
          collection={this.state.searchCollection}
          currentValue={this.state.searchInputCurrentValue}
        />
  
      </Form>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    currentUser: state.currentUserReducer.currentUser,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectForm);
