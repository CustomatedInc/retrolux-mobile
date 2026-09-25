import _ from 'lodash'

import Model from '../model';
import realm from '../realm';
import { projectSchema } from '../schema'
import { Area } from  './Area';
import { Location } from  './Location';
import { RateSchedule } from  './RateSchedule';
import { OperatingSchedule } from  './OperatingSchedule';
import { Heating } from  './Heating';
import { Cooling } from  './Cooling';
import { customAttributeScopes as CA } from './CustomAttribute';
import { CustomAttributable } from '../mixins/CustomAttributable'
import { compose } from '../../lib/utilities';
import { Editable } from '../mixins/Editable'
import { scope } from '../../lib/utilities';
import { apiToRealmGeneral, convertToStrings, addDate } from '../../lib/objectFormatters';
import memoize from 'fast-memoize';

const memoActiveExistingLightings = memoize((project, order) => {
  return realm.objects('ExistingLighting').filtered('mobile_project_id = $0 AND active = true', project.mobile_id).sorted(order)
});

const memoActiveDoorSchedules = memoize((project, order) => {
  return realm.objects('DoorSchedule').filtered('mobile_project_id = $0 AND active = true', project.mobile_id).sorted(order)
});

export class Project extends compose(Editable, CustomAttributable)(Model) {

  static applyTaxOn(string) {
    const enumObject = { 'no_sales_tax': 0, 'product_only': 1, 'gross_price': 2 }
    return enumObject[string];
  }

  static taxType(string) {
    const enumObject = { 'sales_tax': 0, 'use_tax': 1 }
    return enumObject[string];
  }

  static markupType(string) {
    const enumObject = { 'markup': 0, 'margin': 1 }
    return enumObject[string];
  }

  static search(searchText) {
    return realm.objects('Project').filtered(`active = true AND name CONTAINS[c] '${searchText}'`)
  }

  static async createFromServer(serverProject) {
    if (serverProject.company_id == null) {
      throw `Project with server_id ${serverProject.id} doesn't have a company_id`;
    }

    let project = await this.prepareForRealm(serverProject)
    await this.create(project, true)
    return project.mobile_id
  }

  static async prepareForRealm(project) {
    project = apiToRealmGeneral(project)
    project = convertToStrings(project, ['maintenance_labor_rate', 'markup', 'probability', 'tax_rate'])
    project = addDate(project, 'expected_close_date')

    project.custom_attributes = JSON.stringify(project.custom_attributes);

    project.mobile_id = await this.findOrNextMobileId(project.server_id);
    return project
  }

  static async prepareAllForApi(user = null) {
    const projects = !!user ? await user.allProjects() : await this.all;
    let projectsData = [];
    for (const project of projects) {
      const data = await project.prepareForApi()
      if(data !== null) projectsData.push(data)
    }
    return projectsData
  }

  // override for Editable.toVitalsObject()
  toVitalsObject() {
    return { mobile_id: this.mobile_id, server_id: this.server_id, company_id: this.company_id }
  }

  async prepareForApi() {
    const updatedRequired = await this.requiresUpdate
    if (!updatedRequired) { return null }

    return {
      ...this.toSyncableFormat(),
      measure_types: Array.from(this.measure_types),
      project_custom_attributes: this.custom_attributes, // needed for sync since custom_attributes: customAttributesDataForApi below wipes project.custom_attributes
      existing_lightings: await this.existingLightingDataForApi(),
      locations: await this.locationsDataForApi(),
      areas: await this.areaDataForApi(),
      operating_schedules: await this.schedulesDataForApi('OperatingSchedule'),
      rate_schedules: await this.schedulesDataForApi('RateSchedule'),
      coolings: await this.schedulesDataForApi('Cooling'),
      heatings: await this.schedulesDataForApi('Heating'),
      project_user: await this.projectUserObject(),
      custom_attributes: await this.customAttributesDataForApi(),
      address: await this.addressDataForApi()
    }
  }

  async projectUserObject() {
    if(!this.isNew) return {}

    const projectUser = await realm.objects('ProjectUser').filtered(`mobile_project_id = ${this.mobile_id} AND server_id = null`)[0]
    if(!!projectUser) {
      return projectUser.toPlainObject()
    } else {
      return {}
    }
  }

  async schedulesDataForApi(model) {
    let schedules = await realm.objects(model).filtered(`mobile_project_id = ${this.mobile_id}`)
    return schedules.map(schedule => schedule.toSyncableFormat())
  }

  get existingLightings() {
    return realm.objects('ExistingLighting').filtered(`mobile_project_id = ${this.mobile_id}`)
  }

