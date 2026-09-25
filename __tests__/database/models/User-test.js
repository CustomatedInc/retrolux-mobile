import { User } from '../../../app/database/models/User';

import { testUser } from '../../../app/__fixtures__/users.js';
import { testCompanyUser } from '../../../app/__fixtures__/companyUsers.js';
import { testProjectUsers } from '../../../app/__fixtures__/projectUsers.js';

// ============================================================================
// Mocks
// ============================================================================

jest.mock('../../../app/database/models/', () => {}); // mocks every model but the one we're testing

import realm from '../../../app/database/realm'; // manual mock

// ============================================================================
// Setup
// ============================================================================

const newTestUser = new User();
Object.assign(newTestUser, testUser)
const overrideMethods = {
  activeCompanyUsers: _ => [ testCompanyUser ],
}
Object.assign(newTestUser, overrideMethods)

// ============================================================================
// Instance
// ============================================================================

describe('accessibleCompanyIdsFilter', () => {
  test('returns the correct filter', async () => {
    const filter = await newTestUser.accessibleCompanyIdsFilter()
    expect(filter).toEqual("company_id = 156")
  })
})
