# PRD — IronLog Local (SQLite-Only)

## 1. Overview
**Masalah:** Banyak lifter hanya butuh aplikasi yang cepat untuk mencatat latihan dan melihat progres, tetapi aplikasi gym tracker modern sering memaksa akun, sinkronisasi cloud, dan fitur sosial yang tidak relevan. Kompleksitas ini memperlambat input saat latihan dan menambah beban pengembangan.

**Tujuan:** Membangun versi `IronLog` yang sepenuhnya berjalan di perangkat, menggunakan SQLite sebagai satu-satunya database, tanpa backend, tanpa login, dan tanpa dependensi server. Fokus utama tetap sama: logging set secepat mungkin, template routine, dan analytics progres yang jelas.

**Nilai Utama (Core Value):**
1. **Kecepatan:** Input set harus sangat cepat dan minim gangguan.
2. **Kemandirian:** Aplikasi tetap bekerja penuh tanpa internet, akun, atau server.
3. **Kejelasan:** Progres beban, volume, dan estimasi 1RM tetap mudah dipahami.

## 2. Product Decision
**Keputusan Produk:** MVP ini adalah **single-device local-first app**.

Artinya:
* Tidak ada login/register.
* Tidak ada backend API.
* Tidak ada sinkronisasi cloud otomatis.
* Semua data disimpan di SQLite lokal.
* Backup dilakukan lewat export file manual.

**Konsekuensi yang diterima:**
* Data hanya tersedia di device yang sama kecuali user melakukan export/import.
* Jika device hilang atau uninstall tanpa backup, data ikut hilang.
* Multi-device sync bukan bagian dari MVP ini.

## 3. Requirements
**Persyaratan Fungsional:**
* Pengguna dapat membuat dan mengelola template routine latihan.
* Pengguna dapat memulai workout dari routine yang dipilih.
* Pengguna dapat mencatat set dengan field `weight`, `reps`, `rpe`, dan `unit`.
* Timer istirahat muncul otomatis setelah set ditandai selesai.
* Pengguna dapat menyalin set sebelumnya untuk mempercepat input.
* Pengguna dapat melihat grafik progres weight, volume, dan estimasi 1RM per exercise.
* Pengguna dapat input body metrics secara manual.
* Pengguna dapat export semua data ke file lokal (`JSON` untuk backup penuh, `CSV` untuk analisis).
* Pengguna dapat import backup `JSON` ke device yang sama atau device lain.

**Persyaratan Non-Fungsional:**
* **UI/UX:** Dark mode wajib, tombol besar, kontras tinggi, dan cocok dipakai saat latihan.
* **Performa:** Simpan set ke SQLite dalam < 200ms pada device target.
* **Ketersediaan:** Semua fitur inti bekerja tanpa internet.
* **Platform:** iOS dan Android.
* **Keamanan:** Data mengandalkan proteksi device; file export harus diberi peringatan bahwa isinya sensitif.

## 4. Core Features
1. **Quick Workout Logger**
   * Numpad besar untuk input angka.
   * `Copy Previous Set`.
   * Satu tap untuk centang selesai.
   * Timer istirahat otomatis per blok gerakan.

2. **Routine Template Manager**
   * Membuat routine baru.
   * Menyusun urutan exercise.
   * Mengatur rest time per exercise.
   * Menyimpan exercise favorit.

3. **Progression Analytics**
   * Grafik weight trend per sesi.
   * Grafik volume trend per sesi.
   * Estimasi 1RM dengan Brzycki atau Epley.
   * Ringkasan best set, best volume, dan last performed.

4. **Body Metrics**
   * Input weight dan body fat percentage.
   * Riwayat metrik tubuh per tanggal.

5. **Backup & Restore**
   * Export full backup ke `JSON`.
   * Export analytics ke `CSV`.
   * Import full backup dari `JSON`.

6. **Exercise Library**
   * Library exercise dasar lokal.
   * Filter berdasarkan muscle group.
   * Tidak ada media/video di MVP.

## 5. User Flow
1. **First Launch:** User buka app -> langsung masuk Home tanpa akun.
2. **Setup:** User buat routine baru atau pilih routine contoh.
3. **Start Workout:** User pilih routine -> tekan "Mulai Latihan".
4. **Logging:** User input set -> tekan selesai -> timer jalan -> ulangi.
5. **Finish:** User selesai workout -> lihat summary -> data otomatis tersimpan.
6. **Analysis:** User buka halaman Progress -> pilih exercise -> lihat grafik.
7. **Backup:** User buka Settings -> export backup `JSON` atau export `CSV`.

