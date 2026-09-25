import _ from 'lodash';
import UUIDGenerator from 'react-native-uuid-generator';

import Model from '../model';
import realm from '../realm';
import { floorPlanSchema } from '../schema'
import { Project } from  './Project';
import { Area } from  './Area';
import { Attachment } from  './Attachment';
import { Editable } from '../mixins/Editable'
import { utcNow } from '../../lib/dateHelpers';
import { Layer } from './Layer';
import { Pin } from './Pin';

export class FloorPlan extends Editable(Model) {

  /////////////////////////////////////////////////
  ////////// Create to Realm From GET /////////////
  ////////////////////////////////////////////////
  static async createAllFromServer(floorPlans) {
    const preppedFloorPlans = []
    let lastFound = await FloorPlan.nextId()
    for (let index = 0; index < floorPlans.length; index++) {
      const preppedFloorPlan = await this.prepareForRealm(floorPlans[index]);
      const found = await this.findServer(preppedFloorPlan.server_id);

      if (!!found) {
        preppedFloorPlan.mobile_id = found.mobile_id
        preppedFloorPlans.push(preppedFloorPlan);
      } else {
        preppedFloorPlan.mobile_id = lastFound
        lastFound =  lastFound + 1
        preppedFloorPlans.push(preppedFloorPlan);
      }
    }
    await this.create(preppedFloorPlans, true);
  }

  static async prepareForRealm(floorPlan) {
    floorPlan.server_id = floorPlan.id;
    delete floorPlan.id;
    // floorPlan.mobile_id = await this.findOrNextMobileId(floorPlan.server_id);
    floorPlan.created_at = floorPlan.created_at ? new Date(floorPlan.created_at) : null
    floorPlan.updated_at = floorPlan.updated_at ? new Date(floorPlan.updated_at) : null
    floorPlan.inactive_at = floorPlan.inactive_at ? new Date(floorPlan.inactive_at) : null

    let area = await Area.findServer(floorPlan.area_id);
    floorPlan.mobile_area_id = area.mobile_id;

    return floorPlan
  }

  /////////////////////////////////////////////////
  ///////////// Create FloorPlan /////////////////
  ////////////////////////////////////////////////
  static async saveToRealm(data, area) {
    let editing = false

    if (!data.mobile_id) {
      data.active = true;
      data.mobile_id = await this.nextId();
      data.area_id = area.server_id ? area.server_id : null;
      data.mobile_area_id = area.mobile_id;
      data.server_id = null;
      data.created_at = utcNow();
      data.updated_at = utcNow();
      data.uuid = await UUIDGenerator.getRandomUUID();
    } else {
      editing = true
      data.updated_at = utcNow();
    }

    realmArea = realm.objects('Area').filtered(`mobile_id = ${area.mobile_id}`)[0]
    realm.write(() => {
      realm.create('FloorPlan', data, editing)
      realmArea.edited = true
    })

    if (editing == false) {
      await Layer.createNewLayers(data.mobile_id)
    }

    return data
  }

  async deactivate() {

    const pins = await this.pins;
    const layers = await this.layers;
    const realmArea = await realm.objects('Area').filtered(`mobile_id = ${this.mobile_area_id}`)[0]

    // Deactivate Attachment - sets active status so whole FloorPlan can sync.
    await FloorPlan.attachment(this.mobile_id).deactivate()

    await realm.write(() => {

      // Deactivate Pins
      for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        pin.active = false;
        pin.inactive_at = utcNow();
      }

      // Deactivate Layers
      for (let j = 0; j < layers.length; j++) {
        const layer = layers[j];
        layer.active = false;
        layer.inactive_at = utcNow();
      }

      // Deactivate FloorPlan
      this.active = false;
      this.inactive_at = utcNow();

      // Edit Area so it all syncs
      realmArea.edited = true;

    });
  }

  static attachment(id) {
    return realm.objects('Attachment').filtered(`active = true AND attachable_type = 'FloorPlan' AND attachable_mobile_id = $0`, id)[0];
  }

  // static findByAreaMobileId(areaMobileId) {
  //   return realm.objects('FloorPlan').filtered(`mobile_area_id = $0`, areaMobileId)[0]
  // }

  get area() {
    return (
      realm.objects('Area').filtered(`mobile_id = $0`, this.mobile_area_id)[0]
    )
  }

  get layers() {
    return (
      realm.objects('Layer').filtered(`active = true AND mobile_floor_plan_id = $0`, this.mobile_id).snapshot()
    )
  }

  // Includes inactive layers
  get sync_layers() {
    return (
      realm.objects('Layer').filtered(`mobile_floor_plan_id = $0`, this.mobile_id)
    )
  }

  get pins() {
    let customFilter = this.layers.map((layer) => `mobile_layer_id = ${layer.mobile_id}`).join(' OR ')
    return (
      realm.objects('Pin').filtered(`active = true`).filtered(customFilter).snapshot()
    )
  }

  get areaLayer() {
    return(
      realm.objects('Layer').filtered(`active = true AND layer_type = 'areas' AND mobile_floor_plan_id = $0`, this.mobile_id)[0]
    )
  }
}

FloorPlan.schema = floorPlanSchema;
