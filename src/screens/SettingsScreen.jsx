import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function SettingsScreen({ onBack, onLogout }) {
  const user = useAuthStore((state) => state.user);
  const group = useAuthStore((state) => state.group);
  const backButtonRef = useRef(null);

  const displayName = user?.name || user?.email || 'Signed in';
  const email = user?.email || '—';
  const household = user?.current_household_name || user?.household_name || 'Your household';
  const planLabel = group && group !== 'auth_user' && group !== 'public_user' ? group.replace(/_/g, ' ') : 'Active subscription';

  const handleLogout = () => {
    useAuthStore.getState().logout();
    onLogout();
  };

  useEffect(() => {
    backButtonRef.current?.focus();
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
          <div className="settings-row">
            <dt>Household</dt>
            <dd>{household}</dd>
          </div>
          <div className="settings-row">
            <dt>Plan</dt>
            <dd className="capitalize">{planLabel}</dd>
          </div>
        </dl>

        <div className="settings-actions">
          <button type="button" className="btn btn-secondary" ref={backButtonRef} onClick={onBack}>
            Back to slideshow
          </button>
          <button type="button" className="btn btn-danger" onClick={handleLogout}>
            Log out
          </button>
        </div>

        <p className="settings-hint">Logging out will require a new device code to sign in again.</p>
      </div>
    </div>
  );
}
