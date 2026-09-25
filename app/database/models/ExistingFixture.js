import { ExistingProduct } from './ExistingProduct';
import { existingFixtureSchema } from '../schema';
import realm from '../realm';
import { Area } from './Area';
import { ExistingLighting } from './ExistingLighting';
import { OperatingSchedule } from './OperatingSchedule';
import { Attachment } from './Attachment';
import UUIDGenerator from 'react-native-uuid-generator';
import { utcNow } from '../../lib/dateHelpers';
import _ from 'lodash';


export class ExistingFixture extends ExistingProduct {
  static inArea(areaId) {
    return realm.objects('ExistingFixture').filtered(`mobile_area_id = '${areaId}' AND active = true`);
  }

  static async prepareForRealm(existingFixture) {
    existingFixture.server_id = existingFixture.id;
    delete existingFixture.id;
    existingFixture.mobile_id = await this.findOrNextMobileId(existingFixture.server_id);
    existingFixture.edited = false;
    existingFixture.created_at = existingFixture.created_at ? new Date(existingFixture.created_at) : null;
    existingFixture.updated_at = existingFixture.updated_at ? new Date(existingFixture.updated_at) : null;
    existingFixture.inactive_at = existingFixture.inactive_at ? new Date(existingFixture.inactive_at) : null;
    existingFixture.mounting_height = existingFixture.mounting_height ? String(existingFixture.mounting_height) : null;
    const area = await Area.findServer(existingFixture.area_id);
    existingFixture.mobile_area_id = area.mobile_id;
    existingFixture.mobile_operating_schedule_id = await OperatingSchedule.translateId(existingFixture.operating_schedule_id);
    const existingLighting = await ExistingLighting.findServer(existingFixture.existing_lighting_id);
    existingFixture.mobile_existing_lighting_id = existingLighting.mobile_id;
    existingFixture.custom_attributes = JSON.stringify(existingFixture.custom_attributes);
    return existingFixture;
  }

  static async prepareFormDataForCreate(existingLighting, area, project) {
    existingFixture = {
      active: true,
      edited: false,
      mobile_id: await this.nextId(),
      mobile_area_id: area.mobile_id,
      custom_attributes: await this.cleanAttributes(project),
      mobile_project_id: project.mobile_id,
      existing_count: 0,
      uuid: await UUIDGenerator.getRandomUUID(),
      existing_lighting_id: existingLighting.server_id,
      mobile_existing_lighting_id: existingLighting.mobile_id,
      created_at: utcNow(),
      updated_at: utcNow(),
    };
    return existingFixture;
  }

  static async prepareFormDataForEdit(formState) {
    const { existingFixture, operatingSchedule, existingLighting, area } = formState;

    existingFixture.mobile_operating_schedule_id = operatingSchedule ? operatingSchedule.mobile_id : null;
    if (existingLighting) {
      existingFixture.mobile_existing_lighting_id = existingLighting.mobile_id;
      existingFixture.existing_lighting_id = existingLighting.server_id;
    }
    if (area) existingFixture.mobile_area_id = area.mobile_id;
    existingFixture.edited = true;
    existingFixture.updated_at = utcNow();

    return existingFixture;
  }

  /////// for CustomAttributable ///////

  project() {
    area = this.area;
    return realm.objects('Project').filtered('mobile_id = $0', area.mobile_project_id)[0];
  }

  // after minification 'this.constructor.name' no longer works
  getClassName() {
    return 'ExistingFixture';
  }

  static getClassName() {
    return 'ExistingFixture';
  }

  ////////////////////////////////////

  find(id) {
    return realm.objects('ExistingFixture').filtered('mobile_id = $0 AND active = true', id)[0];
  }

}

ExistingFixture.schema = existingFixtureSchema;
