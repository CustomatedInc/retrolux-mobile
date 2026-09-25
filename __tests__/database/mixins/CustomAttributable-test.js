import _ from 'lodash';

// import { CustomAttributable } from 'RetroluxMobile/app/database/mixins/CustomAttributable';
import { CustomAttributable } from '../../database/mixins/CustomAttributable';

// ============================================================================
// Setup
// ============================================================================
class Base {}
class EmptyTargetClass extends CustomAttributable(Base) {
  static getClassName() {
    return 'EmptyTargetClass'
  }
}

const attributesMock = [
  { code_name: 'attribute_1', display_order: 2, input_type: "integer", required: true, min: 0 },
  { code_name: 'attribute_2', display_order: 0, input_type: "integer", required: true, min: 0 },
  { code_name: 'attribute_3', display_order: 1, input_type: "string", required: false },
]

const customAttributesMock = JSON.stringify({ attribute_1: 'value 1', attribute_2: 'value 2', attribute_3: 'value 3' })

const projectMock = {
  primaryEmptyTargetClassAttributes: () => attributesMock,
  requiredEmptyTargetClassAttributes: () => _.filter(attributesMock, (attribute, index, collection) => attribute.required),
  EmptyTargetClassAttributes: () => attributesMock,
}

// ============================================================================
// Static
// ============================================================================
describe('projectAttributesForType()', () => {
  it("returns an empty array if no project is passed in", async () => {
    expect(await EmptyTargetClass.projectAttributesForType(null)).toEqual([])
  })

  it("returns custom attributes if no project is passed in", async () => {
    const attributes = await EmptyTargetClass.projectAttributesForType(projectMock)
    expect(attributes).toEqual(expect.arrayContaining([{ code_name: 'attribute_1', display_order: 2, input_type: "integer", required: true, min: 0 }]))
  })
})

describe('validateCustomAttributes()', () => {
  it("returns no errors if no number attributes are passed in", async () => {
    const customAttributes = { attribute_3: 'string' }
    const errors = await EmptyTargetClass.validateCustomAttributes(customAttributes, projectMock)
    expect(errors).toEqual({})
  })

  it("returns no errors if a number attributes is passed in with a string value containing only numbers", async () => {
    const customAttributes = { attribute_1: '42' }
    const errors = await EmptyTargetClass.validateCustomAttributes(customAttributes, projectMock)
    expect(errors).toEqual({})
  })

  it("returns no errors if a no CustomAttribute model corresponds to the key-value in custom_attributes", async () => {
    const customAttributes = { unknownAttribute: 42 }
    const errors = await EmptyTargetClass.validateCustomAttributes(customAttributes, projectMock)
    expect(errors).toEqual({})
  })

  it("returns an error if a number attributes is passed in with a string value containing letters", async () => {
    const customAttributes = { attribute_1: 'string' }
    const errors = await EmptyTargetClass.validateCustomAttributes(customAttributes, projectMock)
    expect(errors).toEqual({ "attribute_1": "Needs to be a whole number" })
  })

  it("can validate multiple attributes and return multipe errors", async () => {
    const customAttributes = { attribute_1: 'string', attribute_2: 'string'  }
    const errors = await EmptyTargetClass.validateCustomAttributes(customAttributes, projectMock)
    expect(errors).toEqual({ "attribute_1": "Needs to be a whole number", "attribute_2": "Needs to be a whole number" })
  })
})

// ============================================================================
// Instance
// ============================================================================
describe('isProjectSafe()', () => {
  const instance = new EmptyTargetClass()
  Object.assign(instance, { getClassName: function() { return 'EmptyTargetClass' } })

  it("returns false if the target Class doesn't have a project method", async () => {
    expect(await instance.isProjectSafe()).toEqual(false)
  })

  it("returns false if the target Class has a project method that doesn't return an object", async () => {
    Object.assign(instance, { project: function() { return null } })
    expect(await instance.isProjectSafe()).toEqual(false)
  })

  it("returns true if target Class has a project method that returns an object", async () => {
    Object.assign(instance, { project: function() { return {} } })
    expect(await instance.isProjectSafe()).toEqual(true)
  })
})

describe('readyForCalculable()', () => {
  const instance = new EmptyTargetClass()
  Object.assign(instance, { getClassName: function() { return 'EmptyTargetClass' } })

  it("returns true if the target Class doesn't have a requiredFields method", async () => {
    expect(await instance.readyForCalculable()).toEqual(true)
  })

  it("returns false if the target Class has a requiredFields method that doesn't return an array", async () => {
    Object.assign(instance, { requiredFields: function() { return 'field_name' } })
    expect(await instance.readyForCalculable()).toEqual(false)
  })

  it("returns false if the instance of the target Class doesn't have properties for the required fields", async () => {
    Object.assign(instance, { requiredFields: function() { return ['field_name', 'field_name_2'] } })
    expect(await instance.readyForCalculable()).toEqual(false)
  })

  it("returns false if the instance of the target Class has properties but no values for the required fields", async () => {
    Object.assign(instance, {
      requiredFields: function() { return ['field_name', 'field_name_2'] } ,
      field_name: null,
      field_name_2: 'string',
    })

    expect(await instance.readyForCalculable()).toEqual(false)
  })

  it("returns true if the instance of the target Class does have values for the required fields", async () => {
    Object.assign(instance, {
      requiredFields: function() { return ['field_name', 'field_name_2'] } ,
      field_name: 1,
      field_name_2: 'string',
    })

    expect(await instance.readyForCalculable()).toEqual(false)
  })
})

