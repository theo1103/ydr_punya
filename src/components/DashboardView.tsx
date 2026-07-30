import React, { useMemo } from 'react';
import { getDailyData } from '../utils/db';
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
import { BarChart2, DollarSign, Calendar, User, FileImage } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const rawRecords = getDailyData();

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

  // Overall Total
  const totalOverall = useMemo(() => {
    return aggregatedData.reduce((acc, curr) => acc + curr.total, 0);
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600" />
            📊 Laporan Kumulatif
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Pantau tren dan agregasi total harian tim Yadoru.</p>
        </div>
      </div>

      {/* Metric Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            TOTAL KESELURUHAN
          </p>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            {totalOverall.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Aggregated Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          Tabel Agregasi Harian
        </h2>

        {aggregatedData.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Belum ada data harian yang diinput.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">Nama User</th>
                  <th className="px-6 py-3.5 text-right">Total</th>
                  <th className="px-6 py-3.5 text-center">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {aggregatedData.map((row, idx) => (
                  <tr key={`${row.date}-${row.username}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.date}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {row.username}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {row.total.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.evidenceList.length > 0 ? (
                        <div className="flex justify-center gap-1">
                          {row.evidenceList.map((img, i) => (
                            <a
                              key={i}
                              href={img}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200"
                            >
                              <FileImage className="w-3.5 h-3.5 text-blue-500" />
                              Lihat
                            </a>
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
        )}
      </div>

      {/* Recharts Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-500" />
          Tren Mingguan (Line Estetik)
        </h2>

        {chartData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Grafik akan muncul setelah data diinput.</div>
        ) : (
          <div className="w-full h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  formatter={(value: any) => [
                    Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2 }),
                    'Total',
                  ]}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {usersList.map((user, index) => (
                  <Line
                    key={user}
                    type="monotone"
                    dataKey={user}
                    name={user}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 5, fill: COLORS[index % COLORS.length] }}
                    activeDot={{ r: 7 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
