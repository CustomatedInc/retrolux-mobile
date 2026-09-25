import _ from 'lodash';
import UUIDGenerator from 'react-native-uuid-generator';

import Model from '../model';
import realm from '../realm';
import { pinSchema } from '../schema'
import { Project } from  './Project';
import { Attachment } from  './Attachment';
import { Area } from  './Area';
import { ExistingFixture } from  './ExistingFixture';
import { Layer } from  './Layer';
import { Editable } from '../mixins/Editable'
import { utcNow } from '../../lib/dateHelpers';
import { markEdited } from '../../lib/realmActions';

export class Pin extends Editable(Model) {

  static async createAllFromServer(pins) {
    const preppedPins = []
    let lastFound = await Pin.nextId() // this could be how we handle all.
    for (let index = 0; index < pins.length; index++) {
      const preppedPin = await this.prepareForRealm(pins[index]);
      const found = await this.findServer(preppedPin.server_id);

      if (!!found) {
        preppedPin.mobile_id = found.mobile_id
        preppedPins.push(preppedPin);
      } else {
        preppedPin.mobile_id = lastFound
        lastFound =  lastFound + 1
        preppedPins.push(preppedPin);
      }
    }
    await this.create(preppedPins, true);
  }

  static async prepareForRealm(pin) {
    pin.server_id = pin.id;
    delete pin.id;
    // pin.mobile_id = await this.findOrNextMobileId(pin.server_id);
    pin.created_at = pin.created_at ? new Date(pin.created_at) : null
    pin.updated_at = pin.updated_at ? new Date(pin.updated_at) : null
    pin.inactive_at = pin.inactive_at ? new Date(pin.inactive_at) : null
    pin.coordinate = `(${pin.coordinate['x']},${pin.coordinate['y']})`

    let layer = await Layer.findServer(pin.layer_id)
    pin.mobile_layer_id = layer.mobile_id

    if (pin.pinnable_type == "Area") {
      let area = await Area.findServer(pin.pinnable_id)
      pin.mobile_pinnable_id = area.mobile_id

    } else if (pin.pinnable_type == "ExistingFixture") {
      let existingFixture = await ExistingFixture.findServer(pin.pinnable_id)
      pin.mobile_pinnable_id = existingFixture.mobile_id

    } else if (pin.pinnable_type == "Attachment") {
      let attachment = await Attachment.findServer(pin.pinnable_id)
      pin.mobile_pinnable_id = attachment.mobile_id
    }

    return pin
  }

  static async saveToRealm(pin, floorPlanId) {
    let editing = false
    if (pin.pinnable_type == 'Area'){
      if (pin.pinnable_sub_type == 'location') {
        layerType = 'areas'

      } else {
        layerType = 'illuminance'
      }

    } else if (pin.pinnable_type == 'ExistingFixture') {
      layerType = 'fixtures'

    } else if (pin.pinnable_type == 'Attachment') {
      layerType = 'attachments'
    }

    layer = await realm.objects('Layer').filtered(`layer_type = "${layerType}" AND mobile_floor_plan_id = $0`, floorPlanId)[0]

    if (!pin.mobile_id) {
      pin.created_at = utcNow();
      pin.updated_at = utcNow();
      pin.mobile_id = await this.nextId();
      pin.mobile_layer_id = layer.mobile_id;
      pin.layer_id = layer.server_id;
      pin.uuid = await UUIDGenerator.getRandomUUID();
    } else {
      pin.updated_at = utcNow();
      editing = true
    }

    realm.write(() => {
      realm.create('Pin', pin, editing)
    })

    await markEdited(pin.pinnable_type, pin.mobile_pinnable_id)

    return pin
  }

  get layer() {
    return(
      realm.objects('Layer').filtered(`mobile_id = $0`, this.mobile_layer_id)[0]
    )
  }

  get pinnable() {
    return(
      realm.objects(this.pinnable_type).filtered(`mobile_id = $0`, this.mobile_pinnable_id)[0]
    )
  }

}

Pin.schema = pinSchema;