export type MonthYear = {
  year: number;
  month: number; // 0-indexed (0 = January)
};

export type WorkoutCalendarState = {
  currentMonth: MonthYear;
  completedDates: Set<string>; // ISO date strings "YYYY-MM-DD"
};