import {
  SYNC_STATUS_CHANGE,
  COMPANIES_SYNC_STATUS_CHANGE,
  COLLECTION_DATA_STATUS_CHANGE,
  EXISTING_LIGHTINGS_SYNC_STATUS_CHANGE,
  UPLOAD_PROJECTS_SYNC_STATUS_CHANGE,
  PROJECTS_SYNC_STATUS_CHANGE,
  ATTACHMENTS_SYNC_STATUS_CHANGE,
  REFRESH_SYNC_STATUS,
  SET_FAILED_UPSYNC_PROJECTS,
  SET_FAILED_DOWNSYNC_PROJECTS,
  SET_LONG_SYNC,
  SET_LOAD_SCREEN,
  SET_PROJECTS_TO_SYNC_COUNT,
  SET_SYNCED_PROJECTS,
} from "../actions/"

let INITIAL_SYNC_STATE = {
  syncStatus: 'idle',
  errorMsg: null,
  companiesSyncStatus: 'idle',
  categoryTreeSyncStatus: 'idle',
  categoriesSyncStatus: 'idle',
  existingLightingsSyncStatus: 'idle',
  attachmentsSyncStatus: 'idle',
  uploadProjectsSyncStatus: 'idle',
  projectsSyncStatus: 'idle',
  failedUpSyncProjects: [],
  failedDownSyncProjects: [],
  isLongSync: false,
  loadScreen: false,
  projectsToSyncCount: null,
  syncedProjects: 0,
};

export const syncReducer = (state = INITIAL_SYNC_STATE, action) => {
  let { subSyncStatus, failedUpSyncProjects, failedDownSyncProjects, isLongSync, loadScreen, syncedProjects, projectsToSyncCount } = action;

  switch (action.type) {
    case SYNC_STATUS_CHANGE:
      const { syncStatus, errorMsg } = action;
      return {
        ...state,
        syncStatus,
        errorMsg
      }

    case COMPANIES_SYNC_STATUS_CHANGE:
      return {
        ...state,
        companiesSyncStatus: subSyncStatus
      }

    case COLLECTION_DATA_STATUS_CHANGE:
      return {
       ...state,
       categoryTreeSyncStatus: subSyncStatus
      }

    case EXISTING_LIGHTINGS_SYNC_STATUS_CHANGE:
      return {
       ...state,
       existingLightingsSyncStatus: subSyncStatus
      }

    case UPLOAD_PROJECTS_SYNC_STATUS_CHANGE:
      return {
       ...state,
       uploadProjectsSyncStatus: subSyncStatus
      }

    case PROJECTS_SYNC_STATUS_CHANGE:
      return {
       ...state,
       projectsSyncStatus: subSyncStatus
      }

    case ATTACHMENTS_SYNC_STATUS_CHANGE:
      return {
       ...state,
       attachmentsSyncStatus: subSyncStatus
      }

    case SET_FAILED_UPSYNC_PROJECTS:
      return {
        ...state,
        failedUpSyncProjects
      }

    case SET_FAILED_DOWNSYNC_PROJECTS:
      return {
        ...state,
        failedDownSyncProjects
      }

    case SET_LONG_SYNC:
      return {
        ...state,
        isLongSync
      }

    case SET_LOAD_SCREEN:
      return {
        ...state,
        loadScreen
      }

    case SET_PROJECTS_TO_SYNC_COUNT:
      return {
        ...state,
        projectsToSyncCount
      }

    case SET_SYNCED_PROJECTS:
      return {
        ...state,
        syncedProjects
      }

    case REFRESH_SYNC_STATUS:
      return INITIAL_SYNC_STATE

    default:
      return state
  }
};
