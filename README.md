# IronLog

`IronLog` adalah aplikasi gym tracker **local-first** berbasis Expo + React Native. Repo ini fokus ke pencatatan workout cepat di device sendiri, tanpa backend, tanpa login, tanpa cloud sync otomatis.

Seluruh data utama disimpan di SQLite lokal. Export/import file dipakai untuk backup manual dan pindah data antar device.

## Kenapa repo ini ada

Project ini dibangun untuk lifter yang butuh 3 hal inti:

- logging set cepat saat latihan
- routine template yang bisa dipakai berulang
- progress analytics yang tetap jelas tanpa infrastruktur server

Trade-off yang sengaja dipilih:

- tidak ada auth
- tidak ada API
- tidak ada sinkronisasi multi-device
- data hilang kalau app dihapus tanpa backup

## Tech Stack

### Runtime dan app shell
- `Expo 55`
- `React Native 0.83`
- `React 19`
- `expo-router` untuk file-based routing

### Data dan persistence
- `expo-sqlite` untuk database lokal `ironlog.db`
- SQL migration runner internal di `src/db/migrations/`
- seed exercise library dari `db/seed-exercises.json`

### Device capability
- `expo-notifications` untuk rest timer notification
- `expo-haptics` untuk feedback haptic
- `expo-document-picker` untuk pilih file backup
- `expo-file-system` untuk baca/tulis backup
- `expo-sharing` untuk share hasil export

### State dan utilitas
- `zustand` dipakai untuk state picker tertentu
- `uuid` untuk ID entity berbasis string
- `TypeScript` untuk typing penuh

## Fitur Utama

### 1. Routine management
- buat routine baru
- edit nama, deskripsi, urutan exercise, dan rest time
- archive routine tanpa menghapus history workout
- tambah custom exercise selain seeded library bawaan

### 2. Active workout logging
- mulai workout dari routine
- snapshot routine ke tabel workout agar histori tidak ikut berubah saat template di-edit
- tambah set per exercise
- edit atau hapus set
- tambah blok exercise baru ke workout aktif
- lanjutkan workout aktif dari home screen

### 3. Rest timer
- timer istirahat per exercise
- local notification saat waktu istirahat selesai
- opsi auto-start rest timer di settings
- opsi haptics saat interaksi / completion

### 4. Progress analytics
- overview jumlah exercise terlacak, completed workout, completed sets
- top lifts
- daftar progress per exercise
- detail insight per exercise berbasis preferred unit dan formula 1RM aktif
- rebuild cache `exercise_stats` setelah workout selesai, perubahan settings tertentu, atau restore backup

### 5. Body metrics
- input berat badan
- input body fat percentage opsional
- histori body metrics berdasarkan tanggal
- tampilan menyesuaikan preferred unit user

### 6. Settings dan backup
- preferred unit: `kg` / `lb`
- formula estimasi 1RM: `brzycki` / `epley`
- toggle haptics
- toggle auto-start rest timer
- export full backup ke `JSON`
- export analytics ke `CSV`
- import backup `JSON` dengan destructive restore confirmation

## User Flow Ringkas

1. User buka app.
2. App bootstrap SQLite lokal dan seed data awal jika perlu.
3. User buat routine atau pilih routine yang sudah ada.
4. User mulai workout lalu input set per exercise.
5. User selesai workout dan lihat summary.
6. User buka tab progress untuk lihat trend dan best lift.
7. User bisa export backup kapan saja dari settings.

## Arsitektur Singkat

Arsitektur app ini sengaja tipis: route/screen memanggil service layer, service layer memanggil repository SQLite, lalu data disimpan di device.

```text
app/ routes and screens
  -> src/services/*
    -> src/db/repositories/*
      -> src/db/sqlite/*
        -> ironlog.db
```

Poin penting implementasi:

- database dibuka sekali lewat `getDatabase()` singleton
- saat bootstrap: open DB, enable foreign keys, enable WAL, run migrations, ensure `app_settings`, seed exercise library
- analytics bukan backend process; dihitung lokal dari SQLite
- backup restore mengganti isi tabel lokal dalam transaction

## Struktur Project

### Route layer
- `app/_layout.tsx`: bootstrap database, init notification handler, root stack
- `app/(tabs)/index.tsx`: home screen
- `app/(tabs)/routines.tsx`: daftar routine
- `app/(tabs)/progress.tsx`: overview analytics
- `app/(tabs)/settings.tsx`: preferences, backup, restore
- `app/routines/*`: create dan detail routine
- `app/workout/*`: active workout dan summary
- `app/exercise/[exerciseId].tsx`: insight per exercise
- `app/body-metrics.tsx`: histori body metrics
- `app/modal/*`: exercise picker dan rest timer modal

