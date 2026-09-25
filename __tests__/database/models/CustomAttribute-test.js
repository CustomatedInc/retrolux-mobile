import _ from 'lodash';

import { CustomAttribute } from '../../../app/database/models/CustomAttribute';
import { customTemplateAttributes } from '../../../app/__fixtures__/customAttributes';

// ============================================================================
// Mocks
// ============================================================================
jest.mock('react-native-aws3', () => { return { Request: { FormData: {} } } });
jest.mock('react-native-fs', () => {})
jest.mock('../../../app/database/models/', () => {}); // mocks every model but the one we're testing

import UUIDGenerator from 'react-native-uuid-generator';
jest.mock('react-native-uuid-generator')

import realm from '../../../app/database/realm'; // manual mock

// ============================================================================
// Setup
// ============================================================================

Object.assign(CustomAttribute, { nextId: _ => 2 })

// ============================================================================
// Static
// ============================================================================

// ============================================================================
// Instance
// ============================================================================

describe('toProjectFormat', () => {
  const templateAttribute = new CustomAttribute();

  /**
   * Not sure why this is necessary, but without it:
   *   RangeError: Maximum call stack size exceeded
   */
  Object.defineProperty(templateAttribute, "edited", { set(v) { } });
  Object.assign(templateAttribute, { ...customTemplateAttributes[0] })

  test('templateAttribute is correctly formatted', async () => {
    const projectAttribute = await templateAttribute.toProjectFormat(1, 2, 3)

    expect(templateAttribute).toHaveProperty('company_template_id')
    expect(templateAttribute.company_template_id).not.toBe(null)
    expect(templateAttribute).toHaveProperty('project_id')
    expect(templateAttribute.project_id).toBe(null)
    expect(templateAttribute).toHaveProperty('mobile_project_id')
    expect(templateAttribute.mobile_project_id).toBe(null)
  })

  test('doesnt include a template id', async () => {
    const projectAttribute = await templateAttribute.toProjectFormat(1, 2, 3)

    expect(projectAttribute.company_template_id).toBe(null)
  })

  test('sets the mobile_project_id', async () => {
    const projectAttribute = await templateAttribute.toProjectFormat(1, 2, 3)

    expect(projectAttribute.mobile_project_id).toBe(1)
  })

  test('sets the project_id', async () => {
    const projectAttribute = await templateAttribute.toProjectFormat(1, 2, 3)

    expect(projectAttribute.project_id).toBe(2)
  })

  test('sets the mobile_id', async () => {
    const projectAttribute = await templateAttribute.toProjectFormat(1, 2, 3)

    expect(projectAttribute.mobile_id).not.toBe(templateAttribute.mobile_id)
    expect(projectAttribute.mobile_id).toBe(3)
  })

  test('copies the rest of the properties', async () => {
    const projectAttribute = await templateAttribute.toProjectFormat(1, 2, 3)
    const changedAttributes = ['company_template_id', 'project_id', 'mobile_project_id', 'mobile_id', 'server_id']
    expect(_.omit(templateAttribute, changedAttributes)).toEqual(_.omit(projectAttribute, changedAttributes))
  })

  test('works if null is passed for args', async () => {
    const anotherProjectAttribute = await templateAttribute.toProjectFormat(null, null, 3)

    expect(anotherProjectAttribute.mobile_project_id).toBe(null)
    expect(anotherProjectAttribute.project_id).toBe(null)
    expect(anotherProjectAttribute.company_template_id).toBe(null)
    expect(anotherProjectAttribute.server_id).toBe(null)
  })
})
