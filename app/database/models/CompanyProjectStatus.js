import Model from '../model'
import { companyProjectStatusSchema } from '../schema'
import _ from 'lodash';

export class CompanyProjectStatus extends Model {
  static async createAllFromServer(statuses) {
    for (var i = 0; i < statuses.length; i++) {
      status = await this.prepareForRealm(statuses[i]);
      await this.create(status, true);
    }
  }

  static async prepareForRealm(status) {
    status.server_id = status.id;
    delete status.id;
    status.mobile_id = await this.findOrNextMobileId(status.server_id);
    return status
  }
}

CompanyProjectStatus.schema = companyProjectStatusSchema;
