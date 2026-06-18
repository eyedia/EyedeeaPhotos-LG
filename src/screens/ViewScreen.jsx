import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { viewApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { getStoredAuthToken } from '../stores/authStore';
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
const DEFAULT_REFRESH_CLIENT_SECONDS = 30;

export default function ViewScreen({ onOpenSettings, onSessionExpired }) {
  const user = useAuthStore((state) => state.user);
  const householdId = user?.current_household_id;

  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [config, setConfig] = useState({ refresh_client: DEFAULT_REFRESH_CLIENT_SECONDS });
  const [activeScope, setActiveScope] = useState('global');
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
          const token = getStoredAuthToken();
          const urlWithSize = addSizeParam(url, optimalSize);
          let blob;
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const response = await fetch(urlWithSize, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (response.ok) {
              blob = await response.blob();
              break;
            }
            if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
          }
          if (blob) {
            blobUrlsRef.current.set(photoId, URL.createObjectURL(blob));
            triggerBlobUpdate();
          }
        } catch {
          // Best-effort preload
        }
      };

      if (waitForFirst && items.length > 0) {
        await loadPhoto(items[0]);
        items.slice(1).forEach((item) => loadPhoto(item));
      } else {
        items.forEach((item) => loadPhoto(item));
      }
    },
    [optimalSize]
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
    };

    initialize();
    return () => {
      cancelled = true;
    };
  }, [handleApiAuthFailure, householdId, loadConfig, loadQueue]);

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
    heartbeatTimerRef.current = setInterval(sendHeartbeat, 15 * 1000);
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

    if (config?.refresh_client > 0 && householdId) {
      autoRefreshTimerRef.current = setInterval(checkForNewPhoto, config.refresh_client * 1000);
    }

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [checkForNewPhoto, config, householdId]);

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
        const token = getStoredAuthToken();
        const urlWithSize = addSizeParam(photoUrl, optimalSize);
        let blob;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          if (cancelled) return;
          const response = await fetch(urlWithSize, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (response.ok) {
            blob = await response.blob();
            break;
          }
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
        }
        if (!cancelled && blob) {
          blobUrlsRef.current.set(photoId, URL.createObjectURL(blob));
          triggerBlobUpdate();
        }
      } catch {
        // Spinner remains
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentIndex, optimalSize, photos]);

  useEffect(() => {
    const handleResize = () => setOptimalSize(getOptimalVariantSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setCurrentIndex((idx) => idx + 1);
  }, [canGoNext]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    setCurrentIndex((idx) => idx - 1);
  }, [canGoPrev]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current);
    controlsHideTimerRef.current = setTimeout(() => {
      setShowControls(false);
      controlsHideTimerRef.current = null;
    }, CONTROLS_HIDE_DELAY_MS);
  }, []);

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
      if (event.key === 'Enter') {
        event.preventDefault();
        setShowMetadata((open) => !open);
        showControlsTemporarily();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canGoNext, canGoPrev, goNext, goPrev, showControlsTemporarily]);

  const currentPhoto = photos[currentIndex];
  const currentPhotoBlobUrl = currentPhoto ? blobUrlsRef.current.get(currentPhoto.photo_id) : null;
  const photoData = currentPhoto?.photo_data;

  if (isLoading) {
    return (
      <div className="screen view-screen view-loading">
        <div className="spinner large" aria-hidden="true" />
        <p>Loading your photos…</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="screen view-screen view-empty">
        <h2>No photos yet</h2>
        <p>Upload photos from the Eyedeea Photos app or website, then come back here.</p>
        <button type="button" className="btn btn-secondary" onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    );
  }

  return (
    <div
      className={`view-screen ${showControls ? 'controls-visible' : ''}`}
      onMouseMove={showControlsTemporarily}
      onClick={showControlsTemporarily}
    >
      <div className="photo-stage">
        {currentPhotoBlobUrl ? (
          isPortrait(photoData) ? (
            <div className="portrait-frame" key={currentPhoto.photo_id}>
              <img src={currentPhotoBlobUrl} alt="" className="photo-blur-bg" />
              <img
                src={currentPhotoBlobUrl}
                alt={photoData?.filename || 'Photo'}
                className="photo-main portrait"
              />
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
          </div>
        )}

        {showMetadata && (
          <div className="photo-metadata">
            <h2>{getTitle(photoData)}</h2>
            <p>{getSubtitle(photoData)}</p>
            <p className="muted">{getSubSubtitle(photoData)}</p>
          </div>
        )}
      </div>

      <div className={`view-toolbar ${showControls ? 'visible' : ''}`}>
        <button type="button" className="btn btn-ghost" onClick={goPrev} disabled={!canGoPrev}>
          Previous
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setShowMetadata((v) => !v)}>
          Info
        </button>
        <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
          Settings
        </button>
        <button type="button" className="btn btn-ghost" onClick={goNext} disabled={!canGoNext}>
          Next
        </button>
      </div>
    </div>
  );
}
