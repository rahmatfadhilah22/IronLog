import { useState, useEffect, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { themeTokens } from "../core/theme";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  }).toUpperCase();
}

function toIsoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function CalendarHeatmap() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());

  const loadMonth = useCallback(async () => {
    const { analyticsService } = await import("../services/analytics");
    const days = await analyticsService.getWorkoutCalendarByMonth(month, year);
    setWorkoutDates(new Set(days.map((d) => d.date)));
  }, [month, year]);

  useEffect(() => { loadMonth(); }, [loadMonth]);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else { setMonth(m => m - 1); }
  };

  const prevThreeMonths = () => {
    const newMonth = month - 3;
    if (newMonth < 0) {
      setYear(y => y - 1);
      setMonth(newMonth + 12);
    } else {
      setMonth(newMonth);
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayStr = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <View style={styles.navLeft}>
          <Pressable style={styles.navBtn} onPress={prevThreeMonths}>
            <Text style={styles.navArrow}>◀◀</Text>
          </Pressable>
          <Pressable style={styles.navBtn} onPress={prevMonth}>
            <Text style={styles.navArrow}>◀</Text>
          </Pressable>
        </View>
        <Text style={styles.monthLabel}>{formatMonthYear(year, month)}</Text>
        <View style={styles.navRight}>
          <Pressable style={styles.navBtn} onPress={() => {
            if (month === 11) { setYear(y => y + 1); setMonth(0); }
            else { setMonth(m => m + 1); }
          }}>
            <Text style={styles.navArrow}>▶</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.dayLabels}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.cell} />;
          }
          const dateStr = toIsoDate(year, month, day);
          const hasWorkout = workoutDates.has(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <View key={day} style={styles.cell}>
              <View
                style={[
                  styles.dayDot,
                  hasWorkout && styles.dayDotActive,
                  isToday && styles.dayDotToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    isToday && styles.dayNumToday,
                    hasWorkout && styles.dayNumActive,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.dayDotActive]} />
          <Text style={styles.legendLabel}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.dayDotToday]} />
          <Text style={styles.legendLabel}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendSwatch} />
          <Text style={styles.legendLabel}>Rest</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: themeTokens.colors.surfaceLow,
    borderRadius: themeTokens.radius.sm,
    padding: themeTokens.spacing.md,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: themeTokens.spacing.sm,
  },
  navBtn: {
    minWidth: 40,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  navLeft: {
    flexDirection: "row",
    gap: themeTokens.spacing.xs,
  },
  navRight: {
    flexDirection: "row",
  },
  navArrow: {
    color: themeTokens.colors.accentPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  monthLabel: {
    color: themeTokens.colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  dayLabels: {
    flexDirection: "row",
    marginBottom: themeTokens.spacing.xs,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    color: themeTokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotActive: {
    backgroundColor: themeTokens.colors.accentPrimary,
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: themeTokens.colors.textPrimary,
  },
  dayNum: {
    color: themeTokens.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  dayNumToday: {
    color: themeTokens.colors.textPrimary,
    fontWeight: "800",
  },
  dayNumActive: {
    color: themeTokens.colors.backgroundDeep,
    fontWeight: "800",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: themeTokens.spacing.sm,
    paddingTop: themeTokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: themeTokens.colors.surfaceHigh,
    gap: themeTokens.spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: themeTokens.spacing.xs,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: themeTokens.colors.surfaceHigh,
  },
  legendLabel: {
    color: themeTokens.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});