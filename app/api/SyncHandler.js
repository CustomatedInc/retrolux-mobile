import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import KeepAwake from 'react-native-keep-awake';
import store from '../store.js';

import { ACCESS_TOKEN, LAST_SUCCESSFUL_SYNC_AT } from '../resources/constants';
import { ERRORS } from '../resources/errors';
import { Attachment, Project } from '../database/models';
import { version } from '../../package.json';
import {
  getCheckVersion,
  getAllProjects,
  getAllProjectsWithRetry,
  getCompanyData,
  buildProjects,
  uploadPreviousProjects,
  postError,
  updateAttachableIds,
  syncNewAttachments,
  syncEditedAttachments,
  buildCompanies,
  checkProjectStatuses,
  getExistingCategoryTreeData,
  getFacilityTypesData,
  getEncentivUtilitiesData,
  getExistingLightingData,
  buildCategoryTree,
  buildFacilityTypes,
  buildEncentivUtilities,
  buildExistingLightings,
  sendDeviceInfo,
  syncDeactivatedPermissions,
} from '../api';
import {
  COMPANIES_SYNC_STATUS_CHANGE,
  COLLECTION_DATA_STATUS_CHANGE,
  EXISTING_LIGHTINGS_SYNC_STATUS_CHANGE,
  ATTACHMENTS_SYNC_STATUS_CHANGE,
  UPLOAD_PROJECTS_SYNC_STATUS_CHANGE,
  PROJECTS_SYNC_STATUS_CHANGE,
  setLongSyncType,
  setUserProjects,
  setProjectDefaults,
  setProductDefaults,
  checkForDisabledStatus,
  setSyncStatus,
  setSubSyncStatus,
  setFailedUpsyncProjects,
  setFailedDownSyncProjects,
} from '../actions/';

export default class SyncHandler {
  constructor() {
    this.currentUser = null;
    this.lastSyncAt = null;
    this.apiAuthToken = null;
    this.failedUpsyncProjects = [];
    this.failedDownSyncProjects = [];
    this.hasProjectWarning = false;
    this.hasAttachmentsWarning = false;
  }

  async start() {
    this.lastSyncAt = await AsyncStorage.getItem(LAST_SUCCESSFUL_SYNC_AT);
    this.apiAuthToken = await AsyncStorage.getItem(ACCESS_TOKEN);
    this.currentUser = await store.getState().currentUserReducer.currentUser;

    if(this.apiAuthToken) {
      store.dispatch(setSyncStatus('syncing'));
      KeepAwake.activate();
      this.checkVersionNumber();
    }
  }

  async checkVersionNumber() {
    const response = await getCheckVersion();
    const res = await response.json();
    if (res.status !== 200) {
      store.dispatch(setSyncStatus('error', 'Update Required. There is a newer version of Retrolux available. Please update the app and then try your sync again'));
      KeepAwake.deactivate();
      return;
    }

    // const newest_version = "2.2.0"
    if (version != res.newest_version && version < res.newest_version) {
      Alert.alert('New Retrolux App Available', `Retrolux version ${res.newest_version} is out now! You are currently using version ${version}. Please update through the app store as soon as your sync has finished.`)
      // Alert.alert('New Retrolux App Available', `Retrolux version ${res.newest_version} is out now! You are currently using version ${version}.Please update through the app store as soon as your sync has finished.\n\nOnce your data is synced, head to the app store and download the newest version for all the new features and goodies.`)
    }

    this.syncCompanyData();
  }

  async syncCompanyData() {
    try {
      store.dispatch(setSubSyncStatus(COMPANIES_SYNC_STATUS_CHANGE, 'syncing'));
      const companyData = await getCompanyData(this.apiAuthToken);
      await buildCompanies(companyData);
      store.dispatch(setSubSyncStatus(COMPANIES_SYNC_STATUS_CHANGE, 'complete'));
    } catch (e) {
      store.dispatch(setSubSyncStatus(COMPANIES_SYNC_STATUS_CHANGE, 'error'));
      this.handleError(e, 'We had trouble syncing important company data');
      return;
    }

    this.syncCategoryTreeData();
  }

