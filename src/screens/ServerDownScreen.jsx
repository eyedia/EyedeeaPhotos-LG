import { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export default function ServerDownScreen({ onReload }) {
  const reloadRef = useRef(null);

  useEffect(() => {
    reloadRef.current?.focus();
  }, []);

  return (
    <div className="screen server-down-screen">
      <div className="server-down-content">
        <div className="server-down-icon">
          <img src="./server_offline.png" alt="" aria-hidden="true" />
        </div>
        <h1>Oops! Server&apos;s taking a nap</h1>
        <p>
          Our servers are catching some Z&apos;s right now. Don&apos;t worry, we&apos;ll keep poking them until they
          wake up!
        </p>
        <p>
          You can still add photos in Settings, and we&apos;ll sync them as soon as we&apos;re back online.
        </p>
        <button
          ref={reloadRef}
          type="button"
          className="btn-reload"
          onClick={onReload}
          aria-label="Reload"
        >
          <RefreshCw size={36} strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