## 6. Architecture
Arsitektur MVP ini sepenuhnya berjalan di device. UI berinteraksi dengan service layer internal, lalu semua data persisten disimpan ke SQLite. Analytics dihitung dari SQLite lokal. Tidak ada network dependency untuk fitur inti.

```mermaid
flowchart TD
    subgraph MobileApp ["Mobile App"]
        UI[UI Layer]
        VM[State / ViewModel Layer]
        SRV[App Services]
        DB[(SQLite)]
        FILE[File Export / Import]
    end

    UI --> VM
    VM --> SRV
    SRV --> DB
    SRV --> FILE

    note right of DB: Single source of truth
    note right of FILE: JSON backup and CSV export
```

## 7. Database Schema
Schema dirancang untuk menjaga histori workout tetap stabil walaupun routine diubah setelahnya. Karena app ini single-device, tidak ada kolom sync, version, atau server metadata.

```mermaid
erDiagram
    APP_SETTINGS ||--o{ ROUTINES : configures
    ROUTINES ||--|{ ROUTINE_EXERCISES : contains
    ROUTINE_EXERCISES ||--o{ WORKOUT_EXERCISES : instantiated_as
    WORKOUTS ||--|{ WORKOUT_EXERCISES : contains
    WORKOUT_EXERCISES ||--|{ WORKOUT_SETS : consists_of
    EXERCISES ||--o{ ROUTINE_EXERCISES : templated_as
    EXERCISES ||--o{ WORKOUT_EXERCISES : performed_as
    EXERCISES ||--o{ EXERCISE_STATS : tracked_in

    APP_SETTINGS {
        int id PK
        varchar preferred_unit
        varchar one_rm_formula
        boolean haptics_enabled
        boolean auto_start_rest_timer
        timestamp updated_at
    }
    ROUTINES {
        text id PK
        string name
        string description
        boolean is_archived
        timestamp created_at
        timestamp updated_at
    }
    ROUTINE_EXERCISES {
        text id PK
        text routine_id FK
        text exercise_id FK
        int sort_order
        int rest_time_seconds
        timestamp created_at
        timestamp updated_at
    }
    WORKOUTS {
        text id PK
        text routine_id FK
        varchar source_type
        varchar status
        timestamp started_at
        timestamp finished_at
        timestamp created_at
        timestamp updated_at
    }
    WORKOUT_EXERCISES {
        text id PK
        text workout_id FK
        text routine_exercise_id FK nullable
        text exercise_id FK
        string display_name
        int sort_order
        int rest_time_seconds
        timestamp created_at
        timestamp updated_at
    }
    WORKOUT_SETS {
        text id PK
        text workout_exercise_id FK
        int set_number
        float weight
        int reps
        int rpe nullable
        varchar unit
        boolean is_completed
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }
    BODY_METRICS {
        text id PK
        float weight
        float body_fat_percentage
        timestamp recorded_at
        timestamp created_at
        timestamp updated_at
    }
    EXERCISES {
        text id PK
        string name
        string muscle_group
        string equipment_type
        boolean is_favorite
    }
    EXERCISE_STATS {
        text exercise_id PK
        float best_1rm
        float best_volume
        float best_weight
        int total_sessions
        timestamp last_performed
        timestamp updated_at
    }
```

**Catatan implementasi:**
* `WORKOUT_EXERCISES` adalah snapshot exercise saat workout dimulai. Histori tidak ikut berubah jika template routine nanti di-edit.
* `WORKOUT_SETS` mereferensikan `workout_exercise_id` agar exercise yang sama bisa muncul lebih dari sekali dalam satu sesi.
* `EXERCISE_STATS` adalah cache/agregat lokal untuk mempercepat dashboard, bukan sumber data utama.
* Semua `id` bertipe `text` berisi UUID string agar mudah dipakai lintas Flutter/RN.

