import Model from '../model'
import { companyTemplateSchema } from '../schema'
import { CustomAttribute } from  './CustomAttribute';
import { CustomAttributeListItem } from  './CustomAttributeListItem';

import realm from '../realm';

export class CompanyTemplate extends Model {
  static async createAllFromServer(templates) {

    console.log("templates count ", templates.length);
    
    const preppedTemplates = [];
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      await CustomAttribute.createAll(template.custom_attributes, true);
      delete template.custom_attributes;
      preppedTemplates.push(template);
    }
    
    await this.create(preppedTemplates, true);
  }

  // Returns {"attribute1":'',"attribute2":"", etc.}
  async cleanAttributes(attributable_type) {
    outCustomAttributes = {};
    const attributes = await this.customAttributes().filtered('attributable_type = $0', attributable_type)
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      outCustomAttributes[attribute.code_name] = null;
    }
    return JSON.stringify(outCustomAttributes);
  }

  customAttributes() {
    return realm.objects('CustomAttribute').filtered('company_template_id = $0', this.id)
  }

  async copyTemplateToNewProject(mobileProjectId, projectId) {
    const templateAttributes = await this.customAttributes()

    const customAttributeData = []
    let latestAttributeMobileId = await CustomAttribute.nextId()

    const listItemData = []
    let latestListItemMobileId = await CustomAttributeListItem.nextId()

    let length1 = templateAttributes.length
    for (let i = length1 - 1; i >= 0; --i) {
      const templateAttribute = templateAttributes[i];
      const projectAttribute = await templateAttribute.toProjectFormat(mobileProjectId, projectId, latestAttributeMobileId)
      customAttributeData.push(projectAttribute)

      const listItems = await templateAttribute.listItems()
      if (!!listItems) {
        let length2 = listItems.length;
        for (let j = length2 - 1; j >= 0; --j) {
          const listItem = listItems[j];
          const projectListItem = await listItem.toProjectFormat(projectAttribute.mobile_id, latestListItemMobileId)
          listItemData.push(projectListItem)

          latestListItemMobileId++
        }
      }

      latestAttributeMobileId++
    }

    await CustomAttribute.insertPreppedDataIntoRealm(customAttributeData, listItemData)

    return templateAttributes
  }
}

CompanyTemplate.schema = companyTemplateSchema;
