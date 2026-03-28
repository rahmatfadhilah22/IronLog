# Build Plan — IronLog React Native MVP

## Phase 1. Project Bootstrap
- create Expo TypeScript app
- set up Expo Router
- set up theme tokens and base layout
- install SQLite, file handling, sharing, Zustand, chart library
- add lint/format/typecheck baseline

## Phase 2. Database Foundation
- define SQLite schema
- create migration runner
- add seed for exercise library
- implement repository layer
- implement transaction helper

## Phase 3. Core Domain Services
- workout service
- routine service
- analytics service
- backup service
- settings service

## Phase 4. Main Screens
- Home
- Routine List
- Create/Edit Routine
- Exercise Picker
- Active Workout Logger
- Rest Timer Overlay
- Workout Summary

## Phase 5. Analytics and Metrics
- Progress Overview
- Exercise Progress Detail
- Body Metrics screen
- `exercise_stats` rebuild flow

## Phase 6. Settings and Backup
- settings persistence
- export JSON
- export CSV
- import JSON with destructive confirmation

## Phase 7. Hardening
- restore active workout on reopen
- empty/error states
- performance pass on logger screen
- manual QA checklist

## Definition of Done
- app boots on Expo
- no backend dependency
- migrations run on clean install
- seed data exists
- create routine works
- active workout logger works
- progress charts render from SQLite data
- import/export works end-to-end
