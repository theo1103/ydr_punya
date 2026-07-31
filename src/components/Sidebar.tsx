import React from 'react';
import { User } from '../types';
import { Inbox, BarChart2, User as UserIcon, Settings, LogOut, Shield, PanelLeftClose, X } from 'lucide-react';

export type NavChoice = 'input' | 'dashboard' | 'profile' | 'admin';

interface SidebarProps {
  logoUrl: string;
  currentUser: User;
  currentNav: NavChoice;
  onSelectNav: (nav: NavChoice) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  logoUrl,
  currentUser,
  currentNav,
  onSelectNav,
  onLogout,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={onClose}
        className="md:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Sidebar Container */}
      <aside className="fixed md:sticky top-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shadow-2xl shrink-0 transition-all duration-300">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="App Logo"
              className="w-10 h-10 rounded-xl object-cover shadow-md border border-slate-700/80"
            />
            <div>
              <h2 className="text-base font-extrabold tracking-wider text-slate-100 leading-tight">YADORU PRO</h2>
              <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                Corporate Portal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Sembunyikan Menu"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <PanelLeftClose className="w-5 h-5 hidden md:block" />
            <X className="w-5 h-5 md:hidden" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Menu Utama
          </p>

          <button
            onClick={() => {
              onSelectNav('input');
              if (window.innerWidth < 768) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all ${
              currentNav === 'input'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4.5 h-4.5 text-emerald-400" />
            <span>📥 Data Input</span>
          </button>

          <button
            onClick={() => {
              onSelectNav('dashboard');
              if (window.innerWidth < 768) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all ${
              currentNav === 'dashboard'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4.5 h-4.5 text-blue-400" />
            <span>📊 Dashboard</span>
          </button>

          <button
            onClick={() => {
              onSelectNav('profile');
              if (window.innerWidth < 768) onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all ${
              currentNav === 'profile'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4.5 h-4.5 text-purple-400" />
            <span>👤 My Profile</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                onSelectNav('admin');
                if (window.innerWidth < 768) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all ${
                currentNav === 'admin'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Settings className="w-4.5 h-4.5 text-amber-400" />
              <span>⚙️ Admin Settings</span>
            </button>
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 mb-3 px-1">
            {currentUser.photo ? (
              <img
                src={currentUser.photo}
                alt={currentUser.username}
                className="w-9 h-9 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 border border-slate-700 text-sm">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{currentUser.username}</p>
              <p className="text-xs text-slate-400 capitalize flex items-center gap-1">
                {currentUser.role === 'admin' && <Shield className="w-3 h-3 text-amber-400 inline" />}
                {currentUser.role}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl text-xs font-semibold border border-red-900/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

