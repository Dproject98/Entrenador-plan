// Design tokens inspired by Bluesky's design system
// Source: github.com/bluesky-social/social-app

export const colors = {
  // Brand
  primary: "#0066FF",
  primaryLight: "#EBF3FF",
  primaryDark: "#0044BB",

  // Backgrounds
  bg: "#F3F3F8",
  bgCard: "#FFFFFF",
  bgInput: "#FFFFFF",

  // Borders
  border: "#E0E0E8",
  borderFocus: "#0066FF",

  // Text
  textPrimary: "#141417",
  textSecondary: "#6B6B8A",
  textMuted: "#9999B0",
  textInverted: "#FFFFFF",

  // Semantic
  success: "#16a34a",
  successBg: "#F0FDF4",
  danger: "#E53935",
  dangerBg: "#FFF1F2",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",

  // Gray scale (Bluesky palette)
  gray1: "#F3F3F8",
  gray2: "#E8E8F0",
  gray3: "#D4D4E0",
  gray4: "#ABABC4",
  gray5: "#7C7C96",
  gray6: "#4F4F67",
  gray7: "#2E2E45",
  gray8: "#141417",
} as const;

export const typography = {
  // Font sizes (Bluesky scale: 9–18px)
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 28,

  // Font weights
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,

  // Line heights (1.3× multiplier)
  lineHeightTight: 1.2,
  lineHeightNormal: 1.4,
  lineHeightRelaxed: 1.6,
} as const;

export const spacing = {
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 999, // pill — Bluesky signature button shape
} as const;

export const shadow = {
  // Bluesky uses borders, not shadows — keep minimal
  none: {},
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;
