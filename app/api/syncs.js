import UUIDGenerator from 'react-native-uuid-generator';
import _ from 'lodash';
// import { AsyncStorage } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Project, Attachment, Area, ExistingFixture, User, CompanyUser, ProjectUser, CustomAttribute, ExistingLighting, FloorPlan, Layer, Pin } from '../database/models';
import {
  getProjects,
  postLogin,
  getUser,
  getUserDeactivatedPermissions,
  putProjects,
  postAttachment,
  putAttachment,
  getExistingCategoryTreeEntries,
  getFacilityTypes,
  getEncentivUtilities,
  getExistingLightings,
  postError,
  putDevice,
  postDiagnostics,
} from './fetches';
import { ERRORS } from '../resources/errors';
import realm from '../database/realm';
import { deviceRegistrationData, deviceUpdateData } from '../lib/deviceHelpers';
import { DEVICE_SERVER_ID } from '../resources/constants';

export async function loginSync(email, password) {
  let apiData = {
    success: false,
    apiAuthToken: null,
    error: {},
  };

  let response = await postLogin(email, password)
  let res = await response.json();
  let error = await loginError(response, res)
  if (error) {
    apiData.error = error;
    return apiData;
  }

  let companies = '['
  for (let j = 0; j < res.companies.length; j++) {
    const companyId = res.companies[j].id;
    companies += `${companyId}`
    if (j != res.companies.length - 1) { companies += ","}
  }
  companies += "]"

  User.create({
    id: parseInt(res.user_id),
    api_auth_token: res.api_auth_token,
    email: email,
    offline_password: password,
    company_ids: companies,
  }, true)

  apiData.success = true;
  apiData.apiAuthToken = res.api_auth_token;
  apiData.currentUserId = parseInt(res.user_id);
  return apiData;
}

async function loginError(response, res) {
  if (response.status != 200) {
    return ERRORS.apiRequestError;
  } else if (res.new_user != 'undefined' && res.new_user) {
    return ERRORS.missingAccount;
  } else if (res.password_empty != 'undefined' && res.password_empty) {
    return ERRORS.noPassword;
  } else if (res.api_auth_token.length == 0) {
    return ERRORS.missingToken;
  } else if (res.companies.length === 0) {
    return ERRORS.missingCompany;
  }

  return null;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getAllProjects(accessToken) {
  let apiData = { success: null, projects: [], error: {} };
  let responseLength = 1;
  let lastId;
  let fetches = 0;

  while (responseLength > 0) {

    try {
    
      let response = await getProjects(accessToken, lastId)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      fetches++ // insurance against runaway loops
      apiData.success = response.status >= 200 && response.status < 300
      if (!apiData.success) { 
        console.log("Process Break");
        break; 
      }

      let res = await response.json();
      let projects = res.projects;
      responseLength = projects.length;

      
      if (responseLength > 0) {
        apiData.projects = apiData.projects.concat(projects);
        console.log("Total Fetched Projects ---> ", apiData.projects.length);
        lastId = projects.pop().id;
      } else {
        console.log("Projects Break called ---> ");
        break;
      }

    } catch (error) {
      console.error("Error fetching projects data:", error);
    }
  }
  
  // apiData.projects = apiData.projects.filter(project => project.enable_sync === true && project.active === true);
  // console.log("After Filter Projects ---> ", apiData.projects.length);

  return apiData;
}


export async function getAllProjectsWithRetry(accessToken, maxRetries = 3) {
  let apiData = { success: null, projects: [], error: {} };
  let responseLength = 1;
  let lastId;
  let fetches = 0;

  while (responseLength > 0) {
    let retryCount = 0;

    while (retryCount < maxRetries) {      
      try {
        console.log(`[${new Date().toISOString()}] Round:  ${fetches}`);
        console.log(`Fetching projects... lastId ${lastId}`);
        console.log(`Fetching projects... Attempt ${retryCount + 1}`);

        let response = await getProjects(accessToken, lastId);

        if (!response.ok) {
          console.log("Response not OK, retrying...");
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        console.log("response.status ->> ", response.status);
        apiData.success = response.status >= 200 && response.status < 300;
        
        if (!apiData.success) {
          console.log("Process Break");
          break;
        }
        
        let res = await response.json();
        let projects = res.projects;
        responseLength = projects.length;
        
        if (responseLength > 0) {
          apiData.projects = apiData.projects.concat(projects);
          console.log("Total Fetched Projects ---> ", apiData.projects.length);
          lastId = projects.pop().id;
          fetches++; // Prevent runaway loops
        } else {
          console.log("Projects Break called ---> ");
          break;
        }

        // If successful, break out of retry loop
        break;

      } catch (error) {
        retryCount++;
        console.error(`Error fetching projects data (Attempt ${retryCount}):`, error);

        if (retryCount >= maxRetries) {
          console.error("Max retries reached. Moving to next request.");
          break;
        }

        // Exponential backoff (wait before retrying)
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, retryCount))); 
      }
    }
  }

  return apiData;
}

