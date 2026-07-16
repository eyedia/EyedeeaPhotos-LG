import { useEffect, useState } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import { faceApi, fetchAuthenticatedBlob } from '../services/api';
import { formatLocalDateTime } from '../utils/dateTime';

const isMeaningfulValue = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return false;
  const lowered = text.toLowerCase();
  return lowered !== 'null' && lowered !== 'none' && lowered !== 'undefined';
};

const parseJsonSafely = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  const text = String(value).trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const resolvePoiValue = (metadata) => {
  const objectsMeta = metadata?.objects_metadata_json || {};
  const unifiedVision = objectsMeta?.unified_vision || {};
  return unifiedVision?.poi ?? objectsMeta?.poi ?? metadata?.poi ?? null;
};

const formatPoiForDisplay = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') {
    return isMeaningfulValue(value) ? value.trim() : null;
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          return String(item.name || item.label || item.poi || '').trim();
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
    return isMeaningfulValue(joined) ? joined : null;
  }
  if (typeof value === 'object') {
    const text = String(value.name || value.label || value.poi || '').trim();
    return isMeaningfulValue(text) ? text : null;
  }
  const text = String(value).trim();
  return isMeaningfulValue(text) ? text : null;
};

const formatAddressBasics = (address) => {
  if (!address) return '-';
  if (typeof address === 'string') {
    const text = address.trim();
    if (!text || text === '{}') return '-';
    const parsed = parseJsonSafely(text);
    if (!parsed) return text;
    return formatAddressBasics(parsed);
  }

  if (typeof address !== 'object') {
    return String(address);
  }

  const parts = [
    address.town || address.city || '',
    address.county || address.state || '',
    address.country || '',
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .filter((part, index, arr) => arr.findIndex((entry) => entry.toLowerCase() === part.toLowerCase()) === index);

  if (parts.length === 0) {
    return '-';
  }

  return parts.join(', ');
};

const formatFileSizeMb = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '-';
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const normalizeTagString = (value) => String(value || '')
  .split(',')
  .map((token) => token.trim())
  .filter(Boolean)
  .filter((token, index, arr) => arr.indexOf(token) === index)
  .join(', ');

const toAlbumName = (folderPath) => {
  const normalized = String(folderPath || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!normalized) return '-';
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || normalized;
};

const basenameOnly = (value) => {
  const normalized = String(value || '').replace(/\\/g, '/').trim();
  if (!normalized) return '-';
  const parts = normalized.split('/');
  return parts[parts.length - 1] || '-';
};

function FaceThumb({ householdId, person }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const displayName = person?.display_name || 'Unnamed';
  const initial = (displayName || '?').slice(0, 1);

  useEffect(() => {
    let revoked = false;
    let objectUrl = null;

    const sourceId = person?.representative_source_id;
    const cropPath = person?.representative_crop_path;
    if (!householdId || !sourceId || !cropPath) {
      setBlobUrl(null);
      return undefined;
    }

    const url = faceApi.getFaceThumbnailUrl(householdId, sourceId, cropPath);
    fetchAuthenticatedBlob(url)
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!revoked) setBlobUrl(null);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [householdId, person?.representative_source_id, person?.representative_crop_path]);

  return (
    <div className="info-person-chip" title={displayName}>
      {blobUrl ? (
        <img src={blobUrl} alt={displayName} className="info-person-thumb" />
      ) : (
        <div className="info-person-initial" aria-hidden="true">{initial}</div>
      )}
    </div>
  );
}

/**
 * Read-only Photo Info drawer for the View slideshow screen.
 */
export default function ViewPhotoInfoPanel({
  isOpen,
  onClose,
  householdId,
  metadata = null,
  peoplePreview = null,
  isLoading = false,
  loadError = '',
  fallbackFilename = '',
  fallbackFolderName = '',
}) {
  const filename = basenameOnly(metadata?.filename || fallbackFilename);
  const albumName = toAlbumName(metadata?.folder_name || fallbackFolderName);
  const addressText = formatAddressBasics(metadata?.address);
  const poiText = formatPoiForDisplay(resolvePoiValue(metadata));
  const caption = String(metadata?.ai_caption || metadata?.caption || '').trim();
  const peopleItems = Array.isArray(peoplePreview?.items) ? peoplePreview.items : [];
  const visiblePeople = peopleItems.slice(0, 4);
  const remainingPeopleCount = Math.max(0, Number(peoplePreview?.total || 0) - visiblePeople.length);
  const geoText = isMeaningfulValue(metadata?.geo_coordinates) ? metadata.geo_coordinates : '-';
  const addressDisplay = isMeaningfulValue(addressText) && addressText !== '-' ? addressText : '-';

  return (
    <aside
      className={`info-panel ${isOpen ? 'open' : ''}`}
      aria-hidden={!isOpen}
      data-tour="view-info-panel"
    >
      <div className="info-panel-header">
        <h2>Photo Info</h2>
        <button
          type="button"
          className="view-icon-btn history-close"
          onClick={onClose}
          title="Hide info panel"
          aria-label="Hide info panel"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="info-panel-body">
        <div className="info-field">
          <p className="info-label">Name</p>
          <p className="info-value break-all">{filename}</p>
        </div>

        <div className="info-field">
          <p className="info-label">Year Month</p>
          <p className="info-value">
            {formatLocalDateTime(metadata?.photo_created_at, { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="info-field">
          <p className="info-label">Album</p>
          <p className="info-value break-all">{albumName}</p>
        </div>

        {caption ? (
          <div className="info-field">
            <p className="info-label">Caption</p>
            <p className="info-value pre-wrap">{caption}</p>
          </div>
        ) : null}

        <div className="info-field">
          <p className="info-label">Date Taken</p>
          <p className="info-value">{formatLocalDateTime(metadata?.photo_created_at)}</p>
        </div>

        <div className="info-field">
          <p className="info-label">Geo Coordinates</p>
          <p className="info-value break-all">{geoText}</p>
        </div>

        <div className="info-field">
          <p className="info-label">Address</p>
          <p className="info-value">{addressDisplay}</p>
        </div>

        <div className="info-field">
          <p className="info-label">POI</p>
          <p className="info-value">{poiText || '-'}</p>
        </div>

        <div className="info-field">
          <p className="info-label">People</p>
          {visiblePeople.length === 0 ? (
            <p className="info-value muted">-</p>
          ) : (
            <div className="info-people-row">
              {visiblePeople.map((person) => (
                <FaceThumb
                  key={person.person_guid || person.display_name}
                  householdId={householdId}
                  person={person}
                />
              ))}
              {remainingPeopleCount > 0 && (
                <span className="info-people-more">{remainingPeopleCount} more</span>
              )}
            </div>
          )}
        </div>

        <div className="info-field">
          <p className="info-label">Tags</p>
          <p className="info-value">{normalizeTagString(metadata?.tags || '') || '-'}</p>
        </div>

        <div className="info-field-row">
          <div className="info-field">
            <p className="info-label">Resolution</p>
            <p className="info-value">{metadata?.resolution || '-'}</p>
          </div>
          <div className="info-field info-field-end">
            <p className="info-label">File Size</p>
            <p className="info-value">{formatFileSizeMb(metadata?.file_size_bytes)}</p>
          </div>
        </div>

        <div className="info-disclaimer">
          <div className="info-disclaimer-rule" />
          <p className="info-disclaimer-text">
            <Info size={14} aria-hidden="true" />
            AI-generated details may be missing or wrong.
          </p>
        </div>

        {isLoading && !metadata && (
          <p className="info-status">loading metadata...</p>
        )}
        {loadError && (
          <p className="info-status info-status-error">{loadError}</p>
        )}
      </div>
    </aside>
  );
}
