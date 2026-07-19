function resolveApiBase() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const activateUrl = import.meta.env.VITE_ACTIVATE_URL;
  if (activateUrl) {
    try {
      return `${new URL(activateUrl).origin}/api/v1`;
    } catch {
      // ignore invalid activate URL
    }
  }

  return 'https://www.eyedeeaphotos.com/api/v1';
}

export const API_BASE = resolveApiBase();
export const ACTIVATE_URL = import.meta.env.VITE_ACTIVATE_URL || 'https://www.eyedeeaphotos.com/activate';
export const APP_VERSION = '1.0.3';
export const APP_USER_AGENT = `EyedeeaPhotos/${APP_VERSION} (LG webOS TV; View)`;

export const STORAGE_KEYS = {
  deviceId: 'lg_device_id',
  token: 'auth_token',
  refreshToken: 'refresh_token',
  user: 'auth_user',
  entitlements: 'auth_entitlements',
  group: 'auth_group',
};
