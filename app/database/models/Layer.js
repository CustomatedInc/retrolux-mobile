import _ from 'lodash';
import UUIDGenerator from 'react-native-uuid-generator';

import Model from '../model';
import realm from '../realm';
import { layerSchema } from '../schema'
import { Project } from  './Project';
import { Attachment } from  './Attachment';
import { Editable } from '../mixins/Editable'
import { utcNow } from '../../lib/dateHelpers';
import { FloorPlan } from './FloorPlan';

export class Layer extends Editable(Model) {

  static async createAllFromServer(layers) {
    const preppedLayers = []
    let lastFound = await Layer.nextId() // this could be how we handle all.
    for (let index = 0; index < layers.length; index++) {
      const preppedLayer = await this.prepareForRealm(layers[index]);
      const found = await this.findServer(preppedLayer.server_id);

      if (!!found) {
        preppedLayer.mobile_id = found.mobile_id
        preppedLayers.push(preppedLayer);
      } else {
        preppedLayer.mobile_id = lastFound
        lastFound =  lastFound + 1
        preppedLayers.push(preppedLayer);
      }
    }
    await this.create(preppedLayers, true);
  }

  static async prepareForRealm(layer) {
    layer.server_id = layer.id;
    delete layer.id;
    // layer.mobile_id = await this.findOrNextMobileId(layer.server_id);
    layer.created_at = layer.created_at ? new Date(layer.created_at) : null
    layer.updated_at = layer.updated_at ? new Date(layer.updated_at) : null
    layer.inactive_at = layer.inactive_at ? new Date(layer.inactive_at) : null

    let floorPlan = await FloorPlan.findServer(layer.floor_plan_id)
    layer.mobile_floor_plan_id =  floorPlan.mobile_id

    return layer
  }

  static async createNewLayers(floorPlanMobileId) {
    const layerTypes = ['areas', 'fixtures', 'attachments', 'illuminance']
    const layersData = []

    for (let j = 0; j < layerTypes.length; j++) {
      const layerType = layerTypes[j];

      layer = {
        server_id: null,
        mobile_id: await this.nextId() + j,
        created_at: utcNow(),
        updated_at: utcNow(),
        mobile_floor_plan_id: floorPlanMobileId,
        uuid: await UUIDGenerator.getRandomUUID(),
        layer_type: layerType
      }

      layersData.push(layer)
    }

    await realm.write(() => {
      layersData.forEach(layerData => {
        realm.create('Layer', layerData)
      })
    })
  }

  get pins() {
    return realm.objects('Pin').filtered(`mobile_layer_id = $0 AND active = true`, this.mobile_id)
  }

}

Layer.schema = layerSchema;
