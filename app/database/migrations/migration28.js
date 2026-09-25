/*
 * Chaging ExistingLighting watts_per_product from string to float
 *
 */
export default function migration28(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 28) {
    let newLightings = newRealm.objects('ExistingLighting')
    let oldLightings = oldRealm.objects('ExistingLighting')

    for (let i = 0; i < oldLightings.length; i++) {
      const oldLighting = oldLightings[i];
      if (!!oldLighting.watts_per_product || oldLighting.watts_per_product == 0) {
        newLightings[i].watts_per_product = parseFloat(oldLighting.watts_per_product.replace(/,/g, ''));
      } else {
        newLightings[i].watts_per_product = 0;
      }
    }
  }
}
