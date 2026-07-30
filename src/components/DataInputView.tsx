import React, { useState } from 'react';
import { addDailyData } from '../utils/db';
import { Calendar, DollarSign, Image as ImageIcon, CheckCircle2, Inbox } from 'lucide-react';

interface DataInputViewProps {
  username: string;
  onDataAdded: () => void;
}

export const DataInputView: React.FC<DataInputViewProps> = ({ username, onDataAdded }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [value, setValue] = useState<string>('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setEvidencePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseFloat(value) || 0;

    addDailyData(username, date, numericValue, evidencePreview);
    
    // Show success banner
    setSuccessMessage(true);
    setValue('');
    setEvidenceFile(null);
    setEvidencePreview(null);

    setTimeout(() => {
      setSuccessMessage(false);
    }, 4000);

    onDataAdded();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-emerald-600" />
            📥 Input Data Harian
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Masukkan catatan angka harian beserta bukti pendukung.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tanggal */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              Tanggal
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Total Angka */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Total Angka
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0.0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Lampirkan Bukti */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              📸 Lampirkan Bukti (opsional)
            </label>
            <input
              type="file"
              accept="image/jpg, image/png, image/jpeg"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            {evidencePreview && (
              <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl max-w-xs">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Pratinjau Bukti:</p>
                <img src={evidencePreview} alt="Evidence preview" className="rounded-lg max-h-40 object-cover w-full" />
              </div>
            )}
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs font-semibold">
                Data Tersimpan Otomatis ke Database! 🎉
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg transition-all transform active:scale-98 flex items-center justify-center gap-2"
          >
            Simpan Data
          </button>
        </form>
      </div>
    </div>
  );
};
