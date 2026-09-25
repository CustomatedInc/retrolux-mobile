import Model from '../model';
import realm from '../realm';
import { companyUserSchema } from '../schema'

export class CompanyUser extends Model {
  static async createAllFromServer(users) {
    for (const user of users) {
      await this.create(user, true)
    }
  }

  static async deactivate_ids(ids) {
    for(const id of ids) {
      const existing_record = await realm.objects(this.schema.name).filtered('id = $0', id)[0]
      if (!!existing_record) existing_record.setProp('active', false)
    }
  }
}

CompanyUser.schema = companyUserSchema;
