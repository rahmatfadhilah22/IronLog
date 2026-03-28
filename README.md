# IronLog (Stage 1 Bootstrap)

Fondasi `IronLog` berbasis **Expo + React Native + TypeScript** dengan fokus Stage 1:
- Expo Router + struktur folder dasar
- theme/tokens dasar industrial dark + lime
- SQLite bootstrap (foreign keys + WAL)
- migration runner
- seed exercise library saat tabel kosong
- app settings singleton (`id = 1`)

## Requirements
- Node.js 20+ (tested on Node 22)
- npm 10+

## Install & Run
```bash
npm install
npm run typecheck
npm run start
```

## Stack (Stage 1)
- `expo`, `expo-router`, `expo-sqlite`
- `expo-file-system`, `expo-document-picker`, `expo-sharing`
- `zustand`, `uuid`
- chart dependency: `victory-native`  
  (`victory-native-xl` tidak tersedia di npm registry publik, sementara repo upstream-nya sama)

## Database Init Order
Urutan bootstrap pada startup:
1. open database `ironlog.db`
2. `PRAGMA foreign_keys = ON`
3. `PRAGMA journal_mode = WAL`
4. run migration runner (`PRAGMA user_version`)
5. ensure singleton `app_settings` row (`id = 1`)
6. seed `exercises` dari `db/seed-exercises.json` jika tabel masih kosong

## Important Paths
- Router root: `app/`
- Core source: `src/`
- DB bootstrap: `src/db/sqlite/database.ts`
- Migration runner: `src/db/migrations/runner.ts`
- Seed logic: `src/db/repositories/exercise-repository.ts`
- Settings singleton access: `src/services/settings/app-settings-service.ts`
