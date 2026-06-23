import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from './stores/authStore';
import DeviceCodeScreen from './screens/DeviceCodeScreen';
import ViewScreen from './screens/ViewScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useWebOSBackKey } from './hooks/useWebOSRemote';

const SCREENS = {
  deviceCode: 'deviceCode',
  view: 'view',
  settings: 'settings',
};

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydratedAuth = useAuthStore((state) => state.hasHydratedAuth);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  const [screen, setScreen] = useState(SCREENS.deviceCode);
  const viewBackHandlerRef = useRef(null);

  useEffect(() => {
    hydrateSession().then((valid) => {
      setScreen(valid ? SCREENS.view : SCREENS.deviceCode);
    });
  }, [hydrateSession]);

  const goToDeviceCode = useCallback(() => {
    setScreen(SCREENS.deviceCode);
  }, []);

  const goToView = useCallback(() => {
    setScreen(SCREENS.view);
  }, []);

  const goToSettings = useCallback(() => {
    setScreen(SCREENS.settings);
  }, []);

  useWebOSBackKey(
    useCallback(() => {
      if (screen === SCREENS.view && viewBackHandlerRef.current?.()) {
        return true;
      }
      if (screen === SCREENS.settings) {
        setScreen(SCREENS.view);
        return true;
      }
      if (screen === SCREENS.view) {
        setScreen(SCREENS.settings);
        return true;
      }
      return false;
    }, [screen])
  );

  if (!hasHydratedAuth) {
    return (
      <div className="screen boot-screen">
        <div className="spinner large" aria-hidden="true" />
        <p>Starting Eyedeea Photos…</p>
      </div>
    );
  }

  if (screen === SCREENS.deviceCode || !isAuthenticated) {
    return <DeviceCodeScreen onAuthenticated={goToView} />;
  }

  if (screen === SCREENS.settings) {
    return (
      <SettingsScreen
        onBack={goToView}
        onLogout={goToDeviceCode}
      />
    );
  }

  return (
    <ViewScreen
      onOpenSettings={goToSettings}
      onSessionExpired={goToDeviceCode}
      onBackHandlerRef={viewBackHandlerRef}
    />
  );
}
