# Yadoru Pro - Corporate Data Portal & Dashboard

Aplikasi berbasis web manajemen data harian corporate Yadoru dengan dukungan real-time cloud sync (Firebase Firestore), tracking **Gift Sendback** (pengembalian), kontrol hak akses admin, laporan agregasi interaktif, dan tampilan responsif yang dioptimalkan untuk perangkat mobile/gadget maupun desktop.

---

## 🚀 Fitur Utama

- **📥 Data Input Harian**: Input tanggal, nama pengguna, nominal angka harian, dan upload foto bukti lampiran.
- **🎁 Gift Sendback Tracking**:
  - Pelacakan otomatis sisa pengembalian (Total Input dikurangi Total Sendback yang disetorkan).
  - Admin dapat mencatat pengembalian nominal (pelunasan sisa / parsial) beserta bukti transfer & catatan.
  - Filter interaktif (Semua, Belum Dikembalikan, Lunas) serta modal riwayat transaksi per user.
- **📊 Dashboard & Grafik Aggregatif**: Rekapitulasi total harian dengan mode tabel presisi touch-friendly & kartu responsif, serta grafik tren mingguan tim.
- **☁️ Online Database & Real-time Sync**: Tersambung langsung ke Cloud Firestore (Firebase) dengan sinkronisasi instan multi-tab & multi-device.
- **⚙️ Panel Admin Khusus (Secret Admin)**:
  - Manajemen role user (Toggle Admin / User)
  - Reset password akun pengguna
  - Hapus catatan data tidak valid
  - Backup & Export Data ke format JSON
  - Custom Branding (Ubah Logo Perusahaan)
- **📱 Responsif & Precision UI**: Layout sidebar collapsible (dapat disembunyikan), dioptimalkan untuk penggunaan nyaman di gadget/smartphone.

---

## 🛠️ Cara Ekspor ke GitHub & Deploy Online

### 1. Ekspor Repository ke GitHub Langsung dari AI Studio
1. Klik menu **Settings** (ikon gerigi) di pojok atas AI Studio UI.
2. Pilih **Export to GitHub** (atau **Download ZIP**).
3. Hubungkan akun GitHub Anda, pilih nama repositori, lalu klik **Export**.

### 2. Menjalankan di Komputer Lokal (Local Development)
```bash
# 1. Clone repository
git clone https://github.com/USERNAME/yadoru-pro.git
cd yadoru-pro

# 2. Install dependensi
npm install

# 3. Jalankan server lokal
npm run dev
```
Aplikasi akan dapat diakses di `http://localhost:3000` (atau port yang ditentukan Vite).

### 3. Deploy Gratis ke Vercel / Netlify / Cloud Run
- **Vercel**: Hubungkan repository GitHub Anda di dashboard Vercel, pilih preset **Vite**, lalu klik **Deploy**.
- **Netlify**: Import project dari GitHub, atur Build Command: `npm run build`, Publish directory: `dist`.
- **Cloud Run / AI Studio**: Klik tombol **Share** atau **Deploy** di bagian atas AI Studio.

---

## 🔐 Kredensial Administrator Default

- **Username**: `yadoru`
- **Password**: `yadoru123`

*(Catatan: Form login dibuat bersih tanpa menampilkan kredensial admin secara terbuka demi keamanan)*.

---

## 📁 Struktur Project

```text
├── src/
│   ├── components/
│   │   ├── AdminSettingsView.tsx  # Panel admin (user & data management)
│   │   ├── AuthScreen.tsx         # Layar Login & Register
│   │   ├── DashboardView.tsx      # Tabel agregasi & grafik tren
│   │   ├── DataInputView.tsx      # Form penginputan data harian
│   │   ├── GiftSendbackView.tsx   # Menu pelacakan gift sendback & pengembalian
│   │   ├── ProfileView.tsx        # Manajemen profil pengguna
│   │   └── Sidebar.tsx            # Navigasi collapsible (hideable menu)
│   ├── utils/
│   │   ├── crypto.ts              # Hashing sha256
│   │   ├── firebase.ts            # Firebase Cloud Firestore setup
│   │   └── db.ts                  # Engine Firestore + local cache real-time event bus
│   ├── App.tsx                    # Root container & real-time subscriber
│   ├── main.tsx                   # Entry point React
│   └── types.ts                   # Type definitions TypeScript
├── firebase-applet-config.json
├── firestore.rules
├── metadata.json
├── package.json
└── vite.config.ts
```
