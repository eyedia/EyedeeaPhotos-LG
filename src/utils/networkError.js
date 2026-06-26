export function isNetworkError(error) {
  if (!error) return false;
  if (error.code === 'NETWORK_ERROR' || error.status === 0) return true;
  if (error instanceof TypeError) return true;
  const message = String(error.message || '').toLowerCase();
  return message === 'failed to fetch' || message.includes('networkerror') || message.includes('load failed');
}
