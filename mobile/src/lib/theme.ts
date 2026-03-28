// Design tokens inspired by Bluesky's design system
// Source: github.com/bluesky-social/social-app

export const colors = {
  // Brand
  primary: "#3B82F6",
  primaryLight: "#1E3A5F",
  primaryDark: "#60A5FA",

  // Backgrounds
  bg: "#0A0A0F",
  bgCard: "#16161E",
  bgInput: "#1E1E2E",

  // Borders
  border: "#2A2A3C",
  borderFocus: "#3B82F6",

  // Text
  textPrimary: "#E8E8F0",
  textSecondary: "#8888A4",
  textMuted: "#5C5C74",
  textInverted: "#0A0A0F",

  // Semantic
  success: "#22C55E",
  successBg: "#0D2818",
  danger: "#EF4444",
  dangerBg: "#2D1114",
  warning: "#FBBF24",
  warningBg: "#2D2410",

  // Gray scale (dark palette)
  gray1: "#0A0A0F",
  gray2: "#1E1E2E",
  gray3: "#2A2A3C",
  gray4: "#4A4A64",
  gray5: "#5C5C74",
  gray6: "#8888A4",
  gray7: "#B0B0C4",
  gray8: "#E8E8F0",
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
