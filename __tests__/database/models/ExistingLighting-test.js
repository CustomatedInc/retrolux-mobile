import { ExistingLighting } from "../../../app/database/models/ExistingLighting";
import { Project } from "../../../app/database/models/Project";
import { testProject1 } from "../../../app/__fixtures__/projects"
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

const realmProject = new Project()
Object.assign(realmProject, testProject1)

// ============================================================================
// Static
// ============================================================================

describe("nextCode()", () => {

  test('ExistingLighting.nextCode(realmProject)',  async () => {
    // No ExistingLighting within Project
    jest.spyOn(realmProject, 'activeExistingLightingsByCode', 'get').mockReturnValue([])
    nextCode = ExistingLighting.nextCode(realmProject)
    expect(nextCode).toEqual('a')

    // No ExistingLighing within Project
    jest.spyOn(realmProject, 'activeExistingLightingsByCode', 'get').mockReturnValue([ { code: 'a' }, { code: 'b' }, { code: 'c' } ])
    nextCode = ExistingLighting.nextCode(realmProject)
    expect(nextCode).toEqual('d')

    // Ignore code with Numbers
    jest.spyOn(realmProject, 'activeExistingLightingsByCode', 'get').mockReturnValue([ { code: 'a' }, { code: 'b' }, { code: 'c3' } ])
    nextCode = ExistingLighting.nextCode(realmProject)
    expect(nextCode).toEqual('c')

    // Ignore code with Numbers 2
    jest.spyOn(realmProject, 'activeExistingLightingsByCode', 'get').mockReturnValue([ { code: 'a' }, { code: '234b' }, { code: 'c3' } ])
    nextCode = ExistingLighting.nextCode(realmProject)
    expect(nextCode).toEqual('b')

    // Ignore code with Numbers 3
    jest.spyOn(realmProject, 'activeExistingLightingsByCode', 'get').mockReturnValue([ { code: 'a' }, { code: 'b3' }, { code: 'c' } ])
    nextCode = ExistingLighting.nextCode(realmProject)
    expect(nextCode).toEqual('d')

    // Places longer codes at end.
    jest.spyOn(realmProject, 'activeExistingLightingsByCode', 'get').mockReturnValue([ { code: 'a' }, { code: 'aa' }, { code: 'b' }, { code: 'c' } ])
    nextCode = ExistingLighting.nextCode(realmProject)
    expect(nextCode).toEqual('ab')

    // Jump from z to a correctly
    jest.spyOn(realmProject, 'activeExistingLightingsByCode', 'get').mockReturnValue([ { code: 'a' }, { code: 'b' }, { code: 'bbb' }, { code: 'azzz' } ])
    nextCode = ExistingLighting.nextCode(realmProject)
    expect(nextCode).toEqual('baaa')

    // Jump from z to a correctly
    jest.spyOn(realmProject, 'activeExistingLightingsByCode', 'get').mockReturnValue([ { code: '1' }, { code: '2' }, { code: '3' } ])
    nextCode = ExistingLighting.nextCode(realmProject)
    expect(nextCode).toEqual('a')
  })
})

describe("validate()", () => {

  test('validate(lightingObject, project, action) scenarios',  async () => {
    objects = [{name: '1', code: '1'}, {name: '2', code: '2'}, {name: '3', code: '3'}]
    realm.objects = jest.fn(() => objects)
    realm.objects().filtered = jest.fn(() => objects)

    existingLightingObject = {
      lm70: 20000,
      watts_per_product: 100,
      existing_product_type: 'luminare',
      code: 'a',
      name: 'ExistingLighting1'
    }

    // no errors
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({})

    // lm70
    existingLightingObject['lm70'] = null
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ lm70: 'Must be present' })

    existingLightingObject['lm70'] = 2000.99
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ lm70: "Must be a whole number 0 or greater" })

    existingLightingObject['lm70'] = 0
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({})

    // watts_per_product
    existingLightingObject['watts_per_product'] = null
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ watts_per_product: 'Must be present' })

    existingLightingObject['watts_per_product'] = -10
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ watts_per_product: 'Must be a number 0 or greater' })

    existingLightingObject['watts_per_product'] = 20.99
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({})

    existingLightingObject['watts_per_product'] = 0
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({})

    // code
    existingLightingObject['code'] = null
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ codeError: 'Must be present' })

    existingLightingObject['code'] = 'aab675'
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ codeError: 'Must be less than 5 characters' })

    existingLightingObject['code'] = '1'
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ codeError: 'Must be unique' })

    existingLightingObject['code'] = 'aa13'
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({})

    // name
    existingLightingObject['name'] = null
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ nameError: 'Must be present' })

    existingLightingObject['name'] = '1'
    errors = await ExistingLighting.validate(existingLightingObject, { mobile_id: 1 }, 'new')
    expect(errors).toEqual({ nameError: 'Must be unique' })
  })
})

// ============================================================================
// Instance
// ============================================================================
