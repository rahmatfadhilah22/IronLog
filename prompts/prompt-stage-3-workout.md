# Prompt Stage 3 — Workout Flow

Lanjutkan project `IronLog` dan fokus hanya pada flow workout inti.

## Wajib Baca
- `prd.md`
- `screen-spec.md`
- `mvp-scope.md`
- `db/schema.sql`
- `design-mapping.md`
- `ui-implementation-rules.md`
- `codex-ui-reference-prompt.md`
- `design-reference/stitch-export/active_workout/`
- `design-reference/stitch-export/rest_timer/`
- `design-reference/stitch-export/summary/`

## Scope Tahap Ini
- start workout dari routine
- snapshot `workout_exercises`
- Active Workout Logger screen
- save set cepat
- copy previous set
- add extra workout exercise block
- rest timer overlay
- finish workout
- Workout Summary screen
- restore active workout saat app reopen

## Hard Rules
- `workout_exercises` harus snapshot dari routine
- histori workout tidak boleh berubah saat routine di-edit
- logger harus jadi screen paling functional
- prioritas utama adalah kecepatan input dan CTA yang jelas

## Jangan Kerjakan Dulu
- jangan implement full analytics charts
- jangan implement backup/import-export

## Output yang Harus Ada
- user bisa memulai workout dari routine
- user bisa log set
- user bisa copy previous set
- user bisa menyelesaikan workout
- summary muncul setelah finish
- active workout bisa dipulihkan jika app dibuka ulang

## Verifikasi Minimum
- start workout berhasil
- set tersimpan ke SQLite
- rest timer muncul
- finish workout mengubah status workout
- summary menghitung total sets/volume/top set

## Catatan UI
- fidelity terhadap `active_workout` harus lebih tinggi daripada screen lain
- kurangi elemen dekoratif bila mengganggu logger flow
