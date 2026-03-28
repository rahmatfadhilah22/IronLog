# IronLog Manual QA Script

## Purpose
Manual end-to-end screening script for the current IronLog MVP on Android device.

Use this script to validate the main user flow:
- routine creation and editing
- custom exercise creation
- workout logging
- workout completion
- progress tracking
- body metrics
- settings and backup flow

## Test Environment
- Device: Android phone with Expo Go
- Build: latest local bundle from this repo
- App state: test both fresh data and existing data where noted
- Network: not important for core app flow because app is local-first

## Tester Notes
- Mark each case as `PASS`, `FAIL`, or `PARTIAL`
- If a case fails, capture:
  - step number
  - actual result
  - screenshot if UI issue
  - whether issue blocks core flow

## Suggested Test Data
- Routine name: `Pull Days`
- Routine description: `Membentuk otot back dan biceps.`
- Custom exercise: `Lari`
- Custom muscle group: `Cardio`
- Custom equipment type: `Outdoor`
- Default exercise examples:
  - `Pull-Up`
  - `Conventional Deadlift`
  - `Barbell Row`
- Workout sample sets:
  - `50 kg x 10`
  - `60 kg x 8`
  - `50 lb x 10`
- Body weight sample:
  - `84.2`
  - `83.8`

---

## Section A: Fresh App Entry

### A1. Home Loads Correctly
Steps:
1. Open app.
2. Wait until initial loading is finished.

Expected:
- Home screen loads without crash.
- Main CTA is visible.
- No broken placeholder or empty loading state remains.

Result:
- Status:
- Notes:

### A2. Tab Navigation
Steps:
1. Open each tab: `Home`, `Routines`, `Progress`, `Settings`.
2. Return to `Home`.

Expected:
- All tabs open correctly.
- Active tab icon/state updates properly.
- No visual overlap with native Android bottom area.

Result:
- Status:
- Notes:

---

## Section B: Routine Flow

### B1. Create First Routine
Steps:
1. Go to `Routines`.
2. Tap `New Routine`.
3. Fill routine name and description.
4. Tap `Add Exercise`.
5. Add 2 default exercises.
6. Save routine.

Expected:
- Routine is saved successfully.
- User lands on routine detail screen or routine list with saved data visible.
- Exercise count is correct.

Result:
- Status:
- Notes:

### B2. Create Custom Exercise From Picker
Steps:
1. In routine detail, tap `Add Exercise`.
2. Open `Create Custom Exercise`.
3. Fill:
   - Name: `Lari`
   - Muscle group: `Cardio`
   - Equipment type: `Outdoor`
4. Save and add.

Expected:
- Custom exercise is created.
- It is attached to the current routine immediately.
- It appears with the correct metadata.

Result:
- Status:
- Notes:

### B3. Reorder Routine Exercises
Steps:
1. In routine detail, use `UP` and `DOWN` on several exercises.
2. Move one item to middle position.
3. Save routine.
4. Leave screen and reopen the same routine.

Expected:
- Order updates visually.
- First item cannot move further up.
- Last item cannot move further down.
- Saved order persists after reopening.

Result:
- Status:
- Notes:

### B4. Remove Exercise With Confirmation
Steps:
1. In routine detail, tap `REMOVE` on one exercise.
2. In dialog, tap `Cancel`.
3. Tap `REMOVE` again.
4. Confirm removal.

Expected:
- Cancel keeps the exercise.
- Confirm removes the exercise.
- Removal dialog uses themed confirmation modal, not default white system alert.

Result:
- Status:
- Notes:

### B5. Rest Time Editing
Steps:
1. Change `REST (SEC)` on at least two exercises.
2. Save routine.
3. Leave and reopen routine detail.

Expected:
- Rest times are saved correctly.
- Values persist after reopen.

Result:
- Status:
- Notes:

---

## Section C: Active Workout Flow

### C1. Start Workout
Steps:
1. Open a routine detail screen.
2. Tap `Start Workout`.

Expected:
- Active workout screen opens.
- Exercise queue reflects routine order.
- No duplicate active workout is created if one already exists.

Result:
- Status:
- Notes:

### C2. Continue Existing Workout
Steps:
1. Start a workout.
2. Log at least one set.
3. Go back to Home or Routines without finishing.
4. Open the same routine detail again.

Expected:
- Primary CTA changes to `Continue Workout`.
- Tapping it opens the same active workout.
- It does not create a second active workout.

Result:
- Status:
- Notes:

### C3. Add Sets
Steps:
1. On active workout, choose one exercise.
2. Add one set in `kg`.
3. Add another set in `lb`.
4. Add another set with different reps.

Expected:
- Sets are added successfully.
- Set list updates immediately.
- Chosen unit is preserved per set.

Result:
- Status:
- Notes:

### C4. Edit And Delete Set
Steps:
1. Edit one logged set.
2. Save the update.
3. Delete one logged set.
4. Confirm deletion in dialog.

Expected:
- Edited set reflects new values.
- Delete requires confirmation.
- Deleted set disappears from the list.

Result:
- Status:
- Notes:

### C5. Add Exercise Block During Workout
Steps:
1. On active workout, tap `Add Exercise Block`.
2. Add one default exercise or custom exercise.

