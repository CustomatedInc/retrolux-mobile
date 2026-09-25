import Model from '../model'
import { categorySchema } from '../schema'
import _ from 'lodash'

export class Category extends Model {

  static prepareForRealm(category) {
    return _.pick(category, ['id', 'name', 'category_type'])
  }

}

Category.schema = categorySchema;