export async function uploadPreviousProjects(accessToken, currentUser) {
  if (!accessToken) throw new Error(' accessToken is missing for uploadPreviousProjects');
  if (!currentUser) throw new Error(' currentUser is missing for uploadPreviousProjects');

  await checkForMissingUuids();
  let projectData = await Project.prepareAllForApi(currentUser);

  if (projectData.length > 0) {
    const overallResponse = { projects: [], status: 200 }

    // one at a time to avoid Heroku timeout
    for (const project of projectData) {
      const response = await putProjects(accessToken, [project])
      const parsedResponse = await response.json();
      if (parsedResponse.status > overallResponse.status) { overallResponse.status = parsedResponse.status }
      if (!!parsedResponse.projects && parsedResponse.projects.length > 0) { overallResponse.projects.push(parsedResponse.projects[0]) }
    }

    return overallResponse
  } else {
    return { status: 204 }
  }
}

// See app/database/migrations/migration13.js
async function checkForMissingUuids() {
  let objectTypes = [
    'Project', 'Area', 'ExistingFixture', 'OperatingSchedule', 'RateSchedule',
    'Cooling', 'Heating', 'Attachment', 'ExistingLighting', 'CustomAttribute',
    'CustomAttributeListItem', 'CompanyTemplate'
  ];

  realm.write(async () => {
    for(let i = 0; i < objectTypes.length; i++) {
      let objects = await realm.objects(objectTypes[i]);
      for (let j = 0; j < objects.length; j++) {
        let object = objects[j];
        if(object.uuid === 'needs uuid') {
          const uuid = await UUIDGenerator.getRandomUUID();
          object['uuid'] = uuid;
        }
      }
    }
  })

  return;
}

export async function checkProjectStatuses(response) {
  let upSync = { wasSuccessful: true, failedProjects: [] }

  for(const project of response.projects) {
    let projectSuccessful = project.status === 'ok'
    let locations = project.locations || []
    let locationsSuccessful = await updateRecordsFromResponse(locations, 'Location')

    let areas = project.areas || []
    let areasSuccessful = await updateAreasFromResponse(areas)

    let existingLightings = project.existing_lightings || []
    let existingLightingsSuccessful = await updateRecordsFromResponse(existingLightings, 'ExistingLighting')

    let operatingSchedules = project.operating_schedules || []
    let operatingSchedulesSuccessful = await updateRecordsFromResponse(operatingSchedules, 'OperatingSchedule')
    let rateSchedules = project.rate_schedules || []
    let rateSchedulesSuccessful = await updateRecordsFromResponse(rateSchedules, 'RateSchedule')
    let coolings = project.coolings || []
    let coolingsSuccessful = await updateRecordsFromResponse(coolings, 'Cooling')
    let heatings = project.heatings || []
    let heatingsSuccessful = await updateRecordsFromResponse(heatings, 'Heating')

    let addresses =  project.addresses  || []
    let addressesSuccessful = await updateRecordsFromResponse(addresses, 'Address')

    let custom_attributes = project.custom_attributes || []
    let customAttributesSuccessful = await updateAttributesFromResponse(custom_attributes, 'CustomAttribute')

    let projectUser = project.project_user
    let projectUserSuccessful = true
    if(!!projectUser) {
      let projectUsers = []
      projectUsers.concat(projectUser)
      projectUserSuccessful = await updateRecordsFromResponse(projectUsers, 'ProjectUser')
    }

    if (
      !projectSuccessful || !locationsSuccessful || !areasSuccessful || !heatingsSuccessful ||
      !coolingsSuccessful || !rateSchedulesSuccessful || !operatingSchedulesSuccessful || !addressesSuccessful ||
      !projectUserSuccessful || !existingLightingsSuccessful || !customAttributesSuccessful
    ) {
      upSync.wasSuccessful = false;
      let existingProject = await Project.find(project.mobile_id)
      upSync.failedProjects.push({ server_id: existingProject.server_id, mobile_id: existingProject.mobile_id, name: existingProject.name })
    } else {
      await Project.updateServerId(project)
    }
  }
  return upSync
}