Expected:
- New block appears in workout queue.
- User can switch to it and log sets.

Result:
- Status:
- Notes:

### C6. Rest Timer
Steps:
1. Ensure `Auto Start Rest Timer` is enabled in Settings.
2. Return to active workout.
3. Complete a set on an exercise that has rest time > 0.

Expected:
- Rest timer modal opens automatically after set completion.

Result:
- Status:
- Notes:

### C7. Finish Workout
Steps:
1. Tap `Finish`.
2. Observe confirmation dialog.
3. Confirm finish.

Expected:
- Finish uses themed dialog.
- Confirm action is green/accent, not destructive red.
- Workout closes and user goes to summary screen.

Result:
- Status:
- Notes:

---

## Section D: Workout Summary Flow

### D1. Summary Loads
Steps:
1. Finish a workout.
2. Wait for summary screen.

Expected:
- Summary shows:
  - workout title
  - completion time
  - total volume
  - duration
  - total sets
  - top set

Result:
- Status:
- Notes:

### D2. Summary Navigation
Steps:
1. Tap `View Progress`.
2. Go back.
3. Tap `Done`.

Expected:
- `View Progress` opens exercise progress for the top set exercise.
- `Done` returns to Home.

Result:
- Status:
- Notes:

---

## Section E: Progress Flow

### E1. Progress Overview
Steps:
1. Open `Progress` tab after completing at least one workout.

Expected:
- Summary cards load.
- `Best Lifts` section appears.
- `Exercise History` list appears.

Result:
- Status:
- Notes:

### E2. Exercise Search
Steps:
1. Search for a known exercise.
2. Search for a custom exercise if available.

Expected:
- Search filters the list correctly.
- Result list remains usable and stable while typing.

Result:
- Status:
- Notes:

### E3. Exercise Progress Detail
Steps:
1. Open one exercise from Progress.
2. Change range between `30d`, `90d`, and `all`.
3. Review `Trend Snapshot`.
4. Review `Session History`.

Expected:
- Range switch updates the content.
- `Trend Snapshot` changes with selected metric:
  - `Weight`
  - `Volume`
  - `1RM`
- `Session History` shows one row per completed session.

Result:
- Status:
- Notes:

### E4. Body Metrics
Steps:
1. From Progress, open `Body Metrics`.
2. Add one new entry.
3. Add a second entry.

Expected:
- Entries save correctly.
- Latest value updates.
- Delta from previous entry appears if two entries exist.
- History is visible.

Result:
- Status:
- Notes:

---

## Section F: Settings And Backup

### F1. Unit Setting
Steps:
1. Open `Settings`.
2. Switch between `KG` and `LB`.
3. Return to Progress and Workout Summary if data exists.

Expected:
- Unit setting saves.
- Relevant screens reflect the selected unit.

Result:
- Status:
- Notes:

### F2. 1RM Formula Setting
Steps:
1. In `Settings`, switch formula between `Brzycki` and `Epley`.
2. Return to Exercise Progress.

Expected:
- Formula saves.
- Estimated 1RM-related values update accordingly.

Result:
- Status:
- Notes:

### F3. Auto Start Rest Timer Setting
Steps:
1. Turn `Auto Start Rest Timer` off.
2. Return to active workout and complete a set.
3. Turn it on again.
4. Complete another set.

Expected:
- Off: rest timer does not auto-open.
- On: rest timer auto-opens.

Result:
- Status:
- Notes:

### F4. Export JSON Backup
Steps:
1. Tap `Export JSON`.
2. Complete share/save flow if prompted.

Expected:
- Export succeeds.
- Success message appears.
- File name follows backup naming convention.

Result:
- Status:
- Notes:

### F5. Export CSV Analytics
Steps:
1. Tap `Export CSV`.

Expected:
- Export succeeds.
- CSV file is generated and shareable.

Result:
- Status:
- Notes:

### F6. Import JSON Backup
Steps:
1. Prepare an exported JSON backup.
2. Tap `Import JSON`.
3. Select the backup file.
4. Observe confirmation dialog.
5. Confirm restore.

Expected:
- Themed confirmation dialog appears.
- Restore completes successfully.
- Data remains usable after restore.

Result:
- Status:
- Notes:

---

## Section G: Regression Notes

### G1. No Unexpected White Native Alerts
Check:
- Remove exercise
- Delete set
- Finish workout
- Restore backup

Expected:
- All use themed confirmation dialog.

Result:
- Status:
- Notes:

### G2. Active Workout Single Source Of Truth
Check:
1. Start a workout.
2. Try re-entering from Home and Routine Detail.

Expected:
- Only one active workout exists.
- User is routed back into the same active workout.

Result:
- Status:
- Notes:

### G3. App Reopen
Check:
1. Leave app while workout is active.
2. Reopen app.

Expected:
- Active workout is still recoverable.
- Home shows `Continue Workout`.

Result:
- Status:
- Notes:

---

## Exit Criteria
App is considered ready for the next step if:
- all core flow cases in Sections B, C, D, E, and F pass
- no blocker bug appears in create routine, active workout, finish workout, progress, or backup restore
- visual issues, if any, are minor and non-blocking
