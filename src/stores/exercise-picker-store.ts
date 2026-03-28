import { create } from "zustand";

type ExercisePickerSelection = {
  requestKey: string;
  exerciseId: string;
  pickedAt: string;
};

type ExercisePickerStore = {
  activeRequestKey: string | null;
  picked: ExercisePickerSelection | null;
  beginRequest: (requestKey: string) => void;
  pickExercise: (requestKey: string, exerciseId: string) => void;
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
        exerciseId,
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
