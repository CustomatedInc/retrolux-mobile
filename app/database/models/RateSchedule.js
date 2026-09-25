import UUIDGenerator from "react-native-uuid-generator";

import Model from "../model";
import realm from "../realm";
import { Schedule } from "./Schedule";
import { rateScheduleSchema } from "../schema";
import { Project } from "./Project";
import { roundTo, presentOrZero } from "../../lib/numberHelpers";
import { utcNow } from '../../lib/dateHelpers';

export class RateSchedule extends Schedule {
  static async createAllFromServer(rateSchedules) {
    for (var i = 0; i < rateSchedules.length; i++) {
      let rateSchedule = rateSchedules[i];
      let rate = await this.prepareForRealm(rateSchedule);
      await this.create(rate, true);
    }
  }

  static async prepareForRealm(rateSchedule) {
    rateSchedule.server_id = rateSchedule.id;
    delete rateSchedule.id;
    rateSchedule.mobile_id = await this.findOrNextMobileId(
      rateSchedule.server_id
    );
    rateSchedule.edited = false;
    rateSchedule.created_at = rateSchedule.created_at
      ? new Date(rateSchedule.created_at)
      : null;
    rateSchedule.updated_at = rateSchedule.updated_at
      ? new Date(rateSchedule.updated_at)
      : null;
    rateSchedule.inactive_at = rateSchedule.inactive_at
      ? new Date(rateSchedule.inactive_at)
      : null;
    rateSchedule.kwh_cost = rateSchedule.kwh_cost
      ? String(rateSchedule.kwh_cost)
      : null;
    let project = await Project.findServer(rateSchedule.project_id);
    rateSchedule.mobile_project_id = project.mobile_id;
    return rateSchedule;
  }

  static async prepareFormData(data, project) {
    data.kwh_cost = presentOrZero(data.kwh_cost) ? String(data.kwh_cost) : null;
    data.kwh_cost_simple = presentOrZero(data.kwh_cost_simple) ? String(data.kwh_cost_simple) : null;
    data.kw_demand_cost = presentOrZero(data.kw_demand_cost) ? String(data.kw_demand_cost) : null;
    data.rate_customer = presentOrZero(data.rate_customer) ? String(data.rate_customer) : null;
    data.rate_escalator = presentOrZero(data.rate_escalator) ? String(data.rate_escalator) : null;

    if (!data.mobile_id) {
      (data.active = true),
        (data.edited = false),
        (data.mobile_id = await this.nextId());
      (data.project_id = project.server_id
        ? parseInt(project.server_id)
        : null),
        (data.mobile_project_id = project.mobile_id),
        (data.server_id = null),
        (data.uuid = await UUIDGenerator.getRandomUUID());
    } else {
      data.edited = true;
    }

    return data;
  }

  static async validate(object) {
    let errors = {};

    if (object.rate_type == 'blended') {
      if (!object.kwh_cost || object.kwh_cost < 0.02 || object.kwh_cost > 1.0) {
        errors.costError = "Rate should be in a range of $0.02 - $1.00";
      }

    } else if (object.rate_type == 'simple') {
      if (!object.kwh_cost_simple || object.kwh_cost_simple < 0.02 || object.kwh_cost_simple  > 1.0) {
        errors.costSimpleError = "Rate should be in a range of $0.02 - $1.00";
      }

      if (!object.kw_demand_cost || object.kw_demand_cost < 0.01 ||  object.kw_demand_cost  > 1000.0) {
        errors.demandSimpleError = "Rate should be in a range of $0.01 - $1,000.00";
      }

      if ((!object.rate_customer && object.rate_customer != 0) || object.rate_customer < 0) {
        errors.rateCustomerError = "Monthly rate should be positive.";
      }

      if ((!object.demand_utilization && object.demand_utilization != 0) || object.demand_utilization < 0 ||  object.demand_utilization  > 100.0) {
        errors.demandThrottleError = "Demand throttle should be in a range of 0% - 100%";
      }
    }

    if (object.rate_escalator < -100.0 || object.rate_escalator > 100.0) {
      errors.rateEscalatorError = 'Rate escalator should be in a range of -100.0% - 100.0%'
    }

    const nameUnique = await this.nameUnique(
      object.name,
      object.mobile_project_id
    );

    if (!object.name || (object.mobile_id === undefined && !nameUnique)) {
      errors.nameError = "Must be present and unique";
    }

    return errors;
  }

  static energyCost(schedule) {
    let cost = 0.0
    if (schedule.rate_type == 'blended') {
      cost = schedule.kwh_cost
    } else if (schedule.rate_type == 'simple') {
      cost = schedule.kwh_cost_simple
    }
    return roundTo(cost, 2)
  }

  // after minification 'this.constructor.name' no longer works
  getClassName() {
    return "RateSchedule";
  }

  async copy() {
    const copyName = `${this.name} - copy`

    copiedSchedule = {
      ...this,
      mobile_id: await RateSchedule.nextId(),
      uuid: await UUIDGenerator.getRandomUUID(),
      server_id: null,
      edited: false,
      updated_at: utcNow(),
      created_at: utcNow(),
      name: copyName,
    }

    RateSchedule.create(copiedSchedule)
  }

}

RateSchedule.schema = rateScheduleSchema;
