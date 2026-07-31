import React, { useState, useEffect, useMemo } from 'react';
import { getDailyData, subscribeDatabaseChanges } from '../utils/db';
import { DailyDataRecord } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart2,
  DollarSign,
  Calendar,
  User,
  FileImage,
  Search,
  LayoutGrid,
  Table as TableIcon,
  X,
  TrendingUp,
  Layers,
  Users,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [rawRecords, setRawRecords] = useState<DailyDataRecord[]>(() => getDailyData());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Subscribe to real-time database changes
  useEffect(() => {
    const unsubscribe = subscribeDatabaseChanges(() => {
      setRawRecords(getDailyData());
    });
    return () => unsubscribe();
  }, []);

  // Aggregate by date and username
  const aggregatedData = useMemo(() => {
    const map = new Map<string, { date: string; username: string; total: number; evidenceList: string[] }>();

    rawRecords.forEach((rec) => {
      const key = `${rec.date}__${rec.username}`;
      if (!map.has(key)) {
        map.set(key, {
          date: rec.date,
          username: rec.username,
          total: 0,
          evidenceList: [],
        });
      }
      const item = map.get(key)!;
      item.total += Number(rec.value) || 0;
      if (rec.evidence) {
        item.evidenceList.push(rec.evidence);
      }
    });

    const list = Array.from(map.values());
    // Sort by date descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawRecords]);

  // Filtered aggregated data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return aggregatedData;
    const term = searchTerm.toLowerCase();
    return aggregatedData.filter(
      (item) => item.username.toLowerCase().includes(term) || item.date.includes(term)
    );
  }, [aggregatedData, searchTerm]);

  // Summary Metrics
  const totalOverall = useMemo(() => {
    return aggregatedData.reduce((acc, curr) => acc + curr.total, 0);
  }, [aggregatedData]);

  const totalContributors = useMemo(() => {
    const set = new Set(aggregatedData.map((d) => d.username));
    return set.size;
  }, [aggregatedData]);

  // Recharts Pivot Data: group by Date with keys as Usernames
  const { chartData, usersList } = useMemo(() => {
    const datesMap = new Map<string, Record<string, number>>();
    const usersSet = new Set<string>();

    rawRecords.forEach((rec) => {
      usersSet.add(rec.username);
      if (!datesMap.has(rec.date)) {
        datesMap.set(rec.date, {});
      }
      const entry = datesMap.get(rec.date)!;
      entry[rec.username] = (entry[rec.username] || 0) + (Number(rec.value) || 0);
    });

    const sortedDates = Array.from(datesMap.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    const chartRows = sortedDates.map((d) => {
      const row: Record<string, any> = { date: d };
      usersSet.forEach((u) => {
        row[u] = datesMap.get(d)?.[u] ?? 0;
      });
      return row;
    });

    return {
      chartData: chartRows,
      usersList: Array.from(usersSet),
    };
  }, [rawRecords]);

  // Vibrant palette for user lines
  const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600 shrink-0" />
            📊 Laporan Kumulatif Corporate
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Pantau tren dan agregasi total harian tim Yadoru dengan presisi tinggi.
          </p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Keseluruhan */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg border border-slate-700/60 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            TOTAL KESELURUHAN
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalOverall.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Total Catatan Input */}
        <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-500" />
            TOTAL BARIS AGREGASI
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            {aggregatedData.length} <span className="text-xs font-semibold text-slate-400">Catatan</span>
          </p>
        </div>

        {/* Kontributor */}
        <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-500" />
            USER KONTRIBUTOR
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            {totalContributors} <span className="text-xs font-semibold text-slate-400">Pengguna</span>
          </p>
        </div>
      </div>

      {/* Aggregated Data Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-blue-600" />
              Tabel Agregasi Harian
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Format tabel presisi untuk gadget dan desktop</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64 min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari user / tanggal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

            {/* View Switcher for Gadgets */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel Presisi"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Tampilan Kartu Gadget"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
            {searchTerm ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data harian yang diinput.'}
          </div>
        ) : viewMode === 'table' ? (
          /* PRECISE TABLE VIEW WITH TOUCH HORIZONTAL SCROLL */
          <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-xs sm:text-sm text-left text-slate-700 min-w-[540px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 w-1/4">Tanggal</th>
                  <th className="px-4 sm:px-6 py-3.5 w-1/4">Nama User</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right w-1/4">Total Nilai</th>
                  <th className="px-4 sm:px-6 py-3.5 text-center w-1/4">Bukti Lampiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredData.map((row, idx) => (
                  <tr key={`${row.date}-${row.username}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 font-semibold text-xs border border-slate-200">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {row.username}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                      {row.total.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-center whitespace-nowrap">
                      {row.evidenceList.length > 0 ? (
                        <div className="flex justify-center items-center gap-1.5">
                          {row.evidenceList.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedImage(img)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
                            >
                              <FileImage className="w-3.5 h-3.5 text-blue-600" />
                              Bukti #{i + 1}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* GADGET RESPONSIVE CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredData.map((row, idx) => (
              <div
                key={`${row.date}-${row.username}-${idx}`}
                className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {row.date}
                    </span>
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                      <User className="w-4 h-4 text-slate-400" />
                      {row.username}
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                    Rp {row.total.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Bukti Lampiran:</span>
                  {row.evidenceList.length > 0 ? (
                    <div className="flex gap-1.5">
                      {row.evidenceList.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedImage(img)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-300 shadow-2xs flex items-center gap-1"
                        >
                          <FileImage className="w-3.5 h-3.5 text-blue-500" />
                          Lihat
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Tidak Ada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recharts Chart */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
          Tren Akumulasi Tim (Grafik Interaktif)
        </h2>

        {chartData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
            Grafik akan secara otomatis muncul setelah data diinput.
          </div>
        ) : (
          <div className="w-full h-64 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [
                    Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
                    'Total',
                  ]}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                {usersList.map((user, index) => (
                  <Line
                    key={user}
                    type="monotone"
                    dataKey={user}
                    name={user}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS[index % COLORS.length] }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Lightbox / Modal Bukti Gambar */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-4 max-w-lg w-full shadow-2xl relative space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileImage className="w-4 h-4 text-blue-600" />
                Bukti Lampiran Data
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 max-h-[70vh] flex items-center justify-center">
              <img src={selectedImage} alt="Bukti" className="object-contain max-h-[65vh] w-auto mx-auto" />
            </div>
            <div className="text-right">
              <button
                onClick={() => setSelectedImage(null)}
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

