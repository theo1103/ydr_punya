import React, { useState, useEffect } from 'react';
import {
  getUsers,
  updateAppLogo,
  toggleUserRole,
  deleteUser,
  resetUserPassword,
  getDailyData,
  deleteDailyDataRecord,
  subscribeDatabaseChanges,
} from '../utils/db';
import {
  Settings,
  Users,
  Palette,
  Upload,
  Shield,
  Check,
  Trash2,
  Key,
  Database,
  Download,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

interface AdminSettingsViewProps {
  currentLogoUrl: string;
  onLogoUpdated: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  currentLogoUrl,
  onLogoUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'records' | 'branding'>('users');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Password reset state
  const [resetModalUser, setResetModalUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const reload = () => setRefreshTrigger((prev) => prev + 1);

  // Auto-reload when DB changes anywhere
  useEffect(() => {
    const unsubscribe = subscribeDatabaseChanges(() => {
      reload();
    });
    return () => unsubscribe();
  }, []);

  const users = getUsers();
  const dailyRecords = getDailyData();

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateLogo = () => {
    if (logoPreview) {
      updateAppLogo(logoPreview);
      setSuccessMsg('Logo Berhasil Diganti!');
      setTimeout(() => setSuccessMsg(''), 3000);
      onLogoUpdated();
    }
  };

  const handleToggleRole = (username: string) => {
    toggleUserRole(username);
    reload();
  };

  const handleDeleteUser = (username: string) => {
    if (username.toLowerCase() === 'yadoru') {
      alert('Default admin "yadoru" tidak dapat dihapus!');
      return;
    }
    if (confirm(`Yakin ingin menghapus akun user "${username}"?`)) {
      deleteUser(username);
      reload();
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetModalUser && newPassword.trim()) {
      await resetUserPassword(resetModalUser, newPassword.trim());
      setSuccessMsg(`Password untuk ${resetModalUser} berhasil diubah!`);
      setResetModalUser(null);
      setNewPassword('');
      setTimeout(() => setSuccessMsg(''), 3000);
      reload();
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('Hapus catatan data ini?')) {
      deleteDailyDataRecord(id);
      reload();
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dailyRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `yadoru_records_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-500" />
            ⚙️ Administrator Panel
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Kelola akun pengguna, kontrol data corporate, dan branding aplikasi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export Backup JSON
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-2 shadow-sm">
          <Check className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-slate-600" />
            👥 User Management ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'records'
                ? 'bg-white text-slate-900 shadow border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-blue-600" />
            🗃️ Data Management ({dailyRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'branding'
                ? 'bg-white text-slate-900 shadow border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-600" />
            🎨 Branding App
          </button>
        </div>

        <div className="p-6">
          {/* USER MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Pengguna Terdaftar
                </h2>
                <span className="text-xs text-slate-400">Admin dapat mengubah role, mereset password & menghapus akun.</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Username</th>
                      <th className="px-6 py-3.5">Role Saat Ini</th>
                      <th className="px-6 py-3.5">Twitter / X</th>
                      <th className="px-6 py-3.5 text-center">Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((u) => (
                      <tr key={u.username} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          {u.username}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {u.role === 'admin' && <Shield className="w-3 h-3 text-amber-600" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{u.twitter || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              title="Ubah Role (Admin / User)"
                              onClick={() => handleToggleRole(u.username)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              Toggle Role
                            </button>

                            <button
                              title="Reset Password"
                              onClick={() => setResetModalUser(u.username)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-medium border border-amber-200 flex items-center gap-1"
                            >
                              <Key className="w-3.5 h-3.5 text-amber-600" />
                              Reset PW
                            </button>

                            {u.username.toLowerCase() !== 'yadoru' && (
                              <button
                                title="Hapus User"
                                onClick={() => handleDeleteUser(u.username)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium border border-red-200 flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RECORDS DATA MANAGEMENT TAB */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Kelola Seluruh Input Data Harian
                </h2>
                <span className="text-xs text-slate-400">Admin dapat menghapus data yang tidak valid.</span>
              </div>

              {dailyRecords.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">Tidak ada catatan data.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3.5">Tanggal</th>
                        <th className="px-6 py-3.5">User</th>
                        <th className="px-6 py-3.5 text-right">Nilai Angka</th>
                        <th className="px-6 py-3.5 text-center">Hapus Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dailyRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{rec.date}</td>
                          <td className="px-6 py-4 font-medium text-slate-700">{rec.username}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            {Number(rec.value).toLocaleString('id-ID', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold border border-red-200 inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* BRANDING TAB */}
          {activeTab === 'branding' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h2 className="text-base font-bold text-slate-800">Ganti Logo Aplikasi</h2>
                <p className="text-slate-500 text-xs mt-1">Logo yang diunggah akan muncul pada sidebar dan halaman login.</p>
              </div>

              <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-center">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Logo Saat Ini</p>
                  <img
                    src={currentLogoUrl}
                    alt="Current Logo"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md mx-auto"
                  />
                </div>

                {logoPreview && (
                  <div className="text-center border-l border-slate-200 pl-6">
                    <p className="text-[11px] font-bold text-emerald-600 uppercase mb-2">Pratinjau Logo Baru</p>
                    <img
                      src={logoPreview}
                      alt="New Logo Preview"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-md mx-auto"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Upload Logo Baru (PNG)
                </label>
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleLogoSelect}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              {logoPreview && (
                <button
                  type="button"
                  onClick={handleUpdateLogo}
                  className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Update Logo Aplikasi
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Reset Password: {resetModalUser}
            </h3>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ketik password baru..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

