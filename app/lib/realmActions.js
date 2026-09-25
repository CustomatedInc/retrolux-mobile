/**
 * NOTICE:
 *  The method in this file is being migrated to 'database/model.js'
 *  No new methods should be added to this file
 */

import realm from '../database/realm';

export function markEdited(model, mobileId) {
  realm.write(() => {
    realm.create(model, {
      mobile_id: mobileId,
      edited: true,
    }, true);
  });
}
