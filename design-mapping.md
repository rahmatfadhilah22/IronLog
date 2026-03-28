# Design Mapping — Stitch Export to IronLog MVP

Dokumen ini menetapkan bagaimana hasil export Stitch harus dipakai sebagai referensi UI untuk implementasi React Native.

## 1. Canonical Rule
Jika ada konflik antara file Stitch dan dokumen produk/arsitektur, urutan prioritasnya adalah:

1. `prd.md`
2. `mvp-scope.md`
3. `screen-spec.md`
4. `design-reference/stitch-export/forged_industrial/DESIGN.md`
5. `screen.png`
6. `code.html`

Artinya:
- PRD dan scope produk menang atas isi desain Stitch.
- `DESIGN.md` menang atas detail HTML jika ada inkonsistensi visual.
- `code.html` hanya referensi layout/hierarchy, bukan source implementasi final.

## 2. Screen Mapping
| Folder Stitch | Screen App | Status | Catatan |
| :--- | :--- | :--- | :--- |
| `home` | Home | Canonical | Pakai sebagai basis Home screen |
| `routines` | Routine List | Canonical | Pakai untuk daftar routine |
| `edit_routine` | Create/Edit Routine | Canonical | Satu screen untuk create dan edit |
| `select_exercise` | Exercise Picker | Canonical | Modal / sheet picker |
| `active_workout` | Active Workout Logger | Canonical Critical | Screen paling penting |
| `rest_timer` | Rest Timer Overlay | Canonical | Overlay / bottom sheet |
| `summary` | Workout Summary | Canonical | Setelah finish workout |
| `progress` | Progress Overview | Canonical | Overview analytics |
| `deadlift_progress` | Exercise Progress Detail | Canonical | Template detail analytics per exercise |
| `body_metrics` | Body Metrics | Canonical | Log dan history body metrics |
| `settings` | Settings | Canonical with overrides | Harus dibersihkan dari cloud/sync language |
| `forged_industrial` | Design System | Canonical Visual System | Acuan visual tertinggi dari Stitch |

## 3. File Usage Rule
Untuk setiap folder Stitch:

- `screen.png`
  - dipakai sebagai referensi visual utama
  - digunakan untuk membaca hierarchy, tone, dan spacing umum

- `code.html`
  - dipakai untuk membaca struktur section, urutan komponen, dan token visual
  - tidak dipakai sebagai source code React Native
  - tidak boleh dicopy mentah ke implementasi

- `design-reference/stitch-export/forged_industrial/DESIGN.md`
  - dipakai sebagai referensi visual system utama
  - menjadi dasar warna, tipografi, gesture visual, dan material feel

## 4. Product Overrides
Beberapa bagian Stitch bertentangan dengan arah final produk. Bagian ini harus diabaikan atau diubah saat implementasi:

### 4.1 Home
Diabaikan / diubah:
- `Cloud Backup`
- `Last sync`

Pengganti:
- `Backup Data`
- `Export JSON`
- `Import Backup`

### 4.2 Settings
Diabaikan / diubah:
- `Data & Cloud`
- `SYNC ACTIVE`
- wording yang mengasumsikan cloud sync
- destructive action `Reset All Progress` bukan prioritas MVP

Pengganti:
- `Data & Backup`
- `Export JSON`
- `Export CSV`
- `Import JSON`
- warning restore lokal

### 4.3 Any Screen
Diabaikan:
- auth assumptions
- sync assumptions
- cloud status
- multi-device language

## 5. Visual Tokens to Keep
Token visual utama yang harus dipertahankan:

- Background utama: `#131313`
- Deep surface: `#0E0E0E`
- Surface container low: sekitar `#1C1B1B`
- Surface container high/highest: sekitar `#2A2A2A` sampai `#353534`
- Text utama: `#E5E2E1`
- Accent utama: `#CCFF00`
- Accent dim: `#ABD600`
- Error / danger: merah gelap industrial

Typography:
- Display/headline: `Space Grotesk`
- Body/label: `Inter`

Visual language:
- square / near-square corners
- minimal border
- surface layering, bukan outline-heavy UI
- uppercase labels
- large display numbers
- analytical charts with restrained accent use

## 6. Known Inconsistencies Inside Stitch Export
Implementasi tidak boleh mengikuti bagian-bagian ini secara buta:

1. `settings/code.html` mendefinisikan `primary` sebagai putih.
   - Abaikan.
   - Gunakan lime sebagai primary global.

2. Beberapa HTML masih memakai border halus padahal `DESIGN.md` mendorong `No-Line Rule`.
   - Implementasi RN sebaiknya mengikuti `DESIGN.md` lebih dekat.

3. Beberapa screen memakai cloud/sync language.
   - Abaikan karena bertentangan dengan local-only MVP.

## 7. Implementation Priority
Urutan referensi visual saat implementasi:

1. `active_workout`
2. `home`
3. `edit_routine`
4. `select_exercise`
5. `summary`
6. `progress`
7. `deadlift_progress`
8. `body_metrics`
9. `settings`
10. `routines`

Alasan:
- `active_workout` menentukan kualitas inti produk.
- `home` dan `routine` menentukan entry flow.
- analytics dan settings penting, tetapi tidak boleh mengganggu prioritas logger.

## 8. Final Decision
Hasil Stitch ini adalah:
- **valid sebagai design reference pack**
- **tidak valid sebagai implementation source code**
- **harus dibaca bersama PRD final**
