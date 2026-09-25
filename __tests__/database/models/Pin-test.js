import { Pin } from "../../../app/database/models/Pin";
import { Layer } from "../../../app/database/models/Layer";
import { floorPlanOnelayers, floorPlanOneAreaLayer } from '../../../app/__fixtures__/layers.js';
import realm from '../../../app/database/realm'; // manual mock
import { pinOneAreaLayer } from "../../../app/__fixtures__/pins";

// ============================================================================
// Mocks
// ============================================================================

jest.mock('react-native-aws3', () => { return { Request: { FormData: {} } } });
jest.mock('react-native-fs', () => {})
jest.mock('../../../app/database/models/', () => {}); // mocks every model but the one we're testing
jest.mock('react-native-uuid-generator', () => { return { getRandomUUID: () => "da5d28d8-5221-43c7-bca2-21a737c8334d" }})

// ============================================================================
// Setup
// ============================================================================

const realmfloorPlanOneAreaLayer = new Layer()
Object.assign(realmfloorPlanOneAreaLayer, floorPlanOneAreaLayer)

// ============================================================================
// Static
// ============================================================================

describe("saveToRealm()", () => {

  pin = {
    coordinate: `(23,50)`,
    pinnable_type: 'Area',
    pinnable_sub_type: 'location',
    pinnable_id: 5,
    mobile_pinnable_id: 5,
  }

  test('test saveToRealm(pin_pobject, floor_plan_id)',  async () => {
    Object.assign(Pin, { nextId: () => 2 })

    realm.objects = jest.fn(() => floorPlanOnelayers)
    realm.objects().filtered =  jest.fn(() => [realmfloorPlanOneAreaLayer])

    pin = await Pin.saveToRealm(pin, 2)

    expect(realm.write).toHaveBeenCalledTimes(2) // 1 for write 1 for markEdited

    expect(pin).toEqual({
      coordinate: '(23,50)',
      pinnable_type: 'Area',
      pinnable_sub_type: 'location',
      pinnable_id: 5,
      mobile_pinnable_id: 5,
      created_at: pin.created_at,
      updated_at: pin.updated_at,
      mobile_id: 2,
      mobile_layer_id: 1,
      layer_id: 1,
      uuid: 'da5d28d8-5221-43c7-bca2-21a737c8334d'
    })

  })
})

// ============================================================================
// Instance
// ============================================================================
