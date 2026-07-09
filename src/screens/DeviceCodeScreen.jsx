import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ACTIVATE_URL } from '../config';
import { authApi, ApiError } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { getOrCreateDeviceId } from '../utils/deviceId';
import { isNetworkError } from '../utils/networkError';
import { useWebOSOkKey } from '../hooks/useWebOSRemote';
import ServerDownScreen from './ServerDownScreen';

const CYCLE_DURATION_MS = 3 * 60 * 1000;
const MAX_CYCLES = 3;
const PROGRESS_TICK_MS = 200;

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
  const [retryAfter, setRetryAfter] = useState(0);
  const [serverDown, setServerDown] = useState(false);
  const [cycleProgress, setCycleProgress] = useState(1);
  const [instantBarReset, setInstantBarReset] = useState(false);

  const deviceCodeRef = useRef('');
  const pollIntervalRef = useRef(5);
  const pollTimerRef = useRef(null);
  const cycleTimerRef = useRef(null);
  const cycleDeadlineRef = useRef(0);
  const cycleIndexRef = useRef(0);
  const issuingRef = useRef(false);
  const exhaustedRef = useRef(false);
  const reloadRef = useRef(null);
  const advanceCycleRef = useRef(async () => {});

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const clearCycleTimer = useCallback(() => {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
  }, []);

  const stopActivation = useCallback(() => {
    clearPollTimer();
    clearCycleTimer();
    exhaustedRef.current = true;
  }, [clearCycleTimer, clearPollTimer]);

  const startCycleTimer = useCallback(() => {
    clearCycleTimer();
    cycleDeadlineRef.current = Date.now() + CYCLE_DURATION_MS;
    setInstantBarReset(true);
    setCycleProgress(1);

    cycleTimerRef.current = setInterval(() => {
      const remaining = cycleDeadlineRef.current - Date.now();
      if (remaining <= 0) {
        clearCycleTimer();
        setCycleProgress(0);
        advanceCycleRef.current();
        return;
      }
      setCycleProgress(remaining / CYCLE_DURATION_MS);
    }, PROGRESS_TICK_MS);
  }, [clearCycleTimer]);

  const pollOnceRef = useRef(async () => {});

  const schedulePoll = useCallback((delayMs) => {
    if (exhaustedRef.current) return;
    clearPollTimer();
    pollTimerRef.current = setTimeout(() => {
      pollTimerRef.current = null;
      pollOnceRef.current();
    }, delayMs);
  }, [clearPollTimer]);

  const issueCode = useCallback(async ({ resetCycle = false, showLoading = true } = {}) => {
    if (issuingRef.current) return;
    issuingRef.current = true;
    setServerDown(false);
    if (showLoading) {
      setStatus('loading');
    }

    if (resetCycle) {
      exhaustedRef.current = false;
      cycleIndexRef.current = 0;
    }

    try {
      const data = await authApi.issueDeviceCode(deviceId);
      deviceCodeRef.current = data.device_code;
      setUserCode(formatUserCode(data.user_code));
      pollIntervalRef.current = Number(data.interval) > 0 ? Number(data.interval) : 5;
      setStatus('waiting');
      startCycleTimer();
      schedulePoll(pollIntervalRef.current * 1000);
    } catch (error) {
      clearCycleTimer();
      if (isNetworkError(error)) {
        setServerDown(true);
        setStatus('error');
        return;
      }

      const retry = Number(error?.data?.retry_after || error?.data?.retry_after_seconds || 0);
      if (retry > 0) {
        setRetryAfter(retry);
        setStatus('blocked');
      } else {
        setStatus('error');
      }
    } finally {
      issuingRef.current = false;
    }
  }, [clearCycleTimer, deviceId, schedulePoll, startCycleTimer]);

  const advanceCycle = useCallback(async () => {
    clearCycleTimer();
    clearPollTimer();
    deviceCodeRef.current = '';

    if (cycleIndexRef.current >= MAX_CYCLES - 1) {
      setUserCode('');
      setStatus('exhausted');
      stopActivation();
      return;
    }

    cycleIndexRef.current += 1;
    await issueCode({ showLoading: false });
  }, [clearCycleTimer, clearPollTimer, issueCode, stopActivation]);

  advanceCycleRef.current = advanceCycle;

  const restartActivation = useCallback(async () => {
    stopActivation();
    exhaustedRef.current = false;
    cycleIndexRef.current = 0;
    deviceCodeRef.current = '';
    setUserCode('');
    setRetryAfter(0);
    await issueCode({ resetCycle: true });
  }, [issueCode, stopActivation]);

  pollOnceRef.current = async () => {
    if (exhaustedRef.current) return;

    const deviceCode = deviceCodeRef.current;
    if (!deviceCode) {
      await issueCode();
      return;
    }

    try {
      const data = await authApi.pollDeviceCode(deviceCode, deviceId);
      const pollStatus = String(data?.status || '').toLowerCase();

      if (pollStatus === 'approved') {
        stopActivation();
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
        await advanceCycle();
        return;
      }

      if (pollStatus === 'blocked') {
        await advanceCycle();
        return;
      }

      setStatus('waiting');
      schedulePoll(pollIntervalRef.current * 1000);
    } catch (error) {
      if (isNetworkError(error)) {
        stopActivation();
        setServerDown(true);
        setStatus('error');
        return;
      }

      if (error instanceof ApiError && error.status === 429) {
        const waitSeconds = Number(error?.data?.retry_after || error?.data?.retry_after_seconds || pollIntervalRef.current);
        setRetryAfter(waitSeconds);
        setStatus('waiting');
        schedulePoll(Math.max(waitSeconds, pollIntervalRef.current) * 1000);
        return;
      }

      setStatus('waiting');
      schedulePoll(pollIntervalRef.current * 1000);
    }
  };

  useEffect(() => {
    if (!instantBarReset) return undefined;
    const frame = requestAnimationFrame(() => {
      setInstantBarReset(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [instantBarReset]);

  useEffect(() => {
    restartActivation();
    return () => {
      clearPollTimer();
      clearCycleTimer();
    };
    // Mount only — restartActivation is stable enough for initial session start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (retryAfter <= 0) return undefined;
    const timer = setInterval(() => {
      setRetryAfter((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  useEffect(() => {
    if ((status === 'exhausted' || status === 'error') && !serverDown) {
      reloadRef.current?.focus();
    }
  }, [serverDown, status]);

  useWebOSOkKey(
    useCallback(() => {
      if (status === 'exhausted' || status === 'error') {
        restartActivation();
        return true;
      }
      return false;
    }, [restartActivation, status])
  );

  if (serverDown) {
    return <ServerDownScreen onReload={restartActivation} />;
  }

  const activateHost = ACTIVATE_URL.replace(/^https?:\/\//, '');

  return (
    <div className="screen device-code-screen">
      <div className="device-code-card">
        <img src="./brand-icon-512.png" alt="Eyedeea Photos" className="app-logo" />
        <h1>Eyedeea Photos</h1>
        <p className="app-tagline">Your memories, everywhere</p>

        <div className="activation-section">
          <h2 className="activation-title">Device Activation</h2>

          <div className="activate-instructions">
            <p>Go to</p>
            <p className="activate-url">{activateHost}</p>
            <p>and enter the code:</p>
          </div>

          {userCode ? (
            <div className="code-display" aria-live="polite">
              <span className="code-value">{userCode}</span>
            </div>
          ) : null}

          {status === 'loading' && !userCode && (
            <div className="status-row">
              <span className="spinner" aria-hidden="true" />
            </div>
          )}

          {userCode && status === 'waiting' && (
            <div
              className="activation-timeout"
              role="progressbar"
              aria-label="Activation time remaining"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(cycleProgress * 100)}
            >
              <div
                className={`activation-timeout-bar${instantBarReset ? ' activation-timeout-bar--instant' : ''}`}
                style={{ width: `${cycleProgress * 100}%` }}
              />
            </div>
          )}

          {status === 'blocked' && retryAfter > 0 && (
            <p className="activation-hint warn">Retry in {retryAfter}s</p>
          )}

          {status === 'exhausted' && (
            <>
              <p className="exhausted-message">No user input provided.</p>
              <div className="status-row">
                <button
                  ref={reloadRef}
                  type="button"
                  className="btn-reload"
                  onClick={restartActivation}
                  aria-label="Refresh"
                >
                  <RefreshCw size={22} strokeWidth={2.25} aria-hidden="true" />
                  Refresh
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <div className="status-row">
              <button
                ref={reloadRef}
                type="button"
                className="btn-reload"
                onClick={restartActivation}
                aria-label="Refresh"
              >
                <RefreshCw size={22} strokeWidth={2.25} aria-hidden="true" />
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
