# Stack Reference — IronLog React Native MVP

Dokumen ini memaku library yang boleh dipakai agar implementasi tetap fokus.

## Approved Stack
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

## Installation Rule
- Gunakan `npx expo install` untuk package Expo/native.
- Hindari mengganti package yang sudah dipilih tanpa alasan teknis kuat.
- Jika Codex ragu soal API package, prioritaskan dokumentasi resmi pada tautan di bawah.

## Official References
- Expo create project: https://docs.expo.dev/get-started/create-a-project/
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Expo FileSystem: https://docs.expo.dev/versions/latest/sdk/filesystem/
- Expo Document Picker: https://docs.expo.dev/versions/latest/sdk/document-picker/
- Expo Sharing: https://docs.expo.dev/versions/latest/sdk/sharing/
- Zustand docs: https://zustand.docs.pmnd.rs/getting-started/introduction

## Why These Libraries
- `Expo`: fastest path to MVP for Android/iOS shared app.
- `Expo Router`: routing lebih cepat dirawat daripada konfigurasi manual navigator untuk app MVP.
- `expo-sqlite`: cukup untuk local-only persistence dan tidak perlu backend.
- `Zustand`: ringan untuk app state tanpa boilerplate berat.
- `expo-document-picker` + `expo-file-system` + `expo-sharing`: cukup untuk import/export backup JSON/CSV.
- `victory-native-xl`: cukup untuk chart progress tanpa setup yang terlalu berat.

## Libraries Explicitly Avoided for MVP
- backend framework apa pun
- remote database apa pun
- auth provider apa pun
- ORM berat yang menyembunyikan query SQLite terlalu jauh
- Redux Toolkit kecuali nanti state app terbukti tumbuh signifikan
- React Navigation manual jika Expo Router sudah mencukupi
