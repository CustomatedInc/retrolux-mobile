import Model from '../model'
import { Project } from './Project';
import realm from '../realm';
import { CustomAttributable } from '../mixins/CustomAttributable'
import { Editable } from '../mixins/Editable'
import { compose } from '../../lib/utilities';
import { succ } from '../../lib/numberHelpers';

/**
 * Mimics functionality of product_schedule.rb on web.
 *
 * Holds the similar functionality between ExistingLighting and DoorSchedule
 *
 * Current models using ProductSchedule:
 * - ExistingLighting
 * - DoorSchedule
 */

export class ProductSchedule extends compose(Editable, CustomAttributable)(Model) {

  /**
   * Builder for API - called from builds.js
  **/

  static async createAllFromServer(productSchedules) {
    const preppedProductSchedules = []
    for (let index = 0; index < productSchedules.length; index++) {
      const preppedProductSchedule = await this.prepareForRealm(productSchedules[index]);
      const found = await this.findServer(preppedProductSchedule.server_id);

      if (!!found) {
        preppedProductSchedules.push(preppedProductSchedule);
      } else {
        preppedProductSchedule.mobile_id = preppedProductSchedule.mobile_id + index
        preppedProductSchedules.push(preppedProductSchedule);
      }
    }
    await this.create(preppedProductSchedules, true);
  }

  /**
   * Common Validation Helpers 
  **/

  static async nameUnique(productScheduleObject, mobileProjectId, action) {
    if (!mobileProjectId) { throw new Error('nameUnique requires a valid mobileProjectId param'); }
    let productScheduleNames = []
    if (!productScheduleObject.mobile_id || action == 'copy') {
      productScheduleNames = await realm.objects(this.schema.name).filtered('active = true AND mobile_project_id = $0', mobileProjectId).map(productSchedule => productSchedule.name);
    } else {
      productScheduleNames = await realm.objects(this.schema.name).filtered('active = true AND mobile_id != $0 AND mobile_project_id = $1', productScheduleObject.mobile_id, mobileProjectId).map(productSchedule => productSchedule.name);
    }
    return (productScheduleNames.indexOf(productScheduleObject.name) === -1);
  }

  static async codeUnique(productScheduleObject, mobileProjectId, action) {
    if (!mobileProjectId) { throw new Error('codeUnique requires a valid mobileProjectId param'); }
    let productScheduleCodes = []
    if (!productScheduleObject.mobile_id || action == 'copy') {
      productScheduleCodes = await realm.objects(this.schema.name).filtered('active = true AND mobile_project_id = $0', mobileProjectId).map(productSchedule => productSchedule.code);
    } else {
      productScheduleCodes = await realm.objects(this.schema.name).filtered('active = true AND mobile_id != $0 AND mobile_project_id = $1', productScheduleObject.mobile_id, mobileProjectId).map(productSchedule => productSchedule.code);
    }
    return (productScheduleCodes.indexOf(productScheduleObject.code) === -1);
  }

  /**
   * Getting Data Helpers 
  **/

  get searchableName() {
    return this.name.replace(/[^A-Za-z0-9\s!?]/g,'').toLowerCase()
  }

  existingProductCount(id) {
    switch (this.getClassName()) {
      case 'ExistingLighting':
        return realm.objects("ExistingFixture").filtered('active = true AND mobile_existing_lighting_id = $0', id).sum('existing_count');
      case 'DoorSchedule':
        return realm.objects("ExistingDoor").filtered('active = true AND mobile_door_schedule_id = $0', id).sum('existing_count');
      default:
        return realm.objects("ExistingFixture").filtered('active = true AND mobile_existing_lighting_id = $0', id).sum('existing_count');
    }
  }

  get activeExistingProducts() {
    switch (this.getClassName()) {
      case 'ExistingLighting':
        return realm.objects("ExistingFixture").filtered('active = true AND mobile_existing_lighting_id = $0', this.mobile_id);
      case 'DoorSchedule':
        return realm.objects("ExistingDoor").filtered('active = true AND mobile_door_schedule_id = $0', this.mobile_id);
      default:
        return realm.objects("ExistingFixture").filtered('active = true AND mobile_existing_lighting_id = $0', this.mobile_id);
    }
  }

  getAttribute(attribute_name) {
    return this.parsedCustomAttributes[attribute_name]
  }

  static attachments(id) {
    return realm.objects('Attachment').filtered(`active = true AND attachable_type = $0 AND attachable_mobile_id = $1`, this.schema.name, id);
  }

  /**
   * After Save Helpers
  **/

  static async findAndRunUpdate(id) {
    let productSchedule = await realm.objects(this.schema.name).filtered('mobile_id = $0 AND active = true', id)[0];
    await productSchedule.afterSaveUpdates();
    await productSchedule.updateExistingProductCompleteStatus();
  }

  async updateExistingProductCompleteStatus() {
    let existingProducts = this.activeExistingProducts;

    for (let i = 0; i < existingProducts.length; i++) {
      const existingProduct = existingProducts[i];
      const complete = await existingProduct.attributesComplete()
      realm.write(() => {
        existingProduct.audit_complete = complete;
        existingProduct.edited = true;
      })
    }
  }

  /**
   * Form Preparation Helpers
  **/

  static nextDisplayOrder(project) {
    let productSchedules;
    switch (this.schema.name) {
      case 'ExistingLighting':
        productSchedules = project.activeExistingLightings;
        break;
      case 'DoorSchedule':
        productSchedules = project.activeDoorSchedules;
        break;
      default:
        productSchedules = project.activeExistingLightings;
    }

    if (productSchedules.length === 0){ return 0 }
    let lastDisplayOrder = productSchedules[productSchedules.length - 1].display_order;
    return lastDisplayOrder + 1;
  }

  static nextCode(project) {
    let orderedProductSchedules;
    switch (this.schema.name) {
      case 'ExistingLighting':
        orderedProductSchedules = project.activeExistingLightingsByCode;
        break;
      case 'DoorSchedule':
        orderedProductSchedules = project.activeDoorSchedulesByCode;
        break;
      default:
        orderedProductSchedules = project.activeExistingLightingsByCode;
    }

    if (orderedProductSchedules.length > 0) {
      lettersOnly = orderedProductSchedules.filter(productSchedule => !/\d/.test(productSchedule.code)).map(e => e.code)

      // sorts by length of string then alphabetically [a, aa, b, c] => [a, b, c, aa]
      lettersOnly.sort(function(a, b) {
        return a.length - b.length || a.localeCompare(b)
      })

      nextCode = lettersOnly.length > 0 ? succ(lettersOnly[lettersOnly.length - 1]) : 'a'

    } else {
      nextCode = 'a'
    }

    return nextCode
  }

}
