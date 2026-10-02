# Kaycee Analyst FYP

Sistem analisis dan prediksi performa video TikTok berdasarkan kurva distribusi engagement dan data empiris algoritma rekomendasi TikTok.

Proyek ini terdiri dari 3 bagian:
1. **Backend API (FastAPI)**: Layanan analisis metrik engagement (repost, save, like) dan estimasi jam upload berdasarkan algoritma TikTok.
2. **Web Dashboard**: Antarmuka visual untuk simulasi metrik dan pemindaian URL video secara langsung.
3. **Ekstensi Browser**: Ekstensi Chrome/Edge untuk memindai video yang sedang diputar di tab aktif dan mengirimkannya ke backend.

---

## Struktur Direktori

```plaintext
Kaycee_AnalystFYP/
|-- backend/
|   |-- app.py                 # Endpoint REST API (FastAPI)
|   |-- predictor_model.py     # Logika kalkulasi skor FYP & formula kurva
|   |-- scraper.py             # Ekstraksi metadata video TikTok
|   |-- requirements.txt       # Ketergantungan Python
|   `-- start.bat              # Script startup lokal Windows
|-- dashboard/
|   |-- index.html             # Halaman antarmuka web dashboard
|   |-- style.css              # Gaya visual dashboard
|   `-- app.js                 # Logika interaktif & bilingual simulator
|-- extension/
|   |-- manifest.json          # Manifest V3 browser extension
|   |-- popup.html             # Panel popup scanner
|   |-- popup.js               # Komunikasi ke API backend & tab scanner
|   |-- popup.css              # Gaya visual popup
|   |-- content.js             # Detektor video TikTok di halaman aktif
|   `-- kaycee_upload_integration.js # Modul konektor untuk ekstensi Kaycee Upload
`-- README.md
```

---

## Menjalankan Backend Lokal

1. Masuk ke direktori backend:
   ```bash
   cd D:\Kaycee_AnalystFYP\backend
   ```
2. Jalankan server:
   - Klik ganda berkas `start.bat`, atau
   - Jalankan perintah terminal:
     ```bash
     uv run --with fastapi,uvicorn,yt-dlp,pydantic uvicorn app:app --reload --port 8000
     ```
3. Akses melalui browser:
   - Dashboard: `http://localhost:8000`
   - Dokumentasi API (Swagger UI): `http://localhost:8000/docs`

---

## Pemasangan Ekstensi Browser

1. Buka Google Chrome atau Microsoft Edge.
2. Buka halaman ekstensi (`chrome://extensions/` atau `edge://extensions/`).
3. Aktifkan **Developer mode** di pojok kanan atas.
4. Klik **Load unpacked** dan pilih folder `D:\Kaycee_AnalystFYP\extension`.
5. Buka video TikTok di browser, lalu klik ikon ekstensi untuk memindai metrik video.

---

## Deployment Cloud (Railway / Render)

1. Hubungkan repositori ke Railway atau Render.
2. Konfigurasi build & run command:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
3. Setelah URL publik aktif (contoh: `https://kayceeanalystfyp-kaycee-try.up.railway.app`), perbarui variabel `API_BASE` di `extension/popup.js` dan `kaycee_upload_integration.js`.
