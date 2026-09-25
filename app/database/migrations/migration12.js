/*
 * Sets all edited fields for Attachments to true to force the server to correct
 * faulty AWS URLs
 *
 */
export default function migration12(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 12) {
    let oldObjects = oldRealm.objects('Attachment');
    let newObjects = newRealm.objects('Attachment');
    for (let i = 0; i < oldObjects.length; i++) {
      newObjects[i].edited = true
    }
  }
}
