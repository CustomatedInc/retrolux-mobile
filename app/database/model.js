import realm from './realm';
import _ from 'lodash';
import { utcNow } from '../lib/dateHelpers';
import { Realm } from '@realm/react'
export default class Model extends Realm.Object {

  static create(data, update = false) {
    if(data instanceof Array) {
    realm.write(() => {
      data.forEach(dataObject => {
        realm.create(this.schema.name, dataObject, update)
      })
    })
  } else {
      realm.write(() => {
        return realm.create(this.schema.name, data, update)
      })
    }
  }

  // only works with records that have a primary key of mobile_id
  static updateServerIds(records) {
    for(const record of records) {
      this.updateServerId(record)
    }
  }

  static updateServerId(record) {
    realm.write(() => {
      realm.create(this.schema.name, { mobile_id: record.mobile_id, server_id: record.server_id, edited: false }, true);
    });
  }

  // EXPERIMENTAL: returns an object of the class type with all values equal to null
  static get new() {
    return _.mapValues(this.schema.properties, function (v) { return null; })
  }

  static get actives() {
    return realm.objects(this.schema.name).filtered('active = true')
  }

  static get all() {
    return realm.objects(this.schema.name)
  }

  static get allArray() {
    const results = realm.objects(this.schema.name).map(x => Object.assign({}, x));

    return results;
  }
  
  static get allArrayServerMobileID() {
    const pageSize = 100000; // Adjust this based on memory constraints
    const totalRecords = realm.objects(this.schema.name).length;
    let pageNumber = 1;

    let finalArray = [];
    while ((pageNumber - 1) * pageSize < totalRecords) {
      const results = realm
        .objects(this.schema.name)
        .sorted("server_id") // Sorting for consistency
        .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
        .map(({ mobile_id, server_id }) => ({ mobile_id, server_id })); // Fetch only required fields

      // console.log(`Page ${pageNumber}:`, results.length);
      finalArray = finalArray.concat(results);
      pageNumber++; // Move to the next page
    }
    
    // console.log("Schema --- ", this.schema.name,"   Fetched results --- ", finalArray.length);

    return finalArray;
  }

  static get allJson() {
    return (async () => {
      let records = await realm.objects(this.schema.name);
      let object_array = records.map(record => Object.assign({}, record));
      return JSON.stringify(object_array);
    })();
  }

  static get newAndEdited() {
    return (async () => {
      let newRecords = await this.all.filtered('server_id = null').map(x => Object.assign({}, x));
      let editedRecords = await this.all.filtered('edited = true').map(x => Object.assign({}, x));
      return _.union(newRecords, editedRecords);
    })();
  }

  static async findOrNextMobileId(server_id) {
    const found = await this.findServer(server_id)

    if(!!found && !!found.mobile_id) {
      return found.mobile_id
    } else {
      const nextMobileId = await this.nextId()
      return nextMobileId
    }
  }

  static async nextId() {
    let objects = await realm.objects(this.schema.name).sorted('mobile_id');
    if (objects.length > 0) {
      const maxId = objects[objects.length-1].mobile_id;
      return maxId + 1;
    }
    return 1;
  }

  static deleteAll() {
    realm.write(() => {
      realm.delete(this.all)
    })
  }

  static find(mobile_id) {
    return realm.objects(this.schema.name).filtered('mobile_id = $0', mobile_id)[0]
  }

  static findServer(server_id) {
    return realm.objects(this.schema.name).filtered('server_id = $0', server_id)[0]
  }

  static async translateId(server_id) {
    if (server_id === null) { return null; }
    let record = await this.findServer(server_id);
    if (!record) { return null; }
    return record.mobile_id;
  }

  get isNew() {
    return this.server_id === null
  }

  get isEdited() {
    return(this.server_id !== null && this.edited === true);
  }

  toPlainObject() {
    return Object.assign({}, this)
  }

  delete() {
    realm.write(() => {
      realm.delete(this)
    });
  }

  setProp(prop, value) {
    realm.write(() => {
      this[prop] = value
    })
  }

  deactivate() {
    realm.write(() => {
      this.edited = true;
      this.active = false;
      this.inactive_at = utcNow();
    });
  }
}
