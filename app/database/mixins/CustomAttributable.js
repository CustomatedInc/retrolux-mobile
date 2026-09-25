import _ from 'lodash';
import {
  isFloat,
  isIntegerGreaterThanZero,
  isNumber,
  isNumberGreaterThanZero,
  parseNumberInput,
} from '../../lib/numberHelpers';

/**
 * Mixin for models hosting custom_attribute json fields.
 *
 * Copies the functionality of the webapp's CustomAttributable concern
 * using composition pattern described here: https://alligator.io/js/class-composition/
 *
 * Models relying on this mixin must:
 * - include a `project()` method that returns an object
 * - include a `getClassName()` instance method that returns a string (e.g. 'ExistingLighting')
 * - include a `getClassName()` static method that is the same as above
 *
 * Models can optionally include:
 * - requiredFields() to influence readyForCalculable()
 *
 * Project model must have named scopes that return realm results for each model
 * that CustomAttributable is added to. If CustomAttributable is added to Area,
 * then Project would need:
 * - AreaAttributes
 * - primaryAreaAttributes
 * - additionalAreaAttributes
 * - requiredAreaAttributes
 */
export const CustomAttributable = superclass => class extends superclass {

  static async projectAttributesForType(project) {
    if (!!project) {
      return project[`${this.getClassName()}Attributes`]()
    } else {
      return []
    }
  }

  /**
   * Validates custom_attribute form values based on corresponding CustomAttribute input_type
   *
   * This needs to be a static method because new and editing models are
   * treated as plain objects in forms and so will not respond to instance
   * methods.
   *
   * @returns {Object} errors
   * @returns {string} errors.code_name - error message for code_name
   */
  static async validateCustomAttributes(custom_attributes, project) {
    const attributeModels = await this.projectAttributesForType(project)
    const errors = {}
    const integerRegex = /^\d+$/

    for (const [code_name, value] of Object.entries(custom_attributes)) {
      const attribute = await attributeModels.filter(attribute => (attribute.code_name === code_name))[0]

      if (!!attribute && value) {

        if (attribute.input_type == "integer" && !integerRegex.test(value)) {
          errors[code_name] = `Needs to be a whole number`
        }

        else if ((attribute.input_type == "number" || attribute.input_type == "integer")) {
          min = (attribute.min && attribute.min != 0) ? attribute.min : 0
          if (!!attribute.max && value > +attribute.max.toFixed(2)) {
            errors[code_name] = `Needs to be greater than ${min} and less than ${+attribute.max.toFixed(2)}`
          }
          else if (value < min) {
            errors[code_name] = `Needs to be greater than ${min}`
          }
        }
      }
    }

    return errors
  }

  /**
   * Gathers primary tab CustomAttribute records that apply to current model (e.g. ExistingLighting).
   *
   * Relies on the project instance to respond to dynamically named functions
   * If CustomAttributable is added to Area, project will need to respond to both:
   * @example
   *   primaryAreaAttributes()
   *   additionalAreaAttributes()
   *
   * @returns {(Promise|Array)} promise object resolves to realm CustomAttribute results or a blank array
   */
  async projectAttributesForType() {
    if (await this.isProjectSafe()) {
      const project = await this.project()
      return project[`${this.getClassName()}Attributes`]()
    } else {
      return []
    }
  }

  async primaryProjectAttributesForType() {
    if (await this.isProjectSafe()) {
      const project = await this.project()
      return project[`primary${this.getClassName()}Attributes`]()
    } else {
      return []
    }
  }

  async sortedPrimaryCustomAttributes() {
    const primaryAttributes = _.orderBy(await this.primaryProjectAttributesForType(), 'display_order')
    const sortedAttributeCodes = primaryAttributes.map(attribute => attribute.code_name)
    const customAttributes = this.parsedCustomAttributes;

    return sortedAttributeCodes.reduce(function (result, key) {
      result[key] = customAttributes[key]
      return result
    }, {})
  }

  async readyForCalculable() {
    if (typeof this.requiredFields !== 'function') return true
    const requiredFields = this.requiredFields()
    if (!Array.isArray(requiredFields)) return false
    return requiredFields.every(field => { !!this[field] })
  }

  async isProjectSafe() {
    if (typeof this.project !== 'function') return false
    const project = await this.project();
    return !!project && (typeof project === 'object')
  }

  // @todo Add custom_attribute clean up to this method
  async afterSaveUpdates() {
    await this.setCompleteStatus()
  }

  async setCompleteStatus() {
    this.setProp('audit_complete', await this.isComplete())
  }

  /**
   * Used to set audit_complete flag based on required CustomAttributes.
   *
   * Gathers custom_attribute key-value pairs that correspond with required
   * CustomAttribute records. Checks whether all pairs have a value.
   */
  async isComplete() {
    const requiredAttributes = await this.requiredCustomAttributes()
    complete = _.every(requiredAttributes, (value, code_name, collection) => !!value || value === 0 )

    if (complete == true) {
      return true
    } else if (!!this.mobile_area_id) {
      return this.attributesComplete() // (this) = ExistingFixture
    } else {
      return false // = ExistingLighting thats not complete
    }
  }

  async requiredCustomAttributes() {
    const parsedCustomAttributes = await this.parsedCustomAttributes
    const requiredCodeNames = await this.requiredCodeNames()

    const requiredAttributes = {}
    requiredCodeNames.forEach(code_name => {
      requiredAttributes[code_name] = parsedCustomAttributes[code_name]
    })
    return requiredAttributes
  }

  async requiredCodeNames() {
    if (await this.isProjectSafe()) {
      const project = await this.project()
      const attributes = await project[`required${this.getClassName()}Attributes`]()
      return attributes.map(attribute => attribute.code_name)
    } else {
      return []
    }
  }

  get parsedCustomAttributes() {
    return JSON.parse(this.custom_attributes)
  }
};
