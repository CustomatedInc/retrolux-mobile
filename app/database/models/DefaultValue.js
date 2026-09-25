// import Model from '../model'
// import { defaultValueSchema } from '../schema'
// import { Project } from './Project';
// import realm from '../realm';

// export class DefaultValue extends Model {
//   static async createAllFromServer(defaultValues) {
//     for (var i = 0; i < defaultValues.length; i++) {
//       let defaultValue = defaultValues[i];
//       defaultValue = await this.prepareForRealm(defaultValue);
//       await this.create(defaultValue, true);
//     }
//   }

//   static async prepareForRealm(defaultValue) {
//     delete defaultValue.modifier_id;
//     delete defaultValue.created_at;
//     delete defaultValue.updated_at;

//     let project = await Project.findServer(defaultValue.defaultable_id) // defaultValue.defaultable_id == project.server_id
//     defaultValue.mobile_project_id = project.mobile_id
//     return defaultValue
//   }
// }

// DefaultValue.schema = defaultValueSchema;