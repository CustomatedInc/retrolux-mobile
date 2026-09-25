import UUIDGenerator from 'react-native-uuid-generator';

import Model from '../model'
import { CustomAttribute } from './CustomAttribute';
import { Editable } from '../mixins/Editable'
import { customAttributeListItemSchema } from '../schema'

export class CustomAttributeListItem extends Editable(Model) {
  static async prepareForRealm(listItem, mobileCustomAttributeId, mobileId) {
    listItem.server_id = listItem.id;
    delete listItem.id;
    listItem.mobile_id = mobileId;
    listItem.edited = false;
    listItem.mobile_custom_attribute_id = mobileCustomAttributeId
    return listItem;
  }

  async toProjectFormat(mobileCustomAttributeId, mobileId) {
    return {
      ...this,
      server_id: null,
      custom_attribute_id: null,
      mobile_id: mobileId,
      mobile_custom_attribute_id: mobileCustomAttributeId,
      uuid: await UUIDGenerator.getRandomUUID(),
    }
  }
}

CustomAttributeListItem.schema = customAttributeListItemSchema;
