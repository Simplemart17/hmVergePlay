const palette = {
  // Dark Theme Base
  neutral100: "#FFFFFF",
  neutral200: "#E6E6E8",
  neutral300: "#A0A0B0", // Light Gray text
  neutral400: "#6E6E7A",
  neutral500: "#4A4A55",
  neutral600: "#2C2C35", // Surface Lighter
  neutral700: "#1F1F28", // Surface
  neutral800: "#13131A", // Background Lighter
  neutral900: "#0A0A0E", // Background Darkest

  // Brand / Accent Colors (Neon/Cyberpunk vibe)
  primary100: "#CCF9FF",
  primary200: "#80EDFF",
  primary300: "#33E1FF",
  primary400: "#00C8EB",
  primary500: "#00A8C6", // Main Cyan
  primary600: "#007A99",

  secondary100: "#F2D9FF",
  secondary200: "#E0A3FF",
  secondary300: "#CB66FF",
  secondary400: "#B026FF",
  secondary500: "#8A00D4", // Electric Purple

  // Status
  angry100: "#FFD9D9",
  angry500: "#FF2E2E",
  success100: "#D9FFD9",
  success500: "#00E05D",

  overlay20: "rgba(10, 10, 14, 0.2)",
  overlay50: "rgba(10, 10, 14, 0.5)",
  overlay80: "rgba(10, 10, 14, 0.8)",

  glass10: "rgba(255, 255, 255, 0.1)",
  glass20: "rgba(255, 255, 255, 0.2)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",

  text: palette.neutral100,
  textDim: palette.neutral300,
  textDark: palette.neutral900,

  background: palette.neutral900,
  backgroundLite: palette.neutral800,

  border: palette.neutral600,
  borderLite: palette.glass10,

  tint: palette.primary500,
  tintSecondary: palette.secondary500,
  tintInactive: palette.neutral500,

  separator: palette.neutral700,

  error: palette.angry500,
  errorBackground: palette.angry100,

  success: palette.success500,

  surface: palette.neutral800,
  surfaceHighlight: palette.neutral700,

  glass: palette.glass10,
} as const
