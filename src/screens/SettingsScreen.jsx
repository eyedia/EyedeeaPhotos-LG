import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWebOSOkKey } from '../hooks/useWebOSRemote';

export default function SettingsScreen({ onBack, onLogout }) {
  const user = useAuthStore((state) => state.user);
  const [selectedAction, setSelectedAction] = useState('back');

  const displayName = user?.name || user?.email || 'Signed in';
  const email = user?.email || '—';

  const handleLogout = useCallback(() => {
    useAuthStore.getState().logout();
    onLogout();
  }, [onLogout]);

  useWebOSOkKey(
    useCallback(() => {
      if (selectedAction === 'back') {
        onBack();
        return true;
      }
      handleLogout();
      return true;
    }, [handleLogout, onBack, selectedAction])
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isLeft = event.key === 'ArrowLeft' || event.keyCode === 37;
      const isRight = event.key === 'ArrowRight' || event.keyCode === 39;
      if (!isLeft && !isRight) return;

      event.preventDefault();
      setSelectedAction((current) => (current === 'back' ? 'logout' : 'back'));
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <div className="screen settings-screen">
      <div className="settings-card">
        <h1>Settings</h1>
        <p className="settings-subtitle">Account signed in on this TV</p>

        <dl className="settings-list">
          <div className="settings-row">
            <dt>Name</dt>
            <dd>{displayName}</dd>
          </div>
          <div className="settings-row">
            <dt>Email</dt>
            <dd>{email}</dd>
          </div>
        </dl>

        <div className="settings-actions">
          <button
            type="button"
            className={`btn btn-settings${selectedAction === 'back' ? ' is-selected' : ''}`}
            onClick={onBack}
            onFocus={() => setSelectedAction('back')}
            onMouseEnter={() => setSelectedAction('back')}
          >
            Back
          </button>
          <button
            type="button"
            className={`btn btn-settings${selectedAction === 'logout' ? ' is-selected' : ''}`}
            onClick={handleLogout}
            onFocus={() => setSelectedAction('logout')}
            onMouseEnter={() => setSelectedAction('logout')}
          >
            Log out
          </button>
        </div>

        <p className="settings-hint">Logging out will require a new device code to sign in again.</p>
      </div>
    </div>
  );
}
