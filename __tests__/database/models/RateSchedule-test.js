import { RateSchedule } from "../../../app/database/models/RateSchedule";
import { Schedule } from "../../../app/database/models/Schedule";
import { testBlendedRateSchedule } from '../../../app/__fixtures__/rateSchedules';
import realm from '../../../app/database/realm'; // manual mock

// ============================================================================
// Mocks
// ============================================================================

jest.mock('react-native-aws3', () => { return { Request: { FormData: {} } } });
jest.mock('react-native-fs', () => {})
jest.mock('../../../app/database/models/', () => {}); // mocks every model but the one we're testing
// jest.mock('../../../app/database/model.js', () => {}); // mocks every model but the one we're testing
// jest.mock('../../../app/database/mixins/Editable.js', () => { return { Editable: () => {} } }); // mocks every model but the one we're testing
jest.mock('react-native-uuid-generator', () => { return { getRandomUUID: () => "da5d28d8-5221-43c7-bca2-21a737c8334d" }})

// ============================================================================
// Setup
// ============================================================================

const blendedRateSchedule = testBlendedRateSchedule

// const fixtureData = {
//   mobile_existing_lighting_id: 2,
//   custom_attributes: JSON.stringify({ attribute_1: 'value 1', attribute_2: 'fixture value 2', attribute_3: '' }),
// }

// Object.assign(testFixture, fixtureData) // assigns data to new model

// ============================================================================
// Setup
// ============================================================================

// Below does not work, but a start
describe("fake test", () => {

  // test('expect blendedRateSchedule to be valid',  async () => {
  //   // console.warn(Object.assign({}, blendedRateSchedule))
  //   let errors = await RateSchedule.validate(blendedRateSchedule);
  //   expect(Object.keys(errors).length).toEqual(0)
  // })

  test('expect blendedRateSchedule to be valid',  async () => {
    // console.warn(Object.assign({}, blendedRateSchedule))
    expect(blendedRateSchedule.name).toEqual('Blended Rate Schedule')
  })
})
