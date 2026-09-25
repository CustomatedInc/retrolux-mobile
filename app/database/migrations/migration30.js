/*
 * Set hour_type for all existing OperatingSchedules
 *
 */
export default function migration30(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 30) {
    let newOperatingSchedule = newRealm.objects('OperatingSchedule')
    let oldOperatingSchedule = oldRealm.objects('OperatingSchedule')

    for (let i = 0; i < oldOperatingSchedule.length; i++) {
      const oldSchedule = oldOperatingSchedule[i];
      if (!oldSchedule.hour_type) {
        newOperatingSchedule[i].hour_type = 'annual';
      }
    }
  }
}
