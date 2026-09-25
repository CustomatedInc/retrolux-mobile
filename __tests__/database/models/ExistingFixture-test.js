import { ExistingFixture} from "../../../app/database/models/ExistingFixture";
import { Project} from "../../../app/database/models/Project";
import { utcNow } from "../../../app/lib/dateHelpers";
import { ExistingLighting } from "../../../app/database/models/ExistingLighting";
import { testExistingFixture } from '../../../app/__fixtures__/existingFixtures.js';
import { customTemplateAttribute01, customTemplateAttribute02 } from '../../../app/__fixtures__/customAttributes';
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

const testFixture = new ExistingFixture() // creates a new Model
const testExistingLighting = new ExistingLighting()
const realmProject = new Project()

const fixtureData = {
  mobile_existing_lighting_id: 2,
  custom_attributes: JSON.stringify({ attribute_1: 'value 1', attribute_2: 'fixture value 2', attribute_3: '' }),
}

const lightingData = {
  mobile_id: 2,
  custom_attributes: JSON.stringify({ attribute_1: 'value 1', attribute_2: 'lighting value 2', attribute_3: '' }),
}

Object.assign(testFixture, fixtureData) // assigns data to new model
Object.assign(testExistingLighting, lightingData)

// ============================================================================
// Static
// ============================================================================

// ============================================================================
// Instance
// ============================================================================

describe("getAttribute", () => {

  test('expect fixture to return ExistingFixture custom_attribute value if present',  async () => {
    const result = await testFixture.getAttribute('attribute_2')
    expect(result).toEqual('fixture value 2')
  })

  test('expect fixture to return ExistingFixture custom_attribute value if 0',  async () => {
    testFixture.custom_attributes = JSON.stringify({ attribute_1: 'value 1', attribute_2: '', attribute_3: 0 })
    const result = await testFixture.getAttribute('attribute_3')
    expect(result).toEqual(0)
  })

  test('expect fixture to return ExistingLighting custom_attribute value',  async () => {
    jest.spyOn(testFixture, 'product_schedule', 'get').mockReturnValue(testExistingLighting) // here product_schedule replaces the product_schedule getter in getAttribute() function with the testExistingLighting data
    testFixture.custom_attributes = JSON.stringify({ attribute_1: 'value 1', attribute_2: '', attribute_3: '' })
    const result = await testFixture.getAttribute('attribute_2')
    expect(result).toEqual('lighting value 2')
  })

  test("expect fixture to return 'null' if neither ExistingFixture or ExistingLighting custom_attribute value",  async () => {
    jest.spyOn(testFixture, 'product_schedule', 'get').mockReturnValue(testExistingLighting)
    testFixture.custom_attributes = JSON.stringify({ attribute_1: 'value 1', attribute_2: '', attribute_3: '' })
    const result = await testFixture.getAttribute('attribute_3')
    expect(result).toEqual('')
  })
})

describe("attributesComplete", () => {
  Object.assign(testFixture, {requiredCustomAttributes: jest.fn()}) // needed for mockClear() below to work
  beforeEach(() => {
    testFixture.requiredCustomAttributes.mockClear(); // need to reset data on every test
  });

  test('expect attributesComplete to return true if all values are present on ExistingFixture',  async () => {
    let requiredCustomAttributes = {attribute_1: 'value 1'}
    testFixture.custom_attributes = JSON.stringify({ attribute_1: 'fixture value 1', attribute_2: ''})
    Object.assign(testFixture, { requiredCustomAttributes: jest.fn(_ => requiredCustomAttributes) })
    const result = await testFixture.attributesComplete()
    expect(testFixture.requiredCustomAttributes).toHaveBeenCalled()
    expect(result).toEqual(true)
  })

  test('expect attributesComplete to return true if ExistingLighting has equivalent values',  async () => {
    let requiredCustomAttributes = {attribute_2: 'value 2'}
    testFixture.custom_attributes = JSON.stringify({ attribute_1: 'fixture value 1', attribute_2: ''})
    testExistingLighting.custom_attributes = JSON.stringify({ attribute_1: 'lighting value 1', attribute_2: 'lighting value 2'})
    jest.spyOn(testFixture, 'product_schedule', 'get').mockReturnValue(testExistingLighting)
    Object.assign(testFixture, { requiredCustomAttributes: jest.fn(_ => requiredCustomAttributes) })
    const result = await testFixture.attributesComplete()
    expect(testFixture.requiredCustomAttributes).toHaveBeenCalled()
    expect(result).toEqual(true)
  })

  test('expect attributesComplete to return false if neither ExistingLighting or ExistingFixture attribtues covered',  async () => {
    let requiredCustomAttributes = {attribute_3: 'value 3'}
    testFixture.custom_attributes = JSON.stringify({ attribute_1: 'fixture value 1', attribute_2: '', attribute_3: ''})
    testExistingLighting.custom_attributes = JSON.stringify({ attribute_1: 'lighting value 1', attribute_2: 'lighting value 2', attribute_3: ''})
    jest.spyOn(testFixture, 'product_schedule', 'get').mockReturnValue(testExistingLighting)
    Object.assign(testFixture, { requiredCustomAttributes: jest.fn(_ => requiredCustomAttributes) })
    const result = await testFixture.attributesComplete()
    expect(testFixture.requiredCustomAttributes).toHaveBeenCalled()
    expect(result).toEqual(false)
  })

  test('expect attributesComplete to return true if ExistingFixture values 0',  async () => {
    let requiredCustomAttributes = {attribute_3: 0}
    testFixture.custom_attributes = JSON.stringify({ attribute_1: 'fixture value 1', attribute_2: '', attribute_3: 0})
    Object.assign(testFixture, { requiredCustomAttributes: jest.fn(_ => requiredCustomAttributes) })
    const result = await testFixture.attributesComplete()
    expect(testFixture.requiredCustomAttributes).toHaveBeenCalled()
    expect(result).toEqual(true)
  })

  test('expect attributesComplete to return true if ExistingLighting values 0',  async () => {
    let requiredCustomAttributes = {attribute_3: 0}
    testFixture.custom_attributes = JSON.stringify({ attribute_1: 'fixture value 1', attribute_2: '', attribute_3: ''})
    testExistingLighting.custom_attributes = JSON.stringify({ attribute_1: 'lighting value 1', attribute_2: 'lighting value 2', attribute_3: 0})
    Object.assign(testFixture, { requiredCustomAttributes: jest.fn(_ => requiredCustomAttributes) })
    jest.spyOn(testFixture, 'product_schedule', 'get').mockReturnValue(testExistingLighting)
    const result = await testFixture.attributesComplete()
    expect(testFixture.requiredCustomAttributes).toHaveBeenCalled()
    expect(result).toEqual(true)
  })
})

