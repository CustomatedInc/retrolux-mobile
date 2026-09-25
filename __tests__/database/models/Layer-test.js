import { Layer} from "../../../app/database/models/Layer";
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

// ============================================================================
// Static
// ============================================================================

describe("createNewLayers()", () => {

  test('realm.create called 4 times for each layer in createNewLayers',  async () => {
    Object.assign(Layer, { nextId: () => 3 })
    await Layer.createNewLayers(15) // 15 = floorplan_mobile_id
    expect(realm.create).toHaveBeenCalledTimes(4)
  })
})

// ============================================================================
// Instance
// ============================================================================
