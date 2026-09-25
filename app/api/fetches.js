import { BUILD_VERSION, ENVIRONMENT_URL } from "../resources/constants";
import { version } from '../../package.json';
import { combineDeviceData, addDeviceParam } from '../lib/deviceHelpers';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// ============================================================================
// GET
// ============================================================================
export async function getCheckVersion() {
  let url = ENVIRONMENT_URL + '/api/v3/login/check_version';
  if (version) { url += `?version=${version}` };

  console.log("Check Version url ::: ", url);  
  return fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
}

export async function getProjects(accessToken, lastId) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/projects';
  url += '?'
  if (lastId) { url += `last_id=${lastId}&` };
  url = await addDeviceParam(url);

  return await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Authorization': accessToken },
  })
}

export async function getUser(accessToken) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/user';

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Authorization': accessToken },
    signal: controller.signal,
  });
  clearTimeout(timeout);
  return response;
}

export function getUserDeactivatedPermissions(accessToken) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/user/deactivated_permissions';

  return fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Authorization': accessToken },
  });
}

export async function getExistingCategoryTreeEntries(accessToken, lastSyncAt) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/existing_category_tree_entries';
  if (lastSyncAt) { url += `?last_sync_at=${lastSyncAt}` };

  return fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
  });
}

export async function getFacilityTypes(accessToken, lastSyncAt) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/facility_types';
  if (lastSyncAt) { url += `?last_sync_at=${lastSyncAt}` };

  return fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
  });
}

export async function getEncentivUtilities(accessToken, lastSyncAt) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/encentiv_utilities';
  if (lastSyncAt) { url += `?last_sync_at=${lastSyncAt}` };

  return fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
  });
}

export async function getExistingLightings(accessToken, lastSyncAt) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/existing_lightings';
  if (lastSyncAt) { url += `?last_sync_at=${lastSyncAt}` };

  return fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
  });
}

// ============================================================================
// POST
// ============================================================================
export function postLogin(email, password) {
  const envUrl = resolveLoginEnv(email)
  let url = envUrl + '/api/v4/login';
  if (version) { url += `?version=${version}` };

  return fetch(url, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password }),
  });
}

export async function postError(accessToken, error) {
  const RNFS = require('react-native-fs');
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/user/error_log';

  const deviceId = await DeviceInfo.getModel();
  const storage = await RNFS.getFSInfo();
  const freeSpace = storage.freeSpace
  const gbConversion = Math.round(freeSpace / 1e9) + 'GB'

  return fetch(url, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
    body: JSON.stringify({ error_log: error, app_version: BUILD_VERSION, ios_version: Platform.Version, iPad_model: deviceId, free_space: gbConversion }),
  });
}

export async function postDiagnostics(accessToken, data) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/diagnostics?';
  url = await addDeviceParam(url);

  return fetch(url, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
    body: JSON.stringify(data),
  });
}

export async function postAttachment(accessToken, attachment) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/attachments';
  attachment = await attachment.prepareForApi();
  let data = await combineDeviceData({ attachment: attachment });

  return fetch(url, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
    body: JSON.stringify(data),
  });
}

// ============================================================================
// PUT
// ============================================================================
export async function putAttachment(accessToken, attachment) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/attachments';
  attachment = await attachment.prepareForApi();
  let data = await combineDeviceData({ attachment: attachment });

  return fetch(url, {
    method: 'PUT',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
    body: JSON.stringify(data),
  });
}

export async function putProjects(accessToken, projects) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/projects';
  projects = await JSON.stringify(projects);
  let data = await combineDeviceData({ projects: projects, version: version });

  return fetch(url, {
    method: 'PUT',
    headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken},
    body: JSON.stringify(data),
  });
}

export async function putDevice(accessToken, device) {
  const envUrl = resolveEnv(accessToken)
  let url = envUrl + '/api/v4/devices/create_or_update';
  device = await JSON.stringify(device);

  return fetch(url, {
    method: 'PUT',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': accessToken },
    body: JSON.stringify({ device: device }),
  });
}

// ============================================================================
// Helpers
// ============================================================================

// Apple requires that the reviewer can login/sync, but sometimes we can't update the live API before Apple's approval:
const APPLE_TOKEN = null // Never commit real tokens; inject the App Review token at build time if needed
const APPLE_ENV = "https://app.retrolux.com"
const resolveLoginEnv = email => email === "apple@retrolux.com" ? APPLE_ENV : ENVIRONMENT_URL
const resolveEnv = accessToken => accessToken === APPLE_TOKEN ? APPLE_ENV : ENVIRONMENT_URL
