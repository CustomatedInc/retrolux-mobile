import { encentivUtilitySchema } from '../schema'
import realm from '../realm';
import Model from '../model'

export class EncentivUtility extends Model {
  static find(id) {
    return realm.objects(this.schema.name).filtered('active = true').filtered('id = $0', id)[0]
  }

  static async createAllFromServer(encentivUtilities) {
    const preppedRecords = []
    for (let i = 0; i < encentivUtilities.length; i++) {
      const preppedEncentivUtilities = await this.prepareForRealm(encentivUtilities[i])
      preppedRecords.push(preppedEncentivUtilities)
    }

    await this.create(preppedRecords, true)
  }

  static async prepareForRealm(entry) {
    delete entry.created_at; // Not needed in realm
    delete entry.updated_at; // Not needed in realm
    delete entry.eiacode; // Not needed in realm
    delete entry.rebate_bus_id; // Not needed in realm
    delete entry.rebate_bus_name; // Not needed in realm

    return entry;
  }

}

EncentivUtility.schema = encentivUtilitySchema;

