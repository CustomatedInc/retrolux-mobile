import { ProductSchedule } from './ProductSchedule';
import { doorScheduleSchema } from '../schema'
import { Project } from './Project';
import realm from '../realm';
import UUIDGenerator from 'react-native-uuid-generator';

export class DoorSchedule extends ProductSchedule {

  static async prepareForRealm(doorSchedule) {
    doorSchedule.server_id = doorSchedule.id;
    delete doorSchedule.id;
    doorSchedule.mobile_id = await this.findOrNextMobileId(doorSchedule.server_id);
    doorSchedule.edited = false;
    doorSchedule.created_at = doorSchedule.created_at ? new Date(doorSchedule.created_at) : null
    doorSchedule.updated_at = doorSchedule.updated_at ? new Date(doorSchedule.updated_at) : null
    doorSchedule.inactive_at = doorSchedule.inactive_at ? new Date(doorSchedule.inactive_at) : null

    if(!!doorSchedule.project_id) {
      let project = await Project.findServer(doorSchedule.project_id)
      doorSchedule.mobile_project_id = project.mobile_id
    }

    doorSchedule.custom_attributes = JSON.stringify(doorSchedule.custom_attributes)
    return doorSchedule;
  }

  // static async prepareFormData(data, project, action) {
  //   data.favorite_company_id = null // no favorites on mobile
  //   data.lm70 = (data.lm70 || data.lm70 == 0) ? data.lm70 : null
  //   data.watts_per_product = (data.watts_per_product || data.watts_per_product == 0) ?  data.watts_per_product : null

  //   if (action === 'new' || action === 'copy') { //created on mobile
  //     data.active = true
  //     data.edited = false
  //     data.mobile_id = await this.nextId();
  //     data.project_id = project.server_id ? parseInt(project.server_id) : null
  //     data.mobile_project_id = project.mobile_id
  //     data.server_id = null
  //     data.display_order = await this.nextDisplayOrder(project);
  //     data.uuid = await UUIDGenerator.getRandomUUID();
  //   } else if (action === 'edit') { // editing original from web
  //     data.edited = true
  //   }

  //   return data
  // }

  // static async validate(object, project, action) {
  //   let errors = {}
  //   const integerRegex = /^\d+$/

  //   if (!!object.lm70 || object.lm70 == 0){
  //     if (object.lm70 < 0 || !integerRegex.test(object.lm70)) {
  //       errors.lm70 = "Must be a whole number 0 or greater";
  //     }
  //   } else {
  //     errors.lm70 = 'Must be present';
  //   }

  //   if (!!object.watts_per_product || object.watts_per_product == 0){
  //     if (object.watts_per_product < 0) {
  //       errors.watts_per_product = "Must be a number 0 or greater";
  //     }
  //   } else {
  //     errors.watts_per_product = 'Must be present';
  //   }

  //   if (!object.existing_product_type){
  //     errors.existing_product_type = 'Must be present'
  //   }

  //   if (!!object.code) {
  //     if (object.code.length > 5) {
  //       errors.codeError = 'Must be less than 5 characters'
  //     } else {
  //       const codeUnique = await this.codeUnique(object, project.mobile_id, action)
  //       if (!codeUnique) {
  //         errors.codeError = 'Must be unique'
  //       }
  //     }
  //   } else {
  //     errors.codeError = 'Must be present'
  //   }

  //   if (!!object.name) {
  //     const nameUnique = await this.nameUnique(object, project.mobile_id, action)
  //     if (!nameUnique) {
  //       errors.nameError = 'Must be unique'
  //     }
  //   } else {
  //     errors.nameError = 'Must be present'
  //   }

  //   return errors
  // }


  // static get showables() {
  //   return realm.objects('ExistingLighting').filtered('active = true AND shown = true AND mobile_project_id = null')
  // }

  // find(id) {
  //   return realm.objects('ExistingLighting').filtered('mobile_id = $0 AND active = true', id)[0];
  // }

    /////// for CustomAttributable ///////

  project() {
    return realm.objects('Project').filtered('mobile_id = $0', this.mobile_project_id)[0]
  }

  // // after minification 'this.constructor.name' no longer works
  getClassName() {
    return 'DoorSchedule';
  }

  static getClassName() {
    return 'DoorSchedule';
  }

  ///////////////////////////////////////

}

DoorSchedule.schema = doorScheduleSchema;
