import _ from 'lodash';
import UUIDGenerator from 'react-native-uuid-generator';

import Model from '../model';
import realm from '../realm';
import { areaSchema } from '../schema'
import { Project } from  './Project';
import { Location } from  './Location';
import { Attachment } from  './Attachment';
import { RateSchedule } from  './RateSchedule';
import { OperatingSchedule } from  './OperatingSchedule';
import { Heating } from  './Heating';
import { Cooling } from  './Cooling';
import { FloorPlan } from  './FloorPlan';
import { Editable } from '../mixins/Editable'
import { CustomAttributable } from '../mixins/CustomAttributable'
import { compose } from '../../lib/utilities';
import { utcNow } from '../../lib/dateHelpers';
import memoize from 'fast-memoize';

const memoInProject =  memoize((project) => {
  if (project.mobile_location_scope_ids.length > 0) {
    const customFilter = project.mobile_location_scope_ids.map((mobile_id) => `mobile_location_id = ${mobile_id}`).join(' OR ')
    return realm.objects('Area').filtered(`mobile_project_id = ${project.mobile_id} AND active = true`).filtered(customFilter);
  } else {
    return realm.objects('Area').filtered(`mobile_project_id = ${project.mobile_id} AND active = true`);
  }
});

export class Area extends compose(Editable, CustomAttributable)(Model) {
  static inProject(project) {
    return memoInProject(project)
  }

  static search(searchText, project) {
    areas = this.inProject(project)
    return (
      areas.filtered(`name_with_parents CONTAINS[c] $0 LIMIT(50)`, searchText)
    )
  }

  static async recursivelyUpdateServerIds(areas) {
    for(area of areas) {
      Area.updateServerId(area)
      ExistingFixture.updateServerIds(area.existing_fixtures)
      Area.recursivelyUpdateServerIds(area.areas)
    }
  }

  static async createAllFromServer(areas) {
    const preppedAreas = []
    for (let index = 0; index < areas.length; index++) {
      const preppedArea = await this.prepareForRealm(areas[index]);
      const found = await this.findServer(preppedArea.server_id);

      if (!!found) {
        preppedAreas.push(preppedArea);
      } else {
        preppedArea.mobile_id = preppedArea.mobile_id + index
        preppedAreas.push(preppedArea);
      }
    }

    await this.create(preppedAreas, true);

    await this.updateFromServerParentIds()
  }

  static async updateFromServerParentIds() {
    const areasWithParents = await realm.objects('Area').filtered(`parent_id != null`)
    await realm.write(() => {

      for (let i = 0; i < areasWithParents.length; i++) {
        const area = areasWithParents[i];
        const parent = Area.findServer(area.parent_id)
        area.mobile_parent_id = parent.mobile_id
      }

    })
  }

  static async prepareForRealm(area) {
    area.server_id = area.id;
    await delete area.id;
    area.mobile_id = await this.findOrNextMobileId(area.server_id);
    area.edited = false;
    area.created_at = area.created_at ? new Date(area.created_at) : null
    area.updated_at = area.updated_at ? new Date(area.updated_at) : null
    area.inactive_at = area.inactive_at ? new Date(area.inactive_at) : null
    area.sqft = area.sqft ? String(area.sqft) : null
    area.avg_illuminace = area.avg_illuminace ? String(area.avg_illuminace) : null
    area.ceiling_height = area.ceiling_height ? String(area.ceiling_height) : null
    area.width = area.width ? String(area.width) : null
    area.length = area.length ? String(area.length) : null
    let project = await Project.findServer(area.project_id)
    area.mobile_project_id = project.mobile_id

    area.custom_attributes = JSON.stringify(area.custom_attributes);

    if (area.location_id) {
      let location = await Location.findServer(area.location_id)
      area.mobile_location_id = location.mobile_id
    }

    area.mobile_rate_schedule_id = await RateSchedule.translateId(area.rate_schedule_id)
    area.mobile_operating_schedule_id = await OperatingSchedule.translateId(area.operating_schedule_id)
    area.mobile_heating_id = await Heating.translateId(area.heating_id)
    area.mobile_cooling_id = await Cooling.translateId(area.cooling_id)
    return area
  }

