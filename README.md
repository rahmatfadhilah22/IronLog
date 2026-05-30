# IronLog

`IronLog` adalah aplikasi gym tracker **local-first** berbasis `Expo` dan `React Native` untuk mencatat latihan, mengelola routine, memantau progres, dan menyimpan data sepenuhnya di perangkat.

Aplikasi ini tidak memakai backend. Data utama disimpan di `SQLite` lokal, keamanan akses app memakai `PIN` + recovery question, dan backup dilakukan lewat ekspor/impor file.

## Ringkasan Produk

`IronLog` dirancang untuk kebutuhan berikut:

- mencatat set latihan dengan cepat saat sesi berlangsung
- menyusun routine latihan yang bisa dipakai berulang
- melihat progres latihan langsung dari data lokal
- menjaga akses aplikasi dengan PIN tanpa bergantung ke akun online
- melakukan backup manual saat ingin pindah device atau berjaga jika app terhapus

Trade-off utama yang sengaja dipilih:

- tidak ada backend
- tidak ada sinkronisasi cloud otomatis
- tidak ada multi-user account
- data lokal bisa hilang jika app dihapus tanpa backup

## Fitur yang Sudah Ada

### 1. Keamanan aplikasi
- setup PIN 6 digit saat pertama kali app digunakan
- recovery question + recovery answer saat setup PIN
- login layar kunci menggunakan PIN
- flow lupa PIN dengan verifikasi recovery answer
- ubah PIN dari menu settings
- ubah recovery question dari menu settings

### 2. Home dashboard
- ringkasan cepat aplikasi saat dibuka
- shortcut untuk lanjutkan workout aktif
- preview workout terakhir yang selesai
- daftar routine terbaru
- CTA dinamis untuk buat routine pertama, lihat routine, atau lanjut workout

### 3. Manajemen routine
- membuat routine baru
- mengedit nama, deskripsi, urutan exercise, dan rest time
- melihat detail routine
- mengarsipkan routine tanpa menghapus histori workout
- memakai exercise bawaan dan custom exercise

### 4. Logging workout aktif
- memulai workout dari routine
- menyimpan snapshot routine ke workout supaya histori tidak berubah saat template diedit
- menambah set per exercise
- mengubah dan menghapus set
- menambah blok exercise ke workout aktif
- menyimpan catatan exercise dalam workout
- menyelesaikan workout dan melihat summary

### 5. Rest timer
- timer istirahat per exercise
- notifikasi lokal saat timer selesai
- opsi auto-start rest timer dari settings
- haptic feedback untuk interaksi tertentu

### 6. Progress dan analytics
- overview jumlah exercise terlacak
- overview completed workouts
- overview completed sets
- kalender workout bulanan
- best lifts
- daftar progres per exercise
- detail insight per exercise
- perhitungan mengikuti preferred unit dan formula 1RM aktif
- cache analytics dibangun ulang setelah workout selesai atau settings tertentu berubah

### 7. Body metrics
- input berat badan
- input body fat percentage opsional
- histori body metrics per tanggal
- tampilan mengikuti preferred unit aktif

### 8. Settings dan backup
- preferred unit: `kg` / `lb`
- formula estimasi 1RM: `brzycki` / `epley`
- toggle haptics
- toggle auto-start rest timer
- export full backup ke `JSON`
- export analytics ke `CSV`
- import backup `JSON`
- destructive restore confirmation saat restore backup

## Stack Teknis

### Runtime aplikasi
- `Expo 55`
- `React Native 0.83`
- `React 19`
- `expo-router` untuk file-based routing

### Persistence dan data lokal
- `expo-sqlite` untuk database lokal
- migration runner internal di `src/db/migrations/`
- seed exercise awal dari `db/seed-exercises.json`

### Fitur device
- `expo-secure-store` untuk menyimpan PIN record
- `expo-notifications` untuk rest timer notification
- `expo-haptics` untuk feedback getar
- `expo-document-picker` untuk pilih file backup
- `expo-file-system` untuk baca/tulis file backup
- `expo-sharing` untuk share file hasil export

### Utility dan state
- `zustand` untuk state ringan tertentu
- `uuid` untuk ID entity
- `TypeScript` untuk typing dan maintainability

## Arsitektur Singkat

Struktur aplikasi dibuat cukup tipis: route/screen memanggil service layer, service layer memanggil repository SQLite, lalu data disimpan di device.

```text
app/ routes and screens
  -> src/services/*
    -> src/db/repositories/*
      -> src/db/sqlite/*
        -> ironlog.db
```

Poin implementasi penting:

- database dibuka melalui singleton `getDatabase()`
- saat bootstrap: open DB, enable foreign keys, coba aktifkan WAL, jalankan migrations, ensure `app_settings`, lalu seed exercises jika masih kosong
- analytics dihitung lokal dari SQLite, tanpa backend
- restore backup mengganti data tabel lokal di dalam transaction
- akses app dikunci oleh PIN yang disimpan di `SecureStore`

## Struktur Project

### Route layer
- `app/_layout.tsx`: bootstrap database, init notification, auth gate, root stack
- `app/auth/*`: flow setup PIN, login, recovery, change PIN, change recovery
- `app/(tabs)/index.tsx`: home screen
- `app/(tabs)/routines.tsx`: daftar routine
- `app/(tabs)/progress.tsx`: analytics overview
- `app/(tabs)/settings.tsx`: preferences, security, backup, restore
- `app/routines/*`: create dan detail routine
- `app/workout/*`: active workout dan summary
- `app/exercise/[exerciseId].tsx`: insight per exercise
- `app/body-metrics.tsx`: histori metrik tubuh
- `app/modal/*`: exercise picker dan rest timer modal