async function updateProjectFromResponse(projectResponse) {
  return projectResponse.status === 'ok'
}

async function updateAreasFromResponse(areasResponses) {
  let areasSuccessful = true

  for(const areaResponse of areasResponses) {
    areaResponse.status !== 'ok' ? areasSuccessful = false : Area.updateServerId(areaResponse)

    let existingFixturesResponses = areaResponse.existing_fixtures || []
    if(existingFixturesResponses.length) {
      let existingFixturesSuccessful = await updateRecordsFromResponse(existingFixturesResponses, 'ExistingFixture');
      if(!existingFixturesSuccessful) { areasSuccessful = false }

      for(const existingFixturesResponse of existingFixturesResponses) {
        let pinResponses = existingFixturesResponse.pins
        if (pinResponses && Object.keys(pinResponses).length > 0) {
          for (const key in pinResponses) {
            const pin = pinResponses[key];
            pin.status !== 'ok' ? areasSuccessful = false : Pin.updateServerId(pin)
          }
        }
      }
    }

    let floorPlanResponses = areaResponse.floor_plans || []
    if(floorPlanResponses.length) {
      let floorPlanSuccessful = await updateRecordsFromResponse(floorPlanResponses, 'FloorPlan');
      if(!floorPlanSuccessful) { areasSuccessful = false }

      for(const floorPlanResponse of floorPlanResponses) {
        let layerResponses = floorPlanResponse.layers
        if (layerResponses && Object.keys(layerResponses).length > 0) {
          for (const key in layerResponses) {
            const layer = layerResponses[key];
            layer.status !== 'ok' ? areasSuccessful = false : Layer.updateServerId(layer)
          }
        }
      }
    }

    let pinsResponses = areaResponse.pins || []
    if(pinsResponses.length) {
      let pinsSuccessful = await updateRecordsFromResponse(pinsResponses, 'Pin');
      if(!pinsSuccessful) { areasSuccessful = false }
    }

  }
  return areasSuccessful;
}

async function updateAttributesFromResponse(attributesResponses) {
  let attributesSuccessful = true

  for(const attributeResponse of attributesResponses) {
    attributeResponse.status !== 'ok' ? attributesSuccessful = false : CustomAttribute.updateServerId(attributeResponse)

    let customAttributeListItemResponses = attributeResponse.custom_attribute_list_items || []
    if(!!customAttributeListItemResponses) {
      let listItemsSuccessful = await updateRecordsFromResponse(customAttributeListItemResponses, 'CustomAttributeListItem');
      if(!listItemsSuccessful) { attributesSuccessful = false }
    }
  }

  return attributesSuccessful;
}

