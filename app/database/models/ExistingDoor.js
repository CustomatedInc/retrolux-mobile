import { ExistingProduct } from './ExistingProduct';
import { existingDoorSchema } from '../schema';
import { Area } from './Area';
import { DoorSchedule } from './DoorSchedule';
import { DoorOperatingSchedule } from './DoorOperatingSchedule';
import realm from '../realm';
import UUIDGenerator from 'react-native-uuid-generator';
import { utcNow } from '../../lib/dateHelpers';
import _ from 'lodash';

export class ExistingDoor extends ExistingProduct {
  // static inArea(areaId) {
  //   return realm.objects('ExistingFixture').filtered(`mobile_area_id = '${areaId}' AND active = true`);
  // }

  static async prepareForRealm(existingDoor) {
    existingDoor.server_id = existingDoor.id;
    delete existingDoor.id;
    existingDoor.mobile_id = await this.findOrNextMobileId(existingDoor.server_id);
    existingDoor.edited = false;
    existingDoor.created_at = existingDoor.created_at ? new Date(existingDoor.created_at) : null;
    existingDoor.updated_at = existingDoor.updated_at ? new Date(existingDoor.updated_at) : null;
    existingDoor.inactive_at = existingDoor.inactive_at ? new Date(existingDoor.inactive_at) : null;

    const area = await Area.findServer(existingDoor.area_id);
    existingDoor.mobile_area_id = area.mobile_id;
    existingDoor.mobile_operating_schedule_id = await DoorOperatingSchedule.translateId(existingDoor.operating_schedule_id);
    const doorSchedule = await DoorSchedule.findServer(existingDoor.door_schedule_id);
    existingDoor.mobile_door_schedule_id = doorSchedule.mobile_id;
    existingDoor.custom_attributes = JSON.stringify(existingDoor.custom_attributes);
    return existingDoor;
  }

  // static async prepareFormDataForCreate(existingLighting, area, project) {
  //   existingFixture = {
  //     active: true,
  //     edited: false,
  //     mobile_id: await this.nextId(),
  //     mobile_area_id: area.mobile_id,
  //     custom_attributes: await this.cleanAttributes(project),
  //     mobile_project_id: project.mobile_id,
  //     existing_count: 0,
  //     uuid: await UUIDGenerator.getRandomUUID(),
  //     existing_lighting_id: existingLighting.server_id,
  //     mobile_existing_lighting_id: existingLighting.mobile_id,
  //     created_at: utcNow(),
  //     updated_at: utcNow(),
  //   };
  //   return existingFixture;
  // }

  // static async prepareFormDataForEdit(formState) {
  //   const { existingFixture, operatingSchedule, existingLighting, area } = formState;

  //   existingFixture.mobile_operating_schedule_id = operatingSchedule ? operatingSchedule.mobile_id : null;
  //   if (existingLighting) {
  //     existingFixture.mobile_existing_lighting_id = existingLighting.mobile_id;
  //     existingFixture.existing_lighting_id = existingLighting.server_id;
  //   }
  //   if (area) existingFixture.mobile_area_id = area.mobile_id;
  //   existingFixture.edited = true;
  //   existingFixture.updated_at = utcNow();

  //   return existingFixture;
  // }

  /////// for CustomAttributable ///////

  project() {
    area = this.area;
    return realm.objects('Project').filtered('mobile_id = $0', area.mobile_project_id)[0];
  }

  // after minification 'this.constructor.name' no longer works
  getClassName() {
    return 'ExistingDoor';
  }

  static getClassName() {
    return 'ExistingDoor';
  }

  /////////////////////////////////////

  // find(id) {
  //   return realm.objects('ExistingFixture').filtered('mobile_id = $0 AND active = true', id)[0];
  // }

}

ExistingDoor.schema = existingDoorSchema;
