# Prompt Stage 5 — Settings + Backup/Restore + Hardening

Lanjutkan project `IronLog` dan selesaikan support flow serta hardening MVP.

## Wajib Baca
- `prd.md`
- `screen-spec.md`
- `mvp-scope.md`
- `stack-reference.md`
- `design-mapping.md`
- `ui-implementation-rules.md`
- `codex-ui-reference-prompt.md`
- `design-reference/stitch-export/settings/`

## Scope Tahap Ini
- Settings screen final
- preferred unit setting
- 1RM formula setting
- auto-start rest timer setting
- haptics toggle
- export JSON backup
- export CSV
- import JSON backup
- destructive confirmation sebelum restore/import
- empty states, error states, dan polish minimum
- update README bila perlu

## Product Overrides
- Settings harus local-only
- jangan ada cloud/sync wording
- `Data & Backup`, bukan `Data & Cloud`
- `Reset All Progress` bukan wajib; hanya implement jika benar-benar sempat dan aman

## Output yang Harus Ada
- settings tersimpan dan dipakai app
- export JSON bekerja
- export CSV bekerja
- import JSON memulihkan data
- UI support states minimum ada

## Verifikasi Minimum
- mengubah unit mempengaruhi tampilan data
- mengubah formula mempengaruhi analytics
- export file berhasil dibuat
- import file berhasil memulihkan data
- app tetap bisa boot setelah restore

## Final Quality Bar
- no backend
- no auth
- no cloud assumptions
- README cukup untuk menjalankan proyek
- flow utama MVP tidak patah
