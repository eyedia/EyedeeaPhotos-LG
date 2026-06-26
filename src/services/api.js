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

function persistRefreshedAuth(refreshed) {
  const state = useAuthStore.getState();
  state.persistAuth({
    user: refreshed.user || state.user,
    token: refreshed.token,
    refreshToken: refreshed.refresh_token || state.refreshToken,
    group: refreshed.group || state.group,
    entitlements: refreshed.entitlements ?? state.entitlements,
  });
}

async function tryRefreshAndRetry(path, options) {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    useAuthStore.getState().logout();
    return null;
  }

  try {
    const refreshed = await authApi.refresh(refreshToken);
    persistRefreshedAuth(refreshed);
    return request(path, { ...options, retryOn401: false });
  } catch {
    useAuthStore.getState().logout();
    return null;
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

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError('Network unavailable', {
      status: 0,
      code: 'NETWORK_ERROR',
      data: { cause: error?.message },
    });
  }

  const data = await parseJsonResponse(response);

  if (response.status === 401 && auth && retryOn401) {
    const retried = await tryRefreshAndRetry(path, options);
    if (retried !== null) return retried;
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

async function fetchWithAuth(url, { retryOn401 = true } = {}) {
  const token = getStoredAuthToken();
  const headers = {
    'User-Agent': APP_USER_AGENT,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { headers });

  if (response.status === 401 && retryOn401) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      try {
        const refreshed = await authApi.refresh(refreshToken);
        persistRefreshedAuth(refreshed);
        return fetchWithAuth(url, { retryOn401: false });
      } catch {
        useAuthStore.getState().logout();
        throw new ApiError('Unauthorized', { status: 401 });
      }
    }
    useAuthStore.getState().logout();
    throw new ApiError('Unauthorized', { status: 401 });
  }

  return response;
}

export async function fetchAuthenticatedBlob(url) {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchWithAuth(url);
      if (response.ok) {
        return response.blob();
      }
      lastError = new ApiError(`Image fetch failed (${response.status})`, { status: response.status });
      if (response.status === 401) break;
    } catch (error) {
      lastError = error;
      if (error?.status === 401) break;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
  }

  throw lastError || new ApiError('Image fetch failed');
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

export const weatherApi = {
  getCurrent: (params = {}) => {
    const query = new URLSearchParams();
    if (params.lat != null) query.set('lat', String(params.lat));
    if (params.lon != null) query.set('lon', String(params.lon));
    const qs = query.toString();
    return request(`/weather/current${qs ? `?${qs}` : ''}`, { auth: true });
  },
};

export { ApiError };
