import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ACTIVATE_URL } from '../config';
import { authApi, ApiError } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { isNetworkError } from '../utils/networkError';
import ServerDownScreen from './ServerDownScreen';

function formatUserCode(value) {
  const compact = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, 3)}-${compact.slice(3)}`;
}

export default function DeviceCodeScreen({ onAuthenticated }) {
  const persistAuth = useAuthStore((state) => state.persistAuth);
  const deviceId = getOrCreateDeviceId();

  const [userCode, setUserCode] = useState('');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Getting your device code…');
  const [retryAfter, setRetryAfter] = useState(0);
  const [serverDown, setServerDown] = useState(false);

  const deviceCodeRef = useRef('');
  const pollIntervalRef = useRef(5);
  const pollTimerRef = useRef(null);
  const issuingRef = useRef(false);
  const reloadRef = useRef(null);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollOnceRef = useRef(async () => {});

  const schedulePoll = useCallback((delayMs) => {
    clearPollTimer();
    pollTimerRef.current = setTimeout(() => {
      pollTimerRef.current = null;
      pollOnceRef.current();
    }, delayMs);
  }, [clearPollTimer]);

  const issueCode = useCallback(async () => {
    if (issuingRef.current) return;
    issuingRef.current = true;
    setServerDown(false);
    setStatus('loading');
    setMessage('Getting your device code…');

    try {
      const data = await authApi.issueDeviceCode(deviceId);
      deviceCodeRef.current = data.device_code;
      setUserCode(formatUserCode(data.user_code));
      pollIntervalRef.current = Number(data.interval) > 0 ? Number(data.interval) : 5;
      setStatus('waiting');
      setMessage('Enter this code on your phone or computer to sign in.');
      schedulePoll(pollIntervalRef.current * 1000);
    } catch (error) {
      if (isNetworkError(error)) {
        setServerDown(true);
        setStatus('error');
        setMessage('');
        return;
      }

      const retry = Number(error?.data?.retry_after || error?.data?.retry_after_seconds || 0);
      if (retry > 0) {
        setRetryAfter(retry);
        setStatus('blocked');
        setMessage(`Too many attempts. Try again in ${retry} seconds.`);
      } else {
        setStatus('error');
        setMessage(error?.message || 'Could not get a device code.');
      }
    } finally {
      issuingRef.current = false;
    }
  }, [deviceId, schedulePoll]);

  pollOnceRef.current = async () => {
    const deviceCode = deviceCodeRef.current;
    if (!deviceCode) {
      await issueCode();
      return;
    }

    try {
      const data = await authApi.pollDeviceCode(deviceCode, deviceId);
      const pollStatus = String(data?.status || '').toLowerCase();

      if (pollStatus === 'approved') {
        clearPollTimer();
        persistAuth({
          user: data.user,
          token: data.token,
          refreshToken: data.refresh_token,
          group: data.group,
          entitlements: data.entitlements,
        });
        onAuthenticated();
        return;
      }

      if (pollStatus === 'expired' || pollStatus === 'consumed' || pollStatus === 'invalid') {
        clearPollTimer();
        deviceCodeRef.current = '';
        setUserCode('');
        setStatus('expired');
        setMessage('Code expired. Getting a new code…');
        await issueCode();
        return;
      }

      if (pollStatus === 'blocked') {
        setStatus('blocked');
        setMessage('Too many sign-in attempts. Getting a new code…');
        clearPollTimer();
        deviceCodeRef.current = '';
        await issueCode();
        return;
      }

      setStatus('waiting');
      schedulePoll(pollIntervalRef.current * 1000);
    } catch (error) {
      if (isNetworkError(error)) {
        clearPollTimer();
        setServerDown(true);
        setStatus('error');
        setMessage('');
        return;
      }

      if (error instanceof ApiError && error.status === 429) {
        const waitSeconds = Number(error?.data?.retry_after || error?.data?.retry_after_seconds || pollIntervalRef.current);
        setRetryAfter(waitSeconds);
        setStatus('waiting');
        setMessage('Waiting to check activation…');
        schedulePoll(Math.max(waitSeconds, pollIntervalRef.current) * 1000);
        return;
      }

      setStatus('waiting');
      schedulePoll(pollIntervalRef.current * 1000);
    }
  };

  useEffect(() => {
    issueCode();
    return () => clearPollTimer();
  }, [clearPollTimer, issueCode]);

  useEffect(() => {
    if (retryAfter <= 0) return undefined;
    const timer = setInterval(() => {
      setRetryAfter((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  useEffect(() => {
    if (status === 'error' && !serverDown) {
      reloadRef.current?.focus();
    }
  }, [serverDown, status]);

  if (serverDown) {
    return <ServerDownScreen onReload={issueCode} />;
  }

  const activateHost = ACTIVATE_URL.replace(/^https?:\/\//, '');

  return (
    <div className="screen device-code-screen">
      <div className="device-code-card">
        <img src="./logo.svg" alt="Eyedeea Photos" className="app-logo" />
        <h1>Sign in to Eyedeea Photos</h1>
        <p className="lead">{message}</p>

        {userCode ? (
          <div className="code-display" aria-live="polite">
            <span className="code-label">Your code</span>
            <span className="code-value">{userCode}</span>
          </div>
        ) : null}

        <div className="activate-instructions">
          <p>On your phone or computer, go to:</p>
          <p className="activate-url">{activateHost}</p>
          <p>Sign in and enter the code shown above.</p>
        </div>

        <div className="status-row">
          {status === 'loading' && <span className="spinner" aria-hidden="true" />}
          {status === 'waiting' && <span className="status-pill">Waiting for activation…</span>}
          {status === 'blocked' && retryAfter > 0 && (
            <span className="status-pill warn">Retry in {retryAfter}s</span>
          )}
          {status === 'error' && (
            <button
              ref={reloadRef}
              type="button"
              className="btn-reload"
              onClick={issueCode}
              aria-label="Reload"
            >
              <RefreshCw size={36} strokeWidth={2.25} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
