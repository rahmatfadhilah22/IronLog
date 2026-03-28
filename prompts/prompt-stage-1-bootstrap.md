# Prompt Stage 1 — Bootstrap + Database Foundation

Bangun fondasi project `IronLog` sebagai aplikasi **React Native + Expo + TypeScript** sesuai dokumen repo ini.

## Wajib Baca
- `prd.md`
- `mvp-scope.md`
- `build-plan.md`
- `stack-reference.md`
- `db/README.md`
- `db/schema.sql`
- `db/migrations/001_init.sql`
- `db/seed-exercises.json`
- `design-mapping.md`
- `ui-implementation-rules.md`
- `codex-ui-reference-prompt.md`

## Scope Tahap Ini
Kerjakan hanya fondasi project dan database:
- bootstrap Expo TypeScript app
- pasang Expo Router
- pasang dependency inti sesuai `stack-reference.md`
- buat struktur folder dasar sesuai `prd.md`
- buat theme/tokens dasar
- implement SQLite init
- implement WAL mode
- implement migration runner
- implement seed exercise library dari `db/seed-exercises.json`
- implement akses settings singleton
- buat README run instructions minimum

## Jangan Kerjakan Dulu
- jangan implement full screen MVP
- jangan implement analytics UI
- jangan implement import/export penuh
- jangan implement chart detail

## Hard Constraints
- gunakan `npx expo install` untuk dependency Expo/native
- jangan ganti stack
- jangan tambahkan backend/auth/cloud
- jangan ubah schema dasar tanpa alasan teknis kuat
- SQLite tetap source of truth

## Output yang Harus Ada
- project Expo runnable
- `app/` dengan routing dasar
- `src/` structure dasar
- database bootstrap code
- migration runner
- seeding flow
- theme token awal
- README singkat

## Verifikasi Minimum
- project bisa install dependency
- app bisa boot
- migration jalan pada first launch
- seed exercise masuk saat tabel kosong
- app settings row tersedia

## Catatan
- gunakan hasil Stitch hanya untuk visual direction dasar, belum perlu fidelity screen tinggi di tahap ini
- prioritaskan arsitektur yang bersih tapi tetap pragmatis
