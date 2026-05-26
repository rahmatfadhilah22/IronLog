import { create } from "zustand";

interface RestTimerState {
  endsAtTimestamp: number | null;
  exerciseName: string | null;
  initialSeconds: number | null;
  startTimer: (endsAt: number, exerciseName: string, initialSeconds: number) => void;
  stopTimer: () => void;
  extendTimer: (additionalSeconds: number) => void;
}

export const useRestTimerStore = create<RestTimerState>((set) => ({
  endsAtTimestamp: null,
  exerciseName: null,
  initialSeconds: null,
  startTimer: (endsAtTimestamp, exerciseName, initialSeconds) =>
    set({ endsAtTimestamp, exerciseName, initialSeconds }),
  stopTimer: () =>
    set({ endsAtTimestamp: null, exerciseName: null, initialSeconds: null }),
  extendTimer: (additionalSeconds) =>
    set((state) => {
      if (!state.endsAtTimestamp) return state;
      return {
        endsAtTimestamp: Math.max(state.endsAtTimestamp, Date.now()) + additionalSeconds * 1000,
      };
    }),
}));
