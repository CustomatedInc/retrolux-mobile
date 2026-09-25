import { ProductOperatingSchedule } from './ProductOperatingSchedule';
import { doorOperatingScheduleSchema } from '../schema';
import { Project } from './Project';
import realm from '../realm';
import { isFloat, isPresent } from '../../lib/numberHelpers';
import UUIDGenerator from 'react-native-uuid-generator';
import { utcNow } from '../../lib/dateHelpers';

export class DoorOperatingSchedule extends ProductOperatingSchedule {

  static async prepareForRealm(doorOperatingSchedule) {
    doorOperatingSchedule.server_id = doorOperatingSchedule.id;
    delete doorOperatingSchedule.id;
    doorOperatingSchedule.mobile_id = await this.findOrNextMobileId(doorOperatingSchedule.server_id);
    doorOperatingSchedule.edited = false;
    doorOperatingSchedule.created_at = doorOperatingSchedule.created_at ? new Date(doorOperatingSchedule.created_at) : null
    doorOperatingSchedule.updated_at = doorOperatingSchedule.updated_at ? new Date(doorOperatingSchedule.updated_at) : null
    doorOperatingSchedule.inactive_at = doorOperatingSchedule.inactive_at ? new Date(doorOperatingSchedule.inactive_at) : null

    let project = await Project.findServer(doorOperatingSchedule.project_id);
    doorOperatingSchedule.mobile_project_id = project.mobile_id;

    doorOperatingSchedule.openings_per_hour = JSON.stringify(doorOperatingSchedule.openings_per_hour);
    doorOperatingSchedule.facility_hours_per_day = JSON.stringify(doorOperatingSchedule.facility_hours_per_day);
    doorOperatingSchedule.facility_days_per_week = JSON.stringify(doorOperatingSchedule.facility_days_per_week);

    return doorOperatingSchedule;
  }

  // static async prepareFormData(data, project) {
  //   if (!data.mobile_id) {
  //     data.active = true,
  //     data.edited = false,
  //     data.mobile_id = await this.nextId();
  //     data.project_id = project.server_id ? parseInt(project.server_id) : null,
  //     data.mobile_project_id = project.mobile_id,
  //     data.server_id = null,
  //     data.uuid = await UUIDGenerator.getRandomUUID();
  //   } else {
  //     data.edited = true
  //   }

  //   return data
  // }

  // static async validate(object) {
  //   let errors = {}
  //   const integerRegex = /^\d+$/

  //   if (object.hour_type == 'annual') {
  //     if (!isPresent(object.annual_hours) || !integerRegex.test(object.annual_hours) ) {
  //       errors.annualHoursError = 'Must be present and a whole number'
  //     } else if (object.annual_hours < 0 || object.annual_hours > 8784) {
  //       errors.annualHoursError = 'Must be greater than 0 and less than or equal to 8,784'
  //     }
  //   } else if (object.hour_type == 'weekly') {
  //     ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(weekday => {
  //       if (!isPresent(object[weekday]) || object[weekday] < 0 || object[weekday] > 24) {
  //         errors[weekday+'Error'] = '0-24'
  //       }
  //     });

  //     if (!isPresent(object.weeks_per_year) || object.weeks_per_year < 0 || object.weeks_per_year > 52) {
  //       errors.weeksPerYearError = 'greater than or equal 0 and less than or equal 52'
  //     }
  //   }

  //   if (object.controls_reduction < 0.0 || object.controls_reduction > 100.0) {
  //     errors.controlsReductionError = 'greater than or equal 0.0 and less than or equal 100.0'
  //   }

  //   const nameUnique = await this.nameUnique(object.name, object.mobile_project_id)

  //   if(!object.name || (object.mobile_id === undefined && !nameUnique)) {
  //     errors.nameError = 'Must be present and unique'
  //   }

  //   return errors
  // }

  // // after minification 'this.constructor.name' no longer works
  getClassName() {
    return 'DoorOperatingSchedule';
  }

  static getClassName() {
    return 'DoorOperatingSchedule';
  }

  async copy() {
    const copyName = `${this.name} - copy`

    copiedSchedule = {
      ...this,
      mobile_id: await DoorOperatingSchedule.nextId(),
      uuid: await UUIDGenerator.getRandomUUID(),
      server_id: null,
      edited: false,
      updated_at: utcNow(),
      created_at: utcNow(),
      name: copyName,
    }

    DoorOperatingSchedule.create(copiedSchedule)
  }

}

DoorOperatingSchedule.schema = doorOperatingScheduleSchema;