  async syncCategoryTreeData() {
    try {
      store.dispatch(setSubSyncStatus(COLLECTION_DATA_STATUS_CHANGE, 'syncing'));
      const categoryTreeData = await getExistingCategoryTreeData(this.apiAuthToken, this.lastSyncAt);
      await buildCategoryTree(categoryTreeData);
    } catch (e) {
      store.dispatch(setSubSyncStatus(COLLECTION_DATA_STATUS_CHANGE, 'error'));
      this.handleError(e, 'We had trouble syncing important category data');
      return;
    }

    this.syncFacilityTypeData();
  }

  async syncFacilityTypeData() {
    try {
      const facilityTypeData = await getFacilityTypesData(this.apiAuthToken, this.lastSyncAt);
      await buildFacilityTypes(facilityTypeData)
    } catch (e) {
      store.dispatch(setSubSyncStatus(COLLECTION_DATA_STATUS_CHANGE, 'error'));
      this.handleError(e, 'We had trouble syncing facility types');
      return;
    }

    this.syncEncentivUtilityData();
  }

  async syncEncentivUtilityData() {
    try {
      const encentivUtilityData = await getEncentivUtilitiesData(this.apiAuthToken, this.lastSyncAt);
      await buildEncentivUtilities(encentivUtilityData)
      store.dispatch(setSubSyncStatus(COLLECTION_DATA_STATUS_CHANGE, 'complete'));
    } catch (e) {
      store.dispatch(setSubSyncStatus(COLLECTION_DATA_STATUS_CHANGE, 'error'));
      this.handleError(e, 'We had trouble syncing encentiv utilities');
      return;
    }

    this.syncExistingLightingData();
  }

  // this is only for retrolux favorites (i.e. existing lightings that don't belong to a project)
  async syncExistingLightingData() {
    try {
      store.dispatch(setSubSyncStatus(EXISTING_LIGHTINGS_SYNC_STATUS_CHANGE, 'syncing'));
      const existingLightingData = await getExistingLightingData(this.apiAuthToken, this.lastSyncAt);
      if (existingLightingData['existing_lightings'].length > 0) {
        await buildExistingLightings(existingLightingData);
      }
      store.dispatch(setSubSyncStatus(EXISTING_LIGHTINGS_SYNC_STATUS_CHANGE, 'complete'));
    } catch (e) {
      store.dispatch(setSubSyncStatus(EXISTING_LIGHTINGS_SYNC_STATUS_CHANGE, 'error'));
      this.handleError(e, 'We had trouble syncing important lighting data');
      return;
    }

    this.pushProjects();
  }

  async pushProjects() {
    store.dispatch(setSubSyncStatus(UPLOAD_PROJECTS_SYNC_STATUS_CHANGE, 'syncing'));
    try {
      const data = await uploadPreviousProjects(this.apiAuthToken, this.currentUser);

      if (data.status !== 200 && data.status !== 204) {
        this.handleError('Non-200 API status received', ERRORS.upSyncFail.message);
        return;
      } else if (data.status === 200) {
        const upSync = await checkProjectStatuses(data);
        this.failedUpsyncProjects = upSync.failedProjects;
        this.warnUserAboutFailedUpsyncProjects();
        await updateAttachableIds(data);
      }
    } catch (e) {
      store.dispatch(setSubSyncStatus(UPLOAD_PROJECTS_SYNC_STATUS_CHANGE, 'error'));
      this.handleError(e, ERRORS.upSyncFail.message);
      return;
    }
    store.dispatch(setSubSyncStatus(UPLOAD_PROJECTS_SYNC_STATUS_CHANGE, 'complete'));
    this.updateAttachments()
  }

