/*
 * Set pinnable_sub_type for all existing Pins
 * Update all RateSchedule to have a type
 */
export default function migration32(oldRealm, newRealm) {
  if (oldRealm.schemaVersion < 32) {
    let newPins = newRealm.objects('Pin')
    let oldPins = oldRealm.objects('Pin')

    for (let i = 0; i < oldPins.length; i++) {
      const oldPin = oldPins[i];
      const newPin = newPins[i]
      newPin.pinnable_sub_type = 'location'
    }
  }

  if (oldRealm.schemaVersion < 32) {
    let newRateSchedule = newRealm.objects('RateSchedule')
    let oldRateSchedule = oldRealm.objects('RateSchedule')

    for (let i = 0; i < oldRateSchedule.length; i++) {
      const oldSchedule = oldRateSchedule[i];
      if (!oldSchedule.rate_type) {
        newRateSchedule[i].rate_type = 'blended';
      }
    }
  }
}
