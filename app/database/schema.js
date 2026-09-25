export const addressSchema = {
  name: 'Address',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    address: { type: 'string', optional: true },
    address_2: { type: 'string', optional: true },
    address_type: 'string',
    addressable_id: { type: 'int', optional: true },
    addressable_type: { type: 'string', optional: true },
    addressable_mobile_id: { type: 'int', optional: true },
    city: { type: 'string', optional: true },
    created_at: { type: 'date', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    inactive_at: { type: 'date', optional: true },
    mobile_id: 'int',
    state: { type: 'string', optional: true },
    server_id: { type: 'int', optional: true },
    updated_at: { type: 'date', optional: true },
    zip_code: { type: 'string', optional: true },
  }
};

export const areaSchema = {
  name: 'Area',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    area_count: { type: 'int', optional: true, default: 1 },
    avg_illuminace: { type: 'string', optional: true },
    ceiling_height: { type: 'string', optional: true },
    mobile_cooling_id: { type: 'int', optional: true },
    cooling_id: { type: 'int', optional: true },
    created_at: { type: 'date', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    description: { type: 'string', optional: true },
    edited: 'bool',
    mobile_heating_id: { type: 'int', optional: true },
    heating_id: { type: 'int', optional: true },
    inactive_at: { type: 'date', optional: true },
    internal_notes: { type: 'string', optional: true },
    length: { type: 'string', optional: true },
    lighting_satisfaction: { type: 'string', optional: true },
    mobile_id: 'int',
    mobile_parent_id: { type: 'int', optional: true },
    name: 'string',
    notes: { type: 'string', optional: true },
    mobile_operating_schedule_id: { type: 'int', optional: true },
    operating_schedule_id: { type: 'int', optional: true },
    parent_id: { type: 'int', optional: true },
    mobile_project_id: 'int',
    project_id: { type: 'int', optional: true },
    mobile_rate_schedule_id: { type: 'int', optional: true },
    rate_schedule_id: { type: 'int', optional: true },
    reflectance: { type: 'double', optional: true },
    server_id: { type: 'int', optional: true },
    uuid: { type: 'string', optional: true },
    sqft: { type: 'string', optional: true },
    updated_at: { type: 'date', optional: true },
    width: { type: 'string', optional: true },
    min_brightness_level: { type: 'double', optional: true },
    existing_controls: { type: 'string', optional: true },
    bi_level_or_occupancy_sensor: { type: 'bool', optional: true },
    first_illuminance: { type: 'double', optional: true },
    second_illuminance: { type: 'double', optional: true },
    third_illuminance: { type: 'double', optional: true },
    fourth_illuminance: { type: 'double', optional: true },
    fifth_illuminance: { type: 'double', optional: true },
    opened: { type: 'bool', default: false },
    code: { type: 'int',  optional: true },
    mobile_location_id: { type: 'int', optional: true },
    location_id: { type: 'int', optional: true },
    name_with_parents: { type: 'string', optional: true },
    custom_attributes: { type: 'string', optional: true },
    audit_complete: { type:'bool', optional: true, default: false },
  }
};

export const attachmentSchema = {
  name: 'Attachment',
  primaryKey: 'mobile_id',
  properties: {
    active: 'bool',
    attachable_id: { type: 'int', optional: true },
    attachable_mobile_id: 'int',
    attachable_type: 'string',
    created_at: { type: 'date', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    name: { type: 'string', optional: true },
    description: { type: 'string', optional: true },
    edited: 'bool',
    file: { type: 'string', optional: true },
    aws_key: { type: 'string', optional: true },
    inactive_at: { type: 'date', optional: true },
    mobile_id: 'int',
    uuid: { type: 'string', optional: true },
    server_id: { type: 'int', optional: true },
    updated_at: { type: 'date', optional: true },
    mobile_uri: { type: 'string', optional: true },
    type: 'string',
  },
};

export const categorySchema = {
  name: 'Category',
  properties: {
    category_type: 'string',
    name: 'string',
    id: 'int',
  },
};

export const companySchema = {
  name: 'Company',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    mobile_id: 'int',
    name: 'string',
    server_id: { type: 'int', optional: true },
    stripe_billing_plan: { type: 'string', optional: true },
    measure_types: { type: 'list', objectType: 'string', default: ['lighting'] }
  },
};

