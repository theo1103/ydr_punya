import React, { useState, useEffect, useMemo } from 'react';
import { User, DailyDataRecord, GiftSendbackRecord } from '../types';
import {
  getUsers,
  getDailyData,
  getGiftSendbacks,
  addGiftSendback,
  deleteGiftSendback,
  subscribeDatabaseChanges,
} from '../utils/db';
import { compressImageFile } from '../utils/image';
import {
  Gift,
  Search,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileText,
  Trash2,
  X,
  DollarSign,
  AlertCircle,
  History,
  Image as ImageIcon,
  User as UserIcon,
  ShieldAlert,
} from 'lucide-react';

interface GiftSendbackViewProps {
  currentUser: User;
}

export const GiftSendbackView: React.FC<GiftSendbackViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [dailyData, setDailyData] = useState<DailyDataRecord[]>(() => getDailyData());
  const [sendbacks, setSendbacks] = useState<GiftSendbackRecord[]>(() => getGiftSendbacks());

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modal states
  const [selectedUserForRecord, setSelectedUserForRecord] = useState<string | null>(null);
  const [historyUser, setHistoryUser] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form states for recording sendback
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formEvidence, setFormEvidence] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Subscribe to real-time changes across database
  useEffect(() => {
    const unsubscribe = subscribeDatabaseChanges(() => {
      setUsers(getUsers());
      setDailyData(getDailyData());
      setSendbacks(getGiftSendbacks());
    });
    return () => unsubscribe();
  }, []);

  // Compute total input per user
  const userTotalsMap = useMemo(() => {
    const map = new Map<string, number>();
    dailyData.forEach((rec) => {
      const u = rec.username.trim();
      map.set(u, (map.get(u) || 0) + rec.value);
    });
    return map;
  }, [dailyData]);

  // Compute total sendbacks per user
  const userSendbacksMap = useMemo(() => {
    const map = new Map<string, number>();
    sendbacks.forEach((rec) => {
      const u = rec.username.trim();
      map.set(u, (map.get(u) || 0) + rec.amount);
    });
    return map;
  }, [sendbacks]);

  // Aggregate user balances list
  const userBalances = useMemo(() => {
    // Get list of all distinct usernames (from registered users AND daily inputs)
    const allUsernames = new Set<string>();
    users.forEach((u) => allUsernames.add(u.username.trim()));
    dailyData.forEach((d) => allUsernames.add(d.username.trim()));
    sendbacks.forEach((s) => allUsernames.add(s.username.trim()));

    const list = Array.from(allUsernames).map((username) => {
      const totalInput = userTotalsMap.get(username) || 0;
      const totalSendback = userSendbacksMap.get(username) || 0;
      const remaining = Math.max(0, totalInput - totalSendback);
      const isCompleted = totalInput > 0 && remaining <= 0;
      return {
        username,
        totalInput,
        totalSendback,
        remaining,
        isCompleted,
      };
    });

    // Sort by remaining amount descending (users with highest unpaid amounts first)
    return list.sort((a, b) => b.remaining - a.remaining || b.totalInput - a.totalInput);
  }, [users, dailyData, sendbacks, userTotalsMap, userSendbacksMap]);

  // Overall Global Statistics
  const stats = useMemo(() => {
    let totalInputAll = 0;
    let totalSendbackAll = 0;
    let countPending = 0;

    userBalances.forEach((item) => {
      totalInputAll += item.totalInput;
      totalSendbackAll += item.totalSendback;
      if (item.remaining > 0 && item.totalInput > 0) {
        countPending++;
      }
    });

    const totalRemainingAll = Math.max(0, totalInputAll - totalSendbackAll);

    return {
      totalInputAll,
      totalSendbackAll,
      totalRemainingAll,
      countPending,
    };
  }, [userBalances]);

  // Filtered User Balances based on Search and Status
  const filteredBalances = useMemo(() => {
    return userBalances.filter((item) => {
      const matchesSearch = item.username.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'pending') {
        return item.remaining > 0;
      }
      if (statusFilter === 'completed') {
        return item.totalInput > 0 && item.remaining <= 0;
      }
      return true;
    });
  }, [userBalances, searchTerm, statusFilter]);

  // Form Image File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedBase64 = await compressImageFile(file, 800, 0.7);
        setFormEvidence(compressedBase64);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormEvidence(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Submit Sendback Record
  const handleAddSendbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRecord) return;

    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Masukkan nominal sendback yang valid!');
      return;
    }

    setIsSubmitting(true);
    await addGiftSendback(
      selectedUserForRecord,
      amountNum,
      formDate,
      formNotes,
      formEvidence,
      currentUser.username
    );

    setIsSubmitting(false);
    setSuccessToast(`Berhasil mencatat sendback Rp ${amountNum.toLocaleString('id-ID')} untuk ${selectedUserForRecord}`);
    setTimeout(() => setSuccessToast(null), 4000);

    // Reset Form
    setSelectedUserForRecord(null);
    setFormAmount('');
    setFormNotes('');
    setFormEvidence(null);
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan pengembalian ini?')) {
      await deleteGiftSendback(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <Gift className="w-7 h-7 text-pink-500 shrink-0" />
            🎁 Status & Rekapitulasi Gift Sendback
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Pantau rincian pengembalian dari akumulasi nominal input harian pengguna secara real-time.
          </p>
        </div>

        {currentUser.role === 'admin' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-amber-800 text-xs font-semibold flex items-center gap-2 self-start sm:self-center">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mode Admin: Bebas mencatat & mengelola sendback</span>
          </div>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Input Kumulatif */}
        <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-blue-500" />
            TOTAL INPUT USER
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Rp {stats.totalInputAll.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Total Sendback / Dikembalikan */}
        <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            SUDAH DIKEMBALIKAN
          </p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
            Rp {stats.totalSendbackAll.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Total Belum Dikembalikan */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg border border-slate-700 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            BELUM DIKEMBALIKAN
          </p>
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Rp {stats.totalRemainingAll.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
          </p>
        </div>

        {/* Jumlah User Pending */}
        <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            USER BELUM LUNAS
          </p>
          <p className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">
            {stats.countPending} <span className="text-xs font-semibold text-slate-400">Pengguna</span>
          </p>
        </div>
      </div>

      {/* Control Filters & Table Container */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserIcon className="w-4.5 h-4.5 text-pink-500" />
              Daftar Status Pengembalian User
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin dapat mengecek sisa nominal yang belum dikembalikan dan mencatat pembayaran sendback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56 min-w-[160px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-800 shadow-2xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({userBalances.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-amber-600'
                }`}
              >
                Belum Dikembalikan ({stats.countPending})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                Lunas ({userBalances.filter((u) => u.isCompleted).length})
              </button>
            </div>
          </div>
        </div>

        {/* User Balances List */}
        {filteredBalances.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
            {searchTerm ? 'Tidak ditemukan user yang cocok.' : 'Belum ada data input atau pengembalian terdaftar.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-xs sm:text-sm text-left text-slate-700 min-w-[620px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Nama User</th>
                  <th className="px-4 py-3.5 text-right">Total Input Harian</th>
                  <th className="px-4 py-3.5 text-right">Sudah Dikembalikan</th>
                  <th className="px-4 py-3.5 text-right">Sisa Belum Dikembalikan</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredBalances.map((row) => {
                  const hasRemaining = row.remaining > 0;
                  return (
                    <tr
                      key={row.username}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasRemaining ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* User */}
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                            {row.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold">{row.username}</p>
                            {row.username === currentUser.username && (
                              <span className="text-[10px] text-pink-600 font-semibold bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200">
                                Akun Anda
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Input */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">
                        Rp {row.totalInput.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                      </td>

                      {/* Total Sendback */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                        Rp {row.totalSendback.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                      </td>

                      {/* Remaining Balance */}
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-black ${
                          hasRemaining ? 'text-amber-600 text-sm' : 'text-slate-400'
                        }`}
                      >
                        Rp {row.remaining.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5 text-center">
                        {row.totalInput === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            Belum Ada Input
                          </span>
                        ) : hasRemaining ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Belum Dikembalikan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Lunas / Complete
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex justify-center items-center gap-1.5">
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => {
                                setSelectedUserForRecord(row.username);
                                setFormAmount(row.remaining > 0 ? row.remaining.toString() : '');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                              title="Catat Sendback Baru"
                            >
                              <PlusCircle className="w-3.5 h-3.5 text-pink-400" />
                              Catat Sendback
                            </button>
                          )}

                          <button
                            onClick={() => setHistoryUser(row.username)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
                            title="Lihat Riwayat Sendback"
                          >
                            <History className="w-3.5 h-3.5 text-slate-500" />
                            Riwayat
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Form Catat Sendback Baru (Admin Only) */}
      {selectedUserForRecord && currentUser.role === 'admin' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-500" />
                Catat Sendback: <span className="text-pink-600">{selectedUserForRecord}</span>
              </h3>
              <button
                onClick={() => setSelectedUserForRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSendbackSubmit} className="space-y-4">
              {/* Target Info */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Input Harian User:</span>
                  <span className="font-bold text-slate-800">
                    Rp {(userTotalsMap.get(selectedUserForRecord) || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sudah Dikembalikan Sebelumnya:</span>
                  <span className="font-bold text-emerald-600">
                    Rp {(userSendbacksMap.get(selectedUserForRecord) || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span className="text-amber-700">Sisa Belum Dikembalikan:</span>
                  <span className="text-amber-700">
                    Rp {Math.max(0, (userTotalsMap.get(selectedUserForRecord) || 0) - (userSendbacksMap.get(selectedUserForRecord) || 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tanggal Pengembalian
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              {/* Nominal Sendback */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nominal Sendback (Rp)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Contoh: 500000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                {/* Quick preset buttons */}
                {userTotalsMap.get(selectedUserForRecord) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const rem = Math.max(0, (userTotalsMap.get(selectedUserForRecord) || 0) - (userSendbacksMap.get(selectedUserForRecord) || 0));
                        setFormAmount(rem.toString());
                      }}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px] font-bold border border-amber-300 transition-colors"
                    >
                      Pelunasan Sisa
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAmount('100000')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200"
                    >
                      Rp 100rb
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAmount('500000')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200"
                    >
                      Rp 500rb
                    </button>
                  </div>
                )}
              </div>

              {/* Catatan / Referensi */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Catatan / Ref Transfer (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Transfer BCA / Gift voucher / Tunai"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              {/* Upload Foto Bukti */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Bukti Transfer / Struk (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                />
                {formEvidence && (
                  <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    <img src={formEvidence} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormEvidence(null)}
                      className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForRecord(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Sendback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Riwayat Sendback User */}
      {historyUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                Riwayat Sendback: <span className="text-pink-600">{historyUser}</span>
              </h3>
              <button
                onClick={() => setHistoryUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Summary Bar */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex justify-between text-xs font-semibold text-slate-700">
              <span>Total Diterima:</span>
              <span className="font-bold text-emerald-600">
                Rp {(userSendbacksMap.get(historyUser) || 0).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Transactions List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {sendbacks.filter((s) => s.username.toLowerCase() === historyUser.toLowerCase()).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada riwayat pengembalian tercatat untuk user ini.
                </div>
              ) : (
                sendbacks
                  .filter((s) => s.username.toLowerCase() === historyUser.toLowerCase())
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 bg-slate-50/80 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{rec.date}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                            + Rp {rec.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        {rec.notes && <p className="text-slate-500 italic text-[11px]">{rec.notes}</p>}
                        <span className="text-[10px] text-slate-400 block">
                          Dicatat oleh: {rec.recordedBy || 'Admin'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {rec.evidenceUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(rec.evidenceUrl!)}
                            className="p-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                            title="Lihat Bukti"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            title="Hapus Catatan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setHistoryUser(null)}
                className="py-2.5 px-5 bg-slate-900 text-white font-semibold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-4 max-w-lg w-full shadow-2xl relative space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Bukti Pengembalian / Sendback</h3>
              <button onClick={() => setPreviewImage(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 max-h-[65vh] flex items-center justify-center">
              <img src={previewImage} alt="Bukti" className="object-contain max-h-[60vh] w-auto mx-auto" />
            </div>
            <div className="text-right">
              <button
                onClick={() => setPreviewImage(null)}
                className="py-2 px-4 bg-slate-900 text-white font-semibold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
