export type ExerciseSeed = {
  id: string;
  name: string;
  muscle_group: string;
  equipment_type: string;
  is_favorite: 0 | 1;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipmentType: string;
  isFavorite: boolean;
};
