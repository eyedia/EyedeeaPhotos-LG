import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { fetchAuthenticatedBlob, viewApi } from '../services/api';
import { clearWeatherCache, getCurrentWeather } from '../services/weatherService';
import { useAuthStore } from '../stores/authStore';
import { addSizeParam, getOptimalVariantSize } from '../utils/variantHelper';
import {
  getSubSubtitle,
  getSubtitle,
  getTitle,
  isPortrait,
} from '../utils/photoFormatters';

const DEFAULT_QUEUE_LIMIT = 12;
const PREFETCH_THRESHOLD = 3;
const CONTROLS_HIDE_DELAY_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 15000;
const WEATHER_REFRESH_MS = 30 * 60 * 1000;
const HISTORY_DISPLAY_COUNT = 15;
const DEFAULT_REFRESH_CLIENT_SECONDS = 30;

function WeatherPanels({ weather, config, compact }) {
  if (!weather?.condition) return null;

  const showAdvanced = config?.advanced_weather && Array.isArray(weather.forecast) && weather.forecast.length > 0;

  return (
    <div
      className="weather-panels"
      style={compact ? { transform: 'scale(0.72)', transformOrigin: 'bottom right' } : undefined}
    >
      <div className="weather-widget weather-widget-main">
        <div className="weather-icon">{weather.icon || '☀️'}</div>
        <div className="weather-main-text">
          <div className="weather-temp">{weather.temp ?? 24}°</div>
          <div className="weather-condition">{weather.condition || 'Sunny'}</div>
          <div className="weather-location">{weather.location || ''}</div>
        </div>
      </div>

      {(weather.humidity !== undefined || weather.wind_speed !== undefined) && (
        <div className="weather-widget weather-widget-details">
          {weather.humidity !== undefined && (
            <div className="weather-detail">
              <span aria-hidden="true">💧</span>
              <span>{weather.humidity}%</span>
            </div>
          )}
          {weather.wind_speed !== undefined && (
            <div className="weather-detail">
              <span aria-hidden="true">💨</span>
              <span>{weather.wind_speed}</span>
            </div>
          )}
        </div>
      )}

      {showAdvanced && (
        <div className="weather-widget weather-widget-forecast">
          {weather.forecast.slice(0, 3).map((day) => (
            <div key={day.date || day.day} className="forecast-day">
              <div className="forecast-day-name">{day.day || day.date}</div>
              <div className="forecast-icon">{day.icon || '☀️'}</div>
              <div className="forecast-temps">
                {day.high}° / {day.low}°
              </div>
              {day.pop !== undefined && <div className="forecast-pop">{day.pop}%</div>}
            </div>
          ))}
        </div>
      )}

      {showAdvanced && weather.alerts?.length > 0 && (
        <div className="weather-alert" title={weather.alerts[0].event}>
          <span aria-hidden="true">⚠️</span>
          <span>{weather.alerts[0].event}</span>
        </div>
      )}
    </div>
  );
}

