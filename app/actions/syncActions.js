export const SYNC_STATUS_CHANGE = 'SYNC_STATUS_CHANGE';
export const COMPANIES_SYNC_STATUS_CHANGE = 'COMPANIES_SYNC_STATUS_CHANGE';
export const UPLOAD_PROJECTS_SYNC_STATUS_CHANGE = 'UPLOAD_PROJECTS_SYNC_STATUS_CHANGE';
export const PROJECTS_SYNC_STATUS_CHANGE = 'PROJECTS_SYNC_STATUS_CHANGE';
export const COLLECTION_DATA_STATUS_CHANGE = 'COLLECTION_DATA_STATUS_CHANGE';
export const EXISTING_LIGHTINGS_SYNC_STATUS_CHANGE = 'EXISTING_LIGHTINGS_SYNC_STATUS_CHANGE';
export const ATTACHMENTS_SYNC_STATUS_CHANGE = 'ATTACHMENTS_SYNC_STATUS_CHANGE';
export const REFRESH_SYNC_STATUS = 'REFRESH_SYNC_STATUS';
export const SET_FAILED_UPSYNC_PROJECTS = 'SET_FAILED_UPSYNC_PROJECTS';
export const SET_FAILED_DOWNSYNC_PROJECTS = 'SET_FAILED_DOWNSYNC_PROJECTS';
export const SET_LONG_SYNC = 'SET_LONG_SYNC';
export const SET_LOAD_SCREEN = 'SET_LOAD_SCREEN';
export const SET_PROJECTS_TO_SYNC_COUNT = 'SET_PROJECTS_TO_SYNC_COUNT';
export const SET_SYNCED_PROJECTS = 'SET_SYNCED_PROJECTS';

export function setSyncStatus(syncStatus, errorMsg){
  return (dispatch) => {
    dispatch({ type: SYNC_STATUS_CHANGE, syncStatus, errorMsg });
  };
}

export function setSubSyncStatus(type, subSyncStatus){
  return (dispatch) => {
    dispatch({ type, subSyncStatus });
  };
}

export function refreshSyncStatus(){
  return (dispatch) => {
    dispatch({ type: REFRESH_SYNC_STATUS });
  };
}

export function setFailedUpsyncProjects(projects){
  return (dispatch) => {
    dispatch({ type: SET_FAILED_UPSYNC_PROJECTS, failedUpSyncProjects: projects });
  };
}

export function setFailedDownSyncProjects(projects){
  return (dispatch) => {
    dispatch({ type: SET_FAILED_DOWNSYNC_PROJECTS, failedDownSyncProjects: projects });
  };
}

export function setLongSyncType(){
  return (dispatch) => {
    dispatch({ type: SET_LONG_SYNC, isLongSync: true });
  };
}

export function setLoadScreen(loadScreen){
  return (dispatch) => {
    dispatch({ type: SET_LOAD_SCREEN, loadScreen });
  };
}

export function setProjectsToSyncCount(projectsToSyncCount){
  return (dispatch) => {
    dispatch({ type: SET_PROJECTS_TO_SYNC_COUNT, projectsToSyncCount });
  };
}

export function setSyncedProjects(syncedProjects){
  return (dispatch) => {
    dispatch({ type: SET_SYNCED_PROJECTS, syncedProjects });
  };
}
