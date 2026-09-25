import Realm from 'realm';
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

const realm = new Realm({
  schema: Object.values(Models),
  schemaVersion: 53,

  migration: (oldRealm, newRealm) => {

    // SCHEMA VERSION 01 - change Area float fields into strings to fix floating point accuracy
    migration01(oldRealm, newRealm);

    // SCHEMA VERSION 02 - change project, fixture and schedule float fields into strings
    migration02(oldRealm, newRealm);

    // SCHEMA VERSION 03 - add Attachment properties

    // SCHEMA VERSION 04 - add more Attachment properties

    // SCHEMA VERSION 05 - add optional aws_key field to Attachments

    // SCHEMA VERSION 06 - change company.stripe_status from int to string due to enum issue

    // SCHEMA VERSION 07 - add fields to attachments

    // SCHEMA VERSION 08 - remove unneeded required fields for CompanyProjectStatus

    // SCHEMA VERSION 09 - make create_at and updated_at optional

    // SCHEMA VERSION 10 - make company.create_by_user_id optional

    // SCHEMA VERSION 11 - remove unneeded User fields. Make user.email optional

    // SCHEMA VERSION 12 - set all Attachment.edited to true
    migration12(oldRealm, newRealm);

    // SCHEMA VERSION 13 - add UUIDs
    migration13(oldRealm, newRealm);

    // SCHEMA VERSION 14 - add fields to ExistingLighting

    // SCHEMA VERSION 15 - add active to ExistingCategoryTreeEntries

    // SCHEMA VERSION 16 - add id to User

    // SCHEMA VERSION 17 - add active to CompanyUser

    // SCHEMA VERSION 18 - product schedules

    // SCHEMA VERSION 19 - make calc_ready optional for ExistingLighting and ExistingFixture

    // SCHEMA VERSION 23 - add luminaire_size_id to existingLightingSchema

    // SCHEMA VERSION 24 - existingLighting needs new primary key values for mobile_id during 2.0.5 release
    migration24(oldRealm, newRealm);

    // SCHEMA VERSION 25 - make existingFixtureSchema.properties.audit_complete optional

    // SCHEMA VERSION 26 - add existingLightingSchema.company_favorite_id

    // SCHEMA VERSION 27 - add quick_list values to CustomAttributes

    // SCHEMA VERSION 28 - add company_ids string array to User && change ExistingLighting.watts_per_product from string to double
    migration28(oldRealm, newRealm);

    // SCHEMA VERSION 29 - add weekly hour field to OperatingSchedule and add new fields to RateSchedule

    // SCHEMA VERSION 30 - give all existing operating schedules hour_type a value
    migration30(oldRealm, newRealm);

    // SCHEMA VERSION 31 - add FloorPlan Model and Relationship to Area

    // SCHEMA VERSION 32 - add pinnable_sub_type and area illuminance (1-5)
    migration32(oldRealm, newRealm);

    // SCHEMA VERSION 33 - remove svg from FloorPlan (not used)

    // SCHEMA VERSION 34 - add code to ExistingLighting

    // SCHEMA VERSION 35 - add LocationSchema

    // SCHEMA VERSION 36 - add mobile_location_ids to Project and location_id to Area

    // SCHEMA VERSION 37 - add stripe_billing_plan to Company and remove unused attributes.

    // SCHEMA VERSION 38 - add name_with_parents to Area

    // SCHEMA VERSION 39 - add controls_reduction to OperatingSchedule

    // SCHEMA VERSION 40 - add name to Attachment

    // SCHEMA VERSION 41 - add custom_attributes to Project

    // SCHEMA VERSION 42 - add custom_attributes + audit_complete to Area and Location

    // SCHEMA VERSION 43 - add all schedules to Location

    // SCHEMA VERSION 44 - add FacilityType

    // SCHEMA VERSION 45- add EncentivUtility

    // SCHEMA VERSION 46- add default_lighting_template_id to Company

    // SCHEMA VERSION 47 - add default_lighting_template_id to Company and measure_type to CompanyTemplate
    migration47(oldRealm, newRealm);

    // SCHEMA VERSION 48 - add default_door_template_id to Company, measure_types to Company and Project, measure_type to CustomAttribute
    migration48(oldRealm, newRealm);

    // SCHEMA VERSION 49 - add DoorSchedule and ExistingDoor

    // SCHEMA VERSION 50 - add DoorOperatingSchedule

    // SCHEMA VERSION 51 - add DefaultSchedule

    // SCHEMA VERSION 52 - remove default_lighting_template_id and default_door_template_id, add default and make measure_type optional on CompanyTemplate and change measure_type to system_type on CustomAttribute

  },
});

export default realm;
