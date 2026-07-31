import React, { useState, useEffect } from 'react';
import { User } from './types';
import { initDatabase, getAppSettings, getUser, subscribeDatabaseChanges } from './utils/db';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar, NavChoice } from './components/Sidebar';
import { DataInputView } from './components/DataInputView';
import { DashboardView } from './components/DashboardView';
import { GiftSendbackView } from './components/GiftSendbackView';
import { ProfileView } from './components/ProfileView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { Menu, PanelLeft, LogOut, Shield } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentNav, setCurrentNav] = useState<NavChoice>('input');
  const [appLogoUrl, setAppLogoUrl] = useState<string>('https://cdn-icons-png.flaticon.com/512/6009/6009864.png');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Initialize DB on app start & subscribe to real-time changes
  useEffect(() => {
    async function setup() {
      await initDatabase();
      refreshAppSettings();
    }
    setup();

    const unsubscribe = subscribeDatabaseChanges(() => {
      refreshAppSettings();
      setCurrentUser((prev) => {
        if (!prev) return null;
        const updated = getUser(prev.username);
        return updated || prev;
      });
    });

    return () => unsubscribe();
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

  const getNavTitle = () => {
    switch (currentNav) {
      case 'input':
        return '📥 Data Input Harian';
      case 'dashboard':
        return '📊 Laporan Dashboard Kumulatif';
      case 'gift-sendback':
        return '🎁 Status Gift Sendback';
      case 'profile':
        return '👤 Profil Saya';
      case 'admin':
        return '⚙️ Admin Settings';
      default:
        return 'Yadoru Corporate';
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        logoUrl={appLogoUrl}
        currentUser={currentUser}
        currentNav={currentNav}
        onSelectNav={setCurrentNav}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Sticky Header */}
        <header className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 border border-slate-700/70"
              title={isSidebarOpen ? 'Sembunyikan Menu' : 'Tampilkan Menu'}
            >
              {isSidebarOpen ? (
                <PanelLeft className="w-5 h-5 text-amber-400" />
              ) : (
                <Menu className="w-5 h-5 text-emerald-400" />
              )}
              <span className="text-xs font-semibold hidden sm:inline">
                {isSidebarOpen ? 'Sembunyikan Menu' : 'Buka Menu'}
              </span>
            </button>

            {!isSidebarOpen && (
              <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
                <img src={appLogoUrl} alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
                <span className="font-bold text-sm text-slate-100 tracking-wide">YADORU PRO</span>
              </div>
            )}

            <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-3">
              <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                {getNavTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">{currentUser.username}</span>
              {currentUser.role === 'admin' && <Shield className="w-3.5 h-3.5 text-amber-400 inline" />}
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl text-xs border border-red-900/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {currentNav === 'input' && (
            <DataInputView
              username={currentUser.username}
              onDataAdded={refreshUser}
            />
          )}

          {currentNav === 'dashboard' && <DashboardView />}

          {currentNav === 'gift-sendback' && <GiftSendbackView currentUser={currentUser} />}

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
    </div>
  );
}

export default App;

