import { weatherApi } from './api';

const CACHE_DURATION = 30 * 60 * 1000;
const STALE_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const WEATHER_CACHE_STORAGE_KEY = 'weather_cache_v1';

const weatherCacheRef = {
  data: null,
  timestamp: null,
  key: null,
};

function readPersistedWeatherCache() {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.data || !parsed.timestamp || !parsed.key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersistedWeatherCache(data, timestamp, key) {
  try {
    localStorage.setItem(WEATHER_CACHE_STORAGE_KEY, JSON.stringify({ data, timestamp, key }));
  } catch {
    // Ignore storage failures.
  }
}

function getCachedWeatherByKey(cacheKey) {
  if (weatherCacheRef.data && weatherCacheRef.timestamp && weatherCacheRef.key === cacheKey) {
    return {
      data: weatherCacheRef.data,
      age: Date.now() - weatherCacheRef.timestamp,
    };
  }

  const persisted = readPersistedWeatherCache();
  if (persisted && persisted.key === cacheKey) {
    weatherCacheRef.data = persisted.data;
    weatherCacheRef.timestamp = persisted.timestamp;
    weatherCacheRef.key = persisted.key;
    return {
      data: persisted.data,
      age: Date.now() - persisted.timestamp,
    };
  }

  return null;
}

function getAnyStaleWeatherCache() {
  if (weatherCacheRef.data && weatherCacheRef.timestamp) {
    const age = Date.now() - weatherCacheRef.timestamp;
    if (age < STALE_CACHE_MAX_AGE) {
      return weatherCacheRef.data;
    }
  }

  const persisted = readPersistedWeatherCache();
  if (persisted?.data && persisted.timestamp) {
    const age = Date.now() - persisted.timestamp;
    if (age < STALE_CACHE_MAX_AGE) {
      weatherCacheRef.data = persisted.data;
      weatherCacheRef.timestamp = persisted.timestamp;
      weatherCacheRef.key = persisted.key;
      return persisted.data;
    }
  }

  return null;
}

function shouldSkipBrowserGeolocation() {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.webOS?.platform?.tv);
}

function getBrowserCoords() {
  if (shouldSkipBrowserGeolocation()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

function getCacheKey(coords) {
  return coords ? `coords:${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}` : 'ip-fallback';
}

function isValidWeatherPayload(data) {
  return data
    && data.temp !== undefined
    && data.temp !== null
    && data.condition
    && data.icon;
}

export async function getCurrentWeather() {
  try {
    const coords = await getBrowserCoords();
    const params = coords ? { lat: coords.lat, lon: coords.lon } : {};
    const cacheKey = getCacheKey(coords);

    const cached = getCachedWeatherByKey(cacheKey);
    if (cached && cached.age < CACHE_DURATION) {
      return cached.data;
    }

    const staleFallback = cached && cached.age < STALE_CACHE_MAX_AGE
      ? cached.data
      : getAnyStaleWeatherCache();

    let data = await weatherApi.getCurrent(params);

    if (data?.error && coords) {
      data = await weatherApi.getCurrent({});
    }

    if (data?.error) {
      return staleFallback;
    }

    if (!isValidWeatherPayload(data)) {
      return staleFallback;
    }

    weatherCacheRef.data = data;
    weatherCacheRef.timestamp = Date.now();
    weatherCacheRef.key = cacheKey;
    writePersistedWeatherCache(data, weatherCacheRef.timestamp, cacheKey);

    return data;
  } catch {
    return getAnyStaleWeatherCache();
  }
}

export function clearWeatherCache() {
  weatherCacheRef.data = null;
  weatherCacheRef.timestamp = null;
  weatherCacheRef.key = null;
  try {
    localStorage.removeItem(WEATHER_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