### Core source
- `src/services/`: business flow per domain
- `src/db/repositories/`: query SQLite dan mapping row
- `src/db/sqlite/`: bootstrap dan koneksi database
- `src/db/migrations/`: migration runner dan versi schema
- `src/types/`: contract TypeScript per domain
- `src/components/`: shared UI blocks
- `src/core/theme/`: design tokens dark industrial theme

### Reference dan docs
- `prd.md`: product requirement utama
- `mvp-scope.md`: batasan MVP
- `screen-spec.md`: rincian screen behavior
- `db/schema.sql`: snapshot schema SQLite
- `db/README.md`: aturan bootstrap database
- `docs/manual-qa-script.md`: panduan QA manual

## Database Model

Entity utama di schema sekarang:

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

- `app_settings` selalu singleton dengan `id = 1`
- `workout_exercises` menyimpan snapshot exercise saat workout dimulai
- `workout_sets.set_number` dibatasi `1..20`
- `exercise_stats` adalah cache analytics, bukan source of truth utama
- migration `003_custom_exercises` menambah dukungan `is_custom` di library exercise

## Screen Map

Tab utama di aplikasi:

- `Home`: resume workout aktif, lihat routine terbaru, buka summary workout terakhir
- `Routines`: list routine dan create routine baru
- `Progress`: analytics overview, top lifts, jump ke detail exercise, shortcut ke body metrics
- `Settings`: preference, export/import, destructive restore confirmation

Flow tambahan:

- `Routine Detail`: start workout, edit routine, archive routine
- `Active Workout`: log set, tambah exercise block, rest timer interaction
- `Workout Summary`: ringkasan hasil session
- `Exercise Insights`: detail progres exercise tertentu
- `Body Metrics`: input dan histori metrik tubuh

## Menjalankan Project

### Requirement
- Node.js 20+
- npm 10+

### Install
```bash
npm install
```

### Jalankan development server
```bash
npm run start
```

Shortcut lain:

```bash
npm run android
npm run ios
npm run web
```

### Verifikasi type safety
```bash
npm run typecheck
```

## Catatan Runtime Penting

- App diset ke `userInterfaceStyle: "dark"` di `app.json`
- Android meminta permission `SCHEDULE_EXACT_ALARM` untuk rest timer
- `expo-notifications` tidak dipakai penuh di Expo Go; service sudah guard runtime tertentu
- backup file ditulis ke folder lokal app lalu dishare via native share sheet
- web route tersedia dari Expo, tapi inti pengalaman tetap didesain untuk mobile workout flow

## Batasan MVP Saat Ini

- belum ada backend atau sync
- belum ada akun / user profile
- belum ada media/video exercise
- belum ada social feature
- belum ada automated test suite; verifikasi utama saat ini `npm run typecheck` dan QA manual

## Kalau Mau Fork Repo Ini

Urutan baca paling cepat:

1. `README.md`
2. `prd.md`
3. `screen-spec.md`
4. `app/` untuk surface UI
5. `src/services/` untuk business flow
6. `src/db/` untuk persistence dan schema

Tempat masuk terbaik kalau mau modifikasi:

- ubah flow produk: mulai dari `app/` lalu `src/services/`
- ubah schema/data: cek `db/schema.sql`, lalu migration di `src/db/migrations/`
- ubah analytics: mulai dari `src/services/analytics/` dan repository terkait
- ubah backup/restore: mulai dari `src/services/backup/backup-service.ts`

## File Penting

- [README.md](/home/rahmat/dev/ProjectPribadi/ironlog/README.md)
- [app/_layout.tsx](/home/rahmat/dev/ProjectPribadi/ironlog/app/_layout.tsx)
- [app/(tabs)/index.tsx](/home/rahmat/dev/ProjectPribadi/ironlog/app/(tabs)/index.tsx)
- [src/db/sqlite/database.ts](/home/rahmat/dev/ProjectPribadi/ironlog/src/db/sqlite/database.ts)
- [src/services/workouts/workout-service.ts](/home/rahmat/dev/ProjectPribadi/ironlog/src/services/workouts/workout-service.ts)
- [src/services/backup/backup-service.ts](/home/rahmat/dev/ProjectPribadi/ironlog/src/services/backup/backup-service.ts)
- [db/schema.sql](/home/rahmat/dev/ProjectPribadi/ironlog/db/schema.sql)
- [prd.md](/home/rahmat/dev/ProjectPribadi/ironlog/prd.md)

