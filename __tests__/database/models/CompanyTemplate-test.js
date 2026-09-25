import {CompanyTemplate} from '../../../app/database/models/CompanyTemplate';
import {CustomAttribute} from '../../../app/database/models/CustomAttribute';
import {CustomAttributeListItem} from '../../../app/database/models/CustomAttributeListItem';

import {companyTemplate01} from '../../../app/__fixtures__/companyTemplates';
import {
  customTemplateAttributes,
  projectCustomTemplateAttribute01,
  areaCustomTemplateAttribute01,
} from '../../../app/__fixtures__/customAttributes';
import {difficultyFactorListItems} from '../../../app/__fixtures__/customAttributeListItems';
import realm from '../../../app/database/realm'; // manual mock

// ============================================================================
// Mocks
// ============================================================================
jest.mock('react-native-aws3', () => {
  return {Request: {FormData: {}}};
});
jest.mock('react-native-fs', () => {});

jest.mock('reactotron-react-native', () => {
  const reactotron = {
    configure: () => reactotron,
    useReactNative: () => reactotron,
    use: () => reactotron,
    connect: () => reactotron,
    clear: () => reactotron,
  };
  return reactotron;
});

jest.mock('../../../app/database/models/', () => {}); // mocks every model but the one we're testing

// ============================================================================
// Setup
// ============================================================================

Object.assign(CustomAttribute, {nextId: _ => 2});
Object.assign(CustomAttributeListItem, {nextId: _ => 2});

difficultyFactorListItems.forEach(item => {
  Object.assign(item, {toProjectFormat: _ => item});
});

const modelCustomTemplateAttributes = customTemplateAttributes.map(att => {
  const modelAtt = new CustomAttribute();
  Object.assign(att, {
    toProjectFormat: _ => att,
    listItems: _ =>
      att.code_name === 'difficulty_factor' ? difficultyFactorListItems : [],
  });
  Object.assign(modelAtt, att);
  return modelAtt;
});

// ============================================================================
// Static
// ============================================================================

// ============================================================================
// Instance
// ============================================================================

describe('copyTemplateToNewProject', () => {
  const template = new CompanyTemplate();
  Object.assign(template, {
    customAttributes: jest.fn(_ => modelCustomTemplateAttributes),
  });

  test('copies four attributes to the project', async () => {
    await template.copyTemplateToNewProject(1);

    expect(realm.create).toHaveBeenCalledTimes(9);
    expect(realm.write).toHaveBeenCalledTimes(1);
  });
});

describe('cleanAttributes(attributable_type)', () => {
  const realmCompanyTemplate = new CompanyTemplate();
  Object.assign(realmCompanyTemplate, companyTemplate01);
  Object.assign(realmCompanyTemplate, {
    customAttributes: jest.fn(_ => modelCustomTemplateAttributes),
  });

  test('cleanAttributes(attributable_type) scenarios', async () => {
    realmCompanyTemplate.customAttributes().filtered = jest.fn(() => [
      projectCustomTemplateAttribute01,
    ]);
    expect(await realmCompanyTemplate.cleanAttributes('project')).toEqual(
      '{"project_difficulty_factor":null}',
    );

    realmCompanyTemplate.customAttributes().filtered = jest.fn(() => [
      areaCustomTemplateAttribute01,
    ]);
    expect(await realmCompanyTemplate.cleanAttributes('area')).toEqual(
      '{"area_attribute":null}',
    );
  });
});