export async function updateRecordsFromResponse(responses, modelType) {
  const successfulResponses = responses.filter(response => response.status === 'ok')
  const failedResponses = responses.filter(response => response.status !== 'ok')

  for(const response of successfulResponses) {
    realm.write(() => {
      realm.create(modelType, { mobile_id: response.mobile_id, server_id: response.server_id, edited: false }, true);
    });
  }

  // This is basis of how to start tracking one by one.
  // let errorMessages = []
  // if (failedResponses.length > 0) {
  //   failedResponses.forEach(failedResponse => {
  //     errorMessages.push({ name: failedResponse.name ? failedResponse.name  : '', error: failedResponse.error })
  //   });
  // }

  // return errorMessages
  // console.warn(failedResponses, 'FAILED RESPONSES')
  return failedResponses.length === 0
}

export async function updateAttachableIds(response) {
  for(const project of response.projects) {
    let areas = project.areas
    areas = areas || [];
    for(let j = 0; j < areas.length; j++) {
      await updateAreaAttachableIds(areas[j]);
    }

    let existingLightings = project.existing_lightings
    existingLightings = existingLightings || [];
    for(let k = 0; k < existingLightings.length; k++) {
      await updateExistingLightingAttachableIds(existingLightings[k]);
    }
  }
}

export async function updateExistingLightingAttachableIds(lighting) {
  let attachments = await Attachment.findAllByAttachable('ExistingLighting', lighting.mobile_id)
  realm.write(() => {
    for(let i = 0; i < attachments.length; i++) {
      let attachment = attachments[i];
      attachment.attachable_id = lighting.server_id;
    }
  })
}

export async function updateAreaAttachableIds(area) {
  let attachments = await Attachment.findAllByAttachable('Area', area.mobile_id)
  attachments = attachments || [];
  realm.write(() => {
    for(let i = 0; i < attachments.length; i++) {
      let attachment = attachments[i];
      attachment.attachable_id = area.server_id;
    }
  })

  let subareas = area.areas
  subareas = subareas || [];
  for(let i = 0; i < subareas.length; i++) {
    await updateAreaAttachableIds(subareas[i]);
  }

  let existingFixtures = area.existing_fixtures
  existingFixtures = existingFixtures || [];
  for(let i = 0; i < existingFixtures.length; i++) {
    await updateFixtureAttachableIds(existingFixtures[i]);
  }

  let floorPlans = area.floor_plans
  floorPlans = floorPlans || [];
  for(let i = 0; i < floorPlans.length; i++) {
    await updateFloorPlanAttachableIds(floorPlans[i]);
  }

}

export async function updateFixtureAttachableIds(fixture) {
  let attachments = await Attachment.findAllByAttachable('ExistingFixture', fixture.mobile_id)
  realm.write(() => {
    for(let k = 0; k < attachments.length; k++) {
      let attachment = attachments[k];
      attachment.attachable_id = fixture.server_id;
    }
  })
}

export async function updateFloorPlanAttachableIds(floorPlan) {
  let attachments = await Attachment.findAllByAttachable('FloorPlan', floorPlan.mobile_id)
  await realm.write(() => {

    for(let k = 0; k < attachments.length; k++) {
      let attachment = attachments[k];
      attachment.attachable_id = floorPlan.server_id;
    }

  })
}

export async function syncNewAttachments(apiAuthToken) {
  let newAttachments = await Attachment.all.filtered('server_id = null AND attachable_id != null')
  let wasSuccessful = true

  for(const attachment of newAttachments) {
    let response = await postAttachment(apiAuthToken, attachment)
    let res = await response.json()
    if (response.status !== 200) {
      postError(apiAuthToken, `A new attachment failed to sync to the API. Error: ${res.error}`);
      wasSuccessful = false
    } else {
      attachment.setProp('server_id', res.server_id)
      attachment.setProp('edited', false)
    }

    let pinsResponses = res.pins || []
    if(pinsResponses.length) {
      let pinsSuccessful = await updateRecordsFromResponse(pinsResponses, 'Pin');
      if(!pinsSuccessful) { wasSuccessful = false }
    }
  }

  return wasSuccessful
}