export const companyProjectStatusSchema = {
  name: 'CompanyProjectStatus',
  primaryKey: 'mobile_id',
  properties: {
    mobile_id: 'int',
    server_id: { type: 'int', optional: true },
    company_id: 'int',
    name: 'string',
  },
};

export const companyTemplateSchema = {
  name: 'CompanyTemplate',
  primaryKey: 'id',
  properties: {
    active: { type: 'bool', default: true },
    company_id: 'int',
    description: { type: 'string', optional: true },
    id: 'int',
    name: 'string',
    measure_type: { type: 'string', optional: true },
    default: { type: 'bool', default: false }
  },
}

export const companyUserSchema = {
  name: 'CompanyUser',
  primaryKey: 'id',
  properties: {
    active: { type: 'bool', default: true },
    company_id: 'int',
    id: 'int',
    role: 'string',
    status: 'string',
    user_id: 'int',
  }
};

export const coolingSchema = {
  name: 'Cooling',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    edited: 'bool',
    created_at: { type: 'date', optional: true },
    inactive_at: { type: 'date', optional: true },
    internal_notes: { type: 'string', optional: true },
    mobile_id: 'int',
    name: 'string',
    notes: { type: 'string', optional: true },
    project_id: { type: 'int', optional: true },
    mobile_project_id: 'int',
    uuid: { type: 'string', optional: true },
    server_id: { type: 'int', optional: true },
    updated_at: { type: 'date', optional: true },
    annual_run_time: 'string',
    system_type: 'string',
    fuel_type: 'string',
    fuel_cost: 'string',
    efficiency_type: 'string',
    efficiency_value: 'string',
  }
};

export const customAttributeSchema = {
  name: 'CustomAttribute',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    attributable_type: 'string',
    code_name: 'string',
    company_template_id: { type: 'int', optional: true },
    default_value: { type: 'string', optional: true },
    description: { type: 'string', optional: true },
    display_order: { type: 'int', optional: true },
    edited: 'bool',
    hint: { type: 'string', optional: true },
    input_type: { type: 'string', optional: true },
    label: 'string',
    locked: { type: 'bool', optional: true },
    mobile_id: 'int',
    mobile_project_id: { type: 'int', optional: true },
    name: 'string',
    placeholder: { type: 'string', optional: true },
    project_id: { type: 'int', optional: true },
    required_for_calculations: { type: 'bool', optional: true },
    required_to_complete: { type: 'bool', optional: true },
    server_id: { type: 'int', optional: true },
    short_name: { type: 'string', optional: true },
    tab: { type: 'string', optional: true },
    uuid: { type: 'string', optional: true },
    unit: { type: 'string', optional: true },
    unit_position: { type: 'string', optional: true },
    min: { type: 'float', optional: true },
    max: { type: 'float', optional: true },
    quick_list: { type: 'string', optional: true },
    system_type: { type: 'string', default: 'lighting' }
  }
};

export const customAttributeListItemSchema = {
  name: 'CustomAttributeListItem',
  primaryKey: 'mobile_id',
  properties: {
    abbr: { type: 'string', optional: true },
    active: { type: 'bool', default: true },
    custom_attribute_id: { type: 'int', optional: true },
    edited: 'bool',
    image_url: { type: 'string', optional: true },
    label: { type: 'string', optional: true },
    mobile_id: 'int',
    display_order: 'int',
    mobile_custom_attribute_id: { type: 'int', optional: true },
    server_id: { type: 'int', optional: true },
    uuid: { type: 'string', optional: true },
  }
};

