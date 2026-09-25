/*
 * Adding mobile_id as primary key to ExistingLighting
 *
 */
export default function migration24(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 24) {
    let newLightings = newRealm.objects('ExistingLighting')
    let oldLightings = oldRealm.objects('ExistingLighting')

    for (let i = 0; i < oldLightings.length; i++) {
      newLightings[i].mobile_id = i;
      newLightings[i].server_id = oldLightings[i].id;
    }
  }
}
