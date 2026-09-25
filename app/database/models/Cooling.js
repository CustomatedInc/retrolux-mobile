import UUIDGenerator from 'react-native-uuid-generator';

import Model from '../model'
import { coolingSchema } from '../schema'
import { Project } from './Project';
import { Schedule } from './Schedule';
import realm from '../realm';
import { formatLargeNumber, isFloat, isNonzeroNumber, validatePercentage } from '../../lib/numberHelpers';
import { utcNow } from '../../lib/dateHelpers';

export class Cooling extends Schedule {
  static async createAllFromServer(coolings) {
    for (var i = 0; i < coolings.length; i++) {
      let cooling = coolings[i];
      cooling = await this.prepareForRealm(cooling);
      await this.create(cooling, true);
    }
  }

  static async prepareForRealm(cooling) {
    cooling.server_id = cooling.id;
    delete cooling.id;
    cooling.mobile_id = await this.findOrNextMobileId(cooling.server_id);
    cooling.edited = false;
    cooling.created_at = cooling.created_at ? new Date(cooling.created_at) : null
    cooling.updated_at = cooling.updated_at ? new Date(cooling.updated_at) : null
    cooling.inactive_at = cooling.inactive_at ? new Date(cooling.inactive_at) : null
    cooling.annual_run_time = cooling.annual_run_time ? String(cooling.annual_run_time) : '0.0'
    cooling.fuel_cost = cooling.fuel_cost ? String(cooling.fuel_cost) : null
    cooling.efficiency_value = cooling.efficiency_value ? String(cooling.efficiency_value) : null
    let project = await Project.findServer(cooling.project_id)
    cooling.mobile_project_id = project.mobile_id
    return cooling
  }

  static async prepareFormData(data, project) {
    if (!data.mobile_id) {
      data.active = true
      data.edited = false
      data.mobile_id = await this.nextId();
      data.project_id = project.server_id ? parseInt(project.server_id) : null
      data.mobile_project_id = project.mobile_id
      data.server_id = null
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
    return 'Cooling';
  }

  async copy() {
    const copyName = `${this.name} - copy`

    copiedSchedule = {
      ...this,
      mobile_id: await Cooling.nextId(),
      uuid: await UUIDGenerator.getRandomUUID(),
      server_id: null,
      edited: false,
      updated_at: utcNow(),
      created_at: utcNow(),
      name: copyName,
    }

    Cooling.create(copiedSchedule)
  }
}

Cooling.schema = coolingSchema;
