import { Platform } from "react-native";

export const colors = {
  ink: "#111111",
  mutedInk: "#6B6B66",
  fog: "#F4F2ED",
  paper: "#FFFDF8",
  line: "#DDD8CF",
  coral: "#8E6B4D",
  coralDark: "#4B3528",
  teal: "#111111",
  tealSoft: "#EEEAE2",
  gold: "#B39B72",
  plum: "#2A2926"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 8,
  pill: 999
};

export const shadows = {
  card:
    Platform.select({
      web: {
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)"
      },
      default: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3
      }
    }) ?? {}
};