  static async prepareFormData(data, project) {
    if (!data.mobile_id) {
      data.active = true;
      data.area_count = 1;
      data.edited = false;
      data.mobile_id = await this.nextId();
      data.project_id = project.server_id ? parseInt(project.server_id) : null;
      data.mobile_project_id = parseInt(project.mobile_id);
      data.server_id = null;
      data.uuid = await UUIDGenerator.getRandomUUID();
      data.created_at = utcNow();
      data.updated_at = utcNow();
      data.code = await this.nextCode(project.mobile_id);
    } else {
      data.edited = true;
      data.updated_at = utcNow();
    }

    return data
  }

  async deactivatePins(model) {
    const pins = await model.pins

    if (pins.length > 0) {
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        pin.deactivate();
      }
    }
  }

  async cascadeDeletePins() {
    // Removes Children Pins and Children ExistingFixture Pins
    let children = await this.children;
    for (var i = 0; i < children.length; i++) {
      const child = children[i];

      let childExistingFixtures = await child.existingFixtures
      for (let l = 0; l < childExistingFixtures.length; l++) {
        const childExistingFixture = childExistingFixtures[l];
        await this.deactivatePins(childExistingFixture)
      }

      let childAttachments = await Area.attachments(child.mobile_id)
      for (let k = 0; k < childAttachments.length; k++) {
        const childAttachment = childAttachments[k];
        const pin = await childAttachment.pin
        if (pin) { await pin.deactivate(); }
      }

      await this.deactivatePins(child);

      await child.cascadeDeletePins();
    }

    // Removes CurrentArea Pins and ExistingFixture Pins
    let existingFixtures = await this.existingFixtures
    for (let m = 0; m < existingFixtures.length; m++) {
      const existingFixture = existingFixtures[m];
      await this.deactivatePins(existingFixture)
    }

    let attachments = await Area.attachments(this.mobile_id)
    for (let j = 0; j < attachments.length; j++) {
      const attachment = attachments[j];
      const pin = await attachment.pin
      if (pin) { await pin.deactivate(); }
    }

    await this.deactivatePins(this)
  }

  static async didLocationChange(beforeId, afterArea) {
    if (!beforeId) { return false; }
    const beforeArea = realm.objects('Area').filtered(`mobile_id = $0`, beforeId)[0]
    if (!beforeArea) { return false; }

    // If we get past this if, return true since mobile_location_id changed
    if (beforeArea.mobile_location_id == afterArea.mobile_location_id) { return false; }

    const descendantIds = await beforeArea.descendantMobileIds();
    if (descendantIds.length < 1) { return true; }

    const descendantsFilter = descendantIds.map((id) => `mobile_id = ${id}`).join(' OR ')

    let descendants = realm.objects('Area').filtered(descendantsFilter)
    let location = realm.objects('Location').filtered(`mobile_id = $0`, afterArea.mobile_location_id)[0];

    realm.write(() => {
      for (let i = 0; i < descendants.length; i++) {
        let descendant = descendants[i];
        descendant.updated_at = utcNow();
        descendant.edited = true;
        
        if (location) {
          descendant.mobile_location_id = location.mobile_id;
          descendant.location_id = location.server_id;
        } else {
          descendant.mobile_location_id = null;
          descendant.location_id = null;
        }
      }
    });

    return true;
  }

  // beforeArea == realm.object, afterArea == js.Object
  static async checkToRemovePins(beforeArea, afterArea) {
    // Moving top level Area undernarth another Area is fine. Validation prevents moving underneath another FloorPlan.
    if (beforeArea.floor_plan) { return; }

    // No FloorPlan then moving under another Area does not matter.
    if (!beforeArea.findFloorPlan) { return; }

    const newParent = await realm.objects('Area').filtered(`mobile_id = $0`, afterArea.mobile_parent_id)[0]

    // Had a FloorPlan now does not - remove Pins.
    if (!newParent || !newParent.findFloorPlan) {
      beforeArea.cascadeDeletePins()
      return;
    }

    // Changed to a different FloorPlan - remove Pins.
    if (beforeArea.findFloorPlan.mobile_id != newParent.findFloorPlan.mobile_id) {
      beforeArea.cascadeDeletePins()
      return;
    }
  }

  static async didParentChange(beforeId, afterArea) {
    if (!beforeId) { return false; }
    const beforeArea = await realm.objects('Area').filtered(`mobile_id = $0`, beforeId)[0]
    if (!beforeArea) { return false; }

    // Did not change parent Area
    if (beforeArea.mobile_parent_id == afterArea.mobile_parent_id) { return false; }

    // AfterSave functions tied to mobile_parent_id change
    await Area.checkToRemovePins(beforeArea, afterArea)
    await Area.updateLocation(beforeArea, afterArea)

    return true;
  }

  // beforeArea == realm.object, afterArea == js.Object
  static async updateLocation(beforeArea, afterArea) {
    const nextMobileParentId = afterArea.mobile_parent_id;

    if (nextMobileParentId) {
      const nextParent = await realm.objects('Area').filtered(`mobile_id = $0`, nextMobileParentId)[0]

      if (nextParent.mobile_location_id != beforeArea.mobile_location_id) {
        newLocationId = nextParent.mobile_location_id;
      } else {
        newLocationId = beforeArea.mobile_location_id;
      }

    } else {
      newLocationId = beforeArea.mobile_location_id;
    }

    const descendantIds = await beforeArea.descendantMobileIds();
    descendantIds.push(beforeArea.mobile_id)
    const customFilter = descendantIds.map((id) => `mobile_id = ${id}`).join(' OR ')

    let selfPlusDescendants = realm.objects('Area').filtered(customFilter)

    const location = await realm.objects('Location').filtered(`mobile_id = $0`, newLocationId)[0];

    await realm.write(() => {
      for (let i = 0; i < selfPlusDescendants.length; i++) {
        const area = selfPlusDescendants[i];
        area.updated_at = utcNow();
        area.edited = true;
        if (location) {
          area.mobile_location_id = location.mobile_id;
          area.location_id = location.server_id;
        } else {
          area.mobile_location_id = null;
          area.location_id = null;
        }
      }
    })

  }

  static async didIlluminanceChange(beforeId, afterArea) {
    if (!beforeId) { return; }
    const beforeArea = await realm.objects('Area').filtered(`mobile_id = $0`, beforeId)[0]
    if (!beforeArea) { return; }

    illuminanceArray = ['first_illuminance', 'second_illuminance', 'third_illuminance', 'fourth_illuminance', 'fifth_illuminance']
    for (let i = 0; i < illuminanceArray.length; i++) {
      const illuminance = illuminanceArray[i];
      const beforeAreaAttributes = JSON.parse(beforeArea.custom_attributes)
      const afterAreaAttributes = JSON.parse(afterArea.custom_attributes)
      if (!beforeAreaAttributes.hasOwnProperty(illuminance)) { continue; }

      if (beforeAreaAttributes[illuminance] || beforeAreaAttributes[illuminance] === 0) {
        if (!afterAreaAttributes[illuminance] && afterArea[illuminance] !== 0) {
          pin = await beforeArea.getPin(illuminance)
          if (!!pin) {
            pin.deactivate()
          }
        }
      }
    }
  }

  static async nextCode(mobile_project_id) {
    lastArea = await realm.objects("Area").filtered(`mobile_project_id = ${mobile_project_id}`).sorted('code', true)[0];
    return !!lastArea ? lastArea.code + 1 : 1
  }

  get productsCount() {
    return realm.objects('ExistingFixture').filtered(`mobile_area_id= ${this.mobile_id} AND active = true`).length
  }

  async deactivate() {
    await realm.write(() => {
      this.active = false
      this.inactive_at = utcNow()
      this.edited = true
    });

    let pins = await this.pins
    if (pins.length > 0) {
      for (let k = 0; k < pins.length; k++) {
        const pin = pins[k];
        await pin.deactivate();
      }
    }

    if (this.floor_plan) {
      await this.floor_plan.deactivate();
    }

    let existingFixtures = await this.existingFixtures
    if (existingFixtures.length > 0) {
      for (let j = 0; j < existingFixtures.length; j++) {
        await existingFixtures[j].deactivate() ;
      }
    }

    let children = await this.children;
    if (children.length > 0) {
      for (var i = 0; i < children.length; i++) {
        await children[i].deactivate()
      }
    }

    Attachment.deleteByAttachable('Area', this.mobile_id)
  }

  get newAndEditedFixtures() {
    return(
      realm
        .objects('ExistingFixture')
        .filtered(`mobile_area_id = ${this.mobile_id}`)
        .filtered('server_id = null OR edited = true')
    );
  }

  async prepareForApi() {
    return {
      ...this.toSyncableFormat(),
      existing_fixtures: await this.existingFixtureDataForApi(),
      floor_plans: await this.floorPlanDataForApi(),
      pins: await this.pinDataForApi()
    }
  }

  async pinDataForApi() {
    const pins = await this.sync_pins
    if (pins.length > 0) {
      outArray = []
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        layer_uuid = await pin.layer.uuid
        const plainPinObject = Object.assign({}, pin)
        plainPinObject['layer_uuid'] = layer_uuid
        outArray.push(plainPinObject)
      }
      return outArray

    } else {
      return []
    }
  }

  async floorPlanDataForApi() {
    const floorPlans = await this.sync_floor_plans

    if (floorPlans) {
      outArray = []
      for (let i = 0; i < floorPlans.length; i++) {
        const floorPlan = floorPlans[i];
        outArray.push({
          ...floorPlan.toPlainObject(),
          layers: floorPlan.sync_layers.length > 0 ? floorPlan.sync_layers.map(layer => Object.assign({}, layer)) : [],
        })
      }
      return outArray

    } else {
      return []
    }
  }

  async existingFixtureDataForApi() {
    const fixtures = await this.newAndEditedFixtures;
    const outArray = []
    for (let i = 0; i < fixtures.length; i++) {
      const fixture = fixtures[i];
      plainObjectFixture = Object.assign({}, fixture)

      const allPins = await fixture.sync_pins
      if (allPins.length > 0) {
        const outPinsArray = []
        for (let k = 0; k < allPins.length; k++) {
          const pin = allPins[k];
          const plainPinObject = await pin.toPlainObject()
          plainPinObject['layer_uuid'] = await pin.layer.uuid
          outPinsArray.push(plainPinObject)
        }

        plainObjectFixture['pins'] = outPinsArray
      } else {
        plainObjectFixture['pins'] = []
      }

      outArray.push(plainObjectFixture)
    }
    return outArray
  }

  static attachments(id) {
    return realm.objects('Attachment').filtered(`active = true AND attachable_type = 'Area' AND attachable_mobile_id = $0`, id);
  }

  get children() {
    return realm.objects('Area').filtered('mobile_parent_id = $0', this.mobile_id).snapshot();
  }

  get existingFixtures() {
    return realm.objects('ExistingFixture').filtered(`mobile_area_id= ${this.mobile_id} AND active = true`).snapshot();
  }

  async descendantsArray() {
    const children = await this.children;
    if (children.length === 0) { return [] }
    let descendantsArray = children.map(area => Object.assign({}, area))
    for (let childArea of children) {
      const branchDescendants = await childArea.descendantsArray()
      descendantsArray = descendantsArray.concat(branchDescendants.map(area => Object.assign({}, area)))
    }
    return descendantsArray;
  }

  async descendantMobileIds() {
    let descendants = await this.descendantsArray();
    return descendants.map(descendant => descendant.mobile_id)
  }

  static async getDescendantMobileIds(area) {
    let descendants = await area.descendantsArray();
    return descendants.map(descendant => descendant.mobile_id)
  }

  static async potentialParentAreas(areaObject, project) {
    allProjectAreas = this.inProject(project)

    // // Only consider areas in same location
    // if (areaObject.mobile_location_id) {
    //   allProjectAreas = await allProjectAreas.filtered(`mobile_location_id = ${areaObject.mobile_location_id}`);
    // }

    if (areaObject.mobile_id) {
      area = await realm.objects('Area').filtered(`mobile_id = ${areaObject.mobile_id}`)[0];
      const areasExcludingSelf = await allProjectAreas.filtered(`mobile_id != ${area.mobile_id}`);
      const descendantMobileIds = await area.descendantMobileIds();

      if (descendantMobileIds.length > 0) {
        const descendantsFilter = descendantMobileIds.map((mobile_id) => 'mobile_id != ' + mobile_id).join(' AND ')
        const areasExcludingDescendants = await areasExcludingSelf.filtered(descendantsFilter);
        return areasExcludingDescendants;
      } else {
        return areasExcludingSelf;
      }

    } else {
      return allProjectAreas
    }
    
  }

  async createCopy(mobileParentId = null, locationId = null) {
    const copiedData = await this.copyObject(mobileParentId, locationId)
    await this.constructor.create(copiedData)

    const fixturesToCopy = await this.existingFixtures
    for (const fixture of fixturesToCopy) {
      await fixture.createCopy(copiedData.mobile_id)
    }

    const childAreasToCopy = await this.children
    for (const childArea of childAreasToCopy) {
      await childArea.createCopy(copiedData.mobile_id, locationId)
    }

    return copiedData.mobile_id
  }

  async copyObject(mobileParentId, locationId) {
    const copyName = locationId ? this.name : mobileParentId ? this.name : `${this.name} - copy`;
    const copyMobileParentId = mobileParentId || this.mobile_parent_id
    const copyLocationId = locationId || this.mobile_location_id
    return {
      ...this,
      mobile_id: await this.constructor.nextId(),
      uuid: await UUIDGenerator.getRandomUUID(),
      server_id: null,
      edited: false,
      updated_at: utcNow(),
      created_at: utcNow(),
      name: copyName,
      mobile_parent_id: copyMobileParentId,
      parent_id: !!mobileParentId ? null : this.parent_id,
      mobile_location_id: copyLocationId,
      location_id: !!locationId ? null : this.location_id,
      code: await this.constructor.nextCode(this.mobile_project_id),
      name_with_parents: await this.constructor.generateNameWithParents(copyMobileParentId, copyName, copyLocationId)
    }
  }

  static async parentDoesNotHaveFloorPlan(currentArea, potentialParentArea) {
    if (!currentArea || !potentialParentArea) { return false }

    if (!!currentArea.floor_plan) {
      if (!!potentialParentArea.floor_plan) { return potentialParentArea.name; }
      const parentAreaParents = await potentialParentArea.parents

      for (let i = 0; i < parentAreaParents.length; i++) {
        const parent = parentAreaParents[i];
        if (!!parent.floor_plan) {
          return parent.name
        }
      }
    }

    return false
  }
 
  static async validate(object) {
    let errors = {}

    if (!object.name) {
      errors.nameError = 'This field is required'
    }

    currentArea = await realm.objects('Area').filtered("mobile_id = $0", object.mobile_id)[0]
    potentialParentArea = await realm.objects('Area').filtered("mobile_id = $0", object.mobile_parent_id)[0]

    let parentError = await Area.parentDoesNotHaveFloorPlan(currentArea, potentialParentArea)
    if (!!parentError) {
      errors.parentError = `Area (${parentError}) in this tree already has a floorplan.`
    }

    return errors
  }

  get parents() {
    const parents = []
    let parentArea = this

    while (parentArea = parentArea.parent) {
      parents.push(parentArea)
    }

    return (parents)
  }

  get parent() {
    return(
      realm.objects('Area').filtered('active = true AND mobile_id = $0', this.mobile_parent_id)[0]
    )
  }

  get location() {
    return(
      realm.objects('Location').filtered('active = true AND mobile_id = $0', this.mobile_location_id)[0]
    )
  }

  get locationName() {
    const location = this.location;

    if (location) {
      return location.name
    } else {
      return '';
    }
  }

  static async findAndRunUpdate(id) {
    const area = await realm.objects('Area').filtered('mobile_id = $0 AND active = true', id)[0];
    await area.afterSaveUpdates();
  }

  /////// for CustomAttributable ///////

  project() {
    return realm.objects('Project').filtered('mobile_id = $0', this.mobile_project_id)[0];
  }

  getClassName() {
    return 'Area';
  }

  static getClassName() {
    return 'Area';
  }

  //////////////////////////////////////

  getPin(pinnable_sub_type) {
    return (
      realm.objects('Pin').filtered(`active = true AND pinnable_type = 'Area' AND pinnable_sub_type = '${pinnable_sub_type}' AND mobile_pinnable_id = $0`, this.mobile_id)[0]
    )
  }

  static mapppingStyle(mobile_id) {
    if (!mobile_id) { return false; }
    area = realm.objects('Area').filtered('active = true AND mobile_id = $0', mobile_id)[0]
    if (!area) { return false; }

    if (area.findFloorPlan) {
      return area.mapping_style
    } else {
      return false
    }
  }

  get mapping_style() {
    neededPinCount = 1

    areaPinsFields = ['first_illuminance', 'second_illuminance', 'third_illuminance', 'fourth_illuminance', 'fifth_illuminance'];
    for (let i = 0; i < areaPinsFields.length; i++) {
      const illuminance = areaPinsFields[i];
      const attributes = JSON.parse(this.custom_attributes);
      if (attributes.hasOwnProperty(illuminance) && (attributes[illuminance] || attributes[illuminance] === 0)) {
        neededPinCount += 1
      }
    }

    if (this.pins.length < neededPinCount) {
      return '#ffc107'
    } else if (this.pins.length > neededPinCount) {
      return 'tomato'
    } else if (this.pins.length == neededPinCount) {
      return  '#33CF6C'
    }
  }

  /////////////////////////////////////////////////////////////
  ////////////////// FloorPlan GET functions //////////////////
  /////////////////////////////////////////////////////////////

  get floor_plan() {
    return(
      realm.objects('FloorPlan').filtered('active = true AND mobile_area_id = $0', this.mobile_id)[0]
    )
  }

  get findFloorPlan() {
    if (this.floor_plan) {

      return this.floor_plan

    } else if (this.parent) {

      let parent = this.parent
      let floorPlan = parent.floor_plan

      while (!floorPlan && !!parent) {
        floorPlan = parent.floor_plan
        parent = parent.parent
      }

      return floorPlan
    }
  }

  get pins() {
    return (
      realm.objects('Pin').filtered(`active = true AND pinnable_type = 'Area' AND mobile_pinnable_id = $0`, this.mobile_id).snapshot()
    )
  }

  /////////////////////////////////////
  // 'sync_' these include inactives //
  /////////////////////////////////////

  get sync_floor_plans() {
    return(
      realm.objects('FloorPlan').filtered('mobile_area_id = $0', this.mobile_id).snapshot()
    )
  }

  get sync_pins() {
    return (
      realm.objects('Pin').filtered(`pinnable_type = 'Area' AND mobile_pinnable_id = $0`, this.mobile_id).snapshot()
    )
  }

  /////////////////////////////////
  // name_with_parents functions //
  /////////////////////////////////

  static async generateNameWithParents(parentId, currentName, locationId) {
    let nameWithParents = ''
    if (parentId) {
      const parent = await realm.objects('Area').filtered('mobile_id = $0', parentId)[0];
      nameWithParents += `${parent.name_with_parents} || ${currentName}`
    } else {
      if (locationId) {
        const location = await realm.objects('Location').filtered('mobile_id = $0', locationId)[0];
        nameWithParents = `${location.name} || ${currentName}`
      } else {
        nameWithParents = currentName;
      }
    }
    return nameWithParents
  }

  static async updateNameWithParents(beforeArea, afterArea) {
    const realmBeforeArea = await realm.objects('Area').filtered('mobile_id = $0', beforeArea.mobile_id)[0];
    if (realmBeforeArea) {

      if (realmBeforeArea.name != afterArea.name || realmBeforeArea.mobile_parent_id != afterArea.mobile_parent_id || realmBeforeArea.mobile_location_id != afterArea.mobile_location_id) {
        afterArea.name_with_parents = await this.generateNameWithParents(beforeArea.mobile_parent_id, beforeArea.name, beforeArea.mobile_location_id);
      }

    } else {
      afterArea.name_with_parents = await this.generateNameWithParents(beforeArea.mobile_parent_id, beforeArea.name, beforeArea.mobile_location_id)
    }

    return afterArea;
  }

  async updateChildNames(lastParentName = null) {
    const children = this.children.filtered('active = true');
    const names = []
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      names.push(await child.updateNameAndChildren(lastParentName))
    }

    const flattenedNames = [].concat.apply([], names);
    await Area.create(flattenedNames, true);
  }

  async updateNameAndChildren(lastParentName = null) {
    let nameWithParents = ''
    if (lastParentName) {
      nameWithParents = lastParentName += ` || ${this.name}`
    } else {
      nameWithParents = await Area.generateNameWithParents(this.mobile_parent_id, this.name, this.mobile_location_id);
    }

    const children = this.children.filtered('active = true');
    const names = [{...this.toPlainObject(), name_with_parents: nameWithParents }]

    for (let i = 0; i < children.length; i++) {
      const child2 = children[i];
      names.push(await child2.updateNameAndChildren(nameWithParents))
    }
    return names.flat();
  }
}

Area.schema = areaSchema;
