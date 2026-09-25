import { ExistingFixture} from "../../../app/database/models/ExistingFixture";
import { Area } from "../../../app/database/models/Area";
import { FloorPlan } from "../../../app/database/models/FloorPlan";
import { Pin } from "../../../app/database/models/Pin";
import { areas } from '../../../app/__fixtures__/areas.js';
import { testExistingFixture } from '../../../app/__fixtures__/existingFixtures.js';
import { floorPlanTwo, floorPlanOne } from '../../../app/__fixtures__/floorPlans.js';
import { floorPlanTwolayers, floorPlanTwoAreaLayer } from '../../../app/__fixtures__/layers.js';
import { pinOneAreaLayer } from '../../../app/__fixtures__/pins.js';
import realm from '../../../app/database/realm'; // manual mock

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

let modelAreas = areas.map(areaData => {
  const newArea = new Area()
  Object.assign(newArea, areaData)
  return newArea
})

const testExistingFixtureModel = new ExistingFixture()
Object.assign(testExistingFixtureModel, testExistingFixture)
const testExistingFixtures = [testExistingFixtureModel]

const realmPinOneAreaLayer = new Pin()
Object.assign(realmPinOneAreaLayer, pinOneAreaLayer)

modelAreas.forEach(area => {
  jest.spyOn(area, 'children', 'get').mockReturnValue(modelAreas.filter(a => a.mobile_parent_id === area.mobile_id))
  jest.spyOn(area, 'existingFixtures', 'get').mockReturnValue(testExistingFixtures.filter(e => e.mobile_area_id === area.mobile_id ))
})

// ============================================================================
// Static
// ============================================================================

// ============================================================================
// Instance
// ============================================================================

const testParentArea = modelAreas.filter(area => area.name == 'Parent Area')[0]
const testChildArea = modelAreas.filter(area => area.name == 'Child Area 01')[0]
const areaDifferentTreeOne = modelAreas.filter(area => area.mobile_id == 16)[0]


describe("copyObject()", () => {
  Object.assign(Area, { nextId: () => 100 })
  Object.assign(Area, { nextCode: () => 6 })
  Object.assign(ExistingFixture, { nextId: () => 100 })

  // These realm mocks need more look, gets tests to pass.
  realm.objects = jest.fn(() => modelAreas)
  realm.objects().filtered =  jest.fn(() => [areaDifferentTreeOne])

  test('appends " - copy" to the name of top-level areas',  async () => {
    const copiedObject = await testParentArea.copyObject()

    expect(copiedObject.name).toEqual('Parent Area - copy')
  })

  test('leaves name alone for child areas',  async () => {
    const copiedObject = await testChildArea.copyObject(2)

    expect(copiedObject.name).toEqual('Child Area 01')
  })

  test('returns an object', async () => {
    const copiedObject = await testParentArea.copyObject()

    expect(typeof copiedObject).toBe('object');
  })

  test('changes the UUID', async () => {
    const copiedObject = await testParentArea.copyObject()

    expect(copiedObject.uuid).not.toEqual(testParentArea.uuid)
  })

  test('keeps the same custom_attributes', async () => {
    const copiedObject = await testParentArea.copyObject()

    expect(copiedObject.custom_attributes).toEqual(testParentArea.custom_attributes)
  })

  test('keeps the same project info', async () => {
    const copiedObject = await testParentArea.copyObject()

    expect(copiedObject.mobile_project_id).toEqual(testParentArea.mobile_project_id)
    expect(copiedObject.project_id).toEqual(testParentArea.project_id)
  })

  test('keeps the same area info', async () => {
    const copiedObject = await testParentArea.copyObject()

    expect(copiedObject.mobile_area_id).toEqual(testParentArea.mobile_area_id)
    expect(copiedObject.area_id).toEqual(testParentArea.area_id)
  })

  test('changes the database ids', async () => {
    const copiedObject = await testParentArea.copyObject()

    expect(copiedObject.server_id).toEqual(null)
    expect(copiedObject.mobile_id).not.toEqual(testParentArea.mobile_id)
  })

  test('clears data fields', async () => {
    const copiedObject = await testParentArea.copyObject()

    expect(copiedObject.server_id).toEqual(null)
    expect(copiedObject.edited).toEqual(false)
  })
})

describe("createCopy()", () => {
  beforeEach(() => {
    realm.create.mockClear();
  });

  test('writes to realm for area and each child area and each fixture', async () => {
    await testParentArea.createCopy()

    expect(realm.create).toHaveBeenCalledTimes(5)
  })

  test('returns the mobile id', async () => {
    const mobileId = await testParentArea.createCopy()

    expect(mobileId).toEqual(100)
  })
})

