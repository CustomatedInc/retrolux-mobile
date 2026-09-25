import UUIDGenerator from 'react-native-uuid-generator';

import Model from '../model'
import { Project } from './Project';
import { CustomAttributeListItem } from './CustomAttributeListItem';
import { Editable } from '../mixins/Editable'
import { customAttributeSchema } from '../schema'
import realm from '../realm';

export class CustomAttribute extends Editable(Model) {
  static async createAll(attributes, template=false) {
    const customAttributeData = []
    let latestAttributeMobileId = await this.nextId()
    const existingAttributeLookup = await this.serverMobileIdLookupBatch()

    const listItemData = []
    let latestListItemMobileId = await CustomAttributeListItem.nextId()
    const existingListItemLookup = await CustomAttributeListItem.serverMobileIdLookupBatch()

    for (let i = attributes.length - 1; i >= 0; --i) {
      const attribute = attributes[i];
      
      const listItems = attribute.custom_attribute_list_items;      
      delete attribute.custom_attribute_list_items
      
      let mobileAttributeId = null
      
      const foundAttributeMobileId = existingAttributeLookup.get(attribute.id);

      if(!!foundAttributeMobileId) {
        mobileAttributeId = foundAttributeMobileId
      } else {
        mobileAttributeId = latestAttributeMobileId
      }
      
      let preppedAttribute = {};
      if (template) {
        preppedAttribute = await this.prepareTemplateAttributeForRealm(attribute, mobileAttributeId)
      } else {
        preppedAttribute = await this.prepareForRealm(attribute, mobileAttributeId)
      }

      customAttributeData.push(preppedAttribute)

      if (!!listItems) {
        let length2 = listItems.length;
        for (let j = length2 - 1; j >= 0; --j) {
          const item = listItems[j];

          let mobileItemId = null

          const foundItemMobileId = existingListItemLookup.get(item.id);

          if(!!foundItemMobileId) {
            mobileItemId = foundItemMobileId
          } else {
            mobileItemId = latestListItemMobileId
          }

          const preppedItem = await CustomAttributeListItem.prepareForRealm(item, preppedAttribute.mobile_id, mobileItemId);
          listItemData.push(preppedItem)

          if(mobileItemId == latestListItemMobileId) latestListItemMobileId++
        }
      }

      if( mobileAttributeId == latestAttributeMobileId) latestAttributeMobileId++
    }

    // console.log("customAttributeData count ---- ", customAttributeData.length);
    // console.log("listItemData count ---- ", listItemData.length);
    
    await this.insertPreppedDataIntoRealm(customAttributeData, listItemData)
  }

  static async insertPreppedDataIntoRealm(customAttributeData, listItemData) {
    await realm.write(() => {
      customAttributeData.forEach(attribute => {
        realm.create('CustomAttribute', attribute, true)
      })

      listItemData.forEach(item => {
        realm.create('CustomAttributeListItem', item, true)
      })
    })

    return;
  }

  /**
   * Used for Project CustomAttribute models only
   *
   * Use prepareTemplateAttributeForRealm for CustomAttribute records that
   * are part of a Company Template.
   */
  static async prepareForRealm(attribute, mobileId) {
    attribute.server_id = attribute.id;
    delete attribute.id;
    attribute.mobile_id = mobileId;
    attribute.edited = false;
    let project = await Project.findServer(attribute.project_id)
    attribute.mobile_project_id = project.mobile_id

    return attribute;
  }

  static async prepareTemplateAttributeForRealm(attribute, mobileId) {
    attribute.server_id = attribute.id;
    delete attribute.id;
    attribute.edited = false;
    attribute.mobile_id = mobileId;

    return attribute;
  }

  async toProjectFormat(mobileProjectId, projectId, mobileId) {
    return {
      ...this,
      server_id: null,
      mobile_id: mobileId,
      company_template_id: null,
      project_id: projectId,
      mobile_project_id: mobileProjectId,
      uuid: await UUIDGenerator.getRandomUUID(),
    }
  }

  async prepareForApi() {
    return {
      ...this.toPlainObject(),
      custom_attribute_list_items: await this.customAttributeListItemForApi(),
    }
  }

  async customAttributeListItemForApi() {
    const listItems = await this.listItems()
    if (!!listItems) {
      return listItems.map(item => item.toPlainObject())
    } else {
      return []
    }
  }

  listItems() {
    return realm.objects('CustomAttributeListItem').filtered('mobile_custom_attribute_id = $0', this.mobile_id).sorted('display_order')
  }

  labelFromUuid(uuid) {
    listItem = realm.objects('CustomAttributeListItem').filtered('mobile_custom_attribute_id = $0 AND uuid = $1', this.mobile_id, uuid)[0]
    return !!listItem ? listItem.label : null
  }

  uuidFromLabel(label) {
    if (!label) { return; }
    listItem = realm.objects('CustomAttributeListItem').filtered('mobile_custom_attribute_id = $0 AND label = $1', this.mobile_id, label.toString())[0]
    return !!listItem ? listItem.uuid : this.getOtherUuid()
  }

  getOtherUuid() {
    otherListItem = realm.objects('CustomAttributeListItem').filtered('mobile_custom_attribute_id = $0 AND label = $1', this.mobile_id, "Other")[0]
    return !!otherListItem ? otherListItem.uuid : null
  }
}

export const customAttributeScopes = {
  project: results => results.filtered('attributable_type = "project"'),
  location: results => results.filtered('attributable_type = "location"'),
  area: results => results.filtered('attributable_type = "area"'),
  existingLighting: results => results.filtered('attributable_type = "existing_lighting"'),
  doorSchedule: results => results.filtered('attributable_type = "door_schedule"'),
  existingFixture: results => results.filtered('attributable_type = "existing_fixture"'),
  existingDoor: results => results.filtered('attributable_type = "existing_door"'),
  primary: results => results.filtered('tab = "primary"'),
  additional: results => results.filtered('tab = "additional"'),
  required: results => results.filtered('required_to_complete = true'),
  byTab: results => results.sorted('tab', true), // primary then additional
}

CustomAttribute.schema = customAttributeSchema;
