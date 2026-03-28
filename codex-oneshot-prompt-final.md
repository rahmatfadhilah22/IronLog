# Codex Final Prompt — Build IronLog MVP End-to-End

Bangun aplikasi mobile `IronLog` end-to-end di repo ini sebagai **React Native + Expo + TypeScript** app yang **local-only**, **tanpa backend**, **tanpa auth**, dan **tanpa cloud sync**.

Kerjakan langsung implementasinya, bukan hanya analisis. Jika ada ambiguity kecil, ambil keputusan yang paling pragmatis selama tetap konsisten dengan dokumen wajib baca di bawah.

## Dokumen Wajib Baca
- `prd.md`
- `screen-spec.md`
- `mvp-scope.md`
- `build-plan.md`
- `stack-reference.md`
- `design-mapping.md`
- `ui-implementation-rules.md`
- `db/README.md`
- `db/schema.sql`
- `db/migrations/001_init.sql`
- `db/seed-exercises.json`
- `design-reference/stitch-export/forged_industrial/DESIGN.md`

## Outcome yang Diharapkan
Hasil akhir harus berupa codebase Expo yang bisa dijalankan dan sudah mencakup:
- bootstrap Expo TypeScript app
- Expo Router
- SQLite init + migration runner
- seed exercise library
- routine CRUD dasar
- active workout logger
- rest timer
- workout summary
- progress overview
- exercise progress detail
- body metrics
- settings
- export backup JSON
- export CSV
- import backup JSON
- restore active workout saat app dibuka ulang
- README cara run project

## Hard Constraints
- jangan tambahkan backend, API, Supabase, Firebase, atau auth provider
- jangan ganti stack yang sudah dipaku di `stack-reference.md`
- gunakan `expo-sqlite` untuk persistence utama
- gunakan `Zustand` hanya untuk UI/app state lintas-screen
- SQLite adalah source of truth
- gunakan schema dasar di `db/schema.sql`
- migration awal harus konsisten dengan `db/migrations/001_init.sql`
- seed exercise library harus berasal dari `db/seed-exercises.json`
- semua query harus parameterized
- gunakan transaction untuk operasi kritikal
- prioritaskan Android ergonomics untuk logger flow
- gunakan hasil Stitch di `design-reference/stitch-export/` hanya sebagai referensi visual dan hierarchy
- ikuti override dan canonical rule di `design-mapping.md`
- ikuti guardrail translasi UI di `ui-implementation-rules.md`

## Library yang Boleh Dipakai
- Expo managed workflow
- Expo Router
- TypeScript
- expo-sqlite
- Zustand
- expo-file-system
- expo-document-picker
- expo-sharing
- uuid
- victory-native-xl

Untuk dependency Expo/native, gunakan `npx expo install`.

## Arsitektur yang Harus Diikuti
- routing mengikuti Expo Router
- folder structure mengikuti `prd.md`
- pisahkan `db`, `repositories`, `services`, `stores`, `components`, `features`
- `workout_exercises` harus menjadi snapshot dari routine saat workout dimulai
- histori workout tidak boleh berubah ketika routine di-edit
- `exercise_stats` adalah cache agregat lokal, bukan source of truth
- `app_settings` adalah singleton row

## Scope Wajib
### Screen
- Home
- Routine List
- Create/Edit Routine
- Exercise Picker
- Active Workout Logger
- Workout Summary
- Progress Overview
- Exercise Progress Detail
- Body Metrics
- Settings

### Flow
- first launch
- seed exercise library
- create routine
- start workout dari routine
- save set cepat
- copy previous set
- auto rest timer
- finish workout
- rebuild exercise stats
- lihat progress chart
- input body metrics
- export/import backup
- restore active workout

## Quality Bar
- jangan tinggalkan placeholder yang memutus user flow utama
- jangan tinggalkan TODO pada fitur MVP inti
- empty state minimum harus ada
- validasi input dasar harus ada
- logger screen harus cepat dan mudah dipakai satu tangan
- UI boleh sederhana, tapi harus rapi, konsisten, dan usable
- gunakan dark theme sesuai PRD

## Jika Harus Memilih Tradeoff
- pilih implementasi yang lebih cepat shipping
- pilih struktur yang cukup rapi tapi tidak berlebihan
- pilih fitur inti selesai penuh daripada banyak fitur setengah jadi
- jika perlu memotong sesuatu, potong item `nice-to-have` dari `mvp-scope.md`, jangan potong core workout flow

## Urutan Kerja yang Diminta
1. bootstrap project Expo TypeScript
2. pasang Expo Router dan struktur folder utama
3. implement database init, WAL mode, migration runner, dan seed logic
4. implement repositories
5. implement services
6. implement stores untuk state lintas-screen
7. implement screen core workout flow
8. implement analytics dan body metrics
9. implement settings + import/export
10. hardening flow, restore active workout, README

## Verifikasi Minimum Sebelum Selesai
- app bisa boot
- migration jalan
- seed exercise masuk
- routine bisa dibuat
- workout bisa dimulai
- set bisa disimpan
- workout bisa diselesaikan
- progress membaca data dari SQLite
- backup JSON bisa dibuat
- import JSON bisa mengembalikan data

## Format Kerja yang Saya Inginkan
- kerjakan langsung perubahan file
- setelah implementasi, ringkas file utama yang dibuat/diubah
- jelaskan asumsi penting yang diambil
- sebutkan apa yang belum sempat jika memang ada

## Larangan
- jangan mengubah requirement produk menjadi cloud-based
- jangan mengganti database ke solusi remote
- jangan memasukkan dependency yang tidak perlu
- jangan membuat arsitektur berlapis yang terlalu berat untuk MVP ini

## Catatan Terakhir
Kalau ada bagian kecil yang belum ditentukan dokumen, ambil keputusan yang paling sederhana dan konsisten dengan prinsip:
- local-first
- fast MVP
- fast logging
- no backend
- SQLite as source of truth
