import { Project } from '../../../app/database/models/Project';

// ============================================================================
// Mocks
// ============================================================================
jest.mock('react-native-aws3', () => { return { Request: { FormData: {} } } });
jest.mock('react-native-fs', () => {})
jest.mock('../../../app/database/models/', () => {}); // mocks every model but the one we're testing

import realm from '../../../app/database/realm'; // manual mock

Object.assign(Project, { findOrNextMobileId: jest.fn(_ => 1) })

// ============================================================================
// Setup
// ============================================================================

/**
 * This should match what Api::V4::ProjectsController#index sends down per project
 * except for nested collections (e.g. areas, existing_fixtures)
 *
 */
const serverProjectSimple = {
  active: true,
  all_company_access: false,
  apply_tax_on: null,
  company_id: 1,
  company_project_status_id: 1,
  cooling_id: null,
  created_at: "2018-12-21T16:25:56.205Z",
  enable_sync: true,
  expected_close_date: null,
  heating_id: null,
  id: 30,
  inactive_at: null,
  maintenance_labor_rate: null,
  markup: null,
  markup_type: null,
  name: "Large Industrial Project",
  operating_schedule_id: null,
  probability: null,
  rate_schedule_id: null,
  tax_rate: null,
  tax_type: null,
  updated_at: "2018-12-21T16:25:56.205Z",
  uuid: "775d1066-8e5e-4f5c-8c57-cf703e1ee63c",
}

const serverProjectAdvanced = {
  active: true,
  all_company_access: false,
  apply_tax_on: null,
  company_id: 1,
  company_project_status_id: 1,
  cooling_id: null,
  created_at: "2018-12-21T16:25:56.205Z",
  enable_sync: true,
  expected_close_date: "2018-12-21T16:25:56.205Z",
  heating_id: null,
  id: 31,
  inactive_at: null,
  maintenance_labor_rate: null,
  markup: 12,
  markup_type: "markup",
  name: "Large Industrial Project",
  operating_schedule_id: null,
  probability: 12,
  rate_schedule_id: null,
  tax_rate: 12,
  tax_type: null,
  updated_at: "2018-12-21T16:25:56.205Z",
  uuid: "775d1066-8e5e-4f5c-8c57-cf703e1ee63c",
}

// ============================================================================
// Static
// ============================================================================

// Used as baseline for refactoring prepareForRealm methods
describe('prepareForRealm', () => {

  beforeEach(() => {
    Project.findOrNextMobileId.mockClear();
  });

  test('translates simple JSON objects from API to realm format', async () => {
    const preppedProject = await Project.prepareForRealm(serverProjectSimple)

    expect(Project.findOrNextMobileId).toHaveBeenCalledTimes(1)
    expect(preppedProject).toEqual({
      active: true,
      all_company_access: false,
      apply_tax_on: null,
      company_id: 1,
      edited: false,
      company_project_status_id: 1,
      cooling_id: null,
      created_at: new Date("2018-12-21T16:25:56.205Z"),
      enable_sync: true,
      expected_close_date: null,
      heating_id: null,
      server_id: 30,
      mobile_id: 1, // see findOrNextMobileId mock at top of file
      inactive_at: null,
      maintenance_labor_rate: null,
      markup: null,
      markup_type: null,
      name: "Large Industrial Project",
      operating_schedule_id: null,
      probability: null,
      rate_schedule_id: null,
      tax_rate: null,
      tax_type: null,
      updated_at: new Date("2018-12-21T16:25:56.205Z"),
      uuid: "775d1066-8e5e-4f5c-8c57-cf703e1ee63c",
    })
  })

  test('translates advanced JSON objects from API to realm format', async () => {
    const preppedProjectAdvanced = await Project.prepareForRealm(serverProjectAdvanced)

    expect(preppedProjectAdvanced).toEqual({
      active: true,
      all_company_access: false,
      apply_tax_on: null,
      company_id: 1,
      company_project_status_id: 1,
      cooling_id: null,
      edited: false,
      created_at: new Date("2018-12-21T16:25:56.205Z"),
      enable_sync: true,
      expected_close_date: new Date("2018-12-21T16:25:56.205Z"),
      heating_id: null,
      server_id: 31,
      mobile_id: 1, // see findOrNextMobileId mock at top of file
      inactive_at: null,
      maintenance_labor_rate: null,
      markup: "12",
      markup_type: "markup",
      name: "Large Industrial Project",
      operating_schedule_id: null,
      probability: "12",
      rate_schedule_id: null,
      tax_rate: "12",
      tax_type: null,
      updated_at: new Date("2018-12-21T16:25:56.205Z"),
      uuid: "775d1066-8e5e-4f5c-8c57-cf703e1ee63c",
    })
  })
})
