import { weatherApi } from './api';

const CACHE_DURATION = 30 * 60 * 1000;
const STALE_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const WEATHER_CACHE_STORAGE_KEY = 'weather_cache_v1';
const CACHE_KEY = 'ip-fallback';

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

export async function getCurrentWeather() {
  try {
    const cached = getCachedWeatherByKey(CACHE_KEY);
    if (cached && cached.age < CACHE_DURATION) {
      return cached.data;
    }

    const staleFallback = cached && cached.age < STALE_CACHE_MAX_AGE ? cached.data : null;
    const data = await weatherApi.getCurrent();

    if (data?.error) {
      return staleFallback;
    }

    if (data.temp === undefined || data.temp === null || !data.condition || !data.icon) {
      return staleFallback;
    }

    weatherCacheRef.data = data;
    weatherCacheRef.timestamp = Date.now();
    weatherCacheRef.key = CACHE_KEY;
    writePersistedWeatherCache(data, weatherCacheRef.timestamp, CACHE_KEY);

    return data;
  } catch {
    const cached = getCachedWeatherByKey(CACHE_KEY);
    if (cached && cached.age < STALE_CACHE_MAX_AGE) {
      return cached.data;
    }
    return null;
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