  async existingLightingDataForApi() {
    let existingLightings = await this.existingLightings;
    return existingLightings.map(lighting => lighting.toSyncableFormat())
  }

  async addressDataForApi() {
    let address = await this.address;

    if (address) {
      return address.toPlainObject();
    } else {
      return {}
    }
  }

  async locationsDataForApi() {
    const locations = realm.objects('Location').filtered(`mobile_project_id = $0`, this.mobile_id)
    if (locations.length == 0) { return [] }

    let allLocationData = [];

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      const locationData = await location.prepareForApi();
      if (locationData) {
        allLocationData.push(locationData);
      }
    }

    return allLocationData;
  }

  async areaDataForApi() {
    const topLevelAreas = await this.topLevelAreas
    if (topLevelAreas.length == 0) { return [] }

    let areasFromTopToBottom = topLevelAreas.map((area) => area)
    let customFilter = topLevelAreas.map((area) => `mobile_parent_id = ${area.mobile_id}`).join(' OR ')

    let found_areas = await realm.objects('Area').filtered(customFilter)

    while (found_areas.length > 0) {
      found_areas.map((found_area) => {
        areasFromTopToBottom.push(found_area)
      })
      customFilter = found_areas.map((found_area) => `mobile_parent_id = ${found_area.mobile_id}`).join(' OR ')

      found_areas = await realm.objects('Area').filtered(customFilter)
    }

    let allAreaData = [];
    for(const area of areasFromTopToBottom) {
      const areaData = await area.prepareForApi()
      if (!!areaData) allAreaData.push(areaData)
    }
    return allAreaData;
  }

  async customAttributesDataForApi() {
    if(!!this.server_id){
      return []
    } else {
      const attributes = []
      const activeCustomAttributes = await this.activeCustomAttributes
      for (const attribute of activeCustomAttributes) {
        const preppedAttribute = await attribute.prepareForApi()
        attributes.push(preppedAttribute)
      }
      return attributes
    }
  }

  get requiresUpdate() {
    return (async () => {
      let newAreas = await this.newAreas;
      let editedAreas = await this.editedAreas;
      let editedLocations = await this.hasLocationUpdates();
      let hasFixtureUpdates = await this.hasFixtureUpdates();
      let hasScheduleUpdates = await this.hasScheduleUpdates();
      let hasLightingUpdates = await this.hasLightingUpdates();

      return(
        this.isNew || this.isEdited || newAreas.length > 0 || editedAreas.length > 0 ||
        editedLocations || hasFixtureUpdates || hasScheduleUpdates || hasLightingUpdates
      );
    })();
  }

  async hasLocationUpdates() {
    const locations = await realm.objects('Location').filtered(`mobile_project_id = ${this.mobile_id}`).filtered('server_id = null OR edited = true');
    return (locations.length > 0)
  }

  async hasLightingUpdates() {
    const lightings = await realm.objects('ExistingLighting').filtered(`mobile_project_id = ${this.mobile_id}`).filtered('server_id = null OR edited = true');
    return (lightings.length > 0)
  }

  async hasScheduleUpdates() {
    let types = ['OperatingSchedule', 'RateSchedule', 'Heating', 'Cooling'];
    for (let i = 0; i < types.length; i++) {
      let schedules = await realm.objects(types[i]).filtered(`mobile_project_id = ${this.mobile_id}`).filtered('server_id = null OR edited = true');
      if (schedules.length > 0 ) {
        return true;
      }
    }
    return false;
  }

  async hasFixtureUpdates() {
    let areas = await this.areas;
    for (let i = 0; i < areas.length; i++) {
      let fixtures = await areas[i].newAndEditedFixtures
      if (fixtures.length > 0 ) {
        return true;
      }
    }
    return false;
  }

  /////// for CustomAttributable ///////

  // Returns self
  project() {
    return realm.objects('Project').filtered('mobile_id = $0', this.mobile_id)[0]
  }

  getClassName() {
    return 'Project';
  }

  static getClassName() {
    return 'Project';
  }

  //////////////////////////////////////

  get newAreas() {
    return realm.objects('Area').filtered(`mobile_project_id = ${this.mobile_id} AND server_id = null`)
  }

  get editedAreas() {
    return realm.objects('Area').filtered(`mobile_project_id = ${this.mobile_id} AND server_id != null AND edited = true`)
  }

  get topLevelAreas() {
    return(
      realm
        .objects('Area')
        .filtered(`mobile_project_id = ${this.mobile_id}`)
        .filtered('mobile_parent_id = null').snapshot()
    );
  }

  get areasCount() {
    return realm.objects('Area').filtered(`mobile_project_id = ${this.mobile_id} AND active = true`).length
  }

  get areas() {
    return realm.objects('Area').filtered(`mobile_project_id = ${this.mobile_id} AND active = true`)
  }

  get company() {
    return realm.objects('Company').filtered(`server_id = $0 AND active = true`, this.company_id)[0]
  }

  get premiumAccount() {
    const billingPlan = this.billingPlan;

    if (billingPlan == 'retrolux_pro' || billingPlan == 'retrolux_premium' ) {
      return true;
    } else {
      return false;
    }
  }

  get billingPlan() {
    return this.company.stripe_billing_plan;
  }

  get address() {
    return realm.objects('Address').filtered(`address_type = 'physical' AND addressable_type = 'Project' AND addressable_mobile_id = $0`, this.mobile_id)[0]
  }

  get locations() {
    return realm.objects('Location').filtered(`mobile_project_id = $0 AND active = true`, this.mobile_id)
  }

  get scoped_locations() {
    if (this.mobile_location_scope_ids.length > 0) {
      const customFilter = this.mobile_location_scope_ids.map((mobile_id) => `mobile_id = ${mobile_id}`).join(' OR ')
      return realm.objects('Location').filtered(`active = true`).filtered(customFilter);
    } else {
      return [];
    }
  }

  openedAreas() {
    const areaIds = this.topLevelAreas.map((area) => area.mobile_id)
    const openendAreas = this.opened

    openendAreas.map((openedArea) => {
      let area = realm.objects('Area').filtered(`mobile_id = $0`, openedArea.mobile_id)[0]
      area.children.filtered(`active = true`).map((child) => {
        areaIds.push(child.mobile_id)
      })
    })

    let customFilter = areaIds.map((mobile_id) => `mobile_id = ${mobile_id}`).join(' OR ')

    const projectAreas = Area.inProject(this);
    return customFilter ? projectAreas.filtered(customFilter) : [];
  }

  get opened() {
    return (
      realm.objects('Area').filtered(`active = true AND mobile_project_id = $0 AND opened = true`, this.mobile_id).snapshot()
    )
  }

  static async refreshSchedules(serverId) {
    const realmProject = await Project.findServer(serverId);
    if (!realmProject) { return; }

    await realmProject.refreshOperatingSchedules();
    await realmProject.refreshRateSchedules();
    await realmProject.refreshHeatings();
    await realmProject.refreshCoolings();
  }

  async refreshOperatingSchedules() {
    if (this.operating_schedule_id) {
      let operating = await OperatingSchedule.findServer(this.operating_schedule_id);
      if (!!operating) { this.setProp('mobile_operating_schedule_id', operating.mobile_id) }
    }
  }

  async refreshRateSchedules() {
     if (this.rate_schedule_id) {
      let rate = await RateSchedule.findServer(this.rate_schedule_id);
      if (!!rate) { this.setProp('mobile_rate_schedule_id', rate.mobile_id) }
    }
  }

  async refreshHeatings() {
     if (this.heating_id) {
      let heating = await Heating.findServer(this.heating_id);
      if (!!heating) { this.setProp('mobile_heating_id', heating.mobile_id) }
    }
  }

  async refreshCoolings() {
     if (this.cooling_id) {
      let cooling = await Cooling.findServer(this.cooling_id);
      if (!!cooling) { this.setProp('mobile_cooling_id', cooling.mobile_id) }
    }
  }

  async checkDefaultOperating(mobile_schedule_id) {
    if (this.mobile_operating_schedule_id === mobile_schedule_id) {
      realm.write(() => {
        this.mobile_operating_schedule_id = null;
        this.operating_schedule_id = null;
        this.edited = true;
      });
    }

    let areas = await realm.objects('Area').filtered(`mobile_operating_schedule_id = ${mobile_schedule_id}`);
    for (let i = areas.length; i--;) {
      let area = areas[i];
      area.setProp('mobile_operating_schedule_id', null)
      area.setProp('operating_schedule_id', null)
      area.setProp('edited', true)
    }

    let fixtures = await realm.objects('ExistingFixture').filtered(`mobile_operating_schedule_id = ${mobile_schedule_id}`)
    for (let i = fixtures.length; i--;) {
      let fixture = fixtures[i];
      fixture.setProp('mobile_operating_schedule_id', null)
      fixture.setProp('operating_schedule_id', null)
      fixture.setProp('edited', true)
    }
  }

  schedules(scheduleModel) {
    return realm.objects(scheduleModel).filtered(`active = true AND mobile_project_id = ${this.mobile_id}`)
  }

  async checkDefaultMobileSchedule(scheduleModel, foreignKey, mobileScheduleId) {
    if (this[foreignKey] === null && this.schedules(scheduleModel).length == 1) {
      this.setProp(foreignKey, mobileScheduleId)
      this.setProp('edited', true)
    }
  }

  async checkDefaultRate(mobile_schedule_id) {
    if (this.mobile_rate_schedule_id === mobile_schedule_id) {
      realm.write(() => {
        this.mobile_rate_schedule_id = null;
        this.rate_schedule_id = null;
        this.edited = true;
      });
    }

    let areas = await realm.objects('Area').filtered(`mobile_rate_schedule_id = ${mobile_schedule_id}`)
    for (let i = areas.length; i--;) {
      let area = areas[i];
      area.setProp('mobile_rate_schedule_id', null)
      area.setProp('rate_schedule_id', null)
      area.setProp('edited', true)
    }
  }

  async checkDefaultCooling(mobile_schedule_id) {
    if (this.mobile_cooling_id === mobile_schedule_id) {
      realm.write(() => {
        this.mobile_cooling_id = null;
        this.cooling_id = null;
        this.edited = true;
      });
    }

    let areas = await realm.objects('Area').filtered(`mobile_cooling_id = ${mobile_schedule_id}`)
    for (let i = areas.length; i--;) {
      let area = areas[i];
      area.setProp('mobile_cooling_id', null)
      area.setProp('cooling_id', null)
      area.setProp('edited', true)
    }
  }

  async checkDefaultHeating(mobile_schedule_id) {
    if (this.mobile_heating_id === mobile_schedule_id) {
      realm.write(() => {
        this.mobile_heating_id = null;
        this.heating_id = null;
        this.edited = true;
      });
    }

    let areas = await realm.objects('Area').filtered(`mobile_heating_id = ${mobile_schedule_id}`)
    for (let i = areas.length; i--;) {
      let area = areas[i];
      area.setProp('mobile_heating_id', null)
      area.setProp('heating_id', null)
      area.setProp('edited', true)
    }
  }

  // get defaultRateEscalator() {
  //   return(
  //     realm
  //       .objects('DefaultValue')
  //       .filtered(`mobile_project_id = $0 AND name = 'rate_escalator'`, this.mobile_id )[0].value
  //   )
  // }

  get defaultOperatingSchedule() {
    return(
      realm.objects('OperatingSchedule').filtered('mobile_id = $0 AND active = true', this.mobile_operating_schedule_id)[0]
    )
  }

  get operatingSchedules() {
    return(
      realm
        .objects('OperatingSchedule')
        .filtered('mobile_project_id = $0 AND active = true', this.mobile_id)
        .sorted('name')
    )
  }

  get defaultRateSchedule() {
    return(
      realm.objects('RateSchedule').filtered('mobile_id = $0 AND active = true', this.mobile_rate_schedule_id)[0]
    )
  }

  get rateSchedules() {
    return(
      realm
        .objects('RateSchedule')
        .filtered('mobile_project_id = $0 AND active = true', this.mobile_id)
        .sorted('name')
    )
  }

  get defaultCooling() {
    return(
      realm.objects('Cooling').filtered('mobile_id = $0 AND active = true', this.mobile_cooling_id)[0]
    )
  }

  get coolings() {
    return(
      realm
        .objects('Cooling')
        .filtered('mobile_project_id = $0 AND active = true', this.mobile_id)
        .sorted('name')
    )
  }

  get defaultHeating() {
    return(
      realm.objects('Heating').filtered('mobile_id = $0 AND active = true', this.mobile_heating_id)[0]
    )
  }

  get heatings() {
    return(
      realm
        .objects('Heating')
        .filtered('mobile_project_id = $0 AND active = true', this.mobile_id)
        .sorted('name')
    )
  }

  get activeExistingLightings() {
    return memoActiveExistingLightings(this, 'display_order');
  }

  get activeExistingLightingsByCode() {
    return memoActiveExistingLightings(this, 'code');
  }

  get activeDoorSchedules() {
    return memoActiveDoorSchedules(this, 'display_order');
  }

  get activeDoorSchedulesByCode() {
    return memoActiveDoorSchedules(this, 'code');
  }

  get scoped_existing_fixtures() {
    areas = Area.inProject(this)

    if (areas.length > 0) {
      const customFilter = areas.map((area) => `mobile_area_id = ${area.mobile_id}`).join(' OR ')
      return(
        realm
          .objects('ExistingFixture')
          .filtered('active = true')
          .filtered(customFilter)
      )
    } else {
      return [];
    }
  }

  get activeCustomAttributes() {
    return(
      realm
        .objects('CustomAttribute')
        .filtered('mobile_project_id = $0 AND active = true', this.mobile_id)
        .sorted('display_order')
    )
  }

  labelFromUuidFixtureOrLighting(uuid) {
    allAttributes = this.activeCustomAttributes
    for (let i = 0; i < allAttributes.length; i++) {
      const attribute = allAttributes[i];
      if (!!attribute.labelFromUuid(uuid)) {
        return attribute.labelFromUuid(uuid)
      }
    }
  }

  //-------------------------------------------------------------------------//
  // Relied on by CustomAttributable
  // Naming is important and used for dynamic method calls
  //

  // Project //

  projectAttributes() {
    return scope(this.activeCustomAttributes, CA.project)
  }

  ProjectAttributes() {
    return scope(this.activeCustomAttributes, CA.project)
  }

  primaryProjectAttributes() {
    return scope(this.activeCustomAttributes, CA.primary, CA.project)
  }

  additionalProjectAttributes() {
    return scope(this.activeCustomAttributes, CA.additional, CA.project)
  }

  // Location //

  locationAttributes() {
    return scope(this.activeCustomAttributes, CA.location)
  }

  primaryLocationAttributes() {
    return scope(this.activeCustomAttributes, CA.primary, CA.location)
  }

  additionalLocationAttributes() {
    return scope(this.activeCustomAttributes, CA.additional, CA.location)
  }

  LocationAttributes() {
    return scope(this.activeCustomAttributes, CA.location)
  }

  requiredLocationAttributes() {
    return scope(this.activeCustomAttributes, CA.required, CA.location)
  }

   // Area //

  areaAttributes() {
    return scope(this.activeCustomAttributes, CA.area)
  }

  primaryAreaAttributes() {
    return scope(this.activeCustomAttributes, CA.primary, CA.area)
  }

  additionalAreaAttributes() {
    return scope(this.activeCustomAttributes, CA.additional, CA.area)
  }

  AreaAttributes() {
    return scope(this.activeCustomAttributes, CA.area)
  }

  requiredAreaAttributes() {
    return scope(this.activeCustomAttributes, CA.required, CA.area)
  }

  // ExistingLighting //

  ExistingLightingAttributes() {
    return scope(this.activeCustomAttributes, CA.existingLighting)
  }

  ExistingLightingAttributesByTab() {
    return scope(this.activeCustomAttributes, CA.existingLighting, CA.byTab)
  }

  primaryExistingLightingAttributes() {
    return scope(this.activeCustomAttributes, CA.primary, CA.existingLighting)
  }

  additionalExistingLightingAttributes() {
    return scope(this.activeCustomAttributes, CA.additional, CA.existingLighting)
  }

  requiredExistingLightingAttributes() {
    return scope(this.activeCustomAttributes, CA.required, CA.existingLighting)
  }

  // ExistingFixture //

  ExistingFixtureAttributes() {
    return scope(this.activeCustomAttributes, CA.existingFixture)
  }

  primaryExistingFixtureAttributes() {
    return scope(this.activeCustomAttributes, CA.primary, CA.existingFixture)
  }

  additionalExistingFixtureAttributes() {
    return scope(this.activeCustomAttributes, CA.additional, CA.existingFixture)
  }

  requiredExistingFixtureAttributes() {
    return scope(this.activeCustomAttributes, CA.required, CA.existingFixture)
  }

  // DoorSchedule //

  DoorScheduleAttributes() {
    return scope(this.activeCustomAttributes, CA.doorSchedule)
  }

  DoorScheduleAttributesByTab() {
    return scope(this.activeCustomAttributes, CA.doorSchedule, CA.byTab)
  }

  primaryDoorScheduleAttributes() {
    return scope(this.activeCustomAttributes, CA.primary, CA.doorSchedule)
  }

  additionalDoorScheduleAttributes() {
    return scope(this.activeCustomAttributes, CA.additional, CA.doorSchedule)
  }

  requiredDoorScheduleAttributes() {
    return scope(this.activeCustomAttributes, CA.required, CA.doorSchedule)
  }

  // ExistingDoor //

  ExistingDoorAttributes() {
    return scope(this.activeCustomAttributes, CA.existingDoor)
  }

  primaryExistingDoorAttributes() {
    return scope(this.activeCustomAttributes, CA.primary, CA.existingDoor)
  }

  additionalExistingDoorAttributes() {
    return scope(this.activeCustomAttributes, CA.additional, CA.existingDoor)
  }

  requiredExistingDoorAttributes() {
    return scope(this.activeCustomAttributes, CA.required, CA.existingDoor)
  }
  //
  //-------------------------------------------------------------------------//
}

Project.schema = projectSchema;
