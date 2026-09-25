import { ProductOperatingSchedule } from './ProductOperatingSchedule';
import { operatingScheduleSchema } from '../schema';
import { Project } from './Project';
import realm from '../realm';
import { isFloat, isPresent } from '../../lib/numberHelpers';
import UUIDGenerator from 'react-native-uuid-generator';
import { utcNow } from '../../lib/dateHelpers';

export class OperatingSchedule extends ProductOperatingSchedule {

  static async prepareForRealm(operatingSchedule) {
    operatingSchedule.server_id = operatingSchedule.id;
    delete operatingSchedule.id;
    operatingSchedule.mobile_id = await this.findOrNextMobileId(operatingSchedule.server_id);
    operatingSchedule.edited = false;
    operatingSchedule.created_at = operatingSchedule.created_at ? new Date(operatingSchedule.created_at) : null
    operatingSchedule.updated_at = operatingSchedule.updated_at ? new Date(operatingSchedule.updated_at) : null
    operatingSchedule.inactive_at = operatingSchedule.inactive_at ? new Date(operatingSchedule.inactive_at) : null
    let project = await Project.findServer(operatingSchedule.project_id)
    operatingSchedule.mobile_project_id = project.mobile_id
    return operatingSchedule
  }

  static async prepareFormData(data, project) {
    if (!data.mobile_id) {
      data.active = true,
      data.edited = false,
      data.mobile_id = await this.nextId();
      data.project_id = project.server_id ? parseInt(project.server_id) : null,
      data.mobile_project_id = project.mobile_id,
      data.server_id = null,
      data.uuid = await UUIDGenerator.getRandomUUID();
    } else {
      data.edited = true
    }

    return data
  }

  static async validate(object) {
    let errors = {}
    const integerRegex = /^\d+$/

    if (object.hour_type == 'annual') {
      if (!isPresent(object.annual_hours) || !integerRegex.test(object.annual_hours) ) {
        errors.annualHoursError = 'Must be present and a whole number'
      } else if (object.annual_hours < 0 || object.annual_hours > 8784) {
        errors.annualHoursError = 'Must be greater than 0 and less than or equal to 8,784'
      }
    } else if (object.hour_type == 'weekly') {
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(weekday => {
        if (!isPresent(object[weekday]) || object[weekday] < 0 || object[weekday] > 24) {
          errors[weekday+'Error'] = '0-24'
        }
      });

      if (!isPresent(object.weeks_per_year) || object.weeks_per_year < 0 || object.weeks_per_year > 52) {
        errors.weeksPerYearError = 'greater than or equal 0 and less than or equal 52'
      }
    }

    if (object.controls_reduction < 0.0 || object.controls_reduction > 100.0) {
      errors.controlsReductionError = 'greater than or equal 0.0 and less than or equal 100.0'
    }

    const nameUnique = await this.nameUnique(object.name, object.mobile_project_id)

    if(!object.name || (object.mobile_id === undefined && !nameUnique)) {
      errors.nameError = 'Must be present and unique'
    }

    return errors
  }

  static getAnnualHours(schedule) {
    if (schedule.hour_type == 'annual') {
      hours = schedule.annual_hours
    } else if (schedule.hour_type == 'weekly') {
      hours = (schedule.monday + schedule.tuesday + schedule.wednesday + schedule.thursday + schedule.friday + schedule.saturday + schedule.sunday) * schedule.weeks_per_year
    }

    const calculatedHours = hours * (1.0 - ( (schedule.controls_reduction || 0.0) / 100.0 ))
    return parseInt(calculatedHours)
  }

  // after minification 'this.constructor.name' no longer works
  getClassName() {
    return 'OperatingSchedule';
  }

  static getClassName() {
    return 'OperatingSchedule';
  }

  async copy() {
    const copyName = `${this.name} - copy`

    copiedSchedule = {
      ...this,
      mobile_id: await OperatingSchedule.nextId(),
      uuid: await UUIDGenerator.getRandomUUID(),
      server_id: null,
      edited: false,
      updated_at: utcNow(),
      created_at: utcNow(),
      name: copyName,
    }

    OperatingSchedule.create(copiedSchedule)
  }

}

OperatingSchedule.schema = operatingScheduleSchema;
