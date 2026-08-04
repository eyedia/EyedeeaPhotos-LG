import { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { SUBSCRIPTION_REQUIRED_MESSAGE } from '../utils/subscriptionAccessHold';

/**
 * Lean-back full-screen notice for LG webOS TV.
 * Refresh re-checks product access after payment is fixed on another device.
 */
export default function SubscriptionRequiredScreen({ onRefresh }) {
  const refreshRef = useRef(null);

  useEffect(() => {
    refreshRef.current?.focus();
  }, []);

  return (
    <div
      className="screen subscription-required-screen"
      role="alert"
      aria-live="assertive"
    >
      <div className="subscription-required-content">
        <p className="subscription-required-message">
          {SUBSCRIPTION_REQUIRED_MESSAGE}
        </p>
        <button
          ref={refreshRef}
          type="button"
          className="btn-reload"
          onClick={onRefresh}
          aria-label="Refresh"
        >
          <RefreshCw size={36} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
