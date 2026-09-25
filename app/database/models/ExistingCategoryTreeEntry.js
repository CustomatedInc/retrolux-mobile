import { existingCategoryTreeEntrySchema } from '../schema'
// import { AsyncStorage } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { EXISTING_CATEGORY_TYPES } from '../../resources/constants';
import realm from '../realm';
import _ from 'lodash'
import Model from '../model'

export class ExistingCategoryTreeEntry extends Model {
  static find(id) {
    return realm.objects(this.schema.name).filtered('active = true').filtered('id = $0', id)[0]
  }

  static async createAllFromServer(existingCategoryTrees) {
    const preppedRecords = []
    for (let i = 0; i < existingCategoryTrees.length; i++) {
      const preppedExistingCategoryTree = await this.prepareForRealm(existingCategoryTrees[i])
      preppedRecords.push(preppedExistingCategoryTree)
    }

    await this.create(preppedRecords, true)
  }

  static async prepareForRealm(entry) {
    delete entry.created_at;
    delete entry.updated_at;
    delete entry.inactivated_by_user_id;
    entry.inactive_at = entry.inactive_at ? new Date(entry.inactive_at) : null
    entry.product_query = JSON.stringify(entry.product_query)
    return entry;
  }

  static get categoryTypes() {
    return AsyncStorage.getItem(EXISTING_CATEGORY_TYPES);
  }

  static get topLevelEntries() {
    return realm.objects(this.schema.name).filtered('active = true').filtered('parent_id = null').sorted('category_name')
  }

  get productFilter() {
    let queryObject = JSON.parse(this.product_query);
    return _(queryObject).keys().map(k => `${k} = ${queryObject[k]}`).join(' AND ');
  }

  get products() {
    let queryObject = JSON.parse(this.product_query);
    const filter = _(queryObject).keys().map(k => `${k} = ${queryObject[k]}`).join(' AND ');
    return realm.objects('ExistingLighting').filtered(`shown = true AND active = true AND mobile_project_id = null AND project_id = null AND ${filter}`)
  }

  get level() {
    const queryObject = JSON.parse(this.product_query);
    return Object.keys(queryObject).length;
  }

  get parent() {
    return realm.objects('ExistingCategoryTreeEntry').filtered('active = true').filtered('id = $0', this.parent_id)[0]
  }

  get children() {
    return realm.objects('ExistingCategoryTreeEntry').filtered('active = true').filtered('parent_id = $0', this.id).sorted('category_name')
  }
}

ExistingCategoryTreeEntry.schema = existingCategoryTreeEntrySchema;

