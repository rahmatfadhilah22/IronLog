# Database Notes

## Files
- `schema.sql`: full SQLite schema snapshot for reference.
- `migrations/001_init.sql`: initial migration to bootstrap a fresh app database.
- `seed-exercises.json`: starter exercise library for first launch seeding.

## Implementation Rules
- Jalankan `PRAGMA foreign_keys = ON` setiap kali membuka koneksi SQLite.
- Aktifkan `WAL` mode saat inisialisasi database di aplikasi.
- Seed `seed-exercises.json` hanya jika tabel `exercises` masih kosong.
- `app_settings` adalah singleton row dengan `id = 1`.
- `exercise_stats` dibangun ulang setelah workout selesai atau setelah import backup.

## Recommended Runtime Init Order
1. Open SQLite database.
2. Enable foreign keys.
3. Enable WAL mode.
4. Run pending migrations in order.
5. Insert default `app_settings` row if missing.
6. Seed `seed-exercises.json` if `exercises` is empty.
