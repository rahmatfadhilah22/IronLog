# PIN Authentication & App Version Display — Design

Status: draft
Date: 2026-05-27
Author: rahmat (with brainstorming assistance)

## Summary

Add two user-visible features to IronLog:

1. **App version display** in the Settings screen, so users can see which version they are running.
2. **PIN authentication** to gate access to the app, primarily as a privacy measure ("anti-intip"). The PIN is mandatory at first run and is requested on every cold start.

The two features are unrelated technically but are implemented and shipped together because both are small, both touch the Settings screen, and both improve the perceived completeness of the app.

## Goals

- Surface the app's semantic version (and optionally native build number) in Settings.
- Prevent casual unauthorized access to workout data on a shared or stolen device.
- Provide a recovery path so users do not lose data if they forget their PIN.

## Non-goals

- Encrypting the on-device SQLite database.
- Biometric (Face ID / fingerprint) authentication.
- Auto-locking when the app is backgrounded.
- Lockout / brute-force throttling on PIN attempts.
- Cloud-based account or sync.

## Feature 1 — Version display

### Location

Inside `app/(tabs)/settings.tsx`, in the existing About section (currently lines 300-302):

```
IRONLOG mobile strength log
v1.0.0 (build 12)
```

The "build N" suffix is shown only when `nativeBuildVersion` is available. In Expo Go it may be undefined; in that case only the semantic version is shown.

### Data sources

- `Constants.expoConfig?.version` from `expo-constants` (already in `package.json`).
- `Application.nativeBuildVersion` from `expo-application`. If `expo-application` is not yet installed, it is added as a new dependency.

### UI

Two centered, uppercase, secondary-color labels stacked under the existing tagline.

### Effort

≈ 15 minutes including dependency install if needed.

## Feature 2 — PIN authentication

### Threat model

Casual snooping by someone who has temporary physical access to the unlocked device. The PIN is **not** intended to defend against:
- Forensic device extraction.
- Determined attackers willing to root the device.
- Malware running with elevated privileges.

This shapes the rest of the design — e.g., the database itself is not encrypted.

### Storage

PIN material is stored in `expo-secure-store` (Android Keystore / iOS Keychain), never on disk in plaintext. One SecureStore key is used:

- `auth.pin_record` — JSON-encoded record:

  ```json
  {
    "version": 1,
    "pinHash": "<hex sha256(pin + salt)>",
    "salt": "<hex 16 random bytes>",
    "recoveryQuestion": "<plain text>",
    "recoveryAnswerHash": "<hex sha256(answer.toLowerCase().trim() + salt)>",
    "createdAt": "<ISO timestamp>"
  }
  ```

Notes:
- Hashing uses `expo-crypto`'s `digestStringAsync` with SHA-256. SHA-256 with a per-record salt is acceptable here because the threat model excludes attackers with full device extraction; a heavier KDF (PBKDF2/scrypt) is unnecessary work for an "anti-intip" feature and would require pulling in a JS crypto library.
- The salt is generated once at PIN setup with `Crypto.getRandomBytesAsync(16)` and reused on PIN change. It is regenerated only when the recovery flow resets the PIN, so old hashes can never re-validate.
- The full record JSON lives in SecureStore (single key) so we do an atomic read/write.

### First-run setup (mandatory)

The PIN setup wizard runs once, on the first cold start after install (or after a recovery wipe).

Bootstrap order in `app/_layout.tsx`:
1. Wait for `useDatabaseBootstrap()` to be ready (existing).
2. Read `auth.pin_record` from SecureStore.
3. If absent → render `<PinSetupScreen />` instead of the normal `<Stack />`.
4. If present and the in-memory `isUnlocked` flag is false → render `<PinLoginScreen />`.
5. Otherwise render the normal `<Stack />`.

The setup wizard has three steps inside one screen (step indicator: dots):

1. **Enter PIN.** Numeric keypad, 6 dots fill in as digits are entered. No advance button — moves to step 2 automatically when 6 digits are typed.
2. **Confirm PIN.** Same UI. If the second entry does not match, snap back to step 1 with an error message and clear the buffers.
3. **Recovery question.** Show three preset questions in a chip group:
   - "Nama hewan peliharaan pertama?"
   - "Nama jalan rumah masa kecil?"
   - "Hobi pertama yang kamu sukai?"

   Plus a single text input for the answer (min 3 characters, trimmed). A "Selesai" button stores the record and unlocks the app.

The wizard cannot be skipped or backed out of (Android back button is intercepted while the wizard is mounted).

### Login flow (cold start)

- After the bootstrap step finds an existing PIN record, render `<PinLoginScreen />`.
- User enters 6 digits → compute `sha256(pin + salt)` and compare with `pinHash`.
- Match → set in-memory `isUnlocked = true` in a Zustand store, render the normal `<Stack />`.
- No match → shake animation, clear the buffer, error label "PIN salah".
- No attempt counter, no lockout (per design decision).
- A "Lupa PIN?" link below the keypad opens the recovery flow.

The unlocked state is **not** persisted. If the OS kills the process, the user must re-enter the PIN. Background → foreground does not require re-entry; only a true cold start does.

### Recovery flow

`<PinRecoveryScreen />`:
1. Display the user's stored `recoveryQuestion` and a single text input.
2. User submits the answer. Normalize (`toLowerCase().trim()`) and hash with the stored salt.
3. Match → navigate to a "set new PIN" mini-flow (steps 1-2 of the setup wizard, reusing the same component). On confirm, regenerate salt and recompute both `pinHash` and `recoveryAnswerHash` (using the same answer the user just provided), then unlock.
4. No match → error label, stay on the screen.

