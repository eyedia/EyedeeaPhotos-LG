export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://www.eyedeeaphotos.com/api/v1';
export const ACTIVATE_URL = import.meta.env.VITE_ACTIVATE_URL || 'https://www.eyedeeaphotos.com/activate';
export const APP_USER_AGENT = 'EyedeeaPhotos/1.0.0 (LG webOS TV; View)';

export const STORAGE_KEYS = {
  deviceId: 'lg_device_id',
  token: 'auth_token',
  refreshToken: 'refresh_token',
  user: 'auth_user',
  group: 'auth_group',
};