  async updateAttachments() {
    try {
      store.dispatch(setSubSyncStatus(ATTACHMENTS_SYNC_STATUS_CHANGE, 'syncing'));
      await Attachment.uploadToAwsInBatch();

      let wasSuccessful = false
      wasSuccessful = await syncNewAttachments(this.apiAuthToken);
      wasSuccessful = await syncEditedAttachments(this.apiAuthToken);

      if(wasSuccessful) {
        store.dispatch(setSubSyncStatus(ATTACHMENTS_SYNC_STATUS_CHANGE, 'complete'));
      } else {
        store.dispatch(setSubSyncStatus(ATTACHMENTS_SYNC_STATUS_CHANGE, 'warning'));
        this.hasAttachmentsWarning = true
      }
    } catch (e) {
      store.dispatch(setSubSyncStatus(ATTACHMENTS_SYNC_STATUS_CHANGE, 'error'));
      this.handleError(e, ERRORS.upSyncFail.message);
      return;
    }

    this.getProjectData();
  }

  async getProjectData() {
    store.dispatch(setSubSyncStatus(PROJECTS_SYNC_STATUS_CHANGE, 'syncing'));
    const projectData = await getAllProjectsWithRetry(this.apiAuthToken);

    for(const serverProject of projectData.projects) {
      const attachments = serverProject.sync_attachments
      console.log("Project wise Attachments: --- ", attachments?.length || 0);
    }

    const buildData = await buildProjects(this.apiAuthToken, projectData.projects, this.failedUpsyncProjects);

    if (buildData.errors.length > 0) await this.warnUserAboutFailedDownsyncProjects(buildData.errors);

    if(this.hasProjectWarning) {
      store.dispatch(setSubSyncStatus(PROJECTS_SYNC_STATUS_CHANGE, 'warning'));
    } else {
      store.dispatch(setSubSyncStatus(PROJECTS_SYNC_STATUS_CHANGE, 'complete'));
    }

    this.getDeactivatedPermissions()
  }

  async getDeactivatedPermissions() {
    await syncDeactivatedPermissions(this.apiAuthToken);
    this.finish();
  }

  async finish() {
    await sendDeviceInfo(this.apiAuthToken);

    const now = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SUCCESSFUL_SYNC_AT, now);

    KeepAwake.deactivate();
    if(this.hasProjectWarning || this.hasAttachmentsWarning) {
      store.dispatch(setSyncStatus('warning'));
    } else {
      store.dispatch(setSyncStatus('complete'));
    }

    const userProjects = await this.currentUser.projects();
    store.dispatch(setUserProjects(userProjects));
    store.dispatch(setProjectDefaults(userProjects));
    store.dispatch(setProductDefaults(userProjects));

    const disabled = await this.currentUser.checkForCustomAttributes();
    store.dispatch(checkForDisabledStatus(disabled));

    const disabledNoCodes = await this.currentUser.checkExistingLightingCode();
    store.dispatch(checkForDisabledStatus(disabledNoCodes));
  }

  async handleError(error, errorMessage) {
    await postError(this.apiAuthToken, `${errorMessage}. Error: ${error}`);
    store.dispatch(setSyncStatus('error', errorMessage));
    KeepAwake.deactivate();
  }

  async warnUserAboutFailedUpsyncProjects() {
    if(this.failedUpsyncProjects.length > 0) {
      this.hasProjectWarning = true;
      postError(this.apiAuthToken, 'Several mobile projects failed to process in the API');
      // store.dispatch(setFailedUpsyncProjects(this.failedUpsyncProjects))
      store.dispatch(setFailedUpsyncProjects(this.failedUpsyncProjects.map(x => x.name)))
    }
  }

  async warnUserAboutFailedDownsyncProjects(buildErrors) {
    this.hasProjectWarning = true;
    const failedProjects = buildErrors.map(error => error.project_name)
    this.failedDownSyncProjects = failedProjects
    store.dispatch(setFailedDownSyncProjects(failedProjects))
  }
}
