import {
  Project,
  ProjectUser,
  Location,
  Area,
  Address,
  ExistingFixture,
  ExistingCategoryTreeEntry,
  FacilityType,
  EncentivUtility,
  ExistingLighting,
  ExistingDoor,
  DoorSchedule,
  CustomAttribute,
  OperatingSchedule,
  DoorOperatingSchedule,
  DefaultSchedule,
  RateSchedule,
  Heating,
  Cooling,
  Company,
  CompanyProjectStatus,
  CompanyUser,
  CompanyTemplate,
  FloorPlan,
  Layer,
  Pin,
  Attachment,
  // DefaultValue,
} from '../database/models';
// import { AsyncStorage } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { EXISTING_CATEGORY_TYPES } from '../resources/constants';
import { postError } from './fetches';

/**
  * Takes fetched project data from API and builds projects
  * Doesn't fail if one record fails to create, but keeps track of failures
  */
export async function buildProjects(apiAuthToken, serverProjects, failedUpSyncProjects) {
  let buildData = {
    success: false,
    errors: [],
  };

  const failedUpSyncProjectIds = failedUpSyncProjects.map(project => project.server_id).filter(n => n)
  for(const serverProject of serverProjects) {    
    try {
      if(failedUpSyncProjectIds.includes(serverProject.id)) continue;

      if(!serverProject.enable_sync) {
        let existingProject = await Project.findServer(serverProject.id)
        if(!!existingProject) existingProject.setProp('enable_sync', false)
      } else if(!serverProject.active) {
        let existingProject = await Project.findServer(serverProject.id)
        if(!!existingProject) existingProject.setProp('active', false)
      } else {
        await buildProject(serverProject)
      }
    } catch (e) {
      const stringError = await e

      buildData.errors.push({
        project_name: serverProject.name,
        id: serverProject.id,
        diagnostics: stringError,
      });

      let error_diagnostic = `\nProject (id: ${serverProject.id || serverProject.server_id}) failed to build during sync.\n\nError: ` + stringError
      await postError(apiAuthToken, error_diagnostic);

      continue; // allows sync to continue without failed project
    }
  }

  return buildData;
}

/**
 * The order in which we build is important (e.g. Area.createAllFromServer
 * assumes that schedules have already been created)
 */
async function buildProject(serverProject) {
  const values = await deconstruct(serverProject)

  const [
    project, locations, areas, fixtures, operatings, doorOperatings, rates, heatings, coolings, defaultSchedules,
    shippingAddress, address, projectUsers, customAttributes, existingLightings,
    doorSchedules, existingDoors,
    floorPlans, layers, pins, attachments
  ] = values

  // console.log("Project: --- ", project ? 1 : 0);  // Project is usually a single object
  // console.log("Locations: --- ", locations?.length || 0);
  // console.log("Areas: --- ", areas?.length || 0);
  // console.log("Fixtures: --- ", fixtures?.length || 0);
  // console.log("Operatings: --- ", operatings?.length || 0);
  // console.log("Door Operatings: --- ", doorOperatings?.length || 0);
  // console.log("Rates: --- ", rates?.length || 0);
  // console.log("Heatings: --- ", heatings?.length || 0);
  // console.log("Coolings: --- ", coolings?.length || 0);
  // console.log("Default Schedules: --- ", defaultSchedules?.length || 0);
  // console.log("Shipping Address: --- ", shippingAddress ? 1 : 0);
  // console.log("Address: --- ", address ? 1 : 0);
  // console.log("Project Users: --- ", projectUsers?.length || 0);
  // console.log("Custom Attributes: --- ", customAttributes?.length || 0);
  // console.log("Existing Lightings: --- ", existingLightings?.length || 0);
  // console.log("Door Schedules: --- ", doorSchedules?.length || 0);
  // console.log("Existing Doors: --- ", existingDoors?.length || 0);
  // console.log("Floor Plans: --- ", floorPlans?.length || 0);
  // console.log("Layers: --- ", layers?.length || 0);
  // console.log("Attachments: --- ", attachments?.length || 0);
  // console.log("Pins: --- ", pins?.length || 0);

  /**
   * If a createAllFromServer below fails it WILL NOT continue
   * to the next line.
   */
  await Project.createFromServer(project);
  await ProjectUser.createAllFromServer(projectUsers)
  await RateSchedule.createAllFromServer(rates);
  await OperatingSchedule.createAllFromServer(operatings);
  await DoorOperatingSchedule.createAllFromServer(doorOperatings);
  await Heating.createAllFromServer(heatings);
  await Cooling.createAllFromServer(coolings);

  await Project.refreshSchedules(serverProject.server_id); // matches the project's server schedule_ids to mobile schedule_ids.

  await Location.createAllFromServer(locations)
  await Address.createAllFromServer(address)
  await Area.createAllFromServer(areas);
  await ExistingLighting.createAllFromServer(existingLightings);
  await ExistingFixture.createAllFromServer(fixtures);
  await DoorSchedule.createAllFromServer(doorSchedules);
  await ExistingDoor.createAllFromServer(existingDoors);
  await DefaultSchedule.createAllFromServer(defaultSchedules);
  await CustomAttribute.createAll(customAttributes);
  await FloorPlan.createAllFromServer(floorPlans);
  await Layer.createAllFromServer(layers);
  await Attachment.createAllFromServer(attachments);
  await Pin.createAllFromServer(pins);

  // await DefaultValue.createAllFromServer(defaultValues);
}