### Core source
- `src/services/`: business flow per domain
- `src/db/repositories/`: query SQLite dan mapping data
- `src/db/sqlite/`: bootstrap dan koneksi database
- `src/db/migrations/`: migration runner dan versi schema
- `src/types/`: kontrak TypeScript per domain
- `src/components/`: shared UI blocks
- `src/core/theme/`: design tokens dan tema UI

## Database Model

Entity utama yang saat ini dipakai:

- `app_settings`
- `exercises`
- `routines`
- `routine_exercises`
- `workouts`
- `workout_exercises`
- `workout_sets`
- `body_metrics`
- `exercise_stats`

Rule data penting:

- `app_settings` adalah singleton row dengan `id = 1`
- `workout_exercises` menyimpan snapshot exercise saat workout dimulai
- `exercise_stats` adalah cache analytics, bukan source of truth utama
- custom exercise didukung di library exercise

## Alur Penggunaan Singkat

1. User membuka app.
2. App bootstrap database lokal dan mengecek status PIN.
3. Jika belum ada PIN, user wajib setup PIN dan recovery question.
4. Jika sudah ada PIN, user login lewat lock screen.
5. User membuat routine atau memilih routine yang sudah ada.
6. User memulai workout dan mencatat set.
7. Setelah selesai, user melihat summary dan tab progress.
8. User bisa melakukan export backup kapan saja dari settings.

## Menjalankan Project

### Requirement
- `Node.js 20+`
- `npm 10+`
- Android Studio / Xcode jika ingin menjalankan native build lokal
- Expo environment yang sesuai untuk development mobile

### Install dependency
```bash
npm install
```

### Jalankan development server
```bash
npm run start
```

Perintah shortcut lain:

```bash
npm run android
npm run ios
npm run web
```

Catatan:
- `npm run android` dan `npm run ios` memakai `expo run:*`, jadi akan melakukan prebuild native bila dibutuhkan.
- Untuk iOS, build lokal hanya tersedia di macOS.

### Verifikasi type safety
```bash
npm run typecheck
```

## Build dan Distribusi

Repo ini sudah memiliki konfigurasi `EAS Build` di `eas.json`.

Profile yang tersedia:

- `development`: development client, distribusi internal
- `preview`: build internal Android `APK`
- `production`: build production, default output Android adalah `AAB`, dengan auto increment version

### Build Android lokal

Untuk build lokal via native Android project:

```bash
npm run android
```

Perintah di atas akan memastikan project native tersedia lewat `expo run:android`. Setelah native project siap, build artifact bisa dibuat dari folder `android/`.

Masuk ke folder Android lalu build sesuai target:

```bash
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

Hasil artifact umumnya berada di:

- `APK`: `android/app/build/outputs/apk/release/app-release.apk`
- `AAB`: `android/app/build/outputs/bundle/release/app-release.aab`

Catatan:
- build lokal butuh Android SDK/Java/Gradle environment yang siap
- signing release build perlu konfigurasi keystore jika ingin dipakai distribusi resmi

### Build Android via EAS

Contoh perintah:

```bash
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

Output yang diharapkan:

- `preview` menghasilkan `APK` untuk distribusi internal / testing cepat
- `production` menghasilkan `AAB` untuk distribusi production

### Build iOS via EAS

```bash
npx eas build --platform ios --profile production
```

Sebelum build dengan EAS, pastikan:
- sudah login ke Expo / EAS
- credential project sudah benar
- package Android di `app.json` sesuai target distribusi
- bila butuh build lokal release, signing Android sudah dikonfigurasi

## Konfigurasi Runtime Penting

- app memakai `userInterfaceStyle: "dark"`
- Android meminta permission `SCHEDULE_EXACT_ALARM` untuk rest timer
- `expo-secure-store` dipakai untuk PIN auth
- backup file ditulis ke storage lokal app lalu dibagikan lewat native share sheet
- pengalaman utama dirancang untuk mobile; web tersedia untuk dev/testing terbatas

## Keterbatasan Saat Ini

- belum ada backend
- belum ada cloud sync
- belum ada akun online / profile user
- belum ada automated test suite penuh
- verifikasi utama saat ini masih mengandalkan `npm run typecheck` dan QA manual
- jika app dihapus tanpa backup, data lokal ikut hilang

## Area Masuk Terbaik untuk Pengembangan

- ubah alur produk: mulai dari `app/` lalu `src/services/`
- ubah schema/data: cek `db/schema.sql`, lalu `src/db/migrations/`
- ubah analytics: mulai dari `src/services/analytics/`
- ubah backup/restore: mulai dari `src/services/backup/backup-service.ts`
- ubah flow auth/PIN: mulai dari `app/auth/` dan `src/services/auth/pin-auth-service.ts`

## File Penting

- `README.md`
- `app/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/settings.tsx`
- `src/db/sqlite/database.ts`
- `src/services/workouts/workout-service.ts`
- `src/services/analytics/analytics-service.ts`
- `src/services/backup/backup-service.ts`
- `src/services/auth/pin-auth-service.ts`