Recovery does **not** wipe data. The DB and SecureStore record (apart from the rotated salt and hashes) are untouched.

### Settings additions

A new "Security" section is added to `settings.tsx`, above "Data & Backup":

- **Change PIN** — opens a flow that prompts for the current PIN, then runs the 2-step set-new-PIN UI. Reuses the same components as setup. Recovery question is not changed.
- **Change Recovery Question** — opens a flow that prompts for the current PIN, then shows the recovery question/answer step from setup.

There is intentionally no "Disable PIN" toggle. The PIN is mandatory.

### Components & files

New files:

- `app/auth/_layout.tsx` — bare Stack for auth subroutes (no header).
- `app/auth/setup.tsx` — wizard wrapper.
- `app/auth/login.tsx` — lock screen.
- `app/auth/recovery.tsx` — recovery question + reset PIN.
- `app/auth/change-pin.tsx` — settings entrypoint, requires current PIN then sets new.
- `app/auth/change-recovery.tsx` — settings entrypoint, requires current PIN then changes recovery Q/A.
- `src/components/numeric-keypad.tsx` — reusable 3x4 keypad (digits 0-9, blank, backspace), exposes `onDigit` / `onBackspace` callbacks.
- `src/components/pin-dots.tsx` — visual indicator (6 dots, filled/empty).
- `src/services/auth/pin-auth-service.ts` — facade over SecureStore + `expo-crypto`. API:
  ```ts
  hasPin(): Promise<boolean>
  setupPin(pin: string, recoveryQuestion: string, recoveryAnswer: string): Promise<void>
  verifyPin(pin: string): Promise<boolean>
  changePin(currentPin: string, newPin: string): Promise<void>
  changeRecovery(currentPin: string, question: string, answer: string): Promise<void>
  getRecoveryQuestion(): Promise<string | null>
  resetPinViaRecovery(answer: string, newPin: string): Promise<boolean>
  ```
- `src/services/auth/index.ts` — barrel.
- `src/stores/auth-store.ts` — Zustand store with `isUnlocked: boolean`, `unlock()`, `lock()` (for testing).

Modified files:

- `app/_layout.tsx` — add bootstrap branch that decides between `<PinSetupScreen />`, `<PinLoginScreen />`, or normal app.
- `app/(tabs)/settings.tsx` — add Security section with two action rows; add version display in About.
- `package.json` — add `expo-secure-store`, `expo-crypto`, possibly `expo-application`.

### Dependencies

To be installed:

- `expo-secure-store` (required) — already provided by Expo, simple `npx expo install` invocation.
- `expo-crypto` (required for hashing) — same.
- `expo-application` (optional but recommended) — for native build number in version display.

### Background / app state behavior

Cold start only. The PIN screen is decided at mount time of `RootLayout`. `AppState` is **not** observed — backgrounded apps that come back to the foreground are not re-prompted.

A consequence: if the OS keeps the JS bundle alive across long backgrounding, the user does not see the PIN screen again. This is acceptable for the "anti-intip" threat model and aligns with the user's chosen "Hanya cold start" preference.

### Error handling

- SecureStore read errors at bootstrap → render an error screen with a "Coba lagi" button (same pattern as the existing DB bootstrap error). The app cannot proceed without knowing whether a PIN exists.
- Crypto failures during hashing → show inline error "Gagal memproses PIN. Coba lagi.", reset buffer.
- Recovery answer comparison is constant-time avoided intentionally — for a 6-digit PIN with no online attacker, timing leaks are not a concern. SHA-256 is fast enough that this is fine.

### Manual verification checklist

(Will be added to `docs/manual-qa-script.md` as a new section.)

1. Fresh install → setup wizard appears immediately after DB bootstrap.
2. Setup wizard rejects mismatched PIN confirmation and restarts step 1.
3. Setup wizard rejects empty / too-short recovery answer.
4. Successful setup → land on Home tab.
5. Force stop the app → reopen → PIN login appears.
6. Wrong PIN → shake + error, no lockout, can keep trying.
7. Correct PIN → unlock, see Home.
8. Background app for 30 seconds → return → no re-prompt (cold start only).
9. Tap "Lupa PIN?" → recovery question shown → wrong answer → error.
10. Recovery → correct answer → set new PIN → unlocks.
11. Settings → Security → Change PIN → wrong current PIN rejected, correct one allows new PIN.
12. Settings → Security → Change Recovery → similar.
13. Settings → About shows app version (and build number if available).

### Risks & open questions

- **No automated tests.** The repo currently has no test runner. Auth logic is small enough that manual QA is acceptable for v1, but `pin-auth-service.ts` is a candidate for a future Vitest/Jest setup.
- **SecureStore failure modes on Android.** On certain devices Keystore can be reset by the user clearing app data; the app behaves correctly here (no PIN found → setup wizard) but this could be confusing if a user thinks their data is gone. Document in QA notes.
- **Recovery question social engineering.** A roommate or partner can often guess "first pet" answers. This is acceptable for the chosen threat model ("anti-intip"); a future iteration could add biometric or replace recovery with "wipe data".

## Out-of-scope follow-ups

These are intentionally deferred:

- Biometric unlock as a shortcut (requires `expo-local-authentication`).
- DB encryption (requires `expo-sqlite/next` or `op-sqlite` with sqlcipher).
- Auto-lock after N minutes in background (requires `AppState` observer + grace period config).
- Per-attempt rate limiting / lockout.
- Settings entry to view recovery question (without going through change flow).
