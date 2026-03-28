# UI Implementation Rules — Codex

Dokumen ini mengatur bagaimana Codex harus menerjemahkan hasil Stitch menjadi UI React Native nyata.

## 1. Source of Truth
Untuk implementasi UI:
- source of truth produk: `prd.md`, `mvp-scope.md`, `screen-spec.md`
- source of truth visual: `design-reference/stitch-export/forged_industrial/DESIGN.md`
- source of truth layout reference: `screen.png`
- source of truth data behavior: schema dan dokumen db

`code.html` hanyalah referensi struktur visual, bukan blueprint kode final.

## 2. What Codex Must Reuse
Codex harus mempertahankan:
- dark industrial aesthetic
- lime accent
- Space Grotesk for display/headlines
- Inter for body/utility text
- strong contrast
- big numeric presentation
- dense but readable metric grouping
- architectural buttons
- minimal visual noise

## 3. What Codex Must Not Copy Literally
Codex tidak boleh menyalin secara literal:
- Tailwind class names
- HTML DOM structure
- web navbar patterns yang tidak cocok di Expo Router
- cloud/sync wording
- placeholder copy yang bertentangan dengan MVP
- decorative sections yang tidak membantu core flow

## 4. Product Corrections Required
Saat menerjemahkan desain:

### Home
- ganti `Cloud Backup` menjadi backup lokal
- hapus segala referensi sync status

### Settings
- ganti `Data & Cloud` menjadi `Data & Backup`
- hapus `SYNC ACTIVE`
- jangan implementasikan fitur cloud apa pun
- `Reset All Progress` bukan wajib MVP; boleh dihilangkan

### Active Workout
- jadikan screen ini paling functional, bukan paling decorative
- kurangi elemen motivasional jika mengganggu kecepatan logging
- pertahankan big inputs, previous set reference, dan CTA utama

### Progress
- fokus pada 1RM, best volume, best weight, last performed, trend chart
- jangan terlalu dashboard-like

## 5. Layout Translation Rules
### General
- gunakan React Native layout primitives, bukan meniru HTML 1:1
- prefer reusable sections/components daripada file screen penuh dengan markup berulang
- spacing harus mengikuti sistem yang konsisten

### Cards
- gunakan tonal surface layers, bukan border-heavy cards
- jangan bikin shadow berlebihan

### Buttons
- primary CTA pakai lime
- secondary CTA pakai darker surface
- square / low-radius corners

### Inputs
- labels harus selalu di atas field
- input angka besar di logger harus jadi fokus visual
- tap target minimum 48dp; primary workout actions 56-64dp

### Charts
- accent line lime
- horizontal gridlines minimal
- jangan terlalu banyak ornament

## 6. Component Reuse Targets
Codex sebaiknya mengekstrak komponen reusable berikut:
- `TopAppBar`
- `BottomTabBar`
- `SectionHeader`
- `MetricCard`
- `PrimaryButton`
- `SecondaryButton`
- `LoggerNumberInput`
- `ExerciseRow`
- `WorkoutSetRow`
- `AnalyticsStatCard`
- `SettingsRow`
- `DangerActionCard`
- `EmptyState`

## 7. Practical Screen Priorities
Saat waktu terbatas:

1. `Active Workout`
2. `Create/Edit Routine`
3. `Exercise Picker`
4. `Home`
5. `Workout Summary`
6. `Progress Overview`
7. `Exercise Progress Detail`
8. `Settings`
9. `Body Metrics`
10. `Routines`

## 8. Allowed Simplifications
Untuk menjaga MVP tetap realistis:
- boleh sederhanakan visual chart dibanding Stitch
- boleh sederhanakan icon usage
- boleh sederhanakan beberapa decorative panel
- boleh kurangi copywriting branding

Selama:
- hierarchy tetap kuat
- logger cepat
- visual identity tetap industrial-dark-lime

## 9. Disallowed Deviations
Codex tidak boleh:
- mengganti visual jadi app wellness yang lembut
- mengganti accent utama ke ungu
- membuat UI terlalu rounded / bubbly
- menambahkan social feed patterns
- mengubah desain menjadi dashboard SaaS generik
- memaksakan cloud UI state

## 10. Final Rule
Kalau ada konflik antara:
- estetika
- implementasi
- kecepatan MVP

maka pilih:
1. flow workout yang paling cepat
2. consistency dengan PRD final
3. visual fidelity secukupnya
