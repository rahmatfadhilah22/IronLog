# Codex UI Reference Prompt

Gunakan folder `design-reference/stitch-export/` sebagai **UI reference pack**, bukan sebagai source code implementasi langsung.

Ikuti aturan berikut:

- gunakan `design-reference/stitch-export/forged_industrial/DESIGN.md` sebagai acuan visual utama
- gunakan `screen.png` pada tiap folder screen sebagai referensi tampilan utama
- gunakan `code.html` hanya untuk membaca hierarchy layout, section order, dan intent spacing
- jangan menyalin HTML, Tailwind classes, atau pola web secara literal ke React Native
- ikuti `design-mapping.md` untuk canonical mapping dan product overrides
- ikuti `ui-implementation-rules.md` untuk guardrail translasi UI
- jika ada konflik antara hasil Stitch dan PRD, maka `prd.md` menang

Product corrections yang wajib:
- hapus semua referensi cloud, sync, auth, dan multi-device
- ubah semua wording cloud backup menjadi local backup / export-import
- pertahankan dark industrial aesthetic, lime accent, Space Grotesk + Inter, dan fast workout logging feel
- prioritaskan `Active Workout` sebagai screen paling kuat dan paling fungsional

Tujuan akhirnya:
- UI React Native yang setia pada arah visual Stitch
- tetap konsisten dengan MVP local-only
- tetap pragmatis dan cepat diimplementasikan
