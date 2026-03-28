# IronLog (Local-Only MVP)

`IronLog` adalah aplikasi gym tracker **local-first** berbasis Expo + React Native.
Seluruh data disimpan lokal di SQLite tanpa backend, auth, dan cloud sync.

## MVP Features
- Routine management (create/edit/reorder/add-remove exercise)
- Active workout logger (set logging, copy previous, rest timer, finish + summary)
- Progress analytics (overview + detail per exercise)
- Body metrics (input + history)
- Settings:
  - preferred unit (`kg` / `lb`)
  - 1RM formula (`brzycki` / `epley`)
  - haptics toggle
  - auto-start rest timer
- Local backup:
  - export full JSON backup
  - export CSV analytics
  - import JSON backup (destructive restore with confirmation)

## Requirements
- Node.js 20+
- npm 10+

## Install & Run
```bash
npm install
npm run typecheck
npm run start
```

## Tech Stack
- `expo`, `expo-router`, `expo-sqlite`
- `expo-file-system`, `expo-document-picker`, `expo-sharing`
- `zustand`, `uuid`
- `victory-native`

## Database Bootstrap
Saat startup:
1. open database `ironlog.db`
2. enable foreign keys
3. enable WAL (non-web)
4. jalankan migration runner (`PRAGMA user_version`)
5. ensure singleton `app_settings` (`id = 1`)
6. seed `exercises` jika tabel kosong

## Important Paths
- App routes: `app/`
- Core source: `src/`
- SQLite bootstrap: `src/db/sqlite/database.ts`
- Migrations: `src/db/migrations/`
- Services: `src/services/`
