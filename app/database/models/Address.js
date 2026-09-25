import Model from '../model'
import { Project } from  './Project';
import { Location } from  './Location';
import { addressSchema } from '../schema'

export class Address extends Model {
  static find(id) {
    return realm.objects(this.schema.name).filtered('active = true').filtered('id = $0', id)[0]
  }

  static async createAllFromServer(addresses) {
    const preppedRecords = []
    let lastFound = await Address.nextId();

    for (let i = 0; i < addresses.length; i++) {
      const preppedAddress = await this.prepareForRealm(addresses[i])
      const found = await this.findServer(preppedAddress.server_id);

      if (!!found) {
        preppedAddress.mobile_id = found.mobile_id
        preppedRecords.push(preppedAddress);
      } else {
        preppedAddress.mobile_id = lastFound
        lastFound =  lastFound + 1
        preppedRecords.push(preppedAddress);
      }
    }

    await this.create(preppedRecords, true)
  }

  static async prepareForRealm(entry) {
    entry.server_id = entry.id;
    delete entry.id;

    let addressable;
    switch(entry.addressable_type) {
      case 'Project':
        addressable = await Project.findServer(entry.addressable_id);
        break;
      case 'Location':
        addressable = await Location.findServer(entry.addressable_id);
        break;
    }

    entry.addressable_mobile_id = addressable.mobile_id;

    entry.created_at = entry.created_at ? new Date(entry.created_at) : null
    entry.updated_at = entry.updated_at ? new Date(entry.updated_at) : null
    entry.inactive_at = entry.inactive_at ? new Date(entry.inactive_at) : null

    return entry;
  }

}

Address.schema = addressSchema;

export const STATES = [
  { name: 'Alabama', id: 'AL' },
  { name: 'Alaska', id: 'AK' },
  { name: 'Arizona', id: 'AZ' },
  { name: 'Arkansas', id: 'AR' },
  { name: 'California', id: 'CA' },
  { name: 'Colorado', id: 'CO' },
  { name: 'Connecticut', id: 'CT' },
  { name: 'Delaware', id: 'DE' },
  { name: 'District of Columbia', id: 'DC' },
  { name: 'Florida', id: 'FL' },
  { name: 'Georgia', id: 'GA' },
  { name: 'Hawaii', id: 'HI' },
  { name: 'Idaho', id: 'ID' },
  { name: 'Illinois', id: 'IL' },
  { name: 'Indiana', id: 'IN' },
  { name: 'Iowa', id: 'IA' },
  { name: 'Kansas', id: 'KS' },
  { name: 'Kentucky', id: 'KY' },
  { name: 'Louisiana', id: 'LA' },
  { name: 'Maine', id: 'ME' },
  { name: 'Maryland', id: 'MD' },
  { name: 'Massachusetts', id: 'MA' },
  { name: 'Michigan', id: 'MI' },
  { name: 'Minnesota', id: 'MN' },
  { name: 'Mississippi', id: 'MS' },
  { name: 'Missouri', id: 'MO' },
  { name: 'Montana', id: 'MT' },
  { name: 'Nebraska', id: 'NE' },
  { name: 'Nevada', id: 'NV' },
  { name: 'New Hampshire', id: 'NH' },
  { name: 'New Jersey', id: 'NJ' },
  { name: 'New Mexico', id: 'NM' },
  { name: 'New York', id: 'NY' },
  { name: 'North Carolina', id: 'NC' },
  { name: 'North Dakota', id: 'ND' },
  { name: 'Ohio', id: 'OH' },
  { name: 'Oklahoma', id: 'OK' },
  { name: 'Oregon', id: 'OR' },
  { name: 'Pennsylvania', id: 'PA' },
  { name: 'Puerto Rico', id: 'PR' },
  { name: 'Rhode Island', id: 'RI' },
  { name: 'South Carolina', id: 'SC' },
  { name: 'South Dakota', id: 'SD' },
  { name: 'Tennessee', id: 'TN' },
  { name: 'Texas', id: 'TX' },
  { name: 'Utah', id: 'UT' },
  { name: 'Vermont', id: 'VT' },
  { name: 'Virginia', id: 'VA' },
  { name: 'Washington', id: 'WA' },
  { name: 'West Virginia', id: 'WV' },
  { name: 'Wisconsin', id: 'WI' },
  { name: 'Wyoming', id: 'WY' }
]