const testFloorPlanModelTwo = new FloorPlan()
Object.assign(testFloorPlanModelTwo, floorPlanTwo)
jest.spyOn(areaDifferentTreeOne, 'floor_plan', 'get').mockReturnValue(testFloorPlanModelTwo)

const testFloorPlanModelOne = new FloorPlan()
Object.assign(testFloorPlanModelOne, floorPlanOne)
jest.spyOn(testParentArea, 'floor_plan', 'get').mockReturnValue(testFloorPlanModelOne)

describe("parentDoesNotHaveFloorPlan()", () => {

  test('test parentDoesNotHaveFloorPlan scenarios',  async () => {

    expect(areaDifferentTreeOne.floor_plan.mobile_area_id).toEqual(areaDifferentTreeOne.mobile_id)

    // No Parent Area
    hasFloorPlan = await Area.parentDoesNotHaveFloorPlan(areaDifferentTreeOne, null)
    expect(hasFloorPlan).toEqual(false)

    // Parent Does Have FloorPlan
    hasFloorPlan = await Area.parentDoesNotHaveFloorPlan(areaDifferentTreeOne, testParentArea)
    expect(hasFloorPlan).toEqual("Parent Area")

    // Parent Two Levels Deep Does Have FloorPlan
    jest.spyOn(testChildArea, 'floor_plan', 'get').mockReturnValue(null)
    jest.spyOn(testChildArea, 'parents', 'get').mockReturnValue([testParentArea])
    hasFloorPlan = await Area.parentDoesNotHaveFloorPlan(areaDifferentTreeOne, testChildArea)
    expect(hasFloorPlan).toEqual("Parent Area")

    // No currentArea does not have FloorPlan
    jest.spyOn(areaDifferentTreeOne, 'floor_plan', 'get').mockReturnValue(null)
    hasFloorPlan = await Area.parentDoesNotHaveFloorPlan(areaDifferentTreeOne, testParentArea)
    expect(hasFloorPlan).toEqual(false)
  })
})

describe("findFloorPlan()", () => {

  test('test findFloorPlan scenarios',  async () => {

    jest.spyOn(testChildArea, 'floor_plan', 'get').mockReturnValue(null)
    jest.spyOn(testChildArea, 'parent', 'get').mockReturnValue(testParentArea)
    jest.spyOn(testParentArea, 'floor_plan', 'get').mockReturnValue(testFloorPlanModelOne)

    // Top Level Area with FloorPlan
    expect(testParentArea.findFloorPlan).toEqual(testFloorPlanModelOne)

    // Child of Top Level without FloorPlan
    expect(testChildArea.findFloorPlan).toEqual(testFloorPlanModelOne)
  })
})

describe("mapppingStyle()", () => {

  test('test mapppingStyle bad mobile_id',  async () => {
    realm.objects = jest.fn(() => modelAreas)
    realm.objects().filtered =  jest.fn(() => [])

    // False if no mobile_id
    expect(Area.mapppingStyle(null)).toEqual(false)

    // False if Area does not exists
    expect(Area.mapppingStyle(100)).toEqual(false)

    expect(realm.objects().filtered).toHaveBeenCalledTimes(1)
  })

  test('test mapppingStyle underPinned, overPinned, equalPinned',  async () => {
    // areaDifferentTreeOne has 4 pins in __fixtures__
    realm.objects = jest.fn(() => modelAreas)
    realm.objects().filtered =  jest.fn(() => [areaDifferentTreeOne])
    jest.spyOn(areaDifferentTreeOne, 'floor_plan', 'get').mockReturnValue(testFloorPlanModelTwo)

    // Under Pinned
    jest.spyOn(areaDifferentTreeOne, 'pins', 'get').mockReturnValue(['pin1', 'pin2', 'pin3'])
    expect(Area.mapppingStyle(areaDifferentTreeOne.mobile_id)).toEqual('#ffc107')

    // Equal Pinned
    jest.spyOn(areaDifferentTreeOne, 'pins', 'get').mockReturnValue(['pin1', 'pin2', 'pin3', 'pin4'])
    expect(Area.mapppingStyle(areaDifferentTreeOne.mobile_id)).toEqual('#33CF6C')

    // Over Pinned
    jest.spyOn(areaDifferentTreeOne, 'pins', 'get').mockReturnValue(['pin1', 'pin2', 'pin3', 'pin4', 'pin5'])
    expect(Area.mapppingStyle(areaDifferentTreeOne.mobile_id)).toEqual('tomato')
  })
})