export const defaultScheduleSchema = {
  name: 'DefaultSchedule',
  primaryKey: 'mobile_id',
  properties: {
    mobile_id: 'int',
    server_id: { type: 'int', optional: true },
    default_id: { type: 'int', optional: true },
    default_mobile_id: 'int',
    default_type: 'string',
    schedule_id: { type: 'int', optional: true },
    schedule_mobile_id: 'int',
    schedule_type: 'string',
    edited: 'bool',
    active: { type: 'bool', default: true },
    inactive_at: { type: 'date', optional: true },
    uuid: { type: 'string', optional: true }
  },
};

// export const defaultValueSchema = {
//   name: 'DefaultValue',
//   primaryKey: 'id',
//   properties: {
//     id: 'int',
//     mobile_project_id: 'int',
//     defaultable_id: 'int', // project.server_id
//     value: 'string',
//     name: 'string',
//     value_type: 'string',
//     defaultable_type: { type: 'string' } // 'Project'
//   }
// };

export const existingCategoryTreeEntrySchema = {
  name: 'ExistingCategoryTreeEntry',
  primaryKey: 'id',
  properties: {
    id: 'int',
    category_id: 'int',
    parent_id: { type: 'int', optional: true },
    category_name: 'string',
    category_type_id: 'int',
    product_query: 'string',
    active: { type: 'bool', default: true },
    inactive_at: { type: 'date', optional: true },
  }
};

export const facilityTypeSchema = {
  name: 'FacilityType',
  primaryKey: 'id',
  properties: {
    id: 'int',
    name: 'string',
    active: { type: 'bool', default: true },
    inactive_at: { type: 'date', optional: true },
  }
};

export const encentivUtilitySchema = {
  name: 'EncentivUtility',
  primaryKey: 'id',
  properties: {
    id: 'int',
    name: 'string',
    state: 'string',
  }
};

