import { Schedule } from './Schedule';

/**
 * Mimics functionality of product_operating_schedule.rb on web.
 *
 * Holds the similar functionality between OperatingSchedule and DoorOperatingSchedule
 *
 * Current models using ExistingProduct:
 * - OperatingSchedule
 * - DoorOperatingSchedule
 */

export class ProductOperatingSchedule extends Schedule {

  /**
   * Builder for API - called from builds.js
  **/

  static async createAllFromServer(productOperatingSchedules) {
    const preppedProductOperatingSchedules = []
    for (let index = 0; index < productOperatingSchedules.length; index++) {
      const preppedProductOperatingSchedule = await this.prepareForRealm(productOperatingSchedules[index]);
      const found = await this.findServer(preppedProductOperatingSchedule.server_id);

      if (!!found) {
        preppedProductOperatingSchedules.push(preppedProductOperatingSchedule);
      } else {
        preppedProductOperatingSchedule.mobile_id = preppedProductOperatingSchedule.mobile_id + index
        preppedProductOperatingSchedules.push(preppedProductOperatingSchedule);
      }
    }
    await this.create(preppedProductOperatingSchedules, true);
  }

}