describe("floorPlanDataForApi()", () => {

  test('floorPlanDataForApi scenarios',  async () => {

    // FloorPlan with no Layers - not possible but a check just in case
    jest.spyOn(areaDifferentTreeOne, 'sync_floor_plans', 'get').mockReturnValue([testFloorPlanModelTwo])
    jest.spyOn(testFloorPlanModelTwo, 'sync_layers', 'get').mockReturnValue([])
    expect(await areaDifferentTreeOne.floorPlanDataForApi()).toEqual([
      {
        active: true,
        mobile_id: 2,
        server_id: 2,
        mobile_area_id: 16,
        area_id: 16,
        height: 1000,
        width: 1000,
        created_by_user_id: 1,
        uuid: 'da5d28d8-6666-gggg-bca2-21a737c8334e',
        layers: []
      }
    ])

    // Returns expected JSON layer data
    jest.spyOn(testFloorPlanModelTwo, 'sync_layers', 'get').mockReturnValue(floorPlanTwolayers)
    expect(await areaDifferentTreeOne.floorPlanDataForApi()).toEqual([
      {
        active: true,
        mobile_id: 2,
        server_id: 2,
        mobile_area_id: 16,
        area_id: 16,
        height: 1000,
        width: 1000,
        created_by_user_id: 1,
        uuid: 'da5d28d8-6666-gggg-bca2-21a737c8334e',
        layers: [
          {
            "active": true,
            "floor_plan_id": 2,
            "layer_type": "areas",
            "mobile_floor_plan_id": 2,
            "mobile_id": 5,
            "server_id": 5,
            "uuid": "da5d28d8-5555-43c7-bca2-21a737c8334e",
            "visible": true,
          },
          {
            "active": true,
            "floor_plan_id": 2,
            "layer_type": "fixtures",
            "mobile_floor_plan_id": 2,
            "mobile_id": 6,
            "server_id": 6,
            "uuid": "da5d28d8-7777-43c7-bca2-21a737c8334e",
            "visible": true,
          },
          {
            "active": true,
            "floor_plan_id": 2,
            "layer_type": "attachments",
            "mobile_floor_plan_id": 2,
            "mobile_id": 7,
            "server_id": 7,
            "uuid": "da5d28d8-8888-43c7-bca2-21a737c8334e",
            "visible": true,
          },
          {
            "active": true,
            "floor_plan_id": 2,
            "layer_type": "illuminance",
            "mobile_floor_plan_id": 2,
            "mobile_id": 8,
            "server_id": 8,
            "uuid": "da5d28d8-9999-43c7-bca2-21a737c8334e",
            "visible": true,
          },
        ]
      }
    ])

    // No FloorPlan return []
    jest.spyOn(areaDifferentTreeOne, 'sync_floor_plans', 'get').mockReturnValue([])
    expect(await areaDifferentTreeOne.floorPlanDataForApi()).toEqual([])
  })
})

describe("pinDataForApi()", () => {

  test('pinDataForApi() scenarios',  async () => {

    // Area with no pins return []
    jest.spyOn(areaDifferentTreeOne, 'sync_pins', 'get').mockReturnValue([])
    expect(await areaDifferentTreeOne.pinDataForApi()).toEqual([])

    // Area with pins
    jest.spyOn(areaDifferentTreeOne, 'sync_pins', 'get').mockReturnValue([realmPinOneAreaLayer])
    jest.spyOn(realmPinOneAreaLayer, 'layer', 'get').mockReturnValue(floorPlanTwoAreaLayer)
    expect(await areaDifferentTreeOne.pinDataForApi()).toEqual([
      { active: true,
        mobile_id: 1,
        server_id: 1,
        mobile_layer_id: 5,
        layer_id: 5,
        pinnable_type: 'Area',
        pinnable_id: 16,
        mobile_pinnable_id: 16,
        coordinate: '(29.46,85.93)',
        uuid: 'da5d28d8-pin1-43c7-bca2-21a737c8334e',
        layer_uuid: 'da5d28d8-5555-43c7-bca2-21a737c8334e'
      }
    ])
  })
})

describe("validate()", () => {

  test('validate() scenarios',  async () => {

    area_object = {
      active: true,
      created_by_user_id: 1,
      edited: false,
      mobile_id: 800,
      mobile_parent_id: null,
      name: '',
      parent_id: null,
      mobile_project_id: 1,
      project_id: 1,
      server_id: 800,
      code: 800,
    }

    // This skips parentDoesNotHaveFloorPlan() as we test it above
    realm.objects = jest.fn(() => modelAreas)
    realm.objects().filtered =  jest.fn(() => [])

    //// Test Name Field ////
    // Blank Name
    expect(await Area.validate(area_object)).toEqual({ nameError: 'This field is required' })

    // Name Present
    area_object['name'] = "Area with name"
    expect(await Area.validate(area_object)).toEqual({})
  })
})
