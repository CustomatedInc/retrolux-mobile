import UUIDGenerator from 'react-native-uuid-generator';

import Model from '../model'
import { heatingSchema } from '../schema'
import { Project } from './Project';
import { Schedule } from './Schedule';
import realm from '../realm';
import { formatLargeNumber, isFloat, isNonzeroNumber, validatePercentage } from '../../lib/numberHelpers';
import { utcNow } from '../../lib/dateHelpers';

export class Heating extends Schedule {
  static async createAllFromServer(heatings) {
    for (var i = 0; i < heatings.length; i++) {
      let heating = heatings[i];
      heating = await this.prepareForRealm(heating);
      await this.create(heating, true);
    }
  }

  static async prepareForRealm(heating) {
    heating.server_id = heating.id;
    delete heating.id;
    heating.mobile_id = await this.findOrNextMobileId(heating.server_id);
    heating.edited = false;
    heating.created_at = heating.created_at ? new Date(heating.created_at) : null
    heating.updated_at = heating.updated_at ? new Date(heating.updated_at) : null
    heating.inactive_at = heating.inactive_at ? new Date(heating.inactive_at) : null
    heating.annual_run_time = heating.annual_run_time ? String(heating.annual_run_time) : '0.0'
    heating.fuel_cost = heating.fuel_cost ? String(heating.fuel_cost) : null
    heating.efficiency_value = heating.efficiency_value ? String(heating.efficiency_value) : null
    let project = await Project.findServer(heating.project_id)
    heating.mobile_project_id = project.mobile_id
    return heating
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

  get annualHours() {
    if (this.annual_run_time === null) { return null }
    let hours = (this.annual_run_time / 100) * 8760;
    return formatLargeNumber(hours.toFixed());
  }

  static async validate(object) {
    let errors = {}
    if (!object.efficiency_value ||!isNonzeroNumber(object.efficiency_value)) {
      errors.efficiencyValueError = 'Must be present and a number greater than 0'
    }
    let isPercentage = false
    if(object.annual_run_time) { isPercentage = await validatePercentage(object.annual_run_time) }
    if (!object.annual_run_time || !isPercentage) {
      errors.annualRunTimeError = 'Must be present and a number between 0 and 100'
    }
    if (!object.fuel_cost || !isFloat(object.fuel_cost)) {
      errors.fuelCostError = 'Must be present and only contain numbers'
    }
    const nameUnique = await this.nameUnique(object.name, object.mobile_project_id)
    if(!object.name || (object.mobile_id === undefined && !nameUnique)) {
      errors.nameError = 'Must be present and unique'
    }
    return errors
  }

  // after minification 'this.constructor.name' no longer works
  getClassName() {
    return 'Heating';
  }

  async copy() {
    const copyName = `${this.name} - copy`

    copiedSchedule = {
      ...this,
      mobile_id: await Heating.nextId(),
      uuid: await UUIDGenerator.getRandomUUID(),
      server_id: null,
      edited: false,
      updated_at: utcNow(),
      created_at: utcNow(),
      name: copyName,
    }

    Heating.create(copiedSchedule)
  }

}

Heating.schema = heatingSchema;
