import _ from 'lodash';

import { pipe } from './utilities';

// Formatting Functions
export const setServerId = obj => _.set(obj, 'server_id', obj.id)
export const removeId = obj => _.omit(obj, 'id')
export const unflagEdited = obj => _.set(obj, 'edited', false)
export const setCreatedAt = obj => addDate(obj, 'created_at')
export const setUpdatedAt = obj => addDate(obj, 'updated_at')
export const setInactiveAt = obj => addDate(obj, 'inactive_at')

// Formatting Collections
export const apiToRealmBasic = obj => pipe(setServerId, removeId, unflagEdited)(obj)
export const apiToRealmDates = obj => pipe(setCreatedAt, setUpdatedAt, setInactiveAt)(obj)
export const apiToRealmGeneral = obj => pipe(apiToRealmBasic, apiToRealmDates)(obj)

// Formatting Support Functions
export const tryDate = date => !!date ? new Date(date) : null
export const addDate = (obj, dateKey) => _.has(obj, dateKey) ? _.update(obj, dateKey, tryDate) : obj

export const tryString = string => !!string ? String(string) : null
export const convertToString = (obj, stringKey) => _.update(obj, stringKey, tryString)
export const convertToStrings = (obj, stringKeys) => { stringKeys.forEach(k => convertToString(obj, k)); return obj }
