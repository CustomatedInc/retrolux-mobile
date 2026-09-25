import { facilityTypeSchema } from '../schema'
import realm from '../realm';
import Model from '../model'

export class FacilityType extends Model {
  static find(id) {
    return realm.objects(this.schema.name).filtered('active = true').filtered('id = $0', id)[0]
  }

  static async createAllFromServer(facilityTypes) {
    const preppedRecords = []
    for (let i = 0; i < facilityTypes.length; i++) {
      const preppedFacilityTypes = await this.prepareForRealm(facilityTypes[i])
      preppedRecords.push(preppedFacilityTypes)
    }

    await this.create(preppedRecords, true)
  }

  static async prepareForRealm(entry) {
    delete entry.created_at; // Not needed in realm
    delete entry.updated_at; // Not needed in realm
    delete entry.sort_order; // Not needed in realm

    entry.inactive_at = entry.inactive_at ? new Date(entry.inactive_at) : null
    return entry;
  }

}

FacilityType.schema = facilityTypeSchema;

