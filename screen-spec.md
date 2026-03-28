# Screen Spec — IronLog MVP (React Native)

## 1. Navigation Map
- `(tabs)/index`: Home
- `(tabs)/routines`: Routine List
- `(tabs)/progress`: Progress Overview
- `(tabs)/settings`: Settings
- `routines/create`: Create Routine
- `routines/[routineId]`: Routine Detail / Edit
- `workout/[workoutId]`: Active Workout Logger
- `workout/summary`: Workout Summary
- `exercise/[exerciseId]`: Exercise Progress Detail
- `body-metrics`: Body Metrics
- `modal/exercise-picker`: Exercise Picker
- `modal/rest-timer`: Rest Timer Overlay

## 2. Home
**Goal:** memberi entry point tercepat ke workout hari ini.

**Content:**
- CTA `Mulai Workout`
- daftar routine terbaru
- kartu `Last Workout`
- shortcut `Body Metrics`
- shortcut `Backup`

**Primary Actions:**
- start routine
- lanjutkan workout aktif jika ada
- buka summary workout terakhir

**States:**
- empty: tampilkan CTA buat routine pertama
- active workout: tombol utama berubah jadi `Lanjutkan Workout`

## 3. Routine List
**Goal:** melihat, membuat, dan memilih routine.

**Content:**
- list routine aktif
- tombol `Create Routine`
- filter ringan `All / Favorites`

**Primary Actions:**
- buka detail routine
- start workout dari routine
- archive routine

**States:**
- empty: ilustrasi ringan + tombol create

## 4. Create/Edit Routine
**Goal:** menyusun routine dengan cepat.

**Content:**
- input `name`
- input `description` opsional
- sortable list `routine_exercises`
- field `rest_time_seconds`
- tombol tambah exercise

**Primary Actions:**
- add exercise dari picker
- reorder exercise
- save routine

**Validation:**
- nama wajib
- minimal 1 exercise
- `rest_time_seconds >= 0`

## 5. Exercise Picker Modal
**Goal:** memilih exercise secepat mungkin.

**Content:**
- search input
- chips muscle group
- list exercise library
- aksi `add custom name` tidak masuk MVP

**Primary Actions:**
- pilih exercise
- tandai favorite

## 6. Active Workout Logger
**Goal:** screen paling cepat di app.

**Content:**
- nama workout dan elapsed time
- daftar `workout_exercises`
- daftar set per blok exercise
- numpad besar untuk input `weight` dan `reps`
- picker sederhana untuk `rpe` dan `unit`
- tombol `Copy Previous`
- tombol `Complete Set`
- tombol `Finish Workout`

**Primary Actions:**
- save set
- add exercise block baru
- open rest timer overlay
- finish workout

**Interaction Rules:**
- fokus default ke field angka utama
- setelah save set sukses, timer otomatis jalan bila setting aktif
- save set tidak boleh pindah screen
- haptic ringan opsional saat save sukses

**States:**
- no sets yet
- active timer
- long workout list
- interrupted session restored after reopen

## 7. Rest Timer Overlay
**Goal:** memberi feedback istirahat tanpa mengganggu logger.

**Content:**
- countdown besar
- tombol `+15s`
- tombol `Skip`
- nama exercise aktif

## 8. Workout Summary
**Goal:** menutup sesi dan memberi feedback progres cepat.

**Content:**
- total sets
- total volume
- top set
- durasi workout
- CTA `Done`
- CTA `View Progress`

## 9. Progress Overview
**Goal:** entry point analytics.

**Content:**
- search exercise
- list most performed exercises
- card `best lifts`
- recent progress cards

**Primary Actions:**
- buka `exercise/[exerciseId]`

**States:**
- empty: pesan bahwa progress muncul setelah beberapa sesi

## 10. Exercise Progress Detail
**Goal:** membaca progres per exercise dengan cepat.

**Content:**
- header nama exercise
- stat cards: best 1RM, best volume, best weight, last performed
- chart weight trend
- chart volume trend
- formula selector readonly mengikuti settings

**Primary Actions:**
- filter range `30d / 90d / all`
- buka riwayat set terkait jika nanti dibutuhkan

## 11. Body Metrics
**Goal:** input metrik tubuh dan melihat trend dasar.

**Content:**
- form `weight`
- form `body_fat_percentage` opsional
- tanggal pencatatan
- history list
- mini trend chart opsional jika waktu cukup

**Primary Actions:**
- save metric
- delete latest item tidak masuk MVP

## 12. Settings
**Goal:** konfigurasi inti dan backup.

**Content:**
- preferred unit `kg/lb`
- 1RM formula `Brzycki/Epley`
- auto start rest timer
- haptics
- export JSON
- export CSV
- import JSON
- about app

**Primary Actions:**
- ubah settings
- export backup
- import backup

**Danger Zone:**
- import JSON harus menampilkan konfirmasi destruktif

## 13. Non-MVP Screens
- onboarding akun
- auth
- cloud sync
- notifications settings detail
- web dashboard
