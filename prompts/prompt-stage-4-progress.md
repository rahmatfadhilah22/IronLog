# Prompt Stage 4 — Progress + Body Metrics

Lanjutkan project `IronLog` dan fokus pada analytics serta body metrics.

## Wajib Baca
- `prd.md`
- `screen-spec.md`
- `mvp-scope.md`
- `db/schema.sql`
- `design-mapping.md`
- `ui-implementation-rules.md`
- `codex-ui-reference-prompt.md`
- `design-reference/stitch-export/progress/`
- `design-reference/stitch-export/deadlift_progress/`
- `design-reference/stitch-export/body_metrics/`

## Scope Tahap Ini
- rebuild `exercise_stats`
- Progress Overview screen
- Exercise Progress Detail screen
- line/bar chart dasar untuk trend
- Body Metrics screen
- input body weight dan optional body fat
- history list body metrics

## Jangan Kerjakan Dulu
- jangan implement import/export dulu jika belum ada
- jangan redesign database besar-besaran

## Analytics Rules
- gunakan formula 1RM dari app settings
- tampilkan best 1RM, best weight, best volume, last performed
- analytics harus berasal dari SQLite
- `exercise_stats` adalah cache lokal, bukan source of truth

## Output yang Harus Ada
- progress overview bekerja
- detail progress per exercise bekerja
- body metrics bisa ditambah dan dilihat
- chart dasar tampil dan terbaca

## Verifikasi Minimum
- exercise stats ter-refresh setelah workout selesai
- progress screen membaca histori nyata
- body metrics tersimpan dan muncul di history

## Catatan UI
- progress harus terasa seperti performance tracker, bukan dashboard SaaS
- body metrics lebih sederhana daripada workout logger