## 8. Business Rules
| Aturan | Deskripsi | Implementasi |
| :--- | :--- | :--- |
| **1RM Formula** | Default Brzycki. | User bisa ganti ke Epley di Settings. Semua analytics mengikuti setting aktif. |
| **RPE Input** | Opsional per set. | Jika kosong, simpan `null`. |
| **Routine Edit Safety** | Histori workout tidak boleh berubah. | Saat workout dimulai, routine disalin menjadi `workout_exercises`. |
| **Max Sets** | Maksimal 20 set per blok exercise. | Jika lebih, user tambah blok exercise baru di workout yang sama. |
| **Unit Consistency** | Default unit mengikuti app settings. | Grafik dinormalisasi ke `preferred_unit`. |
| **Delete Strategy** | Tidak pakai hard delete untuk data utama. | Gunakan `is_archived` untuk routine; workout history tetap permanen. |
| **Backup Restore** | Import boleh menimpa data lokal. | Sebelum import, app wajib tampilkan warning bahwa restore akan mengganti database aktif. |

## 9. Acceptance Criteria
### 9.1 Quick Workout Logger
* **Given** user sedang dalam workout aktif
* **When** user mengisi `weight` dan `reps`, lalu menekan tombol selesai
* **Then** set tersimpan ke SQLite dalam < 200ms dan timer istirahat langsung dimulai

### 9.2 Routine Template Manager
* **Given** user berada di halaman create routine
* **When** user menambahkan 5 exercise dan mengatur urutannya
* **Then** routine tersimpan dan saat workout dimulai urutannya tetap sama

### 9.3 Progression Analytics
* **Given** user memiliki minimal 3 sesi untuk satu exercise
* **When** user membuka halaman progress untuk exercise tersebut
* **Then** app menampilkan trend weight, volume, dan estimasi 1RM dengan benar

### 9.4 Backup & Restore
* **Given** user sudah memiliki data workout lokal
* **When** user export ke JSON lalu import file yang sama
* **Then** seluruh routine, workout, sets, metrics, dan settings kembali utuh

## 10. Local Module Contract
Bagian ini menggantikan API contract. Karena tidak ada backend, kontrak utama berada di service layer internal aplikasi.

### 10.1 Workout Service
| Method | Input | Output | Catatan |
| :--- | :--- | :--- | :--- |
| `startWorkout` | `routineId, startedAt` | `workoutId, workoutExercises[]` | Membuat snapshot routine |
| `addWorkoutExercise` | `workoutId, exerciseId, displayName, sortOrder, restTimeSeconds` | `workoutExerciseId` | Untuk blok tambahan |
| `saveSet` | `workoutExerciseId, setNumber, weight, reps, rpe, unit` | `setId, restTimerSeconds` | Menyimpan satu set |
| `finishWorkout` | `workoutId, finishedAt` | `status` | Menutup workout aktif |

### 10.2 Routine Service
| Method | Input | Output | Catatan |
| :--- | :--- | :--- | :--- |
| `createRoutine` | `name, exercises[]` | `routineId` | Validasi minimal 1 exercise |
| `updateRoutine` | `routineId, payload` | `void` | Tidak mengubah histori workout |
| `archiveRoutine` | `routineId` | `void` | Soft archive |
| `listRoutines` | `-` | `Routine[]` | Menampilkan routine aktif |

### 10.3 Analytics Service
| Method | Input | Output | Catatan |
| :--- | :--- | :--- | :--- |
| `getExerciseSummary` | `exerciseId` | `best1RM, formulaUsed, bestWeight, bestVolume` | Ambil dari cache atau hitung ulang |
| `getExerciseTrend` | `exerciseId` | `weightTrend[], volumeTrend[]` | Berdasarkan histori workout |
| `rebuildExerciseStats` | `exerciseId?` | `void` | Dipanggil setelah workout selesai atau import |

### 10.4 Backup Service
| Method | Input | Output | Catatan |
| :--- | :--- | :--- | :--- |
| `exportBackupJson` | `-` | `filePath` | Backup penuh |
| `exportCsv` | `filters?` | `filePath` | Untuk analisis luar app |
| `importBackupJson` | `filePath` | `restoreResult` | Mengganti DB aktif setelah konfirmasi |

## 11. Tech Stack
**Rekomendasi Utama:** **React Native + Expo + SQLite**.

* **App Framework:** Expo (managed workflow)
  * Mempercepat bootstrap MVP, native module sudah terkurasi, dan onboarding dev lebih cepat.
* **Navigation:** Expo Router
  * File-based routing, cocok untuk struktur screen MVP yang sederhana dan cepat dirawat.
* **Language:** TypeScript
  * Mengurangi bug data-shape pada SQLite rows, services, dan form state.
* **State Management:** Zustand
  * Ringan, cepat, dan tidak menambah boilerplate provider untuk global UI/app state.
