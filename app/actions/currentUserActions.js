export const SET_CURRENT_USER = 'SET_CURRENT_USER';
export const REMOVE_CURRENT_USER = 'REMOVE_CURRENT_USER';
export const SET_USER_PROJECTS = 'SET_USER_PROJECTS';
export const SET_PROJECT_DEFAULTS = 'SET_PROJECT_DEFAULTS';
export const SET_PROJECT_DEFAULT = 'SET_PROJECT_DEFAULT';
export const SET_PRODUCT_DEFAULTS = 'SET_PRODUCT_DEFAULTS';
export const SET_PRODUCT_DEFAULT = 'SET_PRODUCT_DEFAULT'
export const CHECK_FOR_DISABLED_STATUS = 'CHECK_FOR_DISABLED_STATUS';

export function setCurrentUser(user){
  return (dispatch) => {
    dispatch({ type: SET_CURRENT_USER, currentUser: user })
  };
}

export function removeCurrentUser(){
  return (dispatch) => {
    dispatch({ type: REMOVE_CURRENT_USER })
  };
}

export function setUserProjects(userProjects){
  return (dispatch) => {
    dispatch({ type: SET_USER_PROJECTS, userProjects })
  };
}

export function setProjectDefaults(projectDefaults){
  return (dispatch) => {
    dispatch({ type: SET_PROJECT_DEFAULTS, projectDefaults })
  };
}

export function setProjectDefault(project, field, value){
  return (dispatch) => {
    dispatch({ type: SET_PROJECT_DEFAULT, project, field, value })
  };
}

export function setProductDefaults(productDefaults){
  return (dispatch) => {
    dispatch({ type: SET_PRODUCT_DEFAULTS, productDefaults })
  };
}

export function setProductDefault(productProject, productField, productValue){
  return (dispatch) => {
    dispatch({ type: SET_PRODUCT_DEFAULT, productProject, productField, productValue })
  };
}

export function checkForDisabledStatus(disabled){
  return (dispatch) => {
    dispatch({ type: CHECK_FOR_DISABLED_STATUS, disabled })
  };
}
