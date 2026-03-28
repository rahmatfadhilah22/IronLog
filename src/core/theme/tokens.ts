export const themeTokens = {
  colors: {
    background: "#131313",
    backgroundDeep: "#0E0E0E",
    surfaceLow: "#1C1B1B",
    surfaceHigh: "#2A2A2A",
    surfaceHighest: "#353534",
    textPrimary: "#E5E2E1",
    textSecondary: "#ABAAA8",
    accentPrimary: "#CCFF00",
    accentDim: "#ABD600",
    danger: "#A63C2D",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  typography: {
    display: {
      fontFamily: "SpaceGrotesk-Bold",
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: 0.6,
    },
    title: {
      fontFamily: "SpaceGrotesk-Bold",
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: 0.4,
    },
    body: {
      fontFamily: "Inter-Regular",
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0.2,
    },
    label: {
      fontFamily: "Inter-SemiBold",
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 1,
    },
  },
} as const;

export type ThemeTokens = typeof themeTokens;
