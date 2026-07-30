import React, { useState } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../utils/db';
import { Camera, Check, Twitter, AlignLeft, User as UserIcon } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
  onProfileUpdated: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, onProfileUpdated }) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentUser.photo || null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [bio, setBio] = useState<string>(currentUser.bio || '');
  const [twitter, setTwitter] = useState<string>(currentUser.twitter || '@');
  
  const [photoSavedMessage, setPhotoSavedMessage] = useState<string>('');
  const [infoSavedMessage, setInfoSavedMessage] = useState<string>('');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = () => {
    if (photoPreview) {
      updateUserProfile(currentUser.username, { photo: photoPreview });
      setPhotoSavedMessage('Foto profil berhasil disimpan!');
      setTimeout(() => setPhotoSavedMessage(''), 3000);
      onProfileUpdated();
    }
  };

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.username, { bio, twitter });
    setInfoSavedMessage('Profil diperbarui!');
    setTimeout(() => setInfoSavedMessage(''), 3000);
    onProfileUpdated();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-purple-600" />
            Profile {currentUser.username}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Kelola informasi diri, foto profil, dan media sosial Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Photo */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt={currentUser.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl ring-2 ring-slate-100"
              />
            ) : (
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="Default avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl ring-2 ring-slate-100"
              />
            )}
          </div>

          <div className="w-full space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-left">
              Ganti Foto Profil
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handlePhotoSelect}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />

            {newPhotoFile && (
              <button
                type="button"
                onClick={handleSavePhoto}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-3.5 h-3.5" />
                Simpan Foto
              </button>
            )}

            {photoSavedMessage && (
              <p className="text-xs text-emerald-600 font-semibold bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200">
                {photoSavedMessage}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Bio & Twitter */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <form onSubmit={handleUpdateInfo} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-slate-400" />
                Biografi Singkat
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan tentang diri Anda..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Twitter className="w-4 h-4 text-blue-500" />
                Username Twitter/X
              </label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username"
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder-slate-400"
              />
            </div>

            {infoSavedMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {infoSavedMessage}
              </div>
            )}

            <button
              type="submit"
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              Update Profile Info
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
