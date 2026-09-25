import Model from '../model'
import { defaultScheduleSchema } from '../schema';
import realm from '../realm';
import { Editable } from '../mixins/Editable'
import UUIDGenerator from 'react-native-uuid-generator';
import { utcNow } from '../../lib/dateHelpers';

/**
 * Mimics functionality of default_schedule.rb on web.
 *
 * This concept is only for DoorOperatingSchedules right now.
 *
 * Sets the Default DoorOperatingSchedule for the Project. This is used for inheriting/treeable.
 * Models that can use DefaultSchedule
 * - Project
 * - Location
 * - Area
 */

export class DefaultSchedule extends Editable(Model) {

  /**
   * Builder for API - called from builds.js
  **/

  static async createAllFromServer(defaultSchedules) {
    const preppedDefaultSchedules = [];
    for (let index = 0; index < defaultSchedules.length; index++) {
      const preppedDefaultSchedule = await this.prepareForRealm(defaultSchedules[index]);
      const found = await this.findServer(preppedDefaultSchedule.server_id);

      if (found) {
        preppedDefaultSchedules.push(preppedDefaultSchedule);
      } else {
        preppedDefaultSchedule.mobile_id = preppedDefaultSchedule.mobile_id + index;
        preppedDefaultSchedules.push(preppedDefaultSchedule);
      }
    }

    await this.create(preppedDefaultSchedules, true);
  }

  static async prepareForRealm(defaultSchedule) {
    defaultSchedule.server_id = defaultSchedule.id;
    delete defaultSchedule.id;
    defaultSchedule.mobile_id = await this.findOrNextMobileId(defaultSchedule.server_id);
    defaultSchedule.edited = false;

    // Find Default
    let defaultRecord = await realm.objects(defaultSchedule.default_type).filtered(`server_id = ${defaultSchedule.default_id}`)[0];
    if(!defaultRecord) { throw `No default found for DefaultSchedule with id: ${defaultSchedule.server_id}` };
    defaultSchedule.default_mobile_id = defaultRecord.mobile_id;

    // Find Schedule
    let scheduleRecord = await realm.objects(defaultSchedule.schedule_type).filtered(`server_id = ${defaultSchedule.schedule_id}`)[0];
    if(!scheduleRecord) { throw `No schedule found for DefaultSchedule with id: ${defaultSchedule.schedule_id}` };
    defaultSchedule.schedule_mobile_id = scheduleRecord.mobile_id;

    return defaultSchedule;
  }

}

DefaultSchedule.schema = defaultScheduleSchema;