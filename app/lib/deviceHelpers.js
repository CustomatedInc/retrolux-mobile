import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage'

import { DEVICE_SERVER_ID } from '../resources/constants';
import { version } from '../../package.json';

export async function deviceRegistrationData() {
  const device_id = await DeviceInfo.getUniqueId();
  const brand = await DeviceInfo.getBrand();
  const model = await DeviceInfo.getModel();
  const manufacturer = await DeviceInfo.getManufacturer();
  const system_name = await DeviceInfo.getSystemName();
  const system_version = await DeviceInfo.getSystemVersion();
  const app_version = version;
  return { device_id, brand, model, manufacturer, system_name, system_version, app_version };
}

export async function deviceUpdateData(serverId) {
  const id = serverId;
  const device_id = await DeviceInfo.getUniqueId();
  const system_version = await DeviceInfo.getSystemVersion();
  const app_version = version;
  return { id, device_id, system_version, app_version };
}

export async function combineDeviceData(data) {
  const deviceId = await AsyncStorage.getItem(DEVICE_SERVER_ID);
  if (deviceId) { data.device_id = deviceId }
  return data;
}

export async function addDeviceParam(url) {
  const deviceId = await AsyncStorage.getItem(DEVICE_SERVER_ID);
  if (deviceId) { url += `device_id=${deviceId}` }
  return url;
}
