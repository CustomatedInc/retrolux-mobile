import UUIDGenerator from 'react-native-uuid-generator';
import Model from '../model';
import realm from '../realm';
import { locationSchema } from '../schema'
import { Project } from  './Project';
import { RateSchedule } from  './RateSchedule';
import { OperatingSchedule } from  './OperatingSchedule';
import { Heating } from  './Heating';
import { Cooling } from  './Cooling';
import { Editable } from '../mixins/Editable'
import { CustomAttributable } from '../mixins/CustomAttributable'
import { compose } from '../../lib/utilities';
import { utcNow } from '../../lib/dateHelpers';

export class Location extends compose(Editable, CustomAttributable)(Model) {

  // static search(searchText, project_id) {
  //   return (
  //     realm.objects('Area')
  //       .filtered(`mobile_project_id = $0`, project_id)
  //       .filtered('active = true')
  //       .filtered(`name CONTAINS[c] $0 LIMIT(25)`, searchText)
  //   );
  // }

  /////////////////////////////////////////////////
  ////////// Create to Realm From GET /////////////
  ////////////////////////////////////////////////

  static async createAllFromServer(locations) {
    const preppedLocations = []
    let lastFound = await Location.nextId()
    for (let index = 0; index < locations.length; index++) {
      const preppedLocation = await this.prepareForRealm(locations[index]);
      const found = await this.findServer(preppedLocation.server_id);

      if (!!found) {
        preppedLocation.mobile_id = found.mobile_id
        preppedLocations.push(preppedLocation);
      } else {
        preppedLocation.mobile_id = lastFound
        lastFound =  lastFound + 1
        preppedLocations.push(preppedLocation);
      }
    }
    await this.create(preppedLocations, true);
  }

  static async prepareForRealm(location) {
    location.server_id = location.id;
    delete location.id;
    location.edited = false;
    location.created_at = location.created_at ? new Date(location.created_at) : null
    location.updated_at = location.updated_at ? new Date(location.updated_at) : null
    location.inactive_at = location.inactive_at ? new Date(location.inactive_at) : null

    location.custom_attributes = JSON.stringify(location.custom_attributes);

    const project = await Project.findServer(location.project_id);
    location.mobile_project_id = project.mobile_id;

    location.mobile_rate_schedule_id = await RateSchedule.translateId(location.rate_schedule_id);
    location.mobile_operating_schedule_id = await OperatingSchedule.translateId(location.operating_schedule_id);
    location.mobile_heating_id = await Heating.translateId(location.heating_id);
    location.mobile_cooling_id = await Cooling.translateId(location.cooling_id);
    return location
  }

  ///////////////////////////////////////////////
  ///////////////////// End /////////////////////
  ///////////////////////////////////////////////

  static async prepareFormData(data, project) {
    if (!data.mobile_id) {
      data.active = true
      data.edited = false
      data.mobile_id = await this.nextId();
      data.project_id = project.server_id ? parseInt(project.server_id) : null
      data.mobile_project_id = project.mobile_id
      data.server_id = null
      data.uuid = await UUIDGenerator.getRandomUUID();
      data.created_at = utcNow();
      data.updated_at = utcNow();
    } else {
      data.edited = true
      data.updated_at = utcNow();
    }

    return data
  }

  async prepareForApi() {
    return {
      ...this.toSyncableFormat(),
      address: await this.addressDataForApi()
    }
  }

  static async validate(locationObject) {
    let errors = {}

    if (!locationObject.name) {
      errors.nameError = 'This field is required'
    }
    return errors
  }

  static async generateFromProject(projectMobileId, templates) {
    const newProject = await realm.objects('Project').filtered('mobile_id = $0', projectMobileId)[0];
    if (!newProject) { return; }

    let customAttributes = "";
    for (let l = 0; l < templates.length; l++) {
      const template = templates[l];
      const attributes = await template.cleanAttributes('location');

      if (templates.length > 1) {
        if (attributes != '{}') {
          customAttributes += attributes
        }
      } else {
        customAttributes += attributes
      }
    }

    const mobileId = await this.nextId()
    Location.create({
      active: true,
      name: newProject.name,
      custom_attributes: customAttributes.replace('}{', ', '),
      edited: false,
      mobile_id: mobileId,
      project_id: null,
      mobile_project_id: newProject.mobile_id,
      server_id: null,
      uuid: await UUIDGenerator.getRandomUUID(),
      created_at: utcNow(),
      updated_at: utcNow(),
    })

    await Location.findAndRunUpdate(mobileId); // to set audit_complete status

    realm.write(() => { newProject.mobile_location_scope_ids.push(mobileId) })
  }

  async createCopy() {
    let copiedLocation = await this.copyObject();
    await Location.create(copiedLocation)

    const areas = this.topLevelAreas; // toplevel only to utilizes cascade createCopy() from Area model.
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      await area.createCopy(null, copiedLocation.mobile_id);
    }
  }

  async copyObject() {
    return {
      ...this,
      mobile_id: await Location.nextId(),
      uuid: await UUIDGenerator.getRandomUUID(),
      server_id: null,
      edited: false,
      updated_at: utcNow(),
      created_at: utcNow(),
      name: `${this.name} - copy`,
    }
  }

  async deactivate() {
    const areas = await this.topLevelAreas; // toplevel only to utilizes cascade deactivate() from Area model.
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      await area.deactivate();
    }

    realm.write(() => {
      this.active = false
      this.inactive_at = utcNow()
      this.edited = true
    });
  }

  async prepareForApi() {
    return {
      ...this.toSyncableFormat(),
      address: await this.addressDataForApi()
    }
  }

  get topLevelAreas() {
    return(
      realm
        .objects('Area')
        .filtered('active = true')
        .filtered(`mobile_location_id = ${this.mobile_id}`)
        .filtered('mobile_parent_id = null').snapshot()
    );
  }

  get address() {
    return realm.objects('Address').filtered(`address_type = 'physical' AND addressable_type = 'Location' AND addressable_mobile_id = $0`, this.mobile_id)[0]
  }

  async addressDataForApi() {
    let address = await this.address;

    if (address) {
      return address.toPlainObject();
    } else {
      return {}
    }
  }

  get areas() {
    return realm.objects('Area').filtered(`mobile_location_id = ${this.mobile_id} AND active = true`).snapshot();
  }

  static async findAndRunUpdate(id) {
    const location = await realm.objects('Location').filtered('mobile_id = $0 AND active = true', id)[0];
    await location.afterSaveUpdates();
  }

  /////// for CustomAttributable ///////

  project() {
    return realm.objects('Project').filtered('mobile_id = $0', this.mobile_project_id)[0]
  }

  getClassName() {
    return 'Location';
  }

  static getClassName() {
    return 'Location';
  }

  //////////////////////////////////////

  async updateAreaNames() {
    const topLevelAreas = this.topLevelAreas;
    await realm.write(async () => {
      for (let i = 0; i < topLevelAreas.length; i++) {
        const area = topLevelAreas[i];
        area.name_with_parents = `${this.name} || ${area.name}`;
        area.edited = true;
        area.updated_at = utcNow();
      }
    })

    for (let k = 0; k < topLevelAreas.length; k++) {
      const area = topLevelAreas[k];
      await area.updateChildNames();
    }

  }

}

Location.schema = locationSchema;
