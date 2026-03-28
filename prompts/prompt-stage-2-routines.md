# Prompt Stage 2 — Routine Flow

Lanjutkan project `IronLog` dari fondasi yang sudah ada. Fokus tahap ini hanya pada flow routine.

## Wajib Baca
- `prd.md`
- `screen-spec.md`
- `mvp-scope.md`
- `design-mapping.md`
- `ui-implementation-rules.md`
- `codex-ui-reference-prompt.md`
- `design-reference/stitch-export/home/`
- `design-reference/stitch-export/routines/`
- `design-reference/stitch-export/edit_routine/`
- `design-reference/stitch-export/select_exercise/`

## Scope Tahap Ini
- Home minimal yang bisa menampilkan routine terbaru dan CTA utama
- Routine List screen
- Create/Edit Routine screen
- Exercise Picker modal/sheet
- repository/service untuk routine CRUD
- penyimpanan `routine_exercises`
- sort order dan rest time per exercise

## Jangan Kerjakan Dulu
- jangan implement workout logger penuh
- jangan implement progress charts
- jangan implement import/export

## Product Overrides
- Home tidak boleh menampilkan cloud/sync
- semua wording harus local-only

## Output yang Harus Ada
- user bisa membuat routine
- user bisa edit routine
- user bisa pilih exercise dari library
- user bisa lihat routine list
- Home menampilkan CTA dan routine entry point

## Verifikasi Minimum
- create routine berhasil
- edit routine berhasil
- order exercise tersimpan
- rest time per exercise tersimpan
- routine muncul di Home dan Routine List

## Catatan UI
- ikuti gaya Stitch tapi tetap sederhana
- prioritaskan hierarchy dan usability, bukan efek visual berlebihan
