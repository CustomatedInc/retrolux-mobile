import { ProductSchedule } from './ProductSchedule';
import { Project } from './Project';
import realm from '../realm';
import { existingLightingSchema } from '../schema'
import UUIDGenerator from 'react-native-uuid-generator';

export class ExistingLighting extends ProductSchedule {

  // used for cataloged ExistingLightings
  static async updateOrCreateOptimized(serverRecords) {
    let preppedRecords = [];
    for (let index = 0; index < serverRecords.length; index++) {
      let result = await this.prepareForRealm(serverRecords[index]);
      const found = await this.findServer(result.server_id)
      if (!!found) {
        preppedRecords.push(result);
      } else {
        result.mobile_id = result.mobile_id + index  // or else prepareForRealm sets all new records to the same number
        preppedRecords.push(result);
      }
    }

    this.create(preppedRecords, true)
  }

  static async prepareForRealm(lighting) {
    lighting.server_id = lighting.id;
    delete lighting.id;
    lighting.mobile_id = await this.findOrNextMobileId(lighting.server_id);
    lighting.edited = false;
    lighting.created_at = lighting.created_at ? new Date(lighting.created_at) : null
    lighting.updated_at = lighting.updated_at ? new Date(lighting.updated_at) : null
    lighting.inactive_at = lighting.inactive_at ? new Date(lighting.inactive_at) : null

    // This below chunk can probably be removed because it was a way of catching a non-updated
    // app from messing up the data collection. Look into it @todo. But no harm in it being present.
    for (let migratedField of ['thermal_efficiency', 'watts_per_lamp', 'lamps_per_fixture']) {
      if (!!lighting[`old_${migratedField}`]) {
        lighting[migratedField] = lighting[`old_${migratedField}`]
        delete lighting[`old_${migratedField}`]
      }
    }

    if(!!lighting.project_id) {
      let project = await Project.findServer(lighting.project_id)
      lighting.mobile_project_id = project.mobile_id
    }

    lighting.custom_attributes = JSON.stringify(lighting.custom_attributes)
    return lighting;
  }

  static async prepareFormData(data, project, action) {
    data.favorite_company_id = null // no favorites on mobile
    data.lm70 = (data.lm70 || data.lm70 == 0) ? data.lm70 : null
    data.watts_per_product = (data.watts_per_product || data.watts_per_product == 0) ?  data.watts_per_product : null

    if (action === 'new' || action === 'copy') { //created on mobile
      data.active = true
      data.edited = false
      data.mobile_id = await this.nextId();
      data.project_id = project.server_id ? parseInt(project.server_id) : null
      data.mobile_project_id = project.mobile_id
      data.server_id = null
      data.display_order = await this.nextDisplayOrder(project);
      data.uuid = await UUIDGenerator.getRandomUUID();
    } else if (action === 'edit') { // editing original from web
      data.edited = true
    }

    return data
  }

  static async validate(object, project, action) {
    let errors = {}
    const integerRegex = /^\d+$/

    if (!!object.lm70 || object.lm70 == 0){
      if (object.lm70 < 0 || !integerRegex.test(object.lm70)) {
        errors.lm70 = "Must be a whole number 0 or greater";
      }
    } else {
      errors.lm70 = 'Must be present';
    }

    if (!!object.watts_per_product || object.watts_per_product == 0){
      if (object.watts_per_product < 0) {
        errors.watts_per_product = "Must be a number 0 or greater";
      }
    } else {
      errors.watts_per_product = 'Must be present';
    }

    if (!object.existing_product_type){
      errors.existing_product_type = 'Must be present'
    }

    if (!!object.code) {
      if (object.code.length > 5) {
        errors.codeError = 'Must be less than 5 characters'
      } else {
        const codeUnique = await this.codeUnique(object, project.mobile_id, action)
        if (!codeUnique) {
          errors.codeError = 'Must be unique'
        }
      }
    } else {
      errors.codeError = 'Must be present'
    }

    if (!!object.name) {
      const nameUnique = await this.nameUnique(object, project.mobile_id, action)
      if (!nameUnique) {
        errors.nameError = 'Must be unique'
      }
    } else {
      errors.nameError = 'Must be present'
    }

    return errors
  }

  static get showables() {
    return realm.objects('ExistingLighting').filtered('active = true AND shown = true AND mobile_project_id = null')
  }

  find(id) {
    return realm.objects('ExistingLighting').filtered('mobile_id = $0 AND active = true', id)[0];
  }

  /////// for CustomAttributable ///////

  project() {
    return realm.objects('Project').filtered('mobile_id = $0', this.mobile_project_id)[0]
  }

  // after minification 'this.constructor.name' no longer works
  getClassName() {
    return 'ExistingLighting';
  }

  static getClassName() {
    return 'ExistingLighting';
  }

  //////////////////////////////////////

}

ExistingLighting.schema = existingLightingSchema;
