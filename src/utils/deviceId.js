import { STORAGE_KEYS } from '../config';

export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(STORAGE_KEYS.deviceId);
  if (!deviceId) {
    deviceId = `lg-${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEYS.deviceId, deviceId);
  }
  return deviceId;
}