describe('primaryProjectAttributesForType()', () => {
  const instance = new EmptyTargetClass()
  Object.assign(instance, { getClassName: function() { return 'EmptyTargetClass' } })

  it("returns an empty array if the instance is not project safe", async () => {
    Object.assign(instance, { project: () => null })

    const attributeCodes = await instance.primaryProjectAttributesForType()
    expect(attributeCodes).toEqual([])
  })

  it("returns an array of project custom attribute code names", async () => {
    Object.assign(instance, { project: () => projectMock })

    const attributeCodes = await instance.primaryProjectAttributesForType()
    expect(attributeCodes).toEqual(expect.arrayContaining([{ code_name: 'attribute_1', display_order: 2, input_type: "integer", required: true, min: 0 }]))
  })
})

describe('sortedPrimaryCustomAttributes()', () => {
  const instance = new EmptyTargetClass()
  Object.assign(instance, { getClassName: function() { return 'EmptyTargetClass' } })

  it("returns an empty object if the instance is not project safe", async () => {
    Object.assign(instance, { project: () => null, custom_attributes: customAttributesMock })
    const value = await instance.sortedPrimaryCustomAttributes()

    expect(value).toEqual({})
  })

  it("returns an empty object if the instance is not project safe", async () => {
    Object.assign(instance, { project: () => null, custom_attributes: customAttributesMock })
    const value = await instance.sortedPrimaryCustomAttributes()

    expect(value).toEqual({})
  })

  it("returns a sorted object if the instance is project safe", async () => {
    Object.assign(instance, { project: () => projectMock, custom_attributes: customAttributesMock })
    const value = await instance.sortedPrimaryCustomAttributes()

    expect(value).toEqual({ attribute_2: 'value 2', attribute_3: 'value 3', attribute_1: 'value 1' })
    expect(Object.keys(value)).toEqual([ 'attribute_2', 'attribute_3', 'attribute_1' ])
  })
})

describe('isComplete()', () => {
  let instance;

  beforeEach(() => {
    instance = new EmptyTargetClass()
    Object.assign(instance, { project: _ => projectMock, getClassName: function() { return 'EmptyTargetClass' } } )
  });

  it("defaults to true if requiredCodeNames is empty", async () => {
    Object.assign(instance, { requiredCodeNames: _ => [], custom_attributes: customAttributesMock })
    expect(await instance.isComplete()).toBeTruthy()
  })

  it("returns to true if requiredCodeNames are filled", async () => {
    Object.assign(instance, { requiredCodeNames: _ => ['attribute_2', 'attribute_3', 'attribute_1'], custom_attributes: JSON.stringify({ attribute_1: 'value 1', attribute_2: 'value 2', attribute_3: 'value 3' }) })
    expect(await instance.isComplete()).toBeTruthy()
  })

  it("returns to true if attribute values are filled with 0", async () => {
    Object.assign(instance, { requiredCodeNames: _ => ['attribute_2', 'attribute_3', 'attribute_1'], custom_attributes: JSON.stringify({ attribute_1: 0, attribute_2: 0, attribute_3: '0' }) })
    expect(await instance.isComplete()).toBeTruthy()
  })

  it("returns to false if requiredCodeNames are not filled (empty string)", async () => {
    Object.assign(instance, { requiredCodeNames: _ => ['attribute_2', 'attribute_3', 'attribute_1'], custom_attributes: JSON.stringify({ attribute_1: 'value 1', attribute_2: '', attribute_3: 'value 3' }) })
    expect(await instance.isComplete()).toBeFalsy()
  })

  it("returns to false if requiredCodeNames are not filled (null)", async () => {
    Object.assign(instance, { requiredCodeNames: _ => ['attribute_2', 'attribute_3', 'attribute_1'], custom_attributes: JSON.stringify({ attribute_1: 'value 1', attribute_2: null, attribute_3: 'value 3' }) })
    expect(await instance.isComplete()).toBeFalsy()
  })

  it("returns true when all required attributes have a corresponding value", async () => {
    Object.assign(instance, { custom_attributes: customAttributesMock })
    expect(await instance.isComplete()).toBeTruthy()
  })

  it("returns false when one required attribute is missing a corresponding value", async () => {
    Object.assign(instance, { custom_attributes: JSON.stringify({ attribute_1: 'value 1', attribute_2: null }) })
    expect(await instance.isComplete()).toBeFalsy()
  })

  it("returns false when several required attributes are missing a corresponding value", async () => {
    Object.assign(instance, { custom_attributes: JSON.stringify({ attribute_1: null, attribute_2: null }) })
    expect(await instance.isComplete()).toBeFalsy()
  })
})