describe("prepareFormDataForEdit", () => {
  let newTestFixture;

  beforeEach(() => {
    newTestFixture = {};
    Object.assign(newTestFixture, testExistingFixture)
  });

  test('sets the correct information when given exactly what it expects',  async () => {
    const formState = {
      existingFixture: { ...newTestFixture, custom_attributes: '{"lamp_type":"T12HO - Linear","lens_trim":"Other","color_temp": null}' },
      operatingSchedule: { mobile_id: 98 },
      existingLighting: { mobile_id: 99 },
      area: { mobile_id: 100 }
    }

    const preparedData = await ExistingFixture.prepareFormDataForEdit(formState)
    expect(preparedData.mobile_operating_schedule_id).toEqual(98)
    expect(preparedData.mobile_existing_lighting_id).toEqual(99)
    expect(preparedData.mobile_area_id).toEqual(100)
    expect(preparedData.edited).toEqual(true)
    expect(preparedData.custom_attributes).toEqual('{"lamp_type":"T12HO - Linear","lens_trim":"Other","color_temp": null}')
  })

  test('sets mobile_operating_schedule_id to null if operatingSchedule not found in state data',  async () => {
    const formState = {
      existingFixture: newTestFixture,
      operatingSchedule: null,
      existingLighting: { mobile_id: 99 },
      area: { mobile_id: 100 },
    }

    const preparedData = await ExistingFixture.prepareFormDataForEdit(formState)
    expect(preparedData.mobile_operating_schedule_id).toEqual(null)
  })

  test('leaves mobile_area_id and mobile_existing_lighting_id alone if area and existingLighting not found in state data',  async () => {
    const formState = {
      existingFixture: newTestFixture,
      operatingSchedule: null,
      existingLighting: null,
      area: null,
    }

    const preparedData = await ExistingFixture.prepareFormDataForEdit(formState)
    expect(preparedData.mobile_existing_lighting_id).toEqual(2)
    expect(preparedData.mobile_area_id).toEqual(14)
  })
})

describe('copyObject()', () => {

  Object.assign(ExistingFixture, { nextId: _ => 100 })

  test('returns an object', async () => {
    const copiedObject = await testFixture.copyObject()

    expect(typeof copiedObject).toBe('object');
  })

  test('changes the UUID', async () => {
    const copiedObject = await testFixture.copyObject()

    expect(copiedObject.uuid).not.toEqual(testFixture.uuid)
  })

  test('keeps the same custom_attributes', async () => {
    const copiedObject = await testFixture.copyObject()

    expect(copiedObject.custom_attributes).toEqual(testFixture.custom_attributes)
  })

  test('keeps the same area info by default', async () => {
    const copiedObject = await testFixture.copyObject()

    expect(copiedObject.mobile_area_id).toEqual(testFixture.mobile_area_id)
    expect(copiedObject.area_id).toEqual(testFixture.area_id)
  })

  test('changes the area info if a new mobile area id is given', async () => {
    const copiedObject = await testFixture.copyObject(2)

    expect(copiedObject.mobile_area_id).toEqual(2)
    expect(copiedObject.area_id).toEqual(null)
  })

  test('changes the database ids', async () => {
    const copiedObject = await testFixture.copyObject()

    expect(copiedObject.server_id).toEqual(null)
    expect(copiedObject.mobile_id).not.toEqual(testFixture.mobile_id)
  })

  test('clears data fields', async () => {
    const copiedObject = await testFixture.copyObject()

    expect(copiedObject.server_id).toEqual(null)
    expect(copiedObject.edited).toEqual(false)
  })
})

describe('createCopy()', () => {
  beforeEach(() => {
    realm.create.mockClear();
  });

  test('writes to realm', async () => {
    await testFixture.createCopy()

    expect(realm.create).toHaveBeenCalledTimes(1)
  })
})

describe('cleanAttributes(project)', () => {
  test('cleanAttributes(project)',  async () => {
    realmProject.ExistingFixtureAttributes = jest.fn(() => [customTemplateAttribute01, customTemplateAttribute02])
    expect(await ExistingFixture.cleanAttributes(realmProject)).toEqual('{"ballast_factor":null,"difficulty_factor":null}')
  })
})
