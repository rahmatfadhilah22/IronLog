import { create } from "zustand";

type ExercisePickerSelection = {
  requestKey: string;
  exerciseIds: string[];
  pickedAt: string;
};

type ExercisePickerStore = {
  activeRequestKey: string | null;
  picked: ExercisePickerSelection | null;
  beginRequest: (requestKey: string) => void;
  pickExercise: (requestKey: string, exerciseId: string) => void;
  submitExercises: (requestKey: string, exerciseIds: string[]) => void;
  clearPicked: () => void;
};

export const useExercisePickerStore = create<ExercisePickerStore>((set, get) => ({
  activeRequestKey: null,
  picked: null,
  beginRequest: (requestKey) => {
    set({
      activeRequestKey: requestKey,
      picked: null,
    });
  },
  pickExercise: (requestKey, exerciseId) => {
    if (get().activeRequestKey !== requestKey) {
      return;
    }

    set({
      picked: {
        requestKey,
        exerciseIds: [exerciseId],
        pickedAt: String(Date.now()),
      },
    });
  },
  submitExercises: (requestKey, exerciseIds) => {
    if (get().activeRequestKey !== requestKey || exerciseIds.length === 0) {
      return;
    }

    set({
      picked: {
        requestKey,
        exerciseIds,
        pickedAt: String(Date.now()),
      },
    });
  },
  clearPicked: () => {
    set({
      activeRequestKey: null,
      picked: null,
    });
  },
}));