export default function ViewScreen({ onOpenSettings, onSessionExpired, onBackHandlerRef }) {
  const user = useAuthStore((state) => state.user);
  const householdId = user?.current_household_id;

  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [config, setConfig] = useState({ refresh_client: DEFAULT_REFRESH_CLIENT_SECONDS });
  const [activeScope, setActiveScope] = useState('global');
  const [weather, setWeather] = useState(null);
  const [showWeatherPanel, setShowWeatherPanel] = useState(true);
  const [compactWeather, setCompactWeather] = useState(false);
  const [optimalSize, setOptimalSize] = useState(() => getOptimalVariantSize());
  const [, triggerBlobUpdate] = useReducer((x) => x + 1, 0);

  const maxLoadedOffsetRef = useRef(0);
  const inFlightRef = useRef(false);
  const preloadedUrlsRef = useRef(new Set());
  const blobUrlsRef = useRef(new Map());
  const autoRefreshTimerRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const controlsHideTimerRef = useRef(null);
  const lastServerPhotoIdRef = useRef(null);
  const lastViewedPhotoIdRef = useRef(null);
  const prevOptimalSizeRef = useRef(optimalSize);
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const clearBlobCache = useCallback(() => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    blobUrlsRef.current.clear();
    preloadedUrlsRef.current.clear();
    triggerBlobUpdate();
  }, []);

  const mergePhotos = useCallback((current, incoming) => {
    const seen = new Set();
    const merged = [];
    [...current, ...incoming].forEach((item) => {
      const id = item?.photo_id;
      if (id == null) return;
      const key = String(id);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(item);
    });
    return merged;
  }, []);

  const preloadPhotos = useCallback(
    async (items, waitForFirst = false) => {
      const loadPhoto = async (item) => {
        const photoId = item?.photo_id;
        const url = item?.photo_url;
        if (!url || !photoId || preloadedUrlsRef.current.has(photoId)) return;

        preloadedUrlsRef.current.add(photoId);
        try {
          const urlWithSize = addSizeParam(url, optimalSize);
          const blob = await fetchAuthenticatedBlob(urlWithSize);
          blobUrlsRef.current.set(photoId, URL.createObjectURL(blob));
          triggerBlobUpdate();
        } catch (error) {
          preloadedUrlsRef.current.delete(photoId);
          if (error?.status === 401) {
            useAuthStore.getState().logout();
            onSessionExpired();
          }
        }
      };

      if (waitForFirst && items.length > 0) {
        await loadPhoto(items[0]);
        items.slice(1).forEach((item) => loadPhoto(item));
      } else {
        items.forEach((item) => loadPhoto(item));
      }
    },
    [onSessionExpired, optimalSize]
  );

  const handleApiAuthFailure = useCallback(
    (error) => {
      if (error?.status === 401) {
        useAuthStore.getState().logout();
        onSessionExpired();
      }
    },
    [onSessionExpired]
  );

  const loadWeather = useCallback(async () => {
    try {
      const weatherData = await getCurrentWeather();
      setWeather(weatherData);
    } catch {
      setWeather(null);
    }
  }, []);

  const loadQueue = useCallback(
    async (offset = 0, append = false, startPhotoId = null) => {
      if (inFlightRef.current || !householdId) return;
      inFlightRef.current = true;
      if (!append) setIsLoading(true);

      let fetchSuccess = false;
      try {
        const queueResponse = await viewApi.getQueue(householdId, DEFAULT_QUEUE_LIMIT, offset);
        const photoIds = queueResponse?.photo_ids || [];

        if (photoIds.length === 0) {
          if (!append) setPhotos([]);
          fetchSuccess = true;
          return;
        }

        const batchResponse = await viewApi.getBatchMetadata(householdId, photoIds);
        let batchPhotos = batchResponse?.photos || [];

        let startIdx = 0;
        if (!append && startPhotoId) {
          const foundIdx = batchPhotos.findIndex((p) => p.photo_id === startPhotoId);
          if (foundIdx >= 0) {
            startIdx = foundIdx;
          } else {
            try {
              const currentBatch = await viewApi.getBatchMetadata(householdId, [startPhotoId]);
              const currentPhoto = currentBatch?.photos?.[0];
              if (currentPhoto) {
                batchPhotos = [currentPhoto, ...batchPhotos];
                startIdx = 0;
              }
            } catch {
              // Default to first photo
            }
          }
        }

        setPhotos((prev) => (append ? mergePhotos(prev, batchPhotos) : batchPhotos));
        if (!append) {
          setCurrentIndex(startIdx);
          setHistory(batchPhotos.length > 0 ? [batchPhotos[startIdx]] : []);
        }
        maxLoadedOffsetRef.current = Math.max(maxLoadedOffsetRef.current, offset);
        fetchSuccess = true;

        if (!append) {
          await preloadPhotos(batchPhotos, true);
        } else {
          preloadPhotos(batchPhotos, false);
        }
      } catch (error) {
        handleApiAuthFailure(error);
        if (!append && !fetchSuccess) {
          setTimeout(() => loadQueue(offset, append, startPhotoId), 3000);
          return;
        }
      } finally {
        inFlightRef.current = false;
        if (!append && fetchSuccess) {
          setIsLoading(false);
        }
      }
    },
    [handleApiAuthFailure, householdId, mergePhotos, preloadPhotos]
  );

  const loadConfig = useCallback(async () => {
    if (!householdId) return;
    try {
      const response = await viewApi.getConfig(householdId);
      const refreshClient = Number.parseInt(response?.refresh_client, 10);
      setConfig({
        ...response,
        refresh_client: Number.isFinite(refreshClient) && refreshClient > 0
          ? refreshClient
          : DEFAULT_REFRESH_CLIENT_SECONDS,
      });
    } catch (error) {
      handleApiAuthFailure(error);
    }
  }, [handleApiAuthFailure, householdId]);

  const rotateToServerPhoto = useCallback(
    async (serverPhotoId) => {
      if (!serverPhotoId || !householdId) return;
      lastServerPhotoIdRef.current = serverPhotoId;

      try {
        const batchResponse = await viewApi.getBatchMetadata(householdId, [serverPhotoId]);
        const newPhoto = batchResponse?.photos?.[0];
        if (!newPhoto) return;

        setPhotos((prev) => [newPhoto, ...prev.slice(0, DEFAULT_QUEUE_LIMIT - 1)]);
        setCurrentIndex(0);
        setHistory((prev) => [newPhoto, ...prev.slice(0, 11)]);
        preloadPhotos([newPhoto], true);
      } catch (error) {
        handleApiAuthFailure(error);
      }
    },
    [handleApiAuthFailure, householdId, preloadPhotos]
  );

  const checkForNewPhoto = useCallback(async () => {
    if (!householdId) return;
    try {
      const response = await viewApi.getCurrentPhotoId(householdId);
      const serverPhotoId = response?.photo_id;
      const scopeFromServer = response?.scope;
      if (scopeFromServer === 'global' || scopeFromServer === 'personal') {
        setActiveScope(scopeFromServer);
      }
      if (serverPhotoId && serverPhotoId !== lastServerPhotoIdRef.current) {
        await rotateToServerPhoto(serverPhotoId);
      }
    } catch (error) {
      handleApiAuthFailure(error);
    }
  }, [handleApiAuthFailure, householdId, rotateToServerPhoto]);

  useEffect(() => {
    if (!householdId) return undefined;

    let cancelled = false;
    const initialize = async () => {
      let serverPhotoId = null;
      try {
        const response = await viewApi.getCurrentPhotoId(householdId);
        serverPhotoId = response?.photo_id || null;
        const scopeFromServer = response?.scope;
        if (scopeFromServer === 'global' || scopeFromServer === 'personal') {
          setActiveScope(scopeFromServer);
        }
        lastServerPhotoIdRef.current = serverPhotoId;
      } catch (error) {
        handleApiAuthFailure(error);
      }

      if (cancelled) return;
      await loadQueue(0, false, serverPhotoId);
      if (cancelled) return;
      await loadConfig();
      if (cancelled) return;
      await loadWeather();
    };

    initialize();
    return () => {
      cancelled = true;
    };
  }, [handleApiAuthFailure, householdId, loadConfig, loadQueue, loadWeather]);

  useEffect(() => {
    if (!householdId) return undefined;

    const sendHeartbeat = async () => {
      try {
        await viewApi.sendHeartbeat(householdId, activeScope);
      } catch (error) {
        handleApiAuthFailure(error);
      }
    };

    sendHeartbeat();
    heartbeatTimerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, [activeScope, handleApiAuthFailure, householdId]);

  useEffect(() => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }

    if (config?.refresh_client > 0 && householdId && !isPanelOpen) {
      autoRefreshTimerRef.current = setInterval(checkForNewPhoto, config.refresh_client * 1000);
    }

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [checkForNewPhoto, config, householdId, isPanelOpen]);

  useEffect(() => {
    const weatherTimer = setInterval(() => {
      clearWeatherCache();
      loadWeather();
    }, WEATHER_REFRESH_MS);
    return () => clearInterval(weatherTimer);
  }, [loadWeather]);

  useEffect(() => {
    const evaluateWeatherVisibility = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width >= height;
      setShowWeatherPanel(width >= 768 || (width <= 760 && isLandscape));
      setCompactWeather(width <= 1366 && height <= 700);
    };

    evaluateWeatherVisibility();
    window.addEventListener('resize', evaluateWeatherVisibility);
    window.addEventListener('orientationchange', evaluateWeatherVisibility);
    return () => {
      window.removeEventListener('resize', evaluateWeatherVisibility);
      window.removeEventListener('orientationchange', evaluateWeatherVisibility);
    };
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;
    if (currentIndex >= photos.length - PREFETCH_THRESHOLD) {
      const nextOffset = maxLoadedOffsetRef.current + DEFAULT_QUEUE_LIMIT;
      loadQueue(nextOffset, true);
    }
  }, [currentIndex, loadQueue, photos.length]);

  useEffect(() => {
    if (!householdId || photos.length === 0) return;
    const photo = photos[currentIndex];
    if (!photo?.photo_id || photo.photo_id === lastViewedPhotoIdRef.current) return;
    lastViewedPhotoIdRef.current = photo.photo_id;
    viewApi.markPhotoViewed(householdId, photo.photo_id, activeScope).catch(() => {});
  }, [activeScope, currentIndex, householdId, photos]);

  useEffect(() => {
    const photo = photos[currentIndex];
    const photoId = photo?.photo_id;
    const photoUrl = photo?.photo_url;
    if (!photoId || !photoUrl || blobUrlsRef.current.has(photoId)) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const urlWithSize = addSizeParam(photoUrl, optimalSize);
        const blob = await fetchAuthenticatedBlob(urlWithSize);
        if (!cancelled) {
          blobUrlsRef.current.set(photoId, URL.createObjectURL(blob));
          triggerBlobUpdate();
        }
      } catch (error) {
        if (!cancelled && error?.status === 401) {
          useAuthStore.getState().logout();
          onSessionExpired();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentIndex, onSessionExpired, optimalSize, photos]);

  useEffect(() => {
    const handleResize = () => {
      const newSize = getOptimalVariantSize();
      if (newSize !== prevOptimalSizeRef.current) {
        prevOptimalSizeRef.current = newSize;
        setOptimalSize(newSize);
        clearBlobCache();
        if (photosRef.current.length > 0) {
          preloadPhotos(photosRef.current, false);
        }
      } else {
        setOptimalSize(newSize);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clearBlobCache, preloadPhotos]);

  useEffect(
    () => () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current.clear();
    },
    []
  );

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < photos.length - 1;

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setHistory((prev) => [...prev.slice(-14), photos[nextIndex]]);
  }, [canGoNext, currentIndex, photos]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setHistory((prev) => [...prev.slice(-14), photos[prevIndex]]);
  }, [canGoPrev, currentIndex, photos]);

  const goToHistoryPhoto = useCallback(
    (photo) => {
      const index = photos.findIndex((p) => p.photo_id === photo.photo_id);
      if (index !== -1) {
        setCurrentIndex(index);
        setIsPanelOpen(false);
      }
    },
    [photos]
  );

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (isPanelOpen) return;
    if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current);
    controlsHideTimerRef.current = setTimeout(() => {
      setShowControls(false);
      controlsHideTimerRef.current = null;
    }, CONTROLS_HIDE_DELAY_MS);
  }, [isPanelOpen]);

  const toggleHistoryPanel = useCallback(() => {
    setIsPanelOpen((open) => {
      const next = !open;
      if (next) {
        setShowControls(true);
        if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current);
      } else {
        showControlsTemporarily();
      }
      return next;
    });
  }, [showControlsTemporarily]);

  useEffect(() => {
    if (!onBackHandlerRef) return undefined;
    onBackHandlerRef.current = () => {
      if (isPanelOpen) {
        setIsPanelOpen(false);
        return true;
      }
      return false;
    };
    return () => {
      onBackHandlerRef.current = null;
    };
  }, [isPanelOpen, onBackHandlerRef]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft' && canGoPrev) {
        event.preventDefault();
        goPrev();
        showControlsTemporarily();
      }
      if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault();
        goNext();
        showControlsTemporarily();
      }
      if (event.key === 'ArrowUp' || event.key === 'Enter') {
        event.preventDefault();
        showControlsTemporarily();
      }
      if (event.key === 'Escape' && isPanelOpen) {
        event.preventDefault();
        setIsPanelOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canGoNext, canGoPrev, goNext, goPrev, isPanelOpen, showControlsTemporarily]);

  const currentPhoto = photos[currentIndex];
  const currentPhotoBlobUrl = currentPhoto ? blobUrlsRef.current.get(currentPhoto.photo_id) : null;
  const photoData = currentPhoto?.photo_data;
  const controlsVisible = showControls || isPanelOpen;

  if (isLoading) {
    return (
      <div className="screen view-screen view-loading">
        <div className="spinner large" aria-hidden="true" />
        <p>Loading viewer…</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="screen view-screen view-empty">
        <h2>No photos available</h2>
        <p>Upload photos from the Eyedeea Photos app or website, then come back here.</p>
        <button type="button" className="btn btn-secondary" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    );
  }

  return (
    <div
      className={`view-screen ${controlsVisible ? 'controls-visible' : ''} ${isPanelOpen ? 'panel-open' : ''}`}
      onMouseMove={showControlsTemporarily}
      onClick={(event) => {
        if (event.target.closest('button')) return;
        showControlsTemporarily();
      }}
    >
      <div className={`photo-stage ${isPanelOpen ? 'panel-open' : ''}`}>
        {currentPhotoBlobUrl ? (
          isPortrait(photoData) ? (
            <div className="portrait-frame" key={currentPhoto.photo_id}>
              <img src={currentPhotoBlobUrl} alt="" className="photo-blur-bg" aria-hidden="true" />
              <div className="portrait-card">
                <img
                  src={currentPhotoBlobUrl}
                  alt={photoData?.filename || 'Photo'}
                  className="photo-main portrait"
                />
              </div>
            </div>
          ) : (
            <img
              key={currentPhoto.photo_id}
              src={currentPhotoBlobUrl}
              alt={photoData?.filename || 'Photo'}
              className="photo-main landscape"
            />
          )
        ) : (
          <div className="photo-loading">
            <div className="spinner large" aria-hidden="true" />
            <p>Loading photo…</p>
          </div>
        )}

        {showMetadata && (
          <div className="photo-metadata">
            <div className="photo-metadata-captions">
              <h2>{getTitle(photoData)}</h2>
              <p>{getSubtitle(photoData)}</p>
              <p className="muted">{getSubSubtitle(photoData)}</p>
            </div>
            {showWeatherPanel && (
              <WeatherPanels weather={weather} config={config} compact={compactWeather} />
            )}
          </div>
        )}
      </div>

      <div className={`view-controls-top ${controlsVisible ? 'visible' : ''}`}>
        <button
          type="button"
          className="view-icon-btn"
          onClick={onOpenSettings}
          aria-label="Home"
          title="Settings"
        >
          ⌂
        </button>
        <button
          type="button"
          className="view-icon-btn"
          onClick={toggleHistoryPanel}
          aria-label="Toggle history panel"
          title="History"
        >
          ☰
        </button>
      </div>

      <button
        type="button"
        className={`view-nav-btn view-nav-prev ${controlsVisible ? 'visible' : ''}`}
        onClick={goPrev}
        disabled={!canGoPrev}
        aria-label="Previous photo"
      >
        ◀
      </button>
      <button
        type="button"
        className={`view-nav-btn view-nav-next ${controlsVisible ? 'visible' : ''}`}
        onClick={goNext}
        disabled={!canGoNext}
        aria-label="Next photo"
      >
        ▶
      </button>

      <aside className={`history-panel ${isPanelOpen ? 'open' : ''}`} aria-hidden={!isPanelOpen}>
        <div className="history-panel-header">
          <h2>Recent History</h2>
          <button
            type="button"
            className="view-icon-btn history-close"
            onClick={() => setIsPanelOpen(false)}
            aria-label="Close history panel"
          >
            ✕
          </button>
        </div>
        <div className="history-grid">
          {history
            .slice(-HISTORY_DISPLAY_COUNT)
            .reverse()
            .map((photo) => {
              const thumbUrl = blobUrlsRef.current.get(photo.photo_id);
              return (
                <button
                  key={photo.photo_id}
                  type="button"
                  className="history-thumb"
                  onClick={() => goToHistoryPhoto(photo)}
                  aria-label={photo.photo_data?.filename || 'Photo'}
                >
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" />
                  ) : (
                    <span className="history-thumb-placeholder" />
                  )}
                </button>
              );
            })}
        </div>
      </aside>
    </div>
  );
}