* **Server State:** Tidak ada
  * MVP ini local-only; semua data berasal dari SQLite lokal.
* **Local Database:** `expo-sqlite`
  * SQLite persisten di device dan cukup untuk seluruh kebutuhan MVP tanpa backend.
* **Charts:** `victory-native-xl`
  * Dipilih untuk line chart sederhana dengan setup yang lebih ringan untuk MVP dibanding arsitektur chart yang terlalu kompleks.
* **File Import:** `expo-document-picker`
  * Untuk memilih file backup `JSON` dari device.
* **File Export / Storage:** `expo-file-system`
  * Untuk membuat file backup/export lokal.
* **File Sharing:** `expo-sharing`
  * Untuk membagikan file `JSON`/`CSV` ke aplikasi lain atau menyimpan ke tujuan lain.
* **Utilities:** `uuid`
  * Untuk membuat ID lokal yang stabil.

## 12. React Native Technical Spec
* **Project Mode:** Expo managed workflow.
* **Package Installation Rule:** Gunakan `npx expo install` untuk package Expo/native agar versi library tetap kompatibel dengan SDK yang aktif.
* **Folder Structure:** Feature-first dengan Expo Router.
  * ```text
    app/
    ├── _layout.tsx
    ├── (tabs)/
    │   ├── index.tsx
    │   ├── routines.tsx
    │   ├── progress.tsx
    │   └── settings.tsx
    ├── workout/
    │   ├── [workoutId].tsx
    │   └── summary.tsx
    ├── routines/
    │   ├── create.tsx
    │   └── [routineId].tsx
    ├── exercise/
    │   └── [exerciseId].tsx
    └── body-metrics.tsx
    src/
    ├── core/
    │   ├── constants/
    │   ├── theme/
    │   └── utils/
    ├── db/
    │   ├── migrations/
    │   ├── repositories/
    │   └── sqlite/
    ├── services/
    │   ├── analytics/
    │   ├── backup/
    │   ├── routines/
    │   └── workouts/
    ├── stores/
    ├── features/
    ├── components/
    └── types/
    ```
* **Navigation Rule:** Tab navigation untuk area utama, stack/modal untuk create/edit/detail flow.
* **Database Mode:** SQLite dengan WAL mode aktif untuk performa write yang lebih baik.
* **Query Rule:** Gunakan prepared statements / parameterized queries. Jangan membangun SQL dari string interpolation mentah.
* **Transactions:** Start workout, finish workout, import backup, dan rebuild stats harus berjalan dalam transaction.
* **Stats Refresh Strategy:** `exercise_stats` di-refresh setelah workout selesai, setelah edit set historis, dan setelah import backup.
* **Crash Safety:** Workout aktif harus bisa dipulihkan saat app dibuka ulang.
* **Export Format:**
  * `JSON` untuk full backup seluruh tabel.
  * `CSV` untuk data workout sets dan body metrics.
* **Import Rule:** Saat memilih file backup, gunakan copy ke cache directory agar file bisa langsung dibaca secara konsisten setelah dipilih.
* **State Ownership:**
  * Zustand hanya untuk UI/app state lintas-screen seperti workout aktif, timer, filter, dan app settings.
  * Data persisten tetap berasal dari SQLite, bukan dari store memory.
* **Definition of Done Teknis:**
  * App dapat dijalankan di Expo.
  * SQLite migration awal berjalan otomatis.
  * Seed exercise library masuk saat first launch.
  * User dapat membuat routine, memulai workout, menyimpan set, melihat progress, export JSON/CSV, dan import JSON.

## 13. Risks and Tradeoffs
1. **Tidak ada backend berarti tidak ada auto-sync.**
   * Ini bukan bug, tetapi keputusan scope.
2. **Restore lebih berisiko daripada sync granular.**
   * Karena basisnya file import/export, UX warning harus jelas.
3. **Analytics lokal bisa berat jika data besar.**
   * Karena itu `exercise_stats` tetap perlu sebagai cache agregat lokal.
4. **Keamanan bergantung pada device.**
   * SQLite lokal tidak otomatis terenkripsi kecuali memakai solusi tambahan.

## 14. Future Upgrade Path
Jika nanti dibutuhkan:
* akun user
* auto backup cloud
* sync multi-device
* shared coach/client access

maka backend baru layak ditambahkan. Pada tahap itu schema lokal ini masih bisa dipertahankan sebagai local-first cache, lalu server ditambahkan di atas model data yang sama.
