import Model from '../model'
import { Project } from './Project';
import { Attachment } from './Attachment';
import realm from '../realm';
import { CustomAttributable } from '../mixins/CustomAttributable'
import { Editable } from '../mixins/Editable'
import { compose } from '../../lib/utilities';
import UUIDGenerator from 'react-native-uuid-generator';
import { utcNow } from '../../lib/dateHelpers';
import _ from 'lodash';

/**
 * Mimics functionality of existing_product.rb on web.
 *
 * Holds the similar functionality between ExistingFixture and ExistingDoor
 *
 * Current models using ExistingProduct:
 * - ExistingFixture
 * - ExistingDoor
 */

export class ExistingProduct extends compose(Editable, CustomAttributable)(Model) {

  /**
   * Builder for API - called from builds.js
  **/

  static async createAllFromServer(existingProducts) {
    const preppedExistingProducts = [];
    for (let index = 0; index < existingProducts.length; index++) {
      const preppedExistingProduct = await this.prepareForRealm(existingProducts[index]);
      const found = await this.findServer(preppedExistingProduct.server_id);

      if (found) {
        preppedExistingProducts.push(preppedExistingProduct);
      } else {
        preppedExistingProduct.mobile_id = preppedExistingProduct.mobile_id + index;
        preppedExistingProducts.push(preppedExistingProduct);
      }
    }

    await this.create(preppedExistingProducts, true);
  }

  /**
   * Form Preparation Helpers
  **/

