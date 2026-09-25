import Model from '../model';
import realm from '../realm';
import { userSchema } from '../schema'
import { CustomAttribute, ExistingLighting } from '../models'

export class User extends Model {
  static async refreshCurrentUser(apiAuthToken, email, password) {
    await this.deleteAll();
    email = email.trim();
    email = email.toLowerCase();
    let newUser = { api_auth_token: apiAuthToken, email: email, offline_password: password };
    this.create(newUser);
  }

  static async findByToken(token) {
    return realm.objects('User').filtered('api_auth_token = $0', token)[0]
  }

  static async findByEmail(email) {
    return realm.objects('User').filtered('email = $0', email)[0]
  }

  static findById(id) {
    return realm.objects('User').filtered('id = $0', id)[0]
  }

  async projects() {
    const projectUserProjectIds = await this.activeProjectUserProjectIds()
    const projects = await this.accessibleProjects(projectUserProjectIds)
    return projects
  }

  // including where ProjectUsers are false
  async allProjects() {
    const projectUserProjectIds = await this.allProjectUserProjectIds()
    const projects = await this.accessibleProjects(projectUserProjectIds)
    return projects
  }

  async accessibleProjects(projectUserProjectIds) {
    const allCompanyUserProjectIds = await this.allCompanyUserProjectIds()
    const viableProjectUserProjectIds = projectUserProjectIds.filter(el => allCompanyUserProjectIds.includes(el));
    const generalAccessCompanyIds = await this.companyUserProjectIds()
    const adminOrManagerProjectIds = await this.adminOrManagerProjectIds()
    const uniqueIds = [...new Set(generalAccessCompanyIds.concat(viableProjectUserProjectIds, adminOrManagerProjectIds))]

    const userFilter = uniqueIds.map(id => `mobile_id = ${id}`).join(' OR ')
    if (!userFilter) return []
    const projects = await realm.objects('Project').filtered('enable_sync = true AND active = true').filtered(userFilter).sorted('name')
    return projects
  }

  async activeProjectUserProjectIds() {
    const projectUsers = await realm.objects('ProjectUser').filtered('user_id = $0', this.id).filtered('active = true').map(projectUser => Object.assign({}, projectUser))
    const projectIds = projectUsers.map(projectUser => projectUser.mobile_project_id)
    const projectFilter = projectIds.map((mobile_project_id) => 'mobile_id = ' + mobile_project_id).join(' OR ')

    if(!!projectFilter) {
      const projectIds = await realm.objects('Project').filtered('enable_sync = true AND active = true').filtered(projectFilter).map(project => project.mobile_id)
      return projectIds
    } else {
      return []
    }
  }

  async allProjectUserProjectIds() {
    const projectUsers = await realm.objects('ProjectUser').filtered('user_id = $0', this.id).map(projectUser => Object.assign({}, projectUser))
    const projectIds = projectUsers.map(projectUser => projectUser.mobile_project_id)
    const projectFilter = projectIds.map((mobile_project_id) => 'mobile_id = ' + mobile_project_id).join(' OR ')

    if(!!projectFilter) {
      const projectIds = await realm.objects('Project').filtered('enable_sync = true AND active = true').filtered(projectFilter).map(project => project.mobile_id)
      return projectIds
    } else {
      return []
    }
  }

  async allCompanyUserProjectIds() {
    const companyFilter = await this.accessibleCompanyIdsFilter()
    if(!!companyFilter) {
      const projectIds = await realm.objects('Project').filtered('enable_sync = true AND active = true').filtered(companyFilter).map(project => project.mobile_id)
      return projectIds
    } else {
      return []
    }
  }

  async companyUserProjectIds() {
    const companyFilter = await this.accessibleCompanyIdsFilter()
    if(!!companyFilter) {
      const projectIds = await realm.objects('Project').filtered('enable_sync = true AND active = true AND all_company_access = true').filtered(companyFilter).map(project => project.mobile_id)
      return projectIds
    } else {
      return []
    }
  }

  async accessibleCompanyIdsFilter() {
    const companyUsers = await this.activeCompanyUsers()
    const companyIds = companyUsers.map(companyUser => companyUser.company_id)
    return companyIds.map((company_id) => 'company_id = ' + company_id).join(' OR ')
  }

  async adminOrManagerProjectIds() {
    const companyFilter = await this.adminOrManagerCompanyIdsFilter()
    if(!!companyFilter) {
      const projectIds = await realm.objects('Project').filtered('enable_sync = true AND active = true').filtered(companyFilter).map(project => project.mobile_id)
      return projectIds
    } else {
      return []
    }
  }

  async adminOrManagerCompanyIdsFilter() {
    const companyUsers = await realm.objects('CompanyUser').filtered('user_id = $0', this.id).filtered('active = true').filtered('role = "admin" OR role = "project_manager" OR role = "company_manager"').map(companyUser => Object.assign({}, companyUser))
    const companyIds = companyUsers.map(companyUser => companyUser.company_id)
    return companyIds.map((company_id) => 'company_id = ' + company_id).join(' OR ')
  }

  get companies() {
    const companies = []
    let companyIds = JSON.parse(this.company_ids)
    for (let j = 0; j < companyIds.length; j++) {
      let id = companyIds[j];
      let co = realm.objects('Company').filtered('server_id = $0 AND active = true', id)[0]
      if (!!co) {
        companies.push(co)
      }
    }
    return companies
  }

  activeCompanyUsers() {
    return realm.objects('CompanyUser').filtered('user_id = $0', this.id).filtered('active = true').map(companyUser => Object.assign({}, companyUser))
  }

  async checkForCustomAttributes() {
    let customAttributes = await CustomAttribute.all;
    return (!customAttributes || customAttributes.length < 1);
  }

  async checkExistingLightingCode() {
    let allProjectExistingLightings = await realm.objects('ExistingLighting').filtered('active = true AND mobile_project_id != $0', null)
    let codePresent = await allProjectExistingLightings.filtered('code != $0', null).filtered('code != $0', '')

    if (allProjectExistingLightings.length > 0) {
      // There are project ExistingLightings and at least one has a code value. Meaning they have synced.
      return codePresent.length < 1
    } else {
      return false
    }

  }
}

User.schema = userSchema;
