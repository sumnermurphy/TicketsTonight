import { Platform } from "react-native";

export const colors = {
  ink: "#242423",
  mutedInk: "#696862",
  fog: "#F6F2EA",
  paper: "#FFFDF7",
  line: "#E4DED2",
  coral: "#B8664F",
  coralDark: "#7C3F32",
  teal: "#214E8A",
  tealSoft: "#E8EEF5",
  gold: "#B89B66",
  plum: "#2F2E34"
};

export const brandColors = {
  galleryWhite: "#FFFDF7",
  warmCanvas: "#F6F2EA",
  graphite: "#242423",
  graphiteMuted: "#696862",
  ultramarine: "#214E8A",
  ultramarineSoft: "#E8EEF5",
  clay: "#B8664F",
  claySoft: "#F2E4DC",
  moss: "#60735C",
  divider: "#E4DED2"
};

export const typeScale = {
  eyebrow: 11,
  caption: 12,
  body: 14,
  title: 18,
  section: 22,
  hero: 34
};

export const surfaceStyles = {
  hairline: {
    borderColor: brandColors.divider,
    borderWidth: 1
  },
  quietCard: {
    backgroundColor: brandColors.galleryWhite,
    borderColor: brandColors.divider,
    borderWidth: 1
  },
  accentCard: {
    backgroundColor: brandColors.ultramarineSoft,
    borderColor: "#D5DFEB",
    borderWidth: 1
  }
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
