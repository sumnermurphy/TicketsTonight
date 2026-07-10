import { Platform } from "react-native";

export const colors = {
  ink: "#1A1A1A",
  mutedInk: "#5E5A52",
  fog: "#FAF6EF",
  paper: "#FFFDF7",
  line: "#E7E4DE",
  coral: "#D64S45",
  coralDark: "#A74338",
  teal: "#0D3B2E",
  tealSoft: "#E6EFEA",
  gold: "#C8A15A",
  plum: "#6A58FF",
  stone: "#E7E4DE",
  mist: "#EFE6E1",
  fogBlue: "#A9B8D0",
  success: "#2E7D57",
  warning: "#F0A64A",
  special: "#6A58FF"
};

export const brandColors = {
  galleryWhite: "#FFFDF7",
  warmCanvas: "#FAF6EF",
  forestGreen: "#0D3B2E",
  forestSoft: "#E6EFEA",
  brass: "#C8A15A",
  charcoal: "#1A1A1A",
  graphite: "#1A1A1A",
  graphiteMuted: "#5E5A52",
  stone: "#E7E4DE",
  mist: "#EFE6E1",
  fogBlue: "#A9B8D0",
  clay: "#D64S45",
  claySoft: "#F6E3DC",
  special: "#6A58FF",
  divider: "#E7E4DE"
};

export const walkerColors = {
  forest: "#0D3B2E",
  brass: "#C8A15A",
  charcoal: "#1A1A1A",
  stone: "#E7E4DE",
  warmCream: "#FAF6EF",
  paper: "#FFFDF7",
  mist: "#EFE6E1",
  fogBlue: "#A9B8D0",
  open: "#2E7D57",
  closing: "#F0A64A",
  closed: "#D64S45",
  special: "#6A58FF",
  divider: "#E7E4DE"
};

export const typeScale = {
  eyebrow: 11,
  caption: 12,
  body: 14,
  title: 18,
  section: 22,
  hero: 34,
  display: 40
};

export const walkerType = {
  displayFamily: Platform.select({
    web: "'Walker Display', 'EB Garamond', Georgia, 'Times New Roman', serif",
    default: "serif"
  }),
  uiFamily: Platform.select({
    web: "'Walker Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    default: undefined
  }),
  display: { fontSize: 40, lineHeight: 48 },
  h1: { fontSize: 28, lineHeight: 36 },
  h2: { fontSize: 22, lineHeight: 28 },
  h3: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16 },
  overline: { fontSize: 11, lineHeight: 14 }
};

export const walkerSpacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const walkerRadii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999
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
    backgroundColor: brandColors.forestSoft,
    borderColor: "#CADBD1",
    borderWidth: 1
  },
  walkerCard: {
    backgroundColor: walkerColors.paper,
    borderColor: walkerColors.divider,
    borderRadius: walkerRadii.lg,
    borderWidth: 1
  },
  walkerSheet: {
    backgroundColor: walkerColors.paper,
    borderColor: walkerColors.divider,
    borderRadius: walkerRadii.xl,
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
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999
};

export const walkerShadows = {
  card:
    Platform.select({
      web: {
        boxShadow: "0 2px 12px rgba(13, 59, 46, 0.08)"
      },
      default: {
        shadowColor: "#0D3B2E",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3
      }
    }) ?? {}
};

export const shadows = walkerShadows;
