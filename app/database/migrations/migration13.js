/*
 * This migration became necessary to add UUIDs to projects,
 * areas, schedules, and attachments that do not have server_ids.
 *
 * Adding a uuid in this migration using react-native-uuid-generator
 * failed.
 *
 * Workaround: Add 'needs uuid' to records without server_ids, then
 * during sync, replace that string with a UUID.
 *
 * Second part of workaround found in file app/api/syncs.js and
 * method checkForMissingUuids()
 */
export default function migration13(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 13) {
    const objectTypes = [
      'Project', 'Area', 'ExistingFixture', 'OperatingSchedule', 'RateSchedule',
      'Cooling', 'Heating', 'Attachment'
    ];

    for(let i = 0; i < objectTypes.length; i++) {
      let oldObjects = oldRealm.objects(objectTypes[i]);
      let newObjects = newRealm.objects(objectTypes[i]);
      for (let j = 0; j < oldObjects.length; j++) {
        newObjects[j].uuid = oldObjects[j].server_id ? null : 'needs uuid';
      }
    }
  }
}
