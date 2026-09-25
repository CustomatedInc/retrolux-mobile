export const parentArea = {
  active: true,
  created_by_user_id: 1,
  edited: false,
  mobile_id: 12,
  mobile_parent_id: null,
  name: 'Parent Area',
  parent_id: null,
  mobile_project_id: 1,
  project_id: 1,
  server_id: 12,
  code: 1,
  custom_attributes: '{"ceiling_height":12.0}',
  uuid: "da5d28d8-5221-43c7-bca2-21a737c8334e",
}

export const levelOneChildArea01 = {
  active: true,
  created_by_user_id: 1,
  edited: false,
  mobile_id: 13,
  mobile_parent_id: 12,
  name: 'Child Area 01',
  parent_id: 12,
  mobile_project_id: 1,
  project_id: 1,
  server_id: 13,
  code: 2,
  custom_attributes: '{"ceiling_height":12.0}',
  uuid: "da5d28d8-5221-43c7-bca2-21a737c8333f",
}

export const levelOneChildArea02 = {
  active: true,
  created_by_user_id: 1,
  edited: false,
  mobile_id: 14,
  mobile_parent_id: 12,
  name: 'Child Area 02',
  parent_id: 12,
  mobile_project_id: 1,
  project_id: 1,
  server_id: 14,
  code: 3,
  custom_attributes: '{"ceiling_height":12.0}',
  uuid: "da5d28d8-5221-43c7-bca2-21a737c833zz",
}

export const levelTwoChildArea01 = {
  active: true,
  created_by_user_id: 1,
  edited: false,
  mobile_id: 15,
  mobile_parent_id: 13,
  name: 'Child Area 01-01',
  parent_id: 13,
  mobile_project_id: 1,
  project_id: 1,
  server_id: 15,
  code: 4,
  custom_attributes: '{"ceiling_height":12.0}',
  uuid: "da5d28d8-5221-43c7-bca2-21a737c83rrr",
}

export const areaDifferentTreeOne = {
  active: true,
  created_by_user_id: 1,
  edited: false,
  mobile_id: 16,
  name: 'Area Different Tree',
  mobile_project_id: 1,
  project_id: 1,
  server_id: 16,
  code: 5,
  custom_attributes: '{"first_illuminance":10,"second_illuminance":20,"third_illuminance": 0,"ceiling_height":12.0}',
  uuid: "da5d28d8-5221-yu67-bca2-21a737c83rrr",
}

export const areas = [
  parentArea,
  levelOneChildArea01,
  levelOneChildArea02,
  levelTwoChildArea01,
  areaDifferentTreeOne,
]
