import { API_BASE, APP_USER_AGENT } from '../config';
import { getStoredAuthToken, useAuthStore } from '../stores/authStore';

class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function request(path, options = {}) {
  const { method = 'GET', body, auth = false, retryOn401 = true } = options;
  const headers = {
    Accept: 'application/json',
    'User-Agent': APP_USER_AGENT,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  };

  if (auth) {
    const token = getStoredAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await parseJsonResponse(response);

  if (response.status === 401 && auth && retryOn401) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      try {
        const refreshed = await authApi.refresh(refreshToken);
        useAuthStore.getState().persistAuth({
          user: refreshed.user || useAuthStore.getState().user,
          token: refreshed.token,
          refreshToken: refreshed.refresh_token,
          group: refreshed.group || useAuthStore.getState().group,
        });
        return request(path, { ...options, retryOn401: false });
      } catch {
        useAuthStore.getState().logout();
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.message || data?.error_description || `Request failed (${response.status})`, {
      status: response.status,
      code: data?.error || data?.code,
      data,
    });
  }

  return data;
}

export const authApi = {
  issueDeviceCode: (deviceId) =>
    request('/auth/device/issue', {
      method: 'POST',
      body: { device_id: deviceId, scope: 'view' },
    }),

  pollDeviceCode: (deviceCode, deviceId) =>
    request('/auth/device', {
      method: 'POST',
      body: { device_code: deviceCode, device_id: deviceId },
    }),

  getSession: () => request('/auth/session', { auth: true }),

  refresh: (refreshToken) =>
    request('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    }),
};

export const viewApi = {
  getQueue: (householdId, limit = 12, offset = 0) =>
    request(`/${householdId}/view/photos?limit=${limit}&offset=${offset}&photo_id_only=true`, { auth: true }),

  getBatchMetadata: (householdId, photoIds) =>
    request(`/${householdId}/view/photos/by-ids`, {
      method: 'POST',
      auth: true,
      body: { photo_ids: photoIds },
    }),

  getCurrentPhotoId: (householdId) =>
    request(`/${householdId}/view/current?photo_id_only=true`, { auth: true }),

  getConfig: (householdId) => request(`/${householdId}/view/config`, { auth: true }),

  sendHeartbeat: (householdId, scope = 'global') =>
    request(`/${householdId}/view/heartbeat`, {
      method: 'POST',
      auth: true,
      body: { scope },
    }),

  markPhotoViewed: (householdId, photoId, scope = 'global') =>
    request(`/${householdId}/view/photos/${encodeURIComponent(String(photoId))}/viewed`, {
      method: 'POST',
      auth: true,
      body: { scope },
    }),
};

export { ApiError };
