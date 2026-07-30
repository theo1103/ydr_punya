import React, { useState, useEffect } from 'react';
import { User } from './types';
import { initDatabase, getAppSettings, getUser } from './utils/db';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar, NavChoice } from './components/Sidebar';
import { DataInputView } from './components/DataInputView';
import { DashboardView } from './components/DashboardView';
import { ProfileView } from './components/ProfileView';
import { AdminSettingsView } from './components/AdminSettingsView';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentNav, setCurrentNav] = useState<NavChoice>('input');
  const [appLogoUrl, setAppLogoUrl] = useState<string>('https://cdn-icons-png.flaticon.com/512/6009/6009864.png');

  // Initialize DB on app start
  useEffect(() => {
    async function setup() {
      await initDatabase();
      refreshAppSettings();
    }
    setup();
  }, []);

  const refreshAppSettings = () => {
    const settings = getAppSettings();
    if (settings.logoUrl) {
      setAppLogoUrl(settings.logoUrl);
    }
  };

  const refreshUser = () => {
    if (currentUser) {
      const updated = getUser(currentUser.username);
      if (updated) {
        setCurrentUser(updated);
      }
    }
    refreshAppSettings();
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentNav('input');
    refreshAppSettings();
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <AuthScreen
        logoUrl={appLogoUrl}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        logoUrl={appLogoUrl}
        currentUser={currentUser}
        currentNav={currentNav}
        onSelectNav={setCurrentNav}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {currentNav === 'input' && (
          <DataInputView
            username={currentUser.username}
            onDataAdded={refreshUser}
          />
        )}

        {currentNav === 'dashboard' && <DashboardView />}

        {currentNav === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onProfileUpdated={refreshUser}
          />
        )}

        {currentNav === 'admin' && currentUser.role === 'admin' && (
          <AdminSettingsView
            currentLogoUrl={appLogoUrl}
            onLogoUpdated={refreshUser}
          />
        )}
      </main>
    </div>
  );
}

export default App;