export async function syncEditedAttachments(apiAuthToken) {
  let editedAttachments = await Attachment.all.filtered('server_id != null AND edited = true');
  let wasSuccessful = true

  for(const attachment of editedAttachments) {
    let response = await putAttachment(apiAuthToken, attachment)
    let res = await response.json()
    if (response.status !== 200) {
      postError(apiAuthToken, `An edited attachment failed to sync to the API. Error: ${res.error}`);
      wasSuccessful = false
    } else {
      attachment.setProp('edited', false)
    }

    let pinsResponses = res.pins || []
    if(pinsResponses.length) {
      let pinsSuccessful = await updateRecordsFromResponse(pinsResponses, 'Pin');
      if(!pinsSuccessful) { wasSuccessful = false }
    }
  }

  return wasSuccessful
}

export async function getCompanyData(api_auth_token) {
  let userData = await getUser(api_auth_token);
  userData = await userData.json();
  
  let companies = '['
  for (let j = 0; j < userData.companies.length; j++) {
    const companyId = userData.companies[j].id;
    companies += `${companyId}`
    if (j != userData.companies.length - 1) { companies += ","}
  }
  companies += "]"

  User.create({
    id: parseInt(userData.id),
    api_auth_token: api_auth_token,
    email: userData.email,
    company_ids: companies,
  }, true)

  return userData.companies;
}

export async function getExistingCategoryTreeData(accessToken, lastSyncAt) {
  let response = await getExistingCategoryTreeEntries(accessToken, lastSyncAt);

  if (response.status !== 200) {
    throw `Could not retrieve necessary data`
  } else {
    collectionData = await response.json();
    return collectionData;
  }
}

export async function getFacilityTypesData(accessToken, lastSyncAt) {
  let lastSync = realm.objects('FacilityType').length ? lastSyncAt : null;
  let response = await getFacilityTypes(accessToken, lastSync);

  if (response.status !== 200) {
    throw `Could not retrieve necessary data`
  } else {
    collectionData = await response.json();
    return collectionData;
  }
}

export async function getEncentivUtilitiesData(accessToken, lastSyncAt) {
  let lastSync = realm.objects('EncentivUtility').length ? lastSyncAt : null;
  let response = await getEncentivUtilities(accessToken, lastSync);

  if (response.status !== 200) {
    throw `Could not retrieve necessary data`
  } else {
    collectionData = await response.json();
    return collectionData;
  }
}

export async function getExistingLightingData(accessToken, lastSyncAt) {
  let response = await getExistingLightings(accessToken, lastSyncAt);

  if (response.status !== 200) {
    throw `Could not retrieve necessary data`
  } else {
    existingLightingData = await response.json();
    return existingLightingData;
  }
}

export async function sendDeviceInfo(accessToken) {
  try {
    const serverId = await AsyncStorage.getItem(DEVICE_SERVER_ID);
    serverId ? updateDevice(accessToken, serverId) : registerDevice(accessToken)
  } catch(e) {
    const errorDiagnostic = 'There was a problem sending the device info: ' + e;
    postError(accessToken, errorDiagnostic);
  }
}

async function registerDevice(accessToken) {
  const device = await deviceRegistrationData();
  const rawResponse = await putDevice(accessToken, device);
  const response = await rawResponse.json()
  if(response.id) { await AsyncStorage.setItem(DEVICE_SERVER_ID, String(response.id)) };
}

async function updateDevice(accessToken, serverId) {
  const device = await deviceUpdateData(serverId);
  putDevice(accessToken, device);
}

export async function syncDeactivatedPermissions(accessToken) {
  const rawResponse = await getUserDeactivatedPermissions(accessToken)
  if (rawResponse.status === 200) {
    const response = await rawResponse.json()
    const company_user_ids = response.inactive_company_user_ids
    if (!!company_user_ids) CompanyUser.deactivate_ids(company_user_ids)
    const project_user_ids = response.inactive_project_user_ids
    if (!!project_user_ids) ProjectUser.deactivate_server_ids(project_user_ids)
  }
}

export async function sendDiagnostics(accessToken) {
  const users = await User.allArray
  const company_users = await CompanyUser.allArray
  const project_users = await ProjectUser.allArray
  const data = { users, company_users, project_users }

  const response = await postDiagnostics(accessToken, data);
  return response.status === 200
}
