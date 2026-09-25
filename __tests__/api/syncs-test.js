import { updateRecordsFromResponse } from '../../app/api/syncs';

/**
 * Mocks
 *
 */
jest.mock('react-native-aws3', () => { return { Request: { FormData: {} } } });
jest.mock('react-native-device-info', () => { return { DeviceInfo: () => {} } });
jest.mock('react-native-fs', () => {})
jest.mock('../../app/database/models', () => {});

import realm from '../../app/database/realm'; // manual mock


/**
 * Method Tests
 *
 */
describe('updateRecordsFromResponse()', () => {
  const successfullResponse1 = { status: 'ok', mobile_id: 1, server_id: 1 }
  const successfullResponse2 = { status: 'ok', mobile_id: 2, server_id: 2 }
  const unsuccessfullResponse = { status: 'bad_request' }

  const successfulResponses = [successfullResponse1, successfullResponse2]
  const mixedResponses = [successfullResponse1, unsuccessfullResponse]

  beforeEach(() => {
    realm.create.mockClear();
  });

  it('throws an error if it doesnt get responses', async () => {
    expect(updateRecordsFromResponse(null, 'ExistingLighting')).resolves.toThrow()
  })

  it('updates realm for each successful response', async () => {
    const updateSuccess = await updateRecordsFromResponse(successfulResponses, 'ExistingLighting')
    expect(realm.create).toHaveBeenCalledTimes(2)
  })

  it('only calls realm.create for successful responses', async () => {
    const updateSuccess = await updateRecordsFromResponse(mixedResponses, 'ExistingLighting')
    expect(realm.create).toHaveBeenCalledTimes(1)
  })

  it('sends realm the correct args for updating successful responses', async () => {
    const updateSuccess = await updateRecordsFromResponse(mixedResponses, 'ExistingLighting')
    const successfullResponse1Args = ['ExistingLighting', { mobile_id: 1, server_id: 1, edited: false }, true]
    expect(realm.create).toBeCalledWith(...successfullResponse1Args)
  })

  it('returns true if all responses are successful', async () => {
    const updateSuccess = await updateRecordsFromResponse(successfulResponses, 'ExistingLighting')
    expect(updateSuccess).toEqual(true);
  })

  it('returns false if any of the responses were not successful', async () => {
    const updateSuccess = await updateRecordsFromResponse(mixedResponses, 'ExistingLighting')
    expect(updateSuccess).toEqual(false);
  })
})