export const doorScheduleSchema = {
  name: 'DoorSchedule',
  primaryKey: 'mobile_id',
  properties: {
    mobile_id: 'int',
    server_id: { type: 'int', optional: true },
    name: 'string',
    description: { type: 'string', optional: true },
    custom_attributes: { type: 'string', optional: true },
    display_order: { type: 'int', optional: true },
    code: { type: 'string',  optional: true },
    time_blocked_open: { type: 'double', optional: true },
    opening_speed: { type: 'double', optional: true },
    closing_speed: { type: 'double', optional: true },
    hold_time: { type: 'double', optional: true },
    insulated_r_value: { type: 'double', optional: true },
    kw_used_for_defrost: { type: 'double', optional: true },
    total_gap_area: { type: 'double', optional: true },
    defrost_days_per_week: { type: 'int', optional: true },
    defrost_hours_per_day: { type: 'int', optional: true },
    heat_trace_power: { type: 'string', optional: true },
    strip_curtains_effectiveness: { type: 'string', optional: true },
    door_speed: { type: 'string', optional: true },
    gap_top: { type: 'double', optional: true },
    gap_bottom: { type: 'double', optional: true },
    gap_center: { type: 'double', optional: true },
    gap_left: { type: 'double', optional: true },
    gap_right: { type: 'double', optional: true },
    height: { type: 'double', optional: true },
    width: { type: 'double', optional: true },
    project_id: { type: 'int', optional: true },
    mobile_project_id: { type: 'int', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    audit_complete: { type:'bool', default: false, optional: true },
    // shown: { type: 'bool', default: true }, // Not using this yet.
    edited: 'bool',
    active: 'bool',
    inactive_at: { type: 'date', optional: true },
    created_at: { type: 'date', optional: true },
    updated_at: { type: 'date', optional: true },
    uuid: { type: 'string', optional: true }
  },
};

export const existingDoorSchema = {
  name: 'ExistingDoor',
  primaryKey: 'mobile_id',
  properties: {
    mobile_id: 'int',
    server_id: { type: 'int', optional: true },
    area_id: { type: 'int', optional: true },
    mobile_area_id: 'int',
    operating_schedule_id: { type: 'int', optional: true },
    mobile_operating_schedule_id: { type: 'int', optional: true },
    door_schedule_id: { type: 'int', optional: true },
    mobile_door_schedule_id: 'int',
    created_by_user_id: { type: 'int', optional: true },
    existing_count: 'int',
    custom_attributes: { type: 'string', optional: true },
    audit_complete: { type:'bool', optional: true, default: false },
    notes: { type: 'string', optional: true },
    internal_notes: { type: 'string', optional: true },
    edited: 'bool',
    active: 'bool',
    inactive_at: { type: 'date', optional: true },
    created_at: { type: 'date', optional: true },
    updated_at: { type: 'date', optional: true },
    uuid: { type: 'string', optional: true }
  },
};

export const existingFixtureSchema = {
  name: 'ExistingFixture',
  primaryKey: 'mobile_id',
  properties: {
    active: 'bool',
    add_after: { type: 'int', default: 0 },
    annual_maintenance_cost: { type: 'string', optional: true },
    area_id: { type: 'int', optional: true },
    audit_complete: { type:'bool', optional: true, default: false },
    calc_ready: { type:'bool', optional: true },
    conditions: { type: 'string', optional: true },
    created_at: { type: 'date', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    custom_attributes: { type: 'string', optional: true },
    description: { type: 'string', optional: true },
    edited: 'bool',
    existing_control: { type: 'string', optional: true },
    existing_count: 'int',
    existing_lighting_id: { type: 'int', optional: true },
    inactive_at: { type: 'date', optional: true },
    installation_time: { type: 'int', optional: true },
    internal_notes: { type: 'string', optional: true },
    lighting_satisfaction: { type: 'string', optional: true },
    location: { type: 'string', optional: true },
    mobile_area_id: 'int',
    mobile_existing_lighting_id: 'int',
    mobile_id: 'int',
    mobile_operating_schedule_id: { type: 'int', optional: true },
    mounting_height: { type: 'string', optional: true },
    name: { type: 'string', optional: true },
    notes: { type: 'string', optional: true },
    operating_schedule_id: { type: 'int', optional: true },
    replacement_cost: { type: 'string', optional: true },
    server_id: { type: 'int', optional: true },
    updated_at: { type: 'date', optional: true },
    uuid: { type: 'string', optional: true },
    working_fixtures_count: { type: 'int', optional: true },
    year_installed: { type: 'int', optional: true },
    status: { type: 'string', optional: true },
  },
};

export const existingLightingSchema = {
  name: 'ExistingLighting',
  primaryKey: 'mobile_id',
  properties: {
    active: 'bool',
    audit_complete: { type:'bool', default: false, optional: true },
    ballast_factor: { type: 'float', optional: true },
    ballast_factor_name: { type: 'int', optional: true },
    ballast_id: { type: 'int', optional: true },
    ballast_loss_factor: { type: 'float', optional: true },
    base_type_id: { type: 'int', optional: true },
    calc_ready: { type:'bool', optional: true },
    category_id: { type: 'int', optional: true },
    color_temp: { type: 'int', optional: true },
    company_id: { type: 'int', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    custom_attributes: { type: 'string', optional: true },
    description: { type: 'string', optional: true },
    display_order: { type: 'int', optional: true },
    edited: 'bool',
    existing_lighting_id: { type: 'int', optional: true },
    favorite_company_id: { type: 'int', optional: true },
    lamps_per_fixture: { type: 'int', optional: true },
    lens_trim_id: { type: 'int', optional: true },
    lm70: { type: 'int', optional: true },
    luminaire_category_id: { type: 'int', optional: true },
    luminaire_subcategory_id: { type: 'int', optional: true },
    luminaire_size_id: { type: 'int', optional: true },
    mobile_id: 'int',
    mobile_project_id: { type: 'int', optional: true },
    mounting_type_id: { type: 'int', optional: true },
    name: 'string',
    power_factor: { type: 'float', optional: true },
    product_length: { type: 'float', optional: true },
    product_number: { type: 'string', optional: true },
    product_type_id: { type: 'int', optional: true },
    project_id: { type: 'int', optional: true },
    server_id: { type: 'int', optional: true },
    shown: { type: 'bool', default: true },
    subcategory_id: { type: 'int', optional: true },
    technology_id: { type: 'int', optional: true },
    thermal_efficiency: { type: 'float', optional: true },
    uuid: { type: 'string', optional: true },
    watts_per_lamp: { type: 'float', optional: true },
    watts_per_product: { type: 'double', optional: true },
    existing_product_type: { type: 'string', optional: true },
    code: { type: 'string',  optional: true }
  }
};

export const floorPlanSchema = {
  name: 'FloorPlan',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    mobile_id: 'int',
    server_id: { type: 'int', optional: true },
    mobile_area_id: 'int',
    area_id: { type: 'int', optional: true },
    height: { type: 'int' },
    width: { type: 'int' },
    created_at: { type: 'date', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    inactive_at: { type: 'date', optional: true },
    updated_at: { type: 'date', optional: true },
    uuid: { type: 'string', optional: true }
  }
};

export const heatingSchema = {
  name: 'Heating',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    edited: 'bool',
    created_at: { type: 'date', optional: true },
    inactive_at: { type: 'date', optional: true },
    internal_notes: { type: 'string', optional: true },
    mobile_id: 'int',
    name: 'string',
    notes: { type: 'string', optional: true },
    project_id: { type: 'int', optional: true },
    mobile_project_id: 'int',
    uuid: { type: 'string', optional: true },
    server_id: { type: 'int', optional: true },
    updated_at: { type: 'date', optional: true },
    annual_run_time: 'string',
    system_type: 'string',
    fuel_type: 'string',
    fuel_cost: 'string',
    efficiency_type: 'string',
    efficiency_value: 'string',
  }
};

export const layerSchema = {
  name: 'Layer',
  primaryKey: 'mobile_id',
  properties: {
    mobile_id: 'int',
    server_id: { type: 'int', optional: true },
    floor_plan_id: { type: 'int', optional: true },
    mobile_floor_plan_id: { type: 'int', optional: true },
    layer_type: { type: 'string', optional: true },
    visible: { type: 'bool', optional: true },
    created_at: { type: 'date', optional: true },
    updated_at: { type: 'date', optional: true },
    active: { type: 'bool', default: true },
    inactive_at: { type: 'date', optional: true },
    uuid: { type: 'string', optional: true }
  }
}

export const locationSchema = {
  name: 'Location',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    edited: 'bool',
    mobile_id: 'int',
    mobile_project_id: 'int',
    project_id: { type: 'int', optional: true },
    uuid: { type: 'string', optional: true },
    name: 'string',
    server_id: { type: 'int', optional: true },
    created_at: { type: 'date', optional: true },
    updated_at: { type: 'date', optional: true },
    inactive_at: { type: 'date', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    custom_attributes: { type: 'string', optional: true },
    audit_complete: { type:'bool', optional: true, default: false },
    mobile_operating_schedule_id: { type: 'int', optional: true },
    operating_schedule_id: { type: 'int', optional: true },
    mobile_rate_schedule_id: { type: 'int', optional: true },
    rate_schedule_id: { type: 'int', optional: true },
    mobile_cooling_id: { type: 'int', optional: true },
    cooling_id: { type: 'int', optional: true },
    mobile_heating_id: { type: 'int', optional: true },
    heating_id: { type: 'int', optional: true },
    facility_type_id: { type: 'int', optional: true }
  }
};

export const operatingScheduleSchema = {
  name: 'OperatingSchedule',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    annual_hours: { type: 'int', optional: true },
    edited: 'bool',
    created_at: { type: 'date', optional: true },
    hour_type: { type: 'string', default: 'annual' },
    inactive_at: { type: 'date', optional: true },
    internal_notes: { type: 'string', optional: true },
    monday: { type: 'double', optional: true },
    tuesday: { type: 'double', optional: true },
    wednesday: { type: 'double', optional: true },
    thursday: { type: 'double', optional: true },
    friday: { type: 'double', optional: true },
    saturday: { type: 'double', optional: true },
    sunday: { type: 'double', optional: true },
    weeks_per_year: { type: 'double', optional: true },
    mobile_id: 'int',
    name: 'string',
    notes: { type: 'string', optional: true },
    project_id: { type: 'int', optional: true },
    mobile_project_id: 'int',
    uuid: { type: 'string', optional: true },
    server_id: { type: 'int', optional: true },
    updated_at: { type: 'date', optional: true },
    controls_reduction: { type: 'double', optional: true },
  }
};

export const doorOperatingScheduleSchema = {
  name: 'DoorOperatingSchedule',
  primaryKey: 'mobile_id',
  properties: {
    mobile_id: 'int',
    server_id: { type: 'int', optional: true },
    name: 'string',
    openings_per_hour: { type: 'string', default: "{\"apr\":\"0\",\"aug\":\"0\",\"dec\":\"0\",\"feb\":\"0\",\"jan\":\"01\",\"jul\":\"0\",\"jun\":\"0\",\"mar\":\"0\",\"may\":\"0\",\"nov\":\"0\",\"oct\":\"0\",\"sep\":\"0\"}" },
    facility_hours_per_day: { type: 'string', default: "{\"apr\":\"0\",\"aug\":\"0\",\"dec\":\"0\",\"feb\":\"0\",\"jan\":\"01\",\"jul\":\"0\",\"jun\":\"0\",\"mar\":\"0\",\"may\":\"0\",\"nov\":\"0\",\"oct\":\"0\",\"sep\":\"0\"}" },
    facility_days_per_week: { type: 'string', default: "{\"apr\":\"0\",\"aug\":\"0\",\"dec\":\"0\",\"feb\":\"0\",\"jan\":\"01\",\"jul\":\"0\",\"jun\":\"0\",\"mar\":\"0\",\"may\":\"0\",\"nov\":\"0\",\"oct\":\"0\",\"sep\":\"0\"}" },
    project_id: { type: 'int', optional: true },
    mobile_project_id: 'int',
    edited: 'bool',
    notes: { type: 'string', optional: true },
    internal_notes: { type: 'string', optional: true },
    active: { type: 'bool', default: true },
    inactive_at: { type: 'date', optional: true },
    updated_at: { type: 'date', optional: true },
    created_at: { type: 'date', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    uuid: { type: 'string', optional: true }
  }
};

export const pinSchema = {
  name: 'Pin',
  primaryKey: 'mobile_id',
  properties: {
    mobile_id: 'int',
    server_id: { type: 'int', optional: true },
    layer_id: { type: 'int', optional: true },
    mobile_layer_id: { type: 'int', optional: true },
    pinnable_type: { type: 'string', optional: true },
    pinnable_sub_type: { type: 'string', optional: true },
    pinnable_id: { type: 'int', optional: true },
    mobile_pinnable_id: { type: 'int', optional: true },
    coordinate: { type: 'string' },
    created_at: { type: 'date', optional: true },
    updated_at: { type: 'date', optional: true },
    active: { type: 'bool', default: true },
    inactive_at: { type: 'date', optional: true },
    uuid: { type: 'string', optional: true }
  }
}

export const projectSchema = {
  name: 'Project',
  primaryKey: 'mobile_id',
  properties: {
    active: 'bool',
    all_company_access: { type: 'bool', optional: true },
    apply_tax_on: { type: 'string', optional: true },
    client_id: { type: 'int', optional: true },
    client_logo: { type: 'string', optional: true },
    company_id: 'int',
    company_project_status_id: 'int',
    contact_id: { type: 'int', optional: true },
    mobile_cooling_id: { type: 'int', optional: true },
    cooling_id: { type: 'int', optional: true },
    created_at: { type: 'date', optional: true },
    created_by_user_id: { type: 'int', optional: true },
    edited: 'bool',
    enable_sync: { type: 'bool', default: true },
    encentiv_id: { type: 'int', optional: true },
    expected_close_date: { type: 'date', optional: true },
    facility_type_id: { type: 'int', optional: true },
    financing_debt_percentage: { type: 'string', optional: true },
    financing_interest_rate: { type: 'string', optional: true },
    financing_loan_months: { type: 'int', optional: true },
    mobile_heating_id: { type: 'int', optional: true },
    heating_id: { type: 'int', optional: true },
    inactive_at: { type: 'date', optional: true },
    incentive_max: { type: 'string', optional: true },
    incentive_max_type: { type: 'string', optional: true },
    internal_notes: { type: 'string', optional: true },
    maintenance_labor_rate: { type: 'string', optional: true },
    markup: { type: 'string', optional: true },
    markup_type: { type: 'string', optional: true },
    mobile_id: 'int',
    name: 'string',
    notes: { type: 'string', optional: true },
    mobile_operating_schedule_id: { type: 'int', optional: true },
    operating_schedule_id: { type: 'int', optional: true },
    prepared_by_user_id: { type: 'int', optional: true },
    prepared_for_user_id: { type: 'int', optional: true },
    probability: { type: 'string', optional: true },
    mobile_rate_schedule_id: { type: 'int', optional: true },
    rate_schedule_id: { type: 'int', optional: true },
    server_id: { type: 'int', optional: true },
    uuid: { type: 'string', optional: true },
    shipping_address_location: { type: 'string', optional: true },
    tax_rate: { type: 'string', optional: true },
    tax_rate_source: { type: 'string', optional: true },
    tax_type: { type: 'string', optional: true },
    test: { type: 'bool', optional: true },
    updated_at: { type: 'date', optional: true },
    utility_id: { type: 'int', optional: true },
    utility_rate_plan: { type: 'string', optional: true },
    mobile_location_scope_ids: { type: 'list', objectType: 'int' },
    custom_attributes: { type: 'string', optional: true },
    measure_types: { type: 'list', objectType: 'string', default: ['lighting'] }
  },
};

export const projectUserSchema = {
  name: 'ProjectUser',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    mobile_id: 'int',
    mobile_project_id: 'int',
    user_id: 'int',
    project_id: { type: 'int', optional: true },
    server_id: { type: 'int', optional: true },
    role: 'string',
    status: 'string',
  },
};

export const rateScheduleSchema = {
  name: 'RateSchedule',
  primaryKey: 'mobile_id',
  properties: {
    active: { type: 'bool', default: true },
    edited: 'bool',
    kwh_cost: { type: 'string', optional: true },
    rate_type: { type: 'string', default: 'blended' },
    rate_escalator: { type: 'string', optional: true },
    rate_customer: { type: 'string', optional: true, default: '0.0' },
    demand_utilization: { type: 'int', optional: true, default: 100 },
    kw_demand_cost: { type: 'string', optional: true },
    kwh_cost_simple: { type: 'string', optional: true },
    created_at: { type: 'date', optional: true },
    inactive_at: { type: 'date', optional: true },
    internal_notes: { type: 'string', optional: true },
    mobile_id: 'int',
    name: 'string',
    notes: { type: 'string', optional: true },
    project_id: { type: 'int', optional: true },
    mobile_project_id: 'int',
    uuid: { type: 'string', optional: true },
    server_id: { type: 'int', optional: true },
    updated_at: { type: 'date', optional: true },
  }
};

export const userSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    id: 'int',
    email: { type: 'string', optional: true },
    last_sync_at: { type: 'date', optional: true },
    offline_password: { type: 'string', optional: true },
    api_auth_token: 'string',
    company_ids: { type: 'string', optional: true },
  }
};
