# My Space

Personal web app untuk urus tugasan, tabiat, dan solat harian.

Secara lalai semua data disimpan dalam browser (localStorage) — tiada backend,
tiada login. Sync cloud adalah **pilihan** dan dihidupkan dengan menambah config
Firebase (lihat di bawah).

## Ciri-ciri

- **Hari Ini** — satu "fokus sekarang", ringkasan kemajuan, solat & tabiat yang belum siap.
- **Tugasan** — keutamaan, kategori, tarikh akhir, carian, dan pecahan kepada langkah kecil.
  Langkah boleh dijana dengan AI (Gemini atau OpenRouter): setiap langkah datang dengan
  emoji dan anggaran masa, dan jumlahnya dipaparkan pada tugasan.
- **Tabiat** — pemicu (habit stacking), pernyataan identiti, streak, amaran
  "jangan terlepas dua hari", dan heatmap bulanan.
- **Solat** — jejak lima waktu, streak hari lengkap, dan heatmap bulanan.
- **Tetapan** — semua yang teknikal di satu tempat: nama profil, status sync dan
  log masuk, API key AI dan model, serta eksport/import/padam data.

Antara muka sengaja monokrom: hitam, putih, dan kelabu sahaja. Keutamaan dikodkan
dengan bentuk (bulatan penuh / separa / kosong), bukan warna, supaya ia kekal jelas
tanpa bergantung pada penglihatan warna. Satu-satunya warna dalam app ialah emoji
pada langkah yang dijana AI.

## Jalankan secara tempatan

```bash
npm install
npm run dev
```

## Build untuk production

```bash
npm run build
npm run preview
```

---

## Sync cloud dengan Firebase (pilihan)

Tanpa config, app berjalan dalam mod tempatan dan SDK Firebase **tidak** dimasukkan
ke dalam bundle. Dengan config, data disimpan di Firestore supaya tidak hilang bila
cache dikosongkan, dan boleh diakses dari beberapa peranti.

### Model keselamatan

Config web Firebase **bukan rahsia** — Firebase menerbitkannya dalam bundle client
secara reka bentuk. Ia mengenal pasti projek; ia tidak membenarkan apa-apa. Kawalan
akses sebenar ada pada `firestore.rules`, yang mengehadkan setiap dokumen kepada
`uid` pemiliknya.

Sebab itu app log masuk secara **anonim** secara automatik: pengguna tidak nampak
skrin login, tetapi setiap orang tetap terasing daripada data orang lain. Log masuk
Google adalah naik taraf pilihan — ia memautkan akaun anonim sedia ada supaya data
yang sama mengikut anda ke peranti lain.

> Tanpa auth, satu-satunya cara Firestore boleh dibaca dari client adalah dengan
> rules terbuka, yang bermakna sesiapa yang membuka halaman ini boleh membaca dan
> menulis semua data anda. Itu sebabnya auth tidak dijadikan pilihan.

### Langkah setup

1. Cipta projek di [console.firebase.google.com](https://console.firebase.google.com).
2. **Project settings → Your apps → Web** — daftar app, salin nilai config.
3. **Build → Firestore Database → Create database** (production mode).
4. **Build → Authentication → Sign-in method** — hidupkan **Anonymous** dan **Google**.
5. Salin `.env.example` kepada `.env.local`, isi nilai dari langkah 2.
6. Deploy rules:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project <project-id>
   ```

7. Untuk deploy GitHub Pages, tambah nilai yang sama sebagai **repository
   variables** (Settings → Secrets and variables → Actions → Variables):
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
   `VITE_FIREBASE_APP_ID`.
8. **Authentication → Settings → Authorized domains** — tambah
   `enquirykhai-blip.github.io` supaya log masuk Google berfungsi di production.

### Bekerja tanpa projek sebenar

Emulator Firebase memberi Firestore + Auth tempatan, jadi sync boleh dibangunkan
dan diuji tanpa menyentuh projek sebenar:

```bash
npm run emulators     # terminal pertama
npm run dev:cloud     # terminal kedua — guna .env.emulator
```

### Bagaimana sync berkelakuan

- Keadaan disimpan sebagai satu dokumen bagi setiap pengguna: `users/{uid}`.
- Tulisan di-debounce 700ms, jadi satu rentetan suntingan menjadi satu tulisan.
- Perubahan jauh sampai secara langsung melalui `onSnapshot` — tab lain dikemas
  kini tanpa reload.
- localStorage kekal sebagai salinan tempatan, jadi app masih boleh dibuka dan
  dibaca sebelum sambungan cloud selesai.
- Nota: penyelesaian konflik ialah last-write-wins pada keseluruhan dokumen. Untuk
  satu pengguna ini memadai, tetapi suntingan serentak dalam keadaan offline pada
  dua peranti boleh menyebabkan satu set kalah.
