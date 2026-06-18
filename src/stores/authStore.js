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

export const useAuthStore = create((set, get) => ({
  user: readJson(STORAGE_KEYS.user),
  token: localStorage.getItem(STORAGE_KEYS.token) || null,
  refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken) || null,
  group: localStorage.getItem(STORAGE_KEYS.group) || null,
  isAuthenticated: Boolean(localStorage.getItem(STORAGE_KEYS.token)),
  hasHydratedAuth: false,

  persistAuth({ user, token, refreshToken, group }) {
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken || '');
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.group, group || '');
    set({
      user,
      token,
      refreshToken: refreshToken || null,
      group: group || null,
      isAuthenticated: true,
    });
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.group);
    set({
      user: null,
      token: null,
      refreshToken: null,
      group: null,
      isAuthenticated: false,
    });
  },

  async hydrateSession() {
    const { token, refreshToken, logout } = get();
    if (!token) {
      set({ hasHydratedAuth: true, isAuthenticated: false });
      return false;
    }

    try {
      const session = await authApi.getSession();
      const user = session?.user || readJson(STORAGE_KEYS.user);
      set({
        user,
        isAuthenticated: true,
        hasHydratedAuth: true,
        group: session?.group || get().group,
      });
      return true;
    } catch (error) {
      if (error?.status === 401 && refreshToken) {
        try {
          const refreshed = await authApi.refresh(refreshToken);
          get().persistAuth({
            user: refreshed.user || readJson(STORAGE_KEYS.user),
            token: refreshed.token,
            refreshToken: refreshed.refresh_token,
            group: refreshed.group || get().group,
          });
          set({ hasHydratedAuth: true, isAuthenticated: true });
          return true;
        } catch {
          logout();
          set({ hasHydratedAuth: true });
          return false;
        }
      }

      logout();
      set({ hasHydratedAuth: true });
      return false;
    }
  },
}));

export function getStoredAuthToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}
