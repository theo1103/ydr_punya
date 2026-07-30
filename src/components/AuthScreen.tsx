import React, { useState } from 'react';
import { User } from '../types';
import { getUsers, loginUser, registerUser } from '../utils/db';
import { LogIn, UserPlus, Lock, User as UserIcon, Shield } from 'lucide-react';

interface AuthScreenProps {
  logoUrl: string;
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ logoUrl, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  
  // Sign In form
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [customUsername, setCustomUsername] = useState<string>('');
  const [signInPassword, setSignInPassword] = useState<string>('');
  const [signInError, setSignInError] = useState<string>('');

  // Register form
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regError, setRegError] = useState<string>('');
  const [regSuccess, setRegSuccess] = useState<string>('');

  const users = getUsers();
  const usernames = users.map((u) => u.username);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    const targetUsername = selectedUsername || customUsername;
    if (!targetUsername) {
      setSignInError('Pilih atau ketik username terlebih dahulu.');
      return;
    }

    const result = await loginUser(targetUsername, signInPassword);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setSignInError(result.message || 'Kredensial salah!');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const result = await registerUser(regUsername, regPassword);
    if (result.success) {
      setRegSuccess(result.message);
      setRegUsername('');
      setRegPassword('');
      // Switch back to signin after a moment or let user click
    } else {
      setRegError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-white">
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logoUrl}
            alt="Yadoru Logo"
            className="w-20 h-20 rounded-2xl object-cover mb-4 shadow-lg border-2 border-white/30"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">YADORU CORPORATE</h1>
          <p className="text-slate-400 text-sm mt-1">Sistem Manajemen Portal Perusahaan</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-6 border border-slate-700/50">
          <button
            onClick={() => {
              setActiveTab('signin');
              setSignInError('');
              setRegError('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signin'
                ? 'bg-slate-900 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('register');
              setSignInError('');
              setRegError('');
            }}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-slate-900 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Register
          </button>
        </div>

        {/* Tab content: Sign In */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Pilih atau Ketik Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <select
                  value={selectedUsername}
                  onChange={(e) => {
                    setSelectedUsername(e.target.value);
                    setCustomUsername('');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 appearance-none"
                >
                  <option value="">-- Pilih Username Terdaftar --</option>
                  {usernames.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              
              {!selectedUsername && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Atau ketik username manual..."
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder-slate-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Masukkan password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder-slate-500"
                />
              </div>
            </div>

            {signInError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs text-center font-medium">
                {signInError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-semibold text-sm rounded-xl shadow-lg border border-slate-600/50 transition-all transform active:scale-98 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Masuk
            </button>

            <div className="mt-4 p-3.5 bg-slate-800/80 rounded-2xl border border-amber-500/30 text-xs text-slate-300 flex items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-amber-400 flex items-center gap-1 mb-0.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Default Admin
                </span>
                <p className="text-[11px] text-slate-400">
                  <code className="text-amber-300">yadoru</code> / <code className="text-amber-300">yadoru123</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUsername('yadoru');
                  setCustomUsername('');
                  setSignInPassword('yadoru123');
                }}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-lg border border-amber-500/40 text-[11px] transition-colors shrink-0"
              >
                Isi Kredensial Admin
              </button>
            </div>
          </form>
        )}

        {/* Tab content: Register */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username Baru
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik username baru"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Ketik password baru"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 placeholder-slate-500"
                />
              </div>
            </div>

            {regError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs text-center font-medium">
                {regError}
              </div>
            )}

            {regSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs text-center font-medium">
                {regSuccess}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-sm rounded-xl shadow-lg border border-emerald-600/50 transition-all transform active:scale-98 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Daftar Akun
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
