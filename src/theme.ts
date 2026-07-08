import { Platform } from "react-native";

export const colors = {
  ink: "#171C24",
  mutedInk: "#59606B",
  fog: "#F5F6F4",
  paper: "#FFFDFC",
  line: "#DCD8CF",
  coral: "#E7563C",
  coralDark: "#B73A26",
  teal: "#0D7C75",
  tealSoft: "#DFF1EE",
  gold: "#D9A441",
  plum: "#5C496A"
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
  lg: 14,
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
