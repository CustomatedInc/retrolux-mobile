import _ from 'lodash';

import Model from '../model';
import realm from '../realm';
import { Editable } from '../mixins/Editable'

export class Schedule extends Editable(Model) {
  async makeDefault() {
    const model = await _.snakeCase(this.getClassName());
    const mobileScheduleId = `mobile_${model}_id`;
    const serverScheduleId = `${model}_id`
    const project = await this.project;
    const scheduleMobileId = this.mobile_id === project[mobileScheduleId] ? null : this.mobile_id;
    const scheduleId = this.server_id === project[serverScheduleId] ? null : this.server_id;

    realm.write(() => {
      project[serverScheduleId] = scheduleId;
      project[mobileScheduleId] = scheduleMobileId;
      project.edited = true;
    });
  }

  static async nameUnique(name, mobileProjectId) {
    if (!mobileProjectId) { throw new Error('nameUnique requires a valid mobileProjectId param'); }
    const existingScheduleNames = await realm.objects(this.schema.name).filtered('active = true AND mobile_project_id = $0', mobileProjectId).map(schedule => schedule.name);
    return (existingScheduleNames.indexOf(name) === -1);
  }

  get project() {
    return realm.objects('Project').filtered(`mobile_id = ${this.mobile_project_id}`)[0];
  }
}
