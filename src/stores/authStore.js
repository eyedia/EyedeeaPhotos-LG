import { create } from 'zustand';
import { STORAGE_KEYS } from '../config';
import { authApi } from '../services/api';

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const parseJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = payload + '='.repeat((4 - (payload.length % 4 || 4)) % 4);
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp <= Math.floor(Date.now() / 1000);
};

const isAuthFailure = (error) => error?.status === 401 || error?.status === 403;

const PROACTIVE_REFRESH_LEAD_SEC = 300;
const MIN_REFRESH_DELAY_MS = 60_000;

let proactiveRefreshTimer = null;

function clearProactiveRefresh() {
  if (proactiveRefreshTimer != null) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
}

function scheduleProactiveRefresh(get) {
  clearProactiveRefresh();

  const { token, refreshToken, isAuthenticated } = get();
  if (!isAuthenticated || !token || !refreshToken) return;

  const payload = parseJwtPayload(token);
  if (!payload?.exp) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const refreshAtSec = payload.exp - PROACTIVE_REFRESH_LEAD_SEC;
  const delayMs = Math.max((refreshAtSec - nowSec) * 1000, MIN_REFRESH_DELAY_MS);

  proactiveRefreshTimer = setTimeout(async () => {
    const state = get();
    if (!state.isAuthenticated || !state.refreshToken) return;

    const refreshed = await state.tryRefreshToken();
    if (refreshed) {
      scheduleProactiveRefresh(get);
    }
  }, delayMs);
}

export const useAuthStore = create((set, get) => ({
  user: readJson(STORAGE_KEYS.user),
  token: localStorage.getItem(STORAGE_KEYS.token) || null,
  refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken) || null,
  entitlements: readJson(STORAGE_KEYS.entitlements),
  group: localStorage.getItem(STORAGE_KEYS.group) || null,
  isAuthenticated: Boolean(localStorage.getItem(STORAGE_KEYS.token)),
  hasHydratedAuth: false,

  persistAuth({ user, token, refreshToken, group, entitlements }) {
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken || '');
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.group, group || '');
    if (entitlements) {
      localStorage.setItem(STORAGE_KEYS.entitlements, JSON.stringify(entitlements));
    } else {
      localStorage.removeItem(STORAGE_KEYS.entitlements);
    }
    set({
      user,
      token,
      refreshToken: refreshToken || null,
      entitlements: entitlements || null,
      group: group || null,
      isAuthenticated: true,
    });
    scheduleProactiveRefresh(get);
  },

  logout() {
    clearProactiveRefresh();
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.entitlements);
    localStorage.removeItem(STORAGE_KEYS.group);
    set({
      user: null,
      token: null,
      refreshToken: null,
      entitlements: null,
      group: null,
      isAuthenticated: false,
    });
  },

  async tryRefreshToken() {
    const { refreshToken, persistAuth, logout } = get();
    if (!refreshToken) return false;

    try {
      const refreshed = await authApi.refresh(refreshToken);
      persistAuth({
        user: refreshed.user || readJson(STORAGE_KEYS.user),
        token: refreshed.token,
        refreshToken: refreshed.refresh_token || refreshToken,
        group: refreshed.group || get().group,
        entitlements: refreshed.entitlements ?? get().entitlements,
      });
      return true;
    } catch (error) {
      if (isAuthFailure(error)) {
        logout();
      }
      return false;
    }
  },

  async hydrateSession() {
    const storedToken = localStorage.getItem(STORAGE_KEYS.token);
    const storedUser = readJson(STORAGE_KEYS.user);
    const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    const storedGroup = localStorage.getItem(STORAGE_KEYS.group);
    const storedEntitlements = readJson(STORAGE_KEYS.entitlements);

    if (!storedToken || !storedUser) {
      set({ hasHydratedAuth: true, isAuthenticated: false });
      return false;
    }

    set({
      user: storedUser,
      token: storedToken,
      refreshToken: storedRefreshToken || null,
      entitlements: storedEntitlements,
      group: storedGroup || null,
      isAuthenticated: true,
    });

    if (isTokenExpired(storedToken)) {
      if (!storedRefreshToken) {
        get().logout();
        set({ hasHydratedAuth: true });
        return false;
      }

      const refreshed = await get().tryRefreshToken();
      if (!refreshed) {
        set({ hasHydratedAuth: true, isAuthenticated: Boolean(get().token) });
        return Boolean(get().token);
      }
    }

    try {
      const session = await authApi.getSession();
      const user = session?.user || storedUser;
      const group = session?.group || storedGroup || null;
      const entitlements = session?.entitlements ?? storedEntitlements;

      get().persistAuth({
        user,
        token: get().token,
        refreshToken: get().refreshToken,
        group,
        entitlements,
      });
      set({ hasHydratedAuth: true, isAuthenticated: true });
      scheduleProactiveRefresh(get);
      return true;
    } catch (error) {
      if (isAuthFailure(error) && storedRefreshToken) {
        const refreshed = await get().tryRefreshToken();
        if (refreshed) {
          set({ hasHydratedAuth: true, isAuthenticated: true });
          scheduleProactiveRefresh(get);
          return true;
        }
        set({ hasHydratedAuth: true });
        return false;
      }

      if (isAuthFailure(error)) {
        get().logout();
        set({ hasHydratedAuth: true });
        return false;
      }

      set({ hasHydratedAuth: true, isAuthenticated: true });
      scheduleProactiveRefresh(get);
      return true;
    }
  },
}));

export function getStoredAuthToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}
