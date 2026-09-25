/**
 * Mixin for models that users can edit on mobile.
 *
 * Contains methods to help with sync preparation.
 *
 * Models using Editable must have attributes:
 * - server_id
 * - mobile_id
 * - edited
 *
 */
export const Editable = superclass => class extends superclass {
  static async serverMobileIdLookup() {
    const objects = await this.allArray
        
    return objects.reduce((result, item, index) => {
      result[item.server_id] = item.mobile_id
      return result
    }, {});
  }
  
  static async serverMobileIdLookupBatch() {
    const objects = await this.allArrayServerMobileID    
    const result = new Map();
    objects.forEach(item => {
        result.set(item.server_id, item.mobile_id);
    });

    return result;
  }

  toSyncableFormat() {
    return this.isfullSyncWorthy() ? this.toPlainObject() : this.toVitalsObject()
  }

  toVitalsObject() {
    return { server_id: this.server_id, mobile_id: this.mobile_id }
  }

  isfullSyncWorthy() {
    return (this.server_id === null || !!this.edited)
  }
};
