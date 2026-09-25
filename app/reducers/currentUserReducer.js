import {
  SET_CURRENT_USER,
  REMOVE_CURRENT_USER,
  SET_USER_PROJECTS,
  SET_PROJECT_DEFAULTS,
  SET_PROJECT_DEFAULT,
  SET_PRODUCT_DEFAULTS,
  SET_PRODUCT_DEFAULT,
  CHECK_FOR_DISABLED_STATUS,
} from "../actions/"

let INITIAL_USER_STATE = {
  currentUser: null,
  loggedIn: false,
  userProjects: [],
  projectDefaults: {},
  productDefaults: {},
  disabled: false,
};

export const currentUserReducer = (state = INITIAL_USER_STATE, action) => {
  switch (action.type) {
    case SET_CURRENT_USER:
      const { currentUser } = action;
      return {
        ...state,
        loggedIn: true,
        currentUser,
      }

    case REMOVE_CURRENT_USER:
      return INITIAL_USER_STATE

    case SET_USER_PROJECTS:
      const { userProjects } = action;
      return {
        ...state,
        userProjects,
      }

    case SET_PROJECT_DEFAULTS:
      const { projectDefaults } = action;
      const projectHash = state.projectDefaults

      for (const key in projectDefaults) {
        const project = projectDefaults[key];

        if (!projectHash[project.mobile_id]) {
          projectHash[project.mobile_id] = {
            areasSortDecending: true,
            areasSortByType: 'code',
            areasSearchText: null,
            subAreaView: true,
          }
        }
      }

      return {
        ...state,
        projectDefaults: projectHash,
      }

    case SET_PROJECT_DEFAULT:
      const { project, field, value } = action
      const stateProjectDefaults = state.projectDefaults
      stateProjectDefaults[project.mobile_id][field] = value

      return {
        ...state,
        projectDefaults: stateProjectDefaults,
      }

    case SET_PRODUCT_DEFAULTS:
      const { productDefaults } = action;
      const productHash = state.productDefaults

      for (const key in productDefaults) {
        const productProject = productDefaults[key];

        if (!productHash[productProject.mobile_id]) {
          productHash[productProject.mobile_id] = {
            productSortDecending: false,
            productSearchText: null,
            selectedEntry: null,
            companyFavoriteClicked: false
          }
        }
      }

      return {
        ...state,
        productDefaults: productHash,
      }

    case SET_PRODUCT_DEFAULT:
      const { productProject, productField, productValue } = action
      const stateProductDefaults = state.productDefaults
      stateProductDefaults[productProject.mobile_id][productField] = productValue

      return {
        ...state,
        productDefaults: stateProductDefaults,
      }

    case CHECK_FOR_DISABLED_STATUS:
      const { disabled } = action;
      return {
        ...state,
        disabled,
      }

    default:
      return state
  }
};
