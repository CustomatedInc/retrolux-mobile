export default function migration01(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 1) {
    let oldObjects = oldRealm.objects('Area');
    let newObjects = newRealm.objects('Area');
    for (let i = 0; i < oldObjects.length; i++) {
      newObjects[i].avg_illuminace = oldObjects[i].avg_illuminace ? oldObjects[i].avg_illuminace.toFixed(2) : null;
      newObjects[i].ceiling_height = oldObjects[i].ceiling_height ? oldObjects[i].ceiling_height.toFixed(2) : null;
      newObjects[i].length = oldObjects[i].length ? oldObjects[i].length.toFixed(2) : null;
      newObjects[i].sqft = oldObjects[i].sqft ? oldObjects[i].sqft.toFixed(2) : null;
      newObjects[i].width = oldObjects[i].width ? oldObjects[i].width.toFixed(2) : null;
    }
  }
}
