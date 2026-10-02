# ⚡ Kaycee_AnalystFYP - Real-Time TikTok Predictive Engine

Sistem prediksi dan analisis potensi FYP video TikTok secara real-time, terpisah dari bot Telegram. Terdiri dari 3 komponen utama:
1. **Backend API (FastAPI)**: Mesin analisis berbasis data empiris 400 video kreator top (@kaycee.onw, @dwrena, @reinwi, @hyutaoo).
2. **Web Dashboard**: Antarmuka visual modern (Glassmorphism dark theme) untuk simulasi dan scanner URL.
3. **Browser Extension & Integration Module**: Ekstensi browser dan modul integrasi untuk ekstensi `Kaycee_Upload`.

---

## 📁 Struktur Direktori

```
tiktok_fyp_radar/
├── backend/
│   ├── app.py                 # Server REST API (FastAPI)
│   ├── predictor_model.py     # Formula & bobot algoritma TikTok
│   ├── scraper.py             # Ekstraktor metadata video TikTok real-time
│   ├── requirements.txt       # Dependencies
│   └── start.bat              # Script jalan 1-klik di Windows
├── dashboard/
│   ├── index.html             # Tampilan dashboard web
│   ├── style.css              # Custom styling (Glassmorphism)
│   └── app.js                 # Logika interaktif & simulator
├── extension/
│   ├── manifest.json          # Konfigurasi Chrome/Edge Extension (MV3)
│   ├── popup.html             # UI popup ekstensi
│   ├── popup.css              # Desain popup
│   ├── popup.js               # Logika pemindaian video di tab aktif
│   ├── content.js             # Script injeksi badge di TikTok web
│   └── content.css            # Styling floating badge
└── README.md
```

---

## 🚀 Cara Menjalankan Secara Lokal (1-Click)

1. Masuk ke folder `backend`:
   ```cmd
   cd d:\Kaycee_Checker_Bot\tiktok_fyp_radar\backend
   ```
2. Cukup klik ganda (double-click) file **`start.bat`**  
   *(Atau jalankan via terminal: `uv run --with fastapi,uvicorn,yt-dlp,pydantic uvicorn app:app --reload --port 8000`)*
3. Buka browser ke:
   * **Web Dashboard:** [http://localhost:8000](http://localhost:8000)
   * **Dokumentasi API (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧩 Cara Pasang Ekstensi ke Browser (Chrome / Edge)

1. Buka browser Chrome atau Edge.
2. Masuk ke halaman ekstensi:
   * Di Chrome: ketik `chrome://extensions` di address bar.
   * Di Edge: ketik `edge://extensions` di address bar.
3. Aktifkan toggle **"Developer mode"** di pojok kanan atas.
4. Klik tombol **"Load unpacked"** (Muat yang belum dibongkar).
5. Pilih folder:  
   `d:\Kaycee_Checker_Bot\tiktok_fyp_radar\extension`
6. Selesai! Ikon ⚡ **FYP Radar** akan muncul di toolbar browser Anda.
7. Saat Anda membuka video TikTok, klik ikon ekstensi lalu klik **"Scan Video di Tab Ini"** untuk melihat probabilitas FYP secara instan!

---

## 🌐 Cara Deploy ke Cloud (Production)

Jika Anda ingin deploy backend agar dashboard dan extension bisa diakses dari mana saja (tanpa perlu menyalakan komputer lokal):

### Opsi A: Deploy ke Railway / Render (Gratis & Cepat)
1. Upload folder `tiktok_fyp_radar` ke repository GitHub Anda.
2. Buat akun di [Railway.app](https://railway.app) atau [Render.com](https://render.com).
3. Sambungkan repository GitHub tersebut.
4. Set **Build Command:**
   ```bash
   pip install -r backend/requirements.txt
   ```
5. Set **Start Command:**
   ```bash
   uvicorn backend.app:app --host 0.0.0.0 --port $PORT
   ```
6. Setelah deploy selesai, Anda akan mendapatkan URL publik (misal: `https://fyp-radar.up.railway.app`).
7. Update variabel `API_BASE` di `extension/popup.js` dengan URL tersebut!