function deconstruct(serverProject) {
  let locations = serverProject.sync_locations
  delete serverProject.sync_locations
  let areas = serverProject.sync_areas
  delete serverProject.sync_areas
  let fixtures = serverProject.sync_existing_fixtures
  delete serverProject.sync_existing_fixtures
  let operatings = serverProject.sync_operating_schedules
  delete serverProject.sync_operating_schedules
  let doorOperatings = serverProject.sync_product_operating_schedules
  delete serverProject.sync_product_operating_schedules
  let rates = serverProject.sync_rate_schedules
  delete serverProject.sync_rate_schedules
  let heatings = serverProject.sync_heatings
  delete serverProject.sync_heatings
  let coolings = serverProject.sync_coolings
  delete serverProject.sync_coolings
  let defaultSchedules = serverProject.sync_default_schedules
  delete serverProject.sync_default_schedules
  let address = serverProject.sync_addresses
  delete serverProject.sync_addresses
  let shippingAddress = serverProject.shipping_address
  delete serverProject.shipping_address
  let projectUsers = serverProject.sync_project_users
  delete serverProject.sync_project_users
  let existingLightings = serverProject.sync_existing_lightings
  delete serverProject.sync_existing_lightings
  let doorSchedules = serverProject.sync_product_schedules
  delete serverProject.sync_product_schedules
  let existingDoors = serverProject.sync_existing_products
  delete serverProject.sync_existing_products
  let customAttributes = serverProject.sync_custom_attributes
  delete serverProject.sync_custom_attributes
  let floorPlans = serverProject.sync_floor_plans
  delete serverProject.sync_floor_plans
  let layers = serverProject.sync_layers
  delete serverProject.sync_layers
  let pins = serverProject.sync_pins
  delete serverProject.sync_pins
  let attachments = serverProject.sync_attachments
  delete serverProject.sync_attachments
  // let defaultValues = serverProject.sync_default_values
  // delete serverProject.sync_default_values

  return [
    serverProject,
    locations,
    areas,
    fixtures,
    operatings,
    doorOperatings,
    rates,
    heatings,
    coolings,
    defaultSchedules,
    shippingAddress,
    address,
    projectUsers,
    customAttributes,
    existingLightings,
    doorSchedules,
    existingDoors,
    floorPlans,
    layers,
    pins,
    attachments
    // defaultValues,
  ];
}

export async function buildCompanies(serverCompanies) {
  for(const serverCompany of serverCompanies) {
    await ExistingLighting.createAllFromServer(serverCompany.favorite_existing_lightings);
    delete serverCompany.favorite_existing_lightings;

    await CompanyProjectStatus.createAllFromServer(serverCompany.company_project_statuses);
    delete serverCompany.company_project_statuses;
    
    await CompanyUser.createAllFromServer(serverCompany.company_users);
    delete serverCompany.company_users;
    
    console.log("serverCompany.company_templates Length ...>> ", serverCompany.company_templates.length);
    
    await CompanyTemplate.createAllFromServer(serverCompany.company_templates);
    delete serverCompany.company_templates;
    
    console.log("Company.createFromServer ---- >> ", serverCompany);
    
    await Company.createFromServer(serverCompany);
  }
}

export async function buildCategoryTree(serverData) {
  if(!serverData.hasOwnProperty('existing_category_types') || !serverData.hasOwnProperty('tree_entries')) {
    throw 'Category data is incomplete'
  };

  let serverEntries = serverData.tree_entries;
  await ExistingCategoryTreeEntry.createAllFromServer(serverEntries);

  let types = JSON.stringify(serverData.existing_category_types);
  await AsyncStorage.setItem(EXISTING_CATEGORY_TYPES, types);
}

export async function buildFacilityTypes(serverData) {

  let serverEntries = serverData.facility_types;
  await FacilityType.createAllFromServer(serverEntries);
}

export async function buildEncentivUtilities(serverData) {

  let serverEntries = serverData.encentiv_utilities;
  await EncentivUtility.createAllFromServer(serverEntries);
}

export async function buildExistingLightings(serverLightingData) {
  if(!serverLightingData.hasOwnProperty('existing_lightings')) { throw 'Lighting data is incomplete'}
  let serverLightings = serverLightingData.existing_lightings;
  await ExistingLighting.updateOrCreateOptimized(serverLightings);
}
