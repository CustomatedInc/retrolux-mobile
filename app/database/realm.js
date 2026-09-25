import { createRealmContext,Realm } from '@realm/react';
import * as Models from './models';
import migration01 from './migrations/migration01';
import migration02 from './migrations/migration02';
import migration12 from './migrations/migration12';
import migration13 from './migrations/migration13';
import migration24 from './migrations/migration24';
import migration28 from './migrations/migration28';
import migration30 from './migrations/migration30';
import migration32 from './migrations/migration32';
import migration47 from './migrations/migration47';
import migration48 from './migrations/migration48';

// Define the migration logic
const migrationFunction = (oldRealm, newRealm) => {
  // SCHEMA VERSION 01 - change Area float fields into strings to fix floating point accuracy
  migration01(oldRealm, newRealm);

  // SCHEMA VERSION 02 - change project, fixture, and schedule float fields into strings
  migration02(oldRealm, newRealm);

  // SCHEMA VERSION 12 - set all Attachment.edited to true
  migration12(oldRealm, newRealm);

  // SCHEMA VERSION 13 - add UUIDs
  migration13(oldRealm, newRealm);

  // SCHEMA VERSION 24 - existingLighting needs new primary key values for mobile_id during 2.0.5 release
  migration24(oldRealm, newRealm);

  // SCHEMA VERSION 28 - add company_ids string array to User && change ExistingLighting.watts_per_product from string to double
  migration28(oldRealm, newRealm);

  // SCHEMA VERSION 30 - give all existing operating schedules hour_type a value
  migration30(oldRealm, newRealm);

  // SCHEMA VERSION 32 - add pinnable_sub_type and area illuminance (1-5)
  migration32(oldRealm, newRealm);

  // SCHEMA VERSION 47 - add default_lighting_template_id to Company and measure_type to CompanyTemplate
  migration47(oldRealm, newRealm);

  // SCHEMA VERSION 48 - add default_door_template_id to Company, measure_types to Company and Project, measure_type to CustomAttribute
  migration48(oldRealm, newRealm);

  // Add any further migrations as needed
};

// Define the Realm configuration
const config = {
  schema: Object.values(Models),
  schemaVersion: 53,
  migration: migrationFunction,
};

// Create a Realm context
// const { RealmProvider, useRealm, useQuery } = createRealmContext(config);
// Create and export the Realm instance

let relam = new Realm(config);
export default relam;
// export { RealmProvider, useRealm, useQuery,getRealmInstance };
