/**
 * Photo variant size helpers for TV displays.
 */

export function getOptimalVariantSize() {
  const screenWidth = window.innerWidth || document.documentElement.clientWidth;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  const maxDimension = Math.max(screenWidth, screenHeight) * pixelRatio;

  if (maxDimension <= 1200) {
    return 'small';
  }
  if (maxDimension <= 2400) {
    return 'medium';
  }
  return 'large';
}

export function addSizeParam(photoUrl, size) {
  if (!photoUrl) return photoUrl;

  try {
    const url = new URL(photoUrl, window.location.origin);
    url.searchParams.set('size', size || 'medium');
    return url.toString();
  } catch {
    const separator = photoUrl.includes('?') ? '&' : '?';
    return `${photoUrl}${separator}size=${encodeURIComponent(size || 'medium')}`;
  }
}