  static cleanAttributes(project) {
    outCustomAttributes = {};
    let attributes;
    switch (this.schema.name) {
      case 'ExistingFixture':
        attributes = project.ExistingFixtureAttributes();
        break;
      case 'ExistingDoor':
        attributes = project.ExistingDoorAttributes();
        break;
    }

    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      outCustomAttributes[attribute.code_name] = null;
    }
    return JSON.stringify(outCustomAttributes);
  }

  /**
   * Get Helpers
  **/

  get area() {
    return (
      realm.objects('Area').filtered('mobile_id = $0 AND active = true', this.mobile_area_id)[0]
    );
  }

  get product_schedule() {
    switch (this.getClassName()) {
      case 'ExistingFixture':
        return realm.objects('ExistingLighting').filtered('mobile_id = $0 AND active = true', this.mobile_existing_lighting_id)[0];
      case 'ExistingDoor':
        return realm.objects('DoorSchedule').filtered('mobile_id = $0 AND active = true', this.mobile_door_schedule_id)[0];
    }
  }

  get product_name() {
    return this.product_schedule.name
  }

  get code() {
    return this.product_schedule.code || ''
  }

  static attachments(id) {
    return realm.objects('Attachment').filtered('active = true AND attachable_type = $0 AND attachable_mobile_id = $1', this.schema.name, id);
  }

  getAttribute(attribute_name) {
    if (!!this.parsedCustomAttributes[attribute_name] || this.parsedCustomAttributes[attribute_name] === 0) {
      return this.parsedCustomAttributes[attribute_name];
    } else if (this.mobile_existing_lighting_id) {
      let productSchedule = this.product_schedule;
      return productSchedule.getAttribute(attribute_name);
    }
  }

  /**
   * After Save Helpers
  **/

  static async findAndRunUpdate(id) {
    const existingProduct = await realm.objects(this.schema.name).filtered('mobile_id = $0 AND active = true', id)[0];
    await existingProduct.afterSaveUpdates();
  }

  /**
   * Counter Helpers
  **/

  incrementProductCount() {
    const count = this.existing_count;

    realm.write(() => {
      this.edited = true;
      this.existing_count = parseInt(count) + 1;
    });
  }

  decrementProductCount() {
    const count = this.existing_count;
    if (count === 0) { return; }

    realm.write(() => {
      this.edited = true;
      this.existing_count = parseInt(count) - 1;
    });
  }

  updateQuantity(newQty) {
    realm.write(() => {
      this.edited = true;
      this.existing_count = parseInt(newQty);
    });
  }

  /**
   * Actions
  **/

  deactivate() {
    realm.write(() => {
      this.active = false;
      this.inactive_at = utcNow();
      this.edited = true;
    });

    for (const pin of this.pins) {
      pin.deactivate();
    }

    Attachment.deleteByAttachable(this.getClassName(), this.mobile_id); // lookinto
  }

  async attributesComplete() {
    buildAttributes = {};
    requiredAttributes = await this.requiredCustomAttributes();

    for (const key in requiredAttributes) {
      buildAttributes[key] = await this.getAttribute(key);
    }

    return _.every(buildAttributes, (value, code_name, collection) => !!value || value === 0);
  }

  async createCopy(newMobileAreaId = null) {
    const copiedData = await this.copyObject(newMobileAreaId);
    this.constructor.create(copiedData);

    return copiedData.mobile_id;
  }

  async copyObject(newMobileAreaId) {
    return {
      ...this,
      mobile_id: await this.constructor.nextId(),
      uuid: await UUIDGenerator.getRandomUUID(),
      server_id: null,
      edited: false,
      updated_at: utcNow(),
      created_at: utcNow(),
      mobile_area_id: newMobileAreaId || this.mobile_area_id,
      area_id: newMobileAreaId ? null : this.areas_id,
    };
  }

  changeProductSchedule(productScheduleMobileId, productScheduleServerId) {
    let modelName = this.getClassName();

    realm.write(() => {
      switch (modelName) {
        case 'ExistingFixture':
          this.mobile_existing_lighting_id = productScheduleMobileId;
          this.existing_lighting_id = productScheduleServerId;
          this.edited = true;
        case 'ExistingDoor':
          this.mobile_door_schedule_id = productScheduleMobileId;
          this.door_schedule_id = productScheduleServerId;
          this.edited = true;
      }
    });
  }

  /**
   * FloorPlan Helpers
  **/

  getPin(pinnable_sub_type) {
    return (
      realm.objects('Pin').filtered(`active = true AND pinnable_type = $0 AND pinnable_sub_type = $1 AND mobile_pinnable_id = $2`, this.getClassName(), pinnable_sub_type, this.mobile_id)[0]
    );
  }

  get mapping_style() {
    if (this.pins.length < this.existing_count) {
      return '#ffc107';
    } else if (this.pins.length > this.existing_count) {
      return 'tomato';
    } else if (this.pins.length == this.existing_count) {
      return '#33CF6C';
    }
  }

  get pins() {
    return realm.objects('Pin').filtered('active = true AND pinnable_type = $0 AND mobile_pinnable_id = $1', this.getClassName(), this.mobile_id).snapshot();
  }

  get sync_pins() {
    return realm.objects('Pin').filtered('pinnable_type = $0 AND mobile_pinnable_id = $1', this.getClassName(), this.mobile_id).snapshot();
  }

  static mapppingStyle(mobile_id, currentExistingCount) {
    if (!mobile_id) { return false; }
    let existingProduct = realm.objects(this.schema.name).filtered('active = true AND mobile_id = $0', mobile_id)[0];
    if (!existingProduct) { return false; }
    if (!existingProduct.area) { return false; }

    if (existingProduct.area.findFloorPlan) {
      if (existingProduct.pins.length < currentExistingCount) {
        return '#ffc107';
      } else if (existingProduct.pins.length > currentExistingCount) {
        return 'tomato';
      } else if (existingProduct.pins.length == currentExistingCount) {
        return '#33CF6C';
      }
    } else {
      return false;
    }
  }

  static async checkToRemovePins(mobile_id, currentAreaMobileId, nextAreaMobileId) {
    const existingProduct = await realm.objects(this.schema.name).filtered('mobile_id = $0', mobile_id)[0];
    if (existingProduct.pins.length < 1) { return; }

    const currentArea = await realm.objects('Area').filtered('mobile_id = $0', currentAreaMobileId)[0];
    const nextArea = await realm.objects('Area').filtered('mobile_id = $0', nextAreaMobileId)[0];

    const currentFloorPlan = await currentArea.findFloorPlan;
    const nextFloorPlan = await nextArea.findFloorPlan;

    if (!nextFloorPlan || (currentFloorPlan.mobile_id != nextFloorPlan.mobile_id)) {
      const pins = await existingProduct.pins;
      if (pins.length > 0) {
        for (let k = 0; k < pins.length; k++) {
          const pin = pins[k];
          await pin.deactivate();
        }
      }
    }
  }



}