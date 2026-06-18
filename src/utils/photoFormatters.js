const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function isPortrait(photoData) {
  return photoData?.orientation === 1;
}

export function getTitle(photoData) {
  try {
    if (!photoData?.folder_name) return 'Memories';
    let title = photoData.folder_name.replaceAll('\\', '/').split('/').pop();
    title = title.replaceAll(' - ', ' ').replaceAll('-', ' ').replaceAll('_', ' ');
    return title || 'Memories';
  } catch {
    return 'Memories';
  }
}

export function formatDateTime(value) {
  try {
    if (!value) return null;
    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) return null;
    const day = date.getDate().toString().padStart(2, '0');
    return `${DAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${day} ${date.getFullYear()}`;
  } catch {
    return null;
  }
}

export function formatPlace(address) {
  try {
    if (!address) return null;
    let addressObj = address;
    if (typeof address === 'string') {
      if (address.trim() === '' || address.trim() === '{}') return null;
      try {
        addressObj = JSON.parse(address);
      } catch {
        return address;
      }
    }
    if (typeof addressObj === 'object' && Object.keys(addressObj).length === 0) return null;

    const cityOrTown = addressObj.town || addressObj.city || addressObj.county || addressObj.state || '';
    const country = addressObj.country || '';
    if (cityOrTown && country) return `${cityOrTown}, ${country}`;
    return cityOrTown || country || null;
  } catch {
    return null;
  }
}

export function getSubtitle(photoData) {
  const timeText = formatDateTime(photoData?.photo_created_at);
  const placeText = formatPlace(photoData?.address);
  if (timeText && placeText) return `${timeText} | ${placeText}`;
  if (timeText) return timeText;
  if (placeText) return placeText;
  return "It's all about the journey";
}

export function getSubSubtitle(photoData) {
  try {
    const filename = photoData?.filename || 'Unknown file';
    return filename.split(/[\\/]+/).pop() || 'Unknown file';
  } catch {
    return 'Unknown file';
  }
}
