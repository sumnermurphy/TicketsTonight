import { StatusBar } from "expo-status-bar";
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Heart,
  Home,
  ListChecks,
  MapPin,
  MessageSquare,
  NotebookPen,
  Route,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  type DimensionValue,
  type ImageSourcePropType,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import Svg, { Polyline } from "react-native-svg";

import {
  galleryAreas,
  galleryExhibitions,
  galleryNeighborhoods
} from "./data/galleryCatalog";
import { galleryQuizArtworks } from "./data/galleryQuizArtworks";
import { gallerySourceCandidates } from "./data/gallerySources";
import {
  createGalleryWalkPlanFromStopIds,
  createGallerySourceTrustSummary,
  createGalleryWalkPlan,
  createNeighborhoodIntelligence,
  filterGalleryExhibitions,
  getGalleryInventoryTrust,
  galleryVisitStatusLabels,
  galleryWalkModeLabels,
  getDaysUntilGalleryCloses,
  getGalleryRouteSwapCandidates,
  getGalleryVisitStatus,
  getGalleryWhyGoReasons,
  getLastChanceGalleryAlerts,
  getSavedGalleryIdsFromLog,
  isGalleryOpeningTonight,
  upsertGalleryLogEntry,
  type GalleryRouteSwapCandidate,
  type GalleryWalkMode
} from "./services/galleryDiscovery";
import {
  clearGalleryAppPersistedState,
  readGalleryAppPersistedState,
  writeGalleryAppPersistedState,
  type GalleryFirstRunChoice,
  type GalleryPersistedLens
} from "./services/galleryAppPersistence";
import {
  completeGalleryBetaTask,
  createGalleryBetaReviewReport,
  createGalleryBetaFeedback,
  createGalleryRouteUsabilityReport,
  getPersonalizationLearningSummary,
  getGalleryBetaTasks,
  type GalleryBetaFeedback,
  type GalleryBetaFeedbackKind,
  type GalleryBetaTaskId,
  type GalleryBetaTaskProgress,
  type GalleryPersonalizationLearningSummary,
  type GalleryRouteUsabilityReport
} from "./services/galleryBetaReadiness";
import { createGalleryMarketDataAudit } from "./services/galleryDataFoundation";
import {
  createWalkerImageReadinessReport,
  createWalkerImageSystemSummary,
  getGalleryVisual,
  getWalkerExhibitionBanner,
  getWalkerVisualForRole,
  type GalleryVisualKey,
  type WalkerImageSystemSummary
} from "./services/galleryVisuals";
import {
  completeGalleryWalk,
  createGalleryWalkSession,
  getActiveWalkProgress,
  getGalleryWalkRecap,
  markGalleryWalkStopVisited,
  replaceGalleryWalkSessionStop,
  skipGalleryWalkStop,
  type GalleryWalkRecap,
  type GalleryWalkProgress,
  type GalleryWalkSession,
  type GalleryWalkStopProgress
} from "./services/galleryWalkSession";
import {
  applyGalleryConciergeSuggestion,
  createGalleryConciergeSuggestions,
  type GalleryConciergeSuggestion
} from "./services/galleryConcierge";
import {
  createGalleryEventSignals,
  createOpeningNightConciergePlan,
  type GalleryEventRouteIntent,
  type GalleryEventSignal
} from "./services/galleryEventIntelligence";
import {
  applyGalleryTasteFeedback,
  createGalleryQuests,
  createPersonalizedGalleryWalkPlan,
  deriveTastePassportFromBehavior,
  deriveTastePassportFromQuiz,
  getGalleryPassportBadges,
  getGalleryPassportStamps,
  getGalleryConciergeReasons,
  mergeGalleryTastePassports,
  rankGalleryExhibitionsForTaste,
  type GalleryEditableTastePreference,
  type GalleryPassportBadge,
  type GalleryPassportStamp,
  type GalleryPersonalizedPick,
  type GalleryQuest,
  type GalleryQuizAnswer,
  type GalleryQuizArtwork,
  type GalleryQuizResponse,
  type GalleryTasteFeedback,
  type GalleryTasteFeedbackKind,
  type GalleryTastePassport
} from "./services/galleryTastePassport";
import {
  createGalleryWalkItineraryText,
  createGalleryWalkShareSummary,
  createSavedGalleryWalk,
  type GallerySavedWalk
} from "./services/galleryWalkSharing";
import {
  createGalleryFreshnessAudit,
  createGallerySourceReceipt,
  getGalleryFreshnessState
} from "./services/galleryFreshness";
import {
  createCamogliFieldGuide,
  type CamogliFieldGuide,
  type CamogliRouteMode
} from "./services/galleryCamogliFieldMode";
import {
  createGalleryRouteMapModel,
  type GalleryRouteMapModel
} from "./services/galleryRouteMap";
import {
  createGalleryPassportMemory,
  createGalleryWalkShareCard,
  getWalkerMemorySummary,
  type GalleryPassportMemory,
  type GalleryWalkShareCard
} from "./services/galleryPassportMemory";
import {
  createWalkerCompletedWalkShareCard,
  createWalkerReactionLogEntry,
  createWalkerStopReaction,
  getWalkerStopArrivalPrompt,
  walkerReactionLabels,
  walkerReactionOptions,
  type WalkerCompletedWalkShareCard,
  type WalkerReactionKind,
  type WalkerStopReaction
} from "./services/walkerJourneyMoments";
import {
  createWalkerFieldTestGuide,
  createWalkerOfflineReadinessSummary,
  createWalkerRouteMapHandoff,
  createWalkerWalkReadinessReport,
  getWalkerStartPointOptions,
  type WalkerFieldTestGuide,
  type WalkerOfflineReadinessSummary,
  type WalkerRouteMapHandoff,
  type WalkerStartPointMode,
  type WalkerStartPointOption,
  type WalkerStartPointPreference,
  type WalkerWalkReadinessReport
} from "./services/walkerFieldReadiness";
import { colors, radii, shadows, spacing, walkerType } from "./theme";
import type {
  GalleryAreaId,
  GalleryExhibition,
  GalleryLogEntry,
  GalleryLogStatus,
  GalleryMedium
} from "./types";

type GalleryLens = GalleryPersistedLens;
type GalleryWalkPlan = ReturnType<typeof createGalleryWalkPlan>;
type GalleryWalkStop = GalleryWalkPlan["stops"][number];
type WalkerJourneyStep = "walking" | "arrival" | "reaction";
type TonightFeedItem = {
  id: string;
  label: string;
  title: string;
  detail: string;
  meta: string;
  actionLabel: string;
  onPress: () => void;
};
type WalkerMobileTab = "home" | "explore" | "walks" | "saved" | "journal";
type WalkerSavedMemoryTab = "collections" | "places" | "works" | "walks";

const referenceNow = "2026-07-09T15:30:00-04:00";

declare const require: (path: string) => ImageSourcePropType;

const galleryVisualSources: Record<GalleryVisualKey, ImageSourcePropType> = {
  hero: require("../assets/gallery/gallery-hero.png"),
  painting: require("../assets/gallery/gallery-painting.png"),
  sculpture: require("../assets/gallery/gallery-sculpture.png"),
  "photo-video": require("../assets/gallery/gallery-photo-video.png"),
  "nyc-painting": require("../assets/gallery/editorial/nyc-painting.png"),
  "nyc-photo": require("../assets/gallery/editorial/nyc-photo.png"),
  "nyc-sculpture": require("../assets/gallery/editorial/nyc-sculpture.png"),
  "nyc-installation": require("../assets/gallery/editorial/nyc-installation.png"),
  "nyc-opening": require("../assets/gallery/editorial/nyc-opening.png"),
  "nyc-quiet": require("../assets/gallery/editorial/nyc-quiet.png"),
  "la-painting": require("../assets/gallery/editorial/la-painting.png"),
  "la-photo": require("../assets/gallery/editorial/la-photo.png"),
  "la-sculpture": require("../assets/gallery/editorial/la-sculpture.png"),
  "la-installation": require("../assets/gallery/editorial/la-installation.png"),
  "la-design": require("../assets/gallery/editorial/la-design.png"),
  "la-opening": require("../assets/gallery/editorial/la-opening.png"),
  "hudson-painting": require("../assets/gallery/editorial/hudson-painting.png"),
  "hudson-sculpture": require("../assets/gallery/editorial/hudson-sculpture.png"),
  "hudson-historic": require("../assets/gallery/editorial/hudson-historic.png"),
  "hudson-quiet": require("../assets/gallery/editorial/hudson-quiet.png"),
  "hudson-opening": require("../assets/gallery/editorial/hudson-opening.png"),
  "hudson-mixed": require("../assets/gallery/editorial/hudson-mixed.png"),
  "camogli-coastal": require("../assets/gallery/editorial/camogli-coastal.png"),
  "camogli-historic": require("../assets/gallery/editorial/camogli-historic.png"),
  "camogli-performance": require("../assets/gallery/editorial/camogli-performance.png"),
  "camogli-design": require("../assets/gallery/editorial/camogli-design.png"),
  "camogli-photo": require("../assets/gallery/editorial/camogli-photo.png"),
  "camogli-quiet": require("../assets/gallery/editorial/camogli-quiet.png"),
  "camogli-harbor-editorial": require("../assets/gallery/editorial/camogli-harbor-editorial.png"),
  "camogli-maritime-museum": require("../assets/gallery/editorial/camogli-maritime-museum.png"),
  "camogli-stone-lanes": require("../assets/gallery/editorial/camogli-stone-lanes.png"),
  "camogli-theatre-evening": require("../assets/gallery/editorial/camogli-theatre-evening.png"),
  "camogli-hill-sea-view": require("../assets/gallery/editorial/camogli-hill-sea-view.png"),
  "camogli-civic-library": require("../assets/gallery/editorial/camogli-civic-library.png"),
  "camogli-waterfront-heritage": require("../assets/gallery/editorial/camogli-waterfront-heritage.png"),
  "camogli-quiet-interior": require("../assets/gallery/editorial/camogli-quiet-interior.png"),
  "walker-gallery-interior": require("../assets/gallery/editorial/walker-gallery-interior.png"),
  "walker-opening-night": require("../assets/gallery/editorial/walker-opening-night.png"),
  "walker-sculpture-room": require("../assets/gallery/editorial/walker-sculpture-room.png"),
  "walker-photo-video": require("../assets/gallery/editorial/walker-photo-video.png"),
  "walker-quiet-painting": require("../assets/gallery/editorial/walker-quiet-painting.png"),
  "walker-street-approach": require("../assets/gallery/editorial/walker-street-approach.png"),
  "walker-design-detail": require("../assets/gallery/editorial/walker-design-detail.png"),
  "walker-waterfront-cultural": require("../assets/gallery/editorial/walker-waterfront-cultural.png")
};

const lensLabels: Record<GalleryLens, string> = {
  all: "All",
  "open-now": "Open now",
  "opening-tonight": "Opening tonight",
  "last-chance": "Last chance"
};

const mediumLabels: Record<GalleryMedium, string> = {
  painting: "Painting",
  photography: "Photography",
  sculpture: "Sculpture",
  installation: "Installation",
  video: "Video",
  performance: "Performance",
  design: "Design",
  prints: "Prints",
  "mixed-media": "Mixed media"
};

const logStatusLabels: Record<GalleryLogStatus, string> = {
  saved: "Saved",
  "want-to-see": "Want",
  visited: "Visited",
  skipped: "Skip"
};

const logStatusOptions: GalleryLogStatus[] = ["saved", "want-to-see", "visited", "skipped"];
const betaFeedbackKinds: GalleryBetaFeedbackKind[] = ["useful", "confusing", "broken", "wish"];
const betaFeedbackLabels: Record<GalleryBetaFeedbackKind, string> = {
  useful: "Useful",
  confusing: "Confusing",
  broken: "Broken",
  wish: "Wish"
};
const betaFeedbackQuickTags = [
  "wrong hours",
  "bad route",
  "missing place",
  "map issue",
  "closed when listed open",
  "good stop",
  "image feels wrong"
];

function getBetaFeedbackFieldTags(note: string): string[] {
  const normalizedNote = note.toLowerCase();

  return betaFeedbackQuickTags.filter((tag) => normalizedNote.includes(tag));
}

function WalkerMark({
  size = 24,
  color = colors.gold
}: {
  size?: number;
  color?: string;
}) {
  const center = size / 2;
  const outer = size - 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel="Walker compass mark">
      <Polyline
        points={`${center},1 ${center + 4},${center - 4} ${outer},${center} ${center + 4},${center + 4} ${center},${outer} ${center - 4},${center + 4} 1,${center} ${center - 4},${center - 4} ${center},1`}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Polyline
        points={`${center},${center - 7} ${center + 2},${center - 2} ${center + 7},${center} ${center + 2},${center + 2} ${center},${center + 7} ${center - 2},${center + 2} ${center - 7},${center} ${center - 2},${center - 2} ${center},${center - 7}`}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
const alertWindowOptions: Array<3 | 7 | 14> = [3, 7, 14];
const eventRouteIntentOptions: GalleryEventRouteIntent[] = [
  "social-opening",
  "quiet-verified",
  "last-look"
];
const eventRouteIntentLabels: Record<GalleryEventRouteIntent, string> = {
  "social-opening": "Social opening crawl",
  "quiet-verified": "Quiet verified walk",
  "last-look": "Last-look route"
};
const walkModeOptions: GalleryWalkMode[] = [
  "quick-loop",
  "two-hour",
  "opening-night",
  "last-chance",
  "for-you"
];
const lensOptions: GalleryLens[] = ["all", "open-now", "opening-tonight", "last-chance"];
const walkModeDetails: Record<GalleryWalkMode, string> = {
  "quick-loop": "Fastest good loop",
  "two-hour": "Deeper neighborhood pass",
  "opening-night": "Timed around receptions",
  "last-chance": "Closing soon first",
  "for-you": "Taste-ranked stops"
};

const defaultTastePreferences: GalleryEditableTastePreference = {
  preferredMediums: [],
  avoidedMediums: [],
  preferredNeighborhoods: [],
  preferredTags: []
};

function getDatePart(iso: string, index: number): string {
  return iso.match(/^(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?/)?.[index] ?? "";
}

function formatShortDate(iso: string): string {
  const month = Number(getDatePart(iso, 2));
  const day = Number(getDatePart(iso, 3));
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  return `${monthNames[month - 1] ?? "Date"} ${day || ""}`.trim();
}

function formatShortTime(iso: string): string {
  const hour = Number(getDatePart(iso, 4));
  const minute = Number(getDatePart(iso, 5));
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function getClosingCopy(exhibition: GalleryExhibition): string {
  const daysUntilClose = getDaysUntilGalleryCloses(exhibition, referenceNow);

  if (daysUntilClose === 0) {
    return "Closes today";
  }

  if (daysUntilClose === 1) {
    return "Closes tomorrow";
  }

  return `Closes in ${daysUntilClose} days`;
}

function getFreshnessCopy(exhibition: GalleryExhibition): string {
  return getGalleryInventoryTrust(exhibition).checkedLabel;
}

function getSourceCopy(exhibition: GalleryExhibition): string {
  return getGalleryInventoryTrust(exhibition).sourceLabel;
}

function getGalleryMapUrl(exhibition: GalleryExhibition): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${exhibition.galleryName} ${exhibition.address}`
  )}`;
}

function percentPosition(value: number): DimensionValue {
  return `${value}%` as DimensionValue;
}

function getRouteProgressLabel(progress?: GalleryWalkStopProgress): string {
  if (progress === "current") {
    return "Current stop";
  }

  if (progress === "next") {
    return "Next stop";
  }

  if (progress === "visited") {
    return "Visited";
  }

  if (progress === "skipped") {
    return "Skipped";
  }

  return "Planned";
}

const quizResponseLabels: Record<GalleryQuizResponse, string> = {
  love: "Love",
  curious: "Curious",
  "not-for-me": "Not for me"
};

const quizResponseOptions: GalleryQuizResponse[] = ["love", "curious", "not-for-me"];

function upsertQuizAnswer(
  answers: GalleryQuizAnswer[],
  artworkId: string,
  response: GalleryQuizResponse,
  answeredAt: string
): GalleryQuizAnswer[] {
  const nextAnswer = { artworkId, response, answeredAt };
  const existingIndex = answers.findIndex((answer) => answer.artworkId === artworkId);

  if (existingIndex === -1) {
    return [...answers, nextAnswer];
  }

  return answers.map((answer, index) => (index === existingIndex ? nextAnswer : answer));
}

function rememberCompletedWalkSession(
  sessions: GalleryWalkSession[],
  session: GalleryWalkSession
): GalleryWalkSession[] {
  if (session.status !== "completed") {
    return sessions;
  }

  const existingIndex = sessions.findIndex((candidate) => candidate.id === session.id);

  if (existingIndex === -1) {
    return [...sessions, session];
  }

  if (sessions[existingIndex]?.updatedAt === session.updatedAt) {
    return sessions;
  }

  return sessions.map((candidate, index) => (index === existingIndex ? session : candidate));
}

function getNewBadgeCount(
  earnedBadges: GalleryPassportBadge[],
  computedBadges: GalleryPassportBadge[]
): number {
  const earnedIds = new Set(earnedBadges.map((badge) => badge.id));

  return computedBadges.filter((badge) => !earnedIds.has(badge.id)).length;
}

function upsertTasteFeedback(
  feedback: GalleryTasteFeedback[],
  exhibitionId: string,
  kind: GalleryTasteFeedbackKind,
  createdAt: string
): GalleryTasteFeedback[] {
  return [
    ...feedback.filter((item) => item.exhibitionId !== exhibitionId),
    { exhibitionId, kind, createdAt }
  ];
}

function toggleMediumPreference(
  preferences: GalleryEditableTastePreference,
  medium: GalleryMedium,
  field: "preferredMediums" | "avoidedMediums"
): GalleryEditableTastePreference {
  const otherField = field === "preferredMediums" ? "avoidedMediums" : "preferredMediums";
  const fieldValues = Array.isArray(preferences[field]) ? preferences[field] : [];
  const otherFieldValues = Array.isArray(preferences[otherField]) ? preferences[otherField] : [];
  const values = fieldValues.includes(medium)
    ? fieldValues.filter((candidate) => candidate !== medium)
    : [...fieldValues, medium];

  return {
    ...preferences,
    [field]: values,
    [otherField]: otherFieldValues.filter((candidate) => candidate !== medium)
  };
}

function toggleStringPreference(
  values: string[],
  value: string
): string[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

async function writeTextToClipboard(text: string): Promise<boolean> {
  const maybeNavigator = (globalThis as unknown as {
    navigator?: {
      clipboard?: {
        writeText?: (value: string) => Promise<void>;
      };
      share?: (payload: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
  }).navigator;

  if (!maybeNavigator?.clipboard?.writeText) {
    return false;
  }

  await maybeNavigator.clipboard.writeText(text);

  return true;
}

async function shareWalkPayload(payload: { title?: string; text?: string; url?: string }): Promise<boolean> {
  const maybeNavigator = (globalThis as unknown as {
    navigator?: {
      share?: (value: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
  }).navigator;

  if (!maybeNavigator?.share) {
    return false;
  }

  await maybeNavigator.share(payload);

  return true;
}

function getRouteProgressDetail(progress?: GalleryWalkStopProgress): string {
  if (progress === "current") {
    return "This is your current stop.";
  }

  if (progress === "next") {
    return "This is your next stop.";
  }

  if (progress === "visited") {
    return "You marked this stop visited.";
  }

  if (progress === "skipped") {
    return "You skipped this stop.";
  }

  return "This stop is still planned.";
}

function getAreaRoleCopy(areaId: GalleryAreaId): string {
  if (areaId === "nyc") {
    return "Primary market";
  }

  if (areaId === "la") {
    return "Secondary market";
  }

  if (areaId === "camogli") {
    return "Cultural-walk test";
  }

  return "Arts-town test";
}

function getMarketReadinessCopy({
  verifiedCount,
  fixtureCount,
  staleCount,
  uniqueGalleryCount,
  walkReadyCount
}: {
  verifiedCount: number;
  fixtureCount: number;
  staleCount: number;
  uniqueGalleryCount: number;
  walkReadyCount: number;
}): string {
  if (verifiedCount >= 40 && uniqueGalleryCount >= 20 && walkReadyCount >= 4) {
    return "Strong verified walk supply";
  }

  if (verifiedCount >= 10 && walkReadyCount >= 2) {
    return "Light verified walk supply";
  }

  if (verifiedCount > 0) {
    return "Verified supply still thin";
  }

  if (fixtureCount > 0 || staleCount > 0) {
    return "Needs more verified supply";
  }

  return "No current verified supply";
}

function getNeighborhoodReadinessCopy({
  verifiedCount,
  uniqueGalleryCount,
  canSupportWalk
}: {
  verifiedCount: number;
  uniqueGalleryCount: number;
  canSupportWalk: boolean;
}): string {
  if (verifiedCount >= 4 && uniqueGalleryCount >= 3 && canSupportWalk) {
    return "Strong verified walk";
  }

  if (verifiedCount >= 2 && canSupportWalk) {
    return "Light verified walk";
  }

  if (verifiedCount > 0) {
    return "Verified supply thin";
  }

  return "Needs verification";
}

function ChipButton({
  label,
  active,
  onPress,
  compact = false
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, compact ? styles.compactChip : null, active ? styles.activeChip : null]}
    >
      <Text style={[styles.chipText, active ? styles.activeChipText : null]}>{label}</Text>
    </Pressable>
  );
}

function Metric({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <View style={[styles.metric, tone === "good" ? styles.goodMetric : null, tone === "warn" ? styles.warnMetric : null]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function TonightStat({
  label,
  value,
  detail,
  dark = false
}: {
  label: string;
  value: string | number;
  detail: string;
  dark?: boolean;
}) {
  return (
    <View style={[styles.tonightStat, dark ? styles.darkTonightStat : null]}>
      <Text style={[styles.tonightStatValue, dark ? styles.darkTonightStatText : null]}>
        {value}
      </Text>
      <Text style={[styles.tonightStatLabel, dark ? styles.darkTonightStatText : null]}>
        {label}
      </Text>
      <Text style={[styles.tonightStatDetail, dark ? styles.darkTonightStatDetail : null]}>
        {detail}
      </Text>
    </View>
  );
}

function WalkerExploreResultRow({
  exhibition,
  logEntry,
  onOpenDetails
}: {
  exhibition: GalleryExhibition;
  logEntry?: GalleryLogEntry;
  onOpenDetails: () => void;
}) {
  const visual = getWalkerVisualForRole({ role: "card-thumbnail", exhibition });
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const trust = getGalleryInventoryTrust(exhibition);
  const isSaved =
    logEntry?.status === "saved" ||
    logEntry?.status === "want-to-see" ||
    logEntry?.status === "visited";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open details for ${exhibition.title} at ${exhibition.galleryName}`}
      onPress={onOpenDetails}
      style={styles.walkerExploreRow}
    >
      <ImageBackground
        source={galleryVisualSources[visual.assetKey]}
        accessibilityLabel={visual.alt}
        imageStyle={styles.walkerExploreThumbImage}
        style={styles.walkerExploreThumb}
      >
        <View style={styles.walkerExploreThumbShade} />
        <Text style={styles.walkerExploreDistance}>{exhibition.distanceMiles.toFixed(1)} mi</Text>
      </ImageBackground>
      <View style={styles.walkerExploreCopy}>
        <View style={styles.walkerExploreTitleRow}>
          <Text style={styles.walkerExploreTitle} numberOfLines={1}>
            {exhibition.galleryName}
          </Text>
          <Heart
            size={15}
            color={isSaved ? colors.teal : colors.mutedInk}
            fill={isSaved ? colors.teal : "transparent"}
          />
        </View>
        <Text style={styles.walkerExploreSubtitle} numberOfLines={1}>
          {exhibition.title}
        </Text>
        <Text style={styles.walkerExploreMeta} numberOfLines={1}>
          {exhibition.neighborhood} - {galleryVisitStatusLabels[status]} - {getClosingCopy(exhibition)}
        </Text>
        <View style={styles.walkerExploreBadgeRow}>
          <Text style={styles.walkerExploreBadge}>{trust.label}</Text>
          <Text style={styles.walkerExploreBadge}>{visual.creditLabel}</Text>
          {trust.hasOfficialLink ? <Text style={styles.walkerExploreBadge}>Official link</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

function ProfessionalMobileHome({
  areaLabel,
  dateLabel,
  routeScopeLabel,
  walkPlan,
  featuredExhibition,
  featuredVisual,
  personalizedPick,
  openingSignal,
  lastChanceAlert,
  neighborhoods,
  sourceTrust,
  freshnessLabel,
  openNowCount,
  closingSoonCount,
  activeWalk,
  camogliFieldGuide,
  onFindWalk,
  onStartWalk,
  onOpenRoute,
  onForYou,
  onResumeWalk,
  onOpenFeatured,
  onSelectNeighborhood
}: {
  areaLabel: string;
  dateLabel: string;
  routeScopeLabel: string;
  walkPlan: GalleryWalkPlan;
  featuredExhibition?: GalleryExhibition;
  featuredVisual: ReturnType<typeof getGalleryVisual>;
  personalizedPick?: GalleryPersonalizedPick;
  openingSignal?: GalleryEventSignal;
  lastChanceAlert?: ReturnType<typeof getLastChanceGalleryAlerts>[number];
  neighborhoods: ReturnType<typeof createNeighborhoodIntelligence>;
  sourceTrust: ReturnType<typeof createGallerySourceTrustSummary>;
  freshnessLabel: string;
  openNowCount: number;
  closingSoonCount: number;
  activeWalk: boolean;
  camogliFieldGuide?: CamogliFieldGuide;
  onFindWalk: () => void;
  onStartWalk: () => void;
  onOpenRoute: () => void;
  onForYou: () => void;
  onResumeWalk: () => void;
  onOpenFeatured: () => void;
  onSelectNeighborhood: (neighborhood?: string) => void;
}) {
  const bestStart = walkPlan.stops.find((stop) => stop.exhibition.id === walkPlan.startStopId);
  const feedItems: TonightFeedItem[] = [
    {
      id: "verified-walk",
      label: "Best verified walk",
      title: walkPlan.summary,
      detail: `${walkPlan.stops.length} stops in ${walkPlan.neighborhood}`,
      meta: `Best start: ${bestStart?.exhibition.galleryName ?? "where open"}`,
      actionLabel: "Start",
      onPress: onStartWalk
    },
    personalizedPick
      ? {
          id: "for-you",
          label: "For You pick",
          title: personalizedPick.exhibition.title,
          detail: `${personalizedPick.exhibition.galleryName} - ${personalizedPick.exhibition.neighborhood}`,
          meta: personalizedPick.reasons.slice(0, 2).join(" - ") || "Taste-ranked",
          actionLabel: "Tune",
          onPress: onForYou
        }
      : undefined,
    openingSignal
      ? {
          id: "opening",
          label: "Opening tonight",
          title: openingSignal.exhibition.title,
          detail: `${openingSignal.exhibition.galleryName} - ${openingSignal.timingLabel}`,
          meta: openingSignal.sourceLabel,
          actionLabel: "View",
          onPress: () => onSelectNeighborhood(openingSignal.exhibition.neighborhood)
        }
      : undefined,
    lastChanceAlert
      ? {
          id: "last-chance",
          label: "Last chance",
          title: lastChanceAlert.exhibition.title,
          detail: `${lastChanceAlert.daysUntilClose} days left - ${lastChanceAlert.exhibition.neighborhood}`,
          meta: lastChanceAlert.matchedSignals.slice(0, 2).join(" - ") || "Closing soon",
          actionLabel: "Route",
          onPress: () => onSelectNeighborhood(lastChanceAlert.exhibition.neighborhood)
        }
      : undefined
  ].filter((item): item is TonightFeedItem => Boolean(item));

  return (
    <View style={styles.mobileHomeShell}>
      <View style={styles.mobileTopBar}>
        <View style={styles.walkerTopBrand}>
          <WalkerMark size={24} />
          <View>
            <Text style={styles.walkerWordmark}>Walker</Text>
            <Text style={styles.mobileDateLabel}>{areaLabel} - {dateLabel}</Text>
          </View>
        </View>
        <View style={styles.mobileVerifiedBadge}>
          <Check size={13} color={colors.paper} />
          <Text style={styles.mobileVerifiedBadgeText}>{sourceTrust.verifiedExhibitionCount} verified</Text>
        </View>
      </View>

      <ImageBackground
        source={galleryVisualSources[featuredVisual.assetKey]}
        accessibilityLabel={featuredVisual.alt}
        imageStyle={styles.mobileFeatureImage}
        style={styles.mobileFeatureCard}
      >
        <View style={styles.mobileFeatureShade} />
        <View style={styles.mobileFeatureContent}>
          <View style={styles.mobileFeatureTopRow}>
            <Text style={styles.mobileFeaturePill} numberOfLines={1}>Featured walk</Text>
            <Text style={styles.mobileFeaturePill} numberOfLines={1}>{routeScopeLabel}</Text>
            <Text style={styles.mobileFeaturePill} numberOfLines={1}>{featuredVisual.creditLabel}</Text>
          </View>
          <View style={styles.mobileFeatureCopy}>
            <Text style={styles.mobileFeatureTitle}>Explore art.{"\n"}Build meaning.</Text>
            <Text style={styles.mobileFeatureSubtitle}>
              {featuredExhibition
                ? `${walkPlan.totalMinutes} minute route in ${walkPlan.neighborhood}.`
                : `${walkPlan.summary} with source-labeled stops.`}
            </Text>
            <View style={styles.mobileFeatureActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Find a walk near me"
                onPress={onFindWalk}
                style={styles.mobilePrimaryCta}
              >
                <Route size={15} color={colors.paper} />
                <Text style={styles.mobilePrimaryCtaText} numberOfLines={1}>Start</Text>
              </Pressable>
              {activeWalk ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Resume active walk"
                  onPress={onResumeWalk}
                  style={styles.mobileSecondaryCta}
                >
                  <Text style={styles.mobileSecondaryCtaText} numberOfLines={1}>Resume</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Open current route map"
                  onPress={onOpenRoute}
                  style={styles.mobileSecondaryCta}
                >
                  <Text style={styles.mobileSecondaryCtaText} numberOfLines={1}>Open map</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.mobileTrustStrip}>
        <Text style={styles.mobileTrustItem}>{openNowCount} open now</Text>
        <Text style={styles.mobileTrustItem}>{closingSoonCount} closing soon</Text>
        <Text style={styles.mobileTrustItem}>{freshnessLabel}</Text>
      </View>

      {camogliFieldGuide ? (
        <CamogliFieldModeCard guide={camogliFieldGuide} compact />
      ) : null}

      {featuredExhibition ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open featured exhibition ${featuredExhibition.title}`}
          onPress={onOpenFeatured}
          style={styles.mobileFeaturedShow}
        >
          <View style={styles.mobileFeaturedShowCopy}>
            <Text style={styles.mobileFeedLabel}>Featured verified show</Text>
            <Text style={styles.mobileFeaturedShowTitle} numberOfLines={2}>
              {featuredExhibition.title}
            </Text>
            <Text style={styles.mobileFeaturedShowMeta} numberOfLines={1}>
              {featuredExhibition.galleryName} - {galleryVisitStatusLabels[getGalleryVisitStatus(featuredExhibition, referenceNow)]}
            </Text>
          </View>
          <Text style={styles.mobileFeaturedShowAction}>Details</Text>
        </Pressable>
      ) : null}

      <View style={styles.mobileTonightFeed}>
        <View style={styles.mobileSectionHeading}>
          <Text style={styles.mobileSectionTitle}>Open Now</Text>
          <Text style={styles.mobileSectionMeta}>{sourceTrust.exhibitionCount} listings</Text>
        </View>
        {feedItems.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={item.onPress}
            style={styles.mobileFeedRow}
          >
            <View style={styles.mobileFeedCopy}>
              <Text style={styles.mobileFeedLabel}>{item.label}</Text>
              <Text style={styles.mobileFeedTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.mobileFeedDetail} numberOfLines={1}>{item.detail}</Text>
              <Text style={styles.mobileFeedMeta} numberOfLines={1}>{item.meta}</Text>
            </View>
            <Text style={styles.mobileFeedAction}>{item.actionLabel}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileNeighborhoodRail}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show all neighborhoods"
          onPress={() => onSelectNeighborhood(undefined)}
          style={styles.mobileNeighborhoodChip}
        >
          <Text style={styles.mobileNeighborhoodName}>All</Text>
          <Text style={styles.mobileNeighborhoodMeta}>{sourceTrust.verifiedExhibitionCount} verified</Text>
        </Pressable>
        {neighborhoods.slice(0, 6).map((item) => (
          <Pressable
            key={item.neighborhood}
            accessibilityRole="button"
            accessibilityLabel={`Plan ${item.neighborhood}`}
            onPress={() => onSelectNeighborhood(item.neighborhood)}
            style={styles.mobileNeighborhoodChip}
          >
            <Text style={styles.mobileNeighborhoodName} numberOfLines={1}>{item.neighborhood}</Text>
            <Text style={styles.mobileNeighborhoodMeta}>{item.verifiedCount} verified - {item.openNowCount} open</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function CamogliFieldModeCard({
  guide,
  compact = false,
  onMode
}: {
  guide: CamogliFieldGuide;
  compact?: boolean;
  onMode?: (mode: CamogliRouteMode) => void;
}) {
  const modes: Array<{ mode: CamogliRouteMode; label: string }> = [
    { mode: "best-easy-walk", label: "Easy" },
    { mode: "centro", label: "Centro" },
    { mode: "waterfront", label: "Waterfront" },
    { mode: "hill-walk", label: "Hill" }
  ];

  return (
    <View style={[styles.camogliFieldCard, compact ? styles.compactCamogliFieldCard : null]}>
      <View style={styles.camogliFieldHeader}>
        <View>
          <Text style={styles.camogliFieldBadge}>{guide.badge}</Text>
          <Text style={styles.camogliFieldTitle}>{guide.title}</Text>
        </View>
        <Text style={styles.camogliFieldTime}>{guide.localTimeLabel}</Text>
      </View>
      <Text style={styles.camogliFieldCopy}>{guide.verifyBeforeYouGoCopy}</Text>
      <View style={styles.camogliFieldStats}>
        <View style={styles.camogliFieldStat}>
          <Text style={styles.camogliFieldStatLabel}>{guide.routeModeLabel}</Text>
          <Text style={styles.camogliFieldStatValue}>{guide.routeEffortLabel}</Text>
        </View>
        <View style={styles.camogliFieldStat}>
          <Text style={styles.camogliFieldStatLabel}>Official links</Text>
          <Text style={styles.camogliFieldStatValue}>{guide.officialLinkCopy}</Text>
        </View>
      </View>
      <Text style={styles.camogliFieldCopy}>{guide.routeEffortDetail}</Text>
      {onMode ? (
        <View style={styles.camogliFieldModeRow}>
          {modes.map((item) => (
            <Pressable
              key={item.mode}
              accessibilityRole="button"
              accessibilityLabel={`Use ${item.label} Camogli mode`}
              onPress={() => onMode(item.mode)}
              style={[
                styles.camogliFieldModeChip,
                guide.routeMode === item.mode ? styles.selectedCamogliFieldModeChip : null
              ]}
            >
              <Text
                style={[
                  styles.camogliFieldModeText,
                  guide.routeMode === item.mode ? styles.selectedCamogliFieldModeText : null
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!compact ? (
        <View style={styles.camogliStopList}>
          {guide.stopLabels.slice(0, 3).map((label) => (
            <View key={label.exhibitionId} style={styles.camogliStopLabel}>
              <Text style={styles.camogliStopPrimary}>{label.primary}</Text>
              <Text style={styles.camogliStopSecondary}>{label.secondary}</Text>
              {label.warning ? <Text style={styles.camogliStopWarning}>{label.warning}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function WalkerReadinessCard({
  report,
  startPointOptions,
  compact = false,
  onStartPointMode,
  onDismissWarning
}: {
  report: WalkerWalkReadinessReport;
  startPointOptions: WalkerStartPointOption[];
  compact?: boolean;
  onStartPointMode: (mode: WalkerStartPointMode) => void;
  onDismissWarning?: (warning: string) => void;
}) {
  const toneStyle =
    report.tone === "ready"
      ? styles.walkerReadinessReady
      : report.tone === "watch"
        ? styles.walkerReadinessWatch
        : styles.walkerReadinessThin;

  return (
    <View style={[styles.walkerReadinessCard, compact ? styles.compactWalkerReadinessCard : null]}>
      <View style={styles.walkerReadinessHeader}>
        <View style={styles.walkerReadinessTitleBlock}>
          <Text style={[styles.walkerReadinessBadge, toneStyle]}>{report.label}</Text>
          <Text style={styles.walkerReadinessTitle}>Use tonight</Text>
          <Text style={styles.walkerReadinessSummary}>{report.summary}</Text>
        </View>
        <View style={styles.walkerReadinessClock}>
          <Clock size={15} color={colors.teal} />
          <Text style={styles.walkerReadinessClockText}>{report.localTimeLabel}</Text>
        </View>
      </View>

      <View style={styles.walkerStartPointCard}>
        <Text style={styles.walkerStartPointLabel}>Start point</Text>
        <Text style={styles.walkerStartPointTitle}>{report.startPointLabel}</Text>
        <Text style={styles.walkerStartPointDetail}>{report.startPointDetail}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.walkerStartPointRail}
      >
        {startPointOptions.map((option) => (
          <Pressable
            key={option.mode}
            accessibilityRole="button"
            accessibilityLabel={`Use ${option.label} start point`}
            disabled={!option.available}
            onPress={() => onStartPointMode(option.mode)}
            style={[
              styles.walkerStartPointChip,
              option.recommended ? styles.selectedWalkerStartPointChip : null,
              !option.available ? styles.disabledWalkerStartPointChip : null
            ]}
          >
            <Text
              style={[
                styles.walkerStartPointChipText,
                option.recommended ? styles.selectedWalkerStartPointChipText : null
              ]}
            >
              {option.label}
            </Text>
            <Text style={styles.walkerStartPointChipDetail} numberOfLines={2}>
              {option.detail}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.walkerReadinessChecklist}>
        {report.checklist.map((item) => (
          <View key={item.id} style={styles.walkerReadinessItem}>
            <View
              style={[
                styles.walkerReadinessDot,
                item.status === "ready"
                  ? styles.walkerReadinessDotReady
                  : item.status === "watch"
                    ? styles.walkerReadinessDotWatch
                    : styles.walkerReadinessDotBlocked
              ]}
            />
            <View style={styles.walkerReadinessItemCopy}>
              <Text style={styles.walkerReadinessItemLabel}>{item.label}</Text>
              <Text style={styles.walkerReadinessItemDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      {report.warnings.length > 0 ? (
        <View style={styles.walkerReadinessWarningRow}>
          {report.warnings.slice(0, compact ? 2 : 4).map((warning) => (
            <Pressable
              key={warning}
              accessibilityRole="button"
              accessibilityLabel={`Dismiss ${warning}`}
              onPress={() => onDismissWarning?.(warning)}
              style={styles.walkerReadinessWarning}
            >
              <Text style={styles.walkerReadinessWarningText}>{warning}</Text>
              {onDismissWarning ? <X size={11} color={colors.gold} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function WalkerFieldTestShortcutCard({
  guide,
  onShortcut
}: {
  guide: WalkerFieldTestGuide;
  onShortcut: (neighborhood: string) => void;
}) {
  return (
    <View style={styles.walkerFieldShortcutCard}>
      <View style={styles.walkerFieldShortcutHeader}>
        <View>
          <Text style={styles.walkerReadinessBadge}>Field test</Text>
          <Text style={styles.walkerFieldShortcutTitle}>{guide.title}</Text>
        </View>
        <WalkerMark size={22} />
      </View>
      <Text style={styles.walkerFieldShortcutSubtitle}>{guide.subtitle}</Text>
      <View style={styles.walkerFieldShortcutList}>
        {guide.shortcuts.map((shortcut) => (
          <Pressable
            key={shortcut.id}
            accessibilityRole="button"
            accessibilityLabel={`Use ${shortcut.label} Camogli test route`}
            onPress={() => onShortcut(shortcut.neighborhood)}
            style={styles.walkerFieldShortcutRow}
          >
            <View style={styles.walkerFieldShortcutCopy}>
              <Text style={styles.walkerFieldShortcutLabel}>{shortcut.label}</Text>
              <Text style={styles.walkerFieldShortcutDetail}>{shortcut.detail}</Text>
              {shortcut.warning ? (
                <Text style={styles.walkerFieldShortcutWarning}>{shortcut.warning}</Text>
              ) : null}
            </View>
            <Text style={styles.walkerFieldShortcutArea}>{shortcut.neighborhood}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function WalkerOfflineReadinessCard({
  summary,
  imageSummary
}: {
  summary: WalkerOfflineReadinessSummary;
  imageSummary: WalkerImageSystemSummary;
}) {
  return (
    <View style={styles.walkerOfflineCard}>
      <View style={styles.walkerFieldShortcutHeader}>
        <View>
          <Text style={styles.walkerReadinessBadge}>PWA beta</Text>
          <Text style={styles.walkerOfflineTitle}>{summary.label}</Text>
        </View>
        <Text style={styles.walkerOfflineState}>
          {summary.serviceWorkerRecommended ? "Pending" : "Ready"}
        </Text>
      </View>
      <Text style={styles.walkerOfflineDetail}>{summary.detail}</Text>
      <View style={styles.walkerImageSummaryBlock}>
        <View style={styles.walkerImageSummaryHeader}>
          <Text style={styles.walkerOfflineColumnTitle}>{imageSummary.headline}</Text>
          <Text style={styles.walkerImageSummaryProvenance}>{imageSummary.provenanceLabel}</Text>
        </View>
        <Text style={styles.walkerOfflineBullet}>{imageSummary.detail}</Text>
        <View style={styles.feedbackRow}>
          {imageSummary.coverageChips.map((chip) => (
            <Text key={chip} style={styles.betaFeedbackContextChip}>{chip}</Text>
          ))}
        </View>
      </View>
      <View style={styles.walkerOfflineGrid}>
        <View style={styles.walkerOfflineColumn}>
          <Text style={styles.walkerOfflineColumnTitle}>Works locally</Text>
          {summary.cachedAssumptions.slice(0, 3).map((item) => (
            <Text key={item} style={styles.walkerOfflineBullet}>{item}</Text>
          ))}
        </View>
        <View style={styles.walkerOfflineColumn}>
          <Text style={styles.walkerOfflineColumnTitle}>Still live-check</Text>
          {summary.needsNetwork.slice(0, 3).map((item) => (
            <Text key={item} style={styles.walkerOfflineBullet}>{item}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function GalleryConciergePanel({
  suggestions,
  onSuggestion
}: {
  suggestions: GalleryConciergeSuggestion[];
  onSuggestion: (suggestion: GalleryConciergeSuggestion) => void;
}) {
  if (suggestions.length === 0) {
    return null;
  }

  const primarySuggestion = suggestions[0];

  return (
    <View style={styles.conciergePanel}>
      <View style={styles.conciergeHeader}>
        <View style={styles.conciergeTitleBlock}>
          <View style={styles.conciergeBadgeRow}>
            <Text style={styles.conciergeBadge}>Concierge</Text>
            <Text style={styles.conciergeBadgeMeta}>{suggestions.length} moves</Text>
          </View>
          <Text style={styles.conciergeTitle}>{primarySuggestion?.title ?? "What to do next"}</Text>
          <Text style={styles.conciergeCopy}>
            {primarySuggestion?.body ?? "A few source-aware moves for tonight."}
          </Text>
          {primarySuggestion ? (
            <View style={styles.routeReasonRow}>
              {primarySuggestion.reasons.slice(0, 3).map((reason) => (
                <Text key={reason} style={styles.conciergeReasonPill}>{reason}</Text>
              ))}
            </View>
          ) : null}
        </View>
        {primarySuggestion ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primarySuggestion.ctaLabel}
            onPress={() => onSuggestion(primarySuggestion)}
            style={[styles.primaryLightButton, styles.conciergePrimaryButton]}
          >
            <Text style={[styles.primaryLightButtonText, styles.conciergePrimaryButtonText]}>
              {primarySuggestion.ctaLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {suggestions.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.conciergeRail}
        >
          {suggestions.slice(1).map((suggestion) => (
            <Pressable
              key={suggestion.id}
              accessibilityRole="button"
              accessibilityLabel={suggestion.title}
              onPress={() => onSuggestion(suggestion)}
              style={styles.conciergeSuggestionCard}
            >
              <Text style={styles.conciergeSuggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.conciergeSuggestionBody} numberOfLines={3}>
                {suggestion.body}
              </Text>
              <View style={styles.routeReasonRow}>
                {suggestion.reasons.slice(0, 3).map((reason) => (
                  <Text key={reason} style={styles.walkStopReason}>{reason}</Text>
                ))}
              </View>
              <Text style={styles.conciergeSuggestionCta}>{suggestion.ctaLabel}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function RouteModeButton({
  label,
  detail,
  active,
  onPress
}: {
  label: string;
  detail: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.routeModeButton, active ? styles.activeRouteModeButton : null]}
    >
      <Text style={[styles.routeModeLabel, active ? styles.activeRouteModeLabel : null]}>
        {label}
      </Text>
      <Text style={[styles.routeModeDetail, active ? styles.activeRouteModeDetail : null]}>
        {detail}
      </Text>
    </Pressable>
  );
}

function FirstRunChoicePanel({
  hasActiveWalk,
  verifiedCount,
  reviewCount,
  freshnessLabel,
  betaProgress = getGalleryBetaTasks([]),
  onFindWalk,
  onTasteQuiz,
  onCamogliTest,
  onResumeWalk,
  onBetaTask,
  onResetDemo,
  onDismiss
}: {
  hasActiveWalk: boolean;
  verifiedCount: number;
  reviewCount: number;
  freshnessLabel: string;
  betaProgress?: GalleryBetaTaskProgress;
  onFindWalk: () => void;
  onTasteQuiz: () => void;
  onCamogliTest: () => void;
  onResumeWalk: () => void;
  onBetaTask: (taskId: GalleryBetaTaskId) => void;
  onResetDemo: () => void;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.firstRunPanel}>
      <View style={styles.firstRunHeader}>
        <View>
          <Text style={styles.routeFirstKicker}>Start tonight</Text>
          <Text style={styles.firstRunTitle}>What should I do tonight?</Text>
          <Text style={styles.firstRunSubtitle}>
            {betaProgress.summaryLabel} - beta preview path
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss first run choices"
          onPress={onDismiss}
          style={styles.firstRunDismissButton}
        >
          <X size={14} color={colors.ink} />
        </Pressable>
      </View>
      <View style={styles.firstRunActionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Find a walk near me"
          onPress={onFindWalk}
          style={styles.firstRunPrimaryAction}
        >
          <Route size={15} color={colors.paper} />
          <Text style={styles.firstRunPrimaryActionText}>Find a walk near me</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take taste quiz"
          onPress={onTasteQuiz}
          style={styles.firstRunSecondaryAction}
        >
          <Sparkles size={15} color={colors.ink} />
          <Text style={styles.firstRunSecondaryActionText}>Take taste quiz</Text>
        </Pressable>
        {hasActiveWalk ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resume active walk"
            onPress={onResumeWalk}
            style={styles.firstRunSecondaryAction}
          >
            <MapPin size={15} color={colors.ink} />
            <Text style={styles.firstRunSecondaryActionText}>Resume walk</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Camogli cultural walk test"
          onPress={onCamogliTest}
          style={styles.firstRunSecondaryAction}
        >
          <MapPin size={15} color={colors.ink} />
          <Text style={styles.firstRunSecondaryActionText}>Camogli test</Text>
        </Pressable>
      </View>
      <View style={styles.betaTaskGrid}>
        {betaProgress.tasks.map((task) => (
          <Pressable
            key={task.id}
            accessibilityRole="button"
            accessibilityLabel={`${task.completed ? "Completed" : "Complete"} beta task ${task.label}`}
            onPress={() => onBetaTask(task.id)}
            style={[styles.betaTaskPill, task.completed ? styles.completedBetaTaskPill : null]}
          >
            <Text style={[styles.betaTaskText, task.completed ? styles.completedBetaTaskText : null]}>
              {task.completed ? "Done " : ""}{task.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.firstRunTrustRow}>
        <Text style={styles.firstRunTrustPill}>{verifiedCount} verified</Text>
        <Text style={styles.firstRunTrustPill}>{reviewCount} demo/review</Text>
        <Text style={styles.firstRunTrustPill}>{freshnessLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset gallery demo state"
          onPress={onResetDemo}
          style={styles.resetDemoButton}
        >
          <RotateCcw size={12} color={colors.ink} />
          <Text style={styles.resetDemoButtonText}>Reset demo</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BetaPreviewPanel({
  routeReport,
  learningSummary,
  verifiedCount,
  demoReviewCount,
  routeModeLabel,
  activeWalkStatus,
  onTryNyc,
  onTryForYou,
  onCheckHudson,
  onSendFeedback,
  onCopyReport
}: {
  routeReport: GalleryRouteUsabilityReport;
  learningSummary: GalleryPersonalizationLearningSummary;
  verifiedCount: number;
  demoReviewCount: number;
  routeModeLabel: string;
  activeWalkStatus?: GalleryWalkSession["status"];
  onTryNyc: () => void;
  onTryForYou: () => void;
  onCheckHudson: () => void;
  onSendFeedback: () => void;
  onCopyReport: () => void;
}) {
  return (
    <View style={styles.betaPreviewPanel}>
      <View style={styles.betaPreviewHeader}>
        <View style={styles.routeFirstTitleBlock}>
          <Text style={styles.routeFirstKicker}>Beta preview</Text>
          <Text style={styles.betaPreviewTitle}>{routeReport.label}</Text>
          <Text style={styles.betaPreviewCopy}>{routeReport.summary}</Text>
        </View>
        <Text style={styles.betaPreviewBadge}>{routeModeLabel}</Text>
      </View>
      <View style={styles.betaPreviewStats}>
        <Text style={styles.betaPreviewStat}>{verifiedCount} verified</Text>
        <Text style={styles.betaPreviewStat}>{demoReviewCount} demo/review</Text>
        <Text style={styles.betaPreviewStat}>{activeWalkStatus ?? "no active walk"}</Text>
      </View>
      <Text style={styles.betaPreviewLearning}>{learningSummary.detail}</Text>
      <View style={styles.firstRunActionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try a New York City walk"
          onPress={onTryNyc}
          style={styles.firstRunPrimaryAction}
        >
          <Route size={15} color={colors.paper} />
          <Text style={styles.firstRunPrimaryActionText}>Try a NYC walk</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try For You route mode"
          onPress={onTryForYou}
          style={styles.firstRunSecondaryAction}
        >
          <Sparkles size={15} color={colors.ink} />
          <Text style={styles.firstRunSecondaryActionText}>Try For You</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Check Hudson market"
          onPress={onCheckHudson}
          style={styles.firstRunSecondaryAction}
        >
          <MapPin size={15} color={colors.ink} />
          <Text style={styles.firstRunSecondaryActionText}>Check Hudson</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open beta feedback composer"
          onPress={onSendFeedback}
          style={styles.firstRunSecondaryAction}
        >
          <MessageSquare size={15} color={colors.ink} />
          <Text style={styles.firstRunSecondaryActionText}>Send feedback</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy beta review report"
          onPress={onCopyReport}
          style={styles.firstRunSecondaryAction}
        >
          <Copy size={14} color={colors.ink} />
          <Text style={styles.firstRunSecondaryActionText}>Copy beta report</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PersonalizationLearningPanel({
  summary
}: {
  summary: GalleryPersonalizationLearningSummary;
}) {
  return (
    <View style={styles.learningPanel}>
      <View style={styles.learningPanelHeader}>
        <View>
          <Text style={styles.learningKicker}>For You + Journal</Text>
          <Text style={styles.learningTitle}>{summary.label}</Text>
        </View>
        <Sparkles size={18} color={colors.paper} />
      </View>
      <Text style={styles.learningCopy}>{summary.detail}</Text>
      <View style={styles.routeReasonRow}>
        {summary.reasonChips.map((chip) => (
          <Text key={chip} style={styles.learningChip}>{chip}</Text>
        ))}
      </View>
    </View>
  );
}

function BetaFeedbackPanel({
  selectedKind,
  note,
  feedbackCount,
  contextChips,
  routeWarningCount,
  onKind,
  onNote,
  onSubmit,
  onCopy,
  onEmail,
  onResetDemo
}: {
  selectedKind: GalleryBetaFeedbackKind;
  note: string;
  feedbackCount: number;
  contextChips: string[];
  routeWarningCount: number;
  onKind: (kind: GalleryBetaFeedbackKind) => void;
  onNote: (note: string) => void;
  onSubmit: () => void;
  onCopy: () => void;
  onEmail: () => void;
  onResetDemo: () => void;
}) {
  return (
    <View style={styles.betaFeedbackPanel}>
      <View style={styles.betaFeedbackHeader}>
        <View style={styles.routeFirstTitleBlock}>
          <Text style={styles.routeFirstKicker}>Beta feedback</Text>
          <Text style={styles.betaFeedbackTitle}>Tell us what felt useful or rough.</Text>
        </View>
        <Text style={styles.firstRunTrustPill}>{feedbackCount} notes</Text>
      </View>
      <View style={styles.betaFeedbackContextPanel}>
        <View style={styles.betaFeedbackContextHeader}>
          <MapPin size={14} color={colors.teal} />
          <Text style={styles.betaFeedbackContextTitle}>Field-test context</Text>
          <Text style={styles.betaFeedbackContextMeta}>
            {routeWarningCount === 0 ? "ready" : `${routeWarningCount} checks`}
          </Text>
        </View>
        <View style={styles.feedbackRow}>
          {contextChips.map((chip) => (
            <Text key={chip} style={styles.betaFeedbackContextChip}>{chip}</Text>
          ))}
        </View>
      </View>
      <View style={styles.feedbackRow}>
        {betaFeedbackKinds.map((kind) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={`Set feedback kind ${betaFeedbackLabels[kind]}`}
            onPress={() => onKind(kind)}
            style={[
              styles.feedbackButton,
              selectedKind === kind ? styles.activeFeedbackButton : null
            ]}
          >
            <Text
              style={[
                styles.feedbackButtonText,
                selectedKind === kind ? styles.activeFeedbackButtonText : null
              ]}
            >
              {betaFeedbackLabels[kind]}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.betaFeedbackInputRow}>
        <MessageSquare size={15} color={colors.mutedInk} />
        <TextInput
          value={note}
          onChangeText={onNote}
          placeholder="What should change before beta?"
          placeholderTextColor={colors.mutedInk}
          style={styles.betaFeedbackInput}
        />
      </View>
      <View style={styles.feedbackRow}>
        {betaFeedbackQuickTags.map((tag) => (
          <Pressable
            key={tag}
            accessibilityRole="button"
            accessibilityLabel={`Add beta feedback tag ${tag}`}
            onPress={() => onNote(note.trim().length > 0 ? `${note.trim()} - ${tag}` : tag)}
            style={styles.feedbackTagButton}
          >
            <Text style={styles.feedbackTagText}>{tag}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.firstRunActionRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save beta feedback"
          onPress={onSubmit}
          style={styles.firstRunPrimaryAction}
        >
          <Text style={styles.firstRunPrimaryActionText}>Save feedback</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy beta feedback report"
          onPress={onCopy}
          style={styles.firstRunSecondaryAction}
        >
          <Copy size={14} color={colors.ink} />
          <Text style={styles.firstRunSecondaryActionText}>Copy report</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Email beta feedback report"
          onPress={onEmail}
          style={styles.firstRunSecondaryAction}
        >
          <ExternalLink size={14} color={colors.ink} />
          <Text style={styles.firstRunSecondaryActionText}>Email</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset gallery demo state"
          onPress={onResetDemo}
          style={styles.resetDemoButton}
        >
          <RotateCcw size={12} color={colors.ink} />
          <Text style={styles.resetDemoButtonText}>Reset demo</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WalkerBottomNav({
  activeTab,
  activeWalk,
  onTab
}: {
  activeTab: WalkerMobileTab;
  activeWalk: boolean;
  onTab: (tab: WalkerMobileTab) => void;
}) {
  const tabs: Array<{
    id: WalkerMobileTab;
    label: string;
    icon: "home" | "search" | "route" | "saved" | "journal";
  }> = [
    { id: "home", label: "Home", icon: "home" },
    { id: "explore", label: "Explore", icon: "search" },
    { id: "walks", label: activeWalk ? "Walking" : "Walks", icon: "route" },
    { id: "saved", label: "Saved", icon: "saved" },
    { id: "journal", label: "Journal", icon: "journal" }
  ];
  const renderIcon = (icon: typeof tabs[number]["icon"], active: boolean) => {
    const iconColor = active ? colors.paper : colors.teal;

    if (icon === "search") {
      return <Search size={17} color={iconColor} />;
    }

    if (icon === "route") {
      return <Route size={17} color={iconColor} />;
    }

    if (icon === "saved") {
      return <Heart size={17} color={iconColor} />;
    }

    if (icon === "journal") {
      return <NotebookPen size={17} color={iconColor} />;
    }

    return <Home size={17} color={iconColor} />;
  };

  return (
    <View style={styles.mobileCommandBar}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${tab.label}`}
            onPress={() => onTab(tab.id)}
            style={[styles.mobileCommandButton, active ? styles.activeMobileCommandButton : null]}
          >
            {renderIcon(tab.icon, active)}
            <Text style={[styles.mobileCommandText, active ? styles.activeMobileCommandText : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WalkerSavedMemoryPanel({
  savedWalks,
  logEntries,
  exhibitions,
  memory,
  badges,
  stamps,
  onCopySavedWalk
}: {
  savedWalks: GallerySavedWalk[];
  logEntries: GalleryLogEntry[];
  exhibitions: GalleryExhibition[];
  memory: GalleryPassportMemory;
  badges: GalleryPassportBadge[];
  stamps: GalleryPassportStamp[];
  onCopySavedWalk: (savedWalk: GallerySavedWalk) => void;
}) {
  const [activeMemoryTab, setActiveMemoryTab] = useState<WalkerSavedMemoryTab>("collections");
  const exhibitionById = new Map(exhibitions.map((exhibition) => [exhibition.id, exhibition]));
  const savedEntries = logEntries.filter((entry) => entry.status === "saved" || entry.status === "want-to-see");
  const visitedEntries = logEntries.filter((entry) => entry.status === "visited");
  const notedEntries = logEntries.filter((entry) => Boolean(entry.note?.trim()));
  const memoryTabs: Array<{ id: WalkerSavedMemoryTab; label: string; count: number }> = [
    { id: "collections", label: "Collections", count: savedWalks.length },
    { id: "places", label: "Places", count: savedEntries.length + visitedEntries.length },
    { id: "works", label: "Works", count: notedEntries.length },
    { id: "walks", label: "Walks", count: memory.completedWalkCount }
  ];
  const timelineEntries =
    activeMemoryTab === "places"
      ? [...visitedEntries, ...savedEntries]
      : activeMemoryTab === "works"
        ? notedEntries
        : logEntries;

  return (
    <View style={styles.mobileMemoryShell}>
      <View style={styles.mobileMemoryHero}>
        <View style={styles.walkerTopBrand}>
          <WalkerMark size={24} />
          <View>
            <Text style={[styles.walkerWordmark, styles.mobileMemoryWordmark]}>Walker</Text>
            <Text style={[styles.mobileDateLabel, styles.mobileMemoryDateLabel]}>Saved, Journal & Memory</Text>
          </View>
        </View>
        <Text style={styles.mobileMemoryTitle}>Capture what moves you.</Text>
        <Text style={styles.mobileMemoryCopy}>{getWalkerMemorySummary(memory)}</Text>
        <View style={styles.mobileMemoryStats}>
          <Text style={styles.mobileMemoryStat}>{savedEntries.length} saved</Text>
          <Text style={styles.mobileMemoryStat}>{visitedEntries.length} visited</Text>
          <Text style={styles.mobileMemoryStat}>{notedEntries.length} notes</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileMemoryTabStrip}
      >
        {memoryTabs.map((tab) => (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={`Show Walker ${tab.label}`}
            onPress={() => setActiveMemoryTab(tab.id)}
            style={[
              styles.mobileMemoryTab,
              activeMemoryTab === tab.id ? styles.activeMobileMemoryTab : null
            ]}
          >
            <Text
              style={[
                styles.mobileMemoryTabLabel,
                activeMemoryTab === tab.id ? styles.activeMobileMemoryTabLabel : null
              ]}
            >
              {tab.label}
            </Text>
            <Text
              style={[
                styles.mobileMemoryTabCount,
                activeMemoryTab === tab.id ? styles.activeMobileMemoryTabLabel : null
              ]}
            >
              {tab.count}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeMemoryTab === "collections" || activeMemoryTab === "walks" ? (
      <View style={styles.mobileCollectionPanel}>
        <View style={styles.mobileSectionHeading}>
          <Text style={styles.mobileSectionTitle}>
            {activeMemoryTab === "walks" ? "Walks" : "Collections"}
          </Text>
          <Text style={styles.mobileSectionMeta}>{savedWalks.length} saved routes</Text>
        </View>
        {savedWalks.slice(0, 4).map((savedWalk) => (
          <View key={savedWalk.id} style={styles.mobileSavedRow}>
            <View style={styles.mobileSavedThumb}>
              <Route size={16} color={colors.teal} />
            </View>
            <View style={styles.mobileFeedCopy}>
              <Text style={styles.mobileFeedTitle} numberOfLines={1}>{savedWalk.title}</Text>
              <Text style={styles.mobileFeedDetail} numberOfLines={1}>{savedWalk.summary}</Text>
              <Text style={styles.mobileFeedMeta} numberOfLines={1}>
                {savedWalk.stopIds.length} stops - {formatShortDate(savedWalk.savedAt)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Copy saved walk ${savedWalk.title}`}
              onPress={() => onCopySavedWalk(savedWalk)}
              style={styles.mobileFeedActionButton}
            >
              <Copy size={13} color={colors.teal} />
            </Pressable>
          </View>
        ))}
        {savedWalks.length === 0 ? (
          <Text style={styles.emptyText}>Save a route from the Walks tab to build a collection.</Text>
        ) : null}
      </View>
      ) : null}

      {activeMemoryTab !== "collections" ? (
      <View style={styles.mobileCollectionPanel}>
        <View style={styles.mobileSectionHeading}>
          <Text style={styles.mobileSectionTitle}>
            {activeMemoryTab === "works" ? "Works & notes" : "Places"}
          </Text>
          <Text style={styles.mobileSectionMeta}>{timelineEntries.length} entries</Text>
        </View>
        {timelineEntries.slice(0, 6).map((entry) => (
          (() => {
            const exhibition = exhibitionById.get(entry.exhibitionId);

            return (
              <View key={entry.exhibitionId} style={styles.mobileJournalRow}>
                <View style={styles.mobileTimelineDot} />
                <View style={styles.mobileFeedCopy}>
                  <Text style={styles.mobileFeedLabel}>{logStatusLabels[entry.status]}</Text>
                  <Text style={styles.mobileFeedTitle} numberOfLines={1}>
                    {exhibition?.title ?? "Saved exhibition"}
                  </Text>
                  <Text style={styles.mobileFeedDetail} numberOfLines={1}>
                    {exhibition?.galleryName ?? "Walker"} - {formatShortDate(entry.updatedAt)}
                  </Text>
                  {entry.note ? (
                    <Text style={styles.mobileFeedMeta} numberOfLines={2}>{entry.note}</Text>
                  ) : null}
                </View>
              </View>
            );
          })()
        ))}
        {timelineEntries.length === 0 ? (
          <Text style={styles.emptyText}>Mark shows saved, wanted, visited, or skipped to start your timeline.</Text>
        ) : null}
      </View>
      ) : null}

      <View style={styles.mobileRecapCard}>
        <Text style={styles.mobileFeedLabel}>Monthly recap</Text>
        <Text style={styles.mobileRecapTitle}>Your cultural recap</Text>
        <View style={styles.mobileMemoryStats}>
          <Text style={styles.mobileMemoryStat}>{memory.completedWalkCount} walks</Text>
          <Text style={styles.mobileMemoryStat}>{memory.visitedStopCount} places</Text>
          <Text style={styles.mobileMemoryStat}>{memory.stamps.length} stamps</Text>
        </View>
        <View style={styles.routeReasonRow}>
          {badges.slice(0, 3).map((badge) => (
            <Text key={badge.id} style={styles.passportBadge}>{badge.label}</Text>
          ))}
          {stamps.slice(0, 3).map((stamp) => (
            <Text key={stamp.id} style={styles.passportStamp}>{stamp.label}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function RouteCommandPanel({
  walkPlan,
  walkMode,
  routeUsabilityReport,
  walkReadinessReport,
  startPointOptions,
  routeVerifiedStopCount,
  routeFixtureStopCount,
  startStop,
  nextStop,
  activeWalkSession,
  activeWalkProgress,
  activeWalkRecap,
  activeWalkPlan,
  activeWalkCurrentStop,
  activeWalkNextStop,
  activeWalkNextLeg,
  activeWalkIsDraft,
  activeWalkRouteMatchesCurrent,
  onMode,
  onStartWalk,
  onResumeWalk,
  onMarkCurrentVisited,
  onSkipCurrent,
  onEndWalk,
  onCopyItinerary,
  onShareRoute,
  onSaveWalk,
  onStartPointMode,
  onDismissReadinessWarning,
  walkRecapRewardCopy,
  routeMapModel,
  routeMapUrl,
  shareCard,
  walkerShareCard,
  compact = false
}: {
  walkPlan: GalleryWalkPlan;
  walkMode: GalleryWalkMode;
  routeUsabilityReport: GalleryRouteUsabilityReport;
  walkReadinessReport: WalkerWalkReadinessReport;
  startPointOptions: WalkerStartPointOption[];
  routeVerifiedStopCount: number;
  routeFixtureStopCount: number;
  startStop?: GalleryWalkStop;
  nextStop?: GalleryWalkStop;
  activeWalkSession?: GalleryWalkSession;
  activeWalkProgress?: GalleryWalkProgress;
  activeWalkRecap?: GalleryWalkRecap;
  activeWalkPlan?: GalleryWalkPlan;
  activeWalkCurrentStop?: GalleryWalkStop;
  activeWalkNextStop?: GalleryWalkStop;
  activeWalkNextLeg?: GalleryWalkPlan["legs"][number];
  activeWalkIsDraft: boolean;
  activeWalkRouteMatchesCurrent: boolean;
  onMode: (mode: GalleryWalkMode) => void;
  onStartWalk: () => void;
  onResumeWalk: () => void;
  onMarkCurrentVisited: () => void;
  onSkipCurrent: () => void;
  onEndWalk: () => void;
  onCopyItinerary: () => void;
  onShareRoute: () => void;
  onSaveWalk: () => void;
  onStartPointMode: (mode: WalkerStartPointMode) => void;
  onDismissReadinessWarning: (warning: string) => void;
  walkRecapRewardCopy?: string;
  routeMapModel: GalleryRouteMapModel;
  routeMapUrl?: string;
  shareCard?: GalleryWalkShareCard;
  walkerShareCard?: WalkerCompletedWalkShareCard;
  compact?: boolean;
}) {
  const showingActiveWalk =
    activeWalkSession?.status === "active" &&
    !activeWalkIsDraft &&
    Boolean(activeWalkProgress && activeWalkPlan);
  const showingCompletedWalk =
    activeWalkSession?.status === "completed" &&
    activeWalkRouteMatchesCurrent &&
    Boolean(activeWalkRecap && activeWalkPlan);
  const displayPlan = showingActiveWalk && activeWalkPlan ? activeWalkPlan : walkPlan;
  const currentStop = showingActiveWalk ? activeWalkCurrentStop : startStop;
  const displayNextStop = showingActiveWalk ? activeWalkNextStop : nextStop;
  const progressCopy =
    showingActiveWalk && activeWalkProgress
      ? `${activeWalkProgress.completedStopCount}/${activeWalkProgress.totalStopCount} stops complete - ${activeWalkProgress.remainingStopIds.length} remaining`
      : `${routeMapModel.confidence.label} - ${routeMapModel.confidence.bestStartLabel}`;
  const routeWarningChips =
    routeUsabilityReport.warnings.length > 0
      ? routeUsabilityReport.warnings.slice(0, 3).map((warning) => warning.label)
      : ["Low timing risk"];
  const activeNextCopy =
    displayNextStop && activeWalkNextLeg
      ? `${activeWalkNextLeg.walkingMinutes} min, ${activeWalkNextLeg.distanceMiles.toFixed(1)} mi`
      : displayNextStop
        ? galleryVisitStatusLabels[displayNextStop.status]
        : "No next stop";

  return (
    <View style={[styles.routeFirstPanel, compact ? styles.compactRouteFirstPanel : null]}>
      {activeWalkSession?.status === "active" && activeWalkIsDraft ? (
        <View style={styles.activeWalkNotice}>
          <View style={styles.activeWalkNoticeCopy}>
            <Text style={styles.activeWalkNoticeTitle}>Previewing a new route</Text>
            <Text style={styles.activeWalkNoticeText}>
              Your {galleryWalkModeLabels[activeWalkSession.mode]} in {activeWalkSession.neighborhood ?? activeWalkSession.areaId.toUpperCase()} is still saved. Start this route only when you want to replace it.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resume active walk"
            onPress={onResumeWalk}
            style={styles.secondaryRouteButton}
          >
            <Text style={styles.secondaryRouteButtonText}>Resume walk</Text>
          </Pressable>
        </View>
      ) : null}

      {showingActiveWalk && currentStop && activeWalkProgress ? (
        <View style={styles.activeWalkCommandSurface}>
          <View style={styles.activeWalkCommandTop}>
            <View style={styles.activeWalkCurrentCopy}>
              <Text style={[styles.routeFirstKicker, styles.activeWalkKicker]}>Walking now</Text>
              <Text style={styles.activeWalkCurrentTitle}>{currentStop.exhibition.galleryName}</Text>
              <Text style={styles.activeWalkCurrentMeta}>
                {currentStop.exhibition.address} - {galleryVisitStatusLabels[currentStop.status]}
              </Text>
            </View>
            <View style={styles.activeWalkProgressMeter}>
              <Text style={styles.activeWalkProgressValue}>
                {activeWalkProgress.completedStopCount}/{activeWalkProgress.totalStopCount}
              </Text>
              <Text style={styles.activeWalkProgressLabel}>done</Text>
            </View>
          </View>

          <View style={styles.activeWalkNextCard}>
            <Text style={styles.activeWalkNextLabel}>Next stop</Text>
            <Text style={styles.activeWalkNextTitle}>
              {displayNextStop?.exhibition.galleryName ?? "Route complete after this stop"}
            </Text>
            <Text style={styles.activeWalkCurrentMeta}>{activeNextCopy}</Text>
          </View>

          <View style={styles.activeWalkProgressRow}>
            <Text style={styles.activeWalkProgressPill}>{activeWalkProgress.visitedStopIds.length} visited</Text>
            <Text style={styles.activeWalkProgressPill}>{activeWalkProgress.skippedStopIds.length} skipped</Text>
            <Text style={styles.activeWalkProgressPill}>{activeWalkProgress.remainingStopIds.length} remaining</Text>
            <Text style={styles.activeWalkProgressPill}>{routeMapModel.mapReadinessLabel}</Text>
            <Text style={styles.activeWalkProgressPill}>{routeUsabilityReport.timingRiskLabel}</Text>
          </View>

          <View style={styles.activeWalkStickyActions}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open map for current stop ${currentStop.exhibition.galleryName}`}
              onPress={() => {
                void Linking.openURL(currentStop.mapUrl);
              }}
              style={styles.activeWalkMapButton}
            >
              <MapPin size={14} color={colors.paper} />
              <Text style={styles.activeWalkMapButtonText}>Open current map</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark current stop visited"
              onPress={onMarkCurrentVisited}
              style={styles.activeWalkVisitButton}
            >
              <Check size={14} color={colors.teal} />
              <Text style={styles.activeWalkVisitButtonText}>Mark visited</Text>
            </Pressable>
            {routeMapUrl ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open full ${displayPlan.neighborhood} walking route in maps`}
                onPress={() => {
                  if (routeMapUrl) {
                    void Linking.openURL(routeMapUrl);
                  }
                }}
                style={styles.secondaryRouteButton}
              >
                <Text style={styles.secondaryRouteButtonText}>Full route</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip current stop"
              onPress={onSkipCurrent}
              style={styles.secondaryRouteButton}
            >
              <Text style={styles.secondaryRouteButtonText}>Skip</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="End active walk"
              onPress={onEndWalk}
              style={styles.secondaryRouteButton}
            >
              <Text style={styles.secondaryRouteButtonText}>End</Text>
            </Pressable>
          </View>
        </View>
      ) : showingCompletedWalk && activeWalkRecap ? (
        <View style={styles.walkRecapCard}>
          <View style={styles.walkRecapHeader}>
            <View>
              <Text style={styles.routeFirstKicker}>Walk completed</Text>
              <Text style={styles.walkRecapTitle}>{walkerShareCard?.heading ?? "Walk Complete"}</Text>
            </View>
            <Text style={styles.walkRecapNeighborhood}>
              {activeWalkRecap.neighborhoods.join(", ") || displayPlan.neighborhood}
            </Text>
          </View>
          <Text style={styles.walkRecapCopy}>
            {activeWalkRecap.visitedStopCount} stops completed, {activeWalkRecap.skippedStopCount} skipped, {activeWalkRecap.notedStopCount} notes saved.
          </Text>
          <View style={styles.completedStatsGrid}>
            <View style={styles.completedStatTile}>
              <Text style={styles.completedStatValue}>{displayPlan.totalMinutes}</Text>
              <Text style={styles.completedStatLabel}>total min</Text>
            </View>
            <View style={styles.completedStatTile}>
              <Text style={styles.completedStatValue}>{activeWalkRecap.visitedStopCount}/{activeWalkRecap.totalStopCount}</Text>
              <Text style={styles.completedStatLabel}>stops</Text>
            </View>
            <View style={styles.completedStatTile}>
              <Text style={styles.completedStatValue}>{displayPlan.totalDistanceMiles.toFixed(1)}</Text>
              <Text style={styles.completedStatLabel}>miles</Text>
            </View>
            <View style={styles.completedStatTile}>
              <Text style={styles.completedStatValue}>{activeWalkRecap.notedStopCount}</Text>
              <Text style={styles.completedStatLabel}>notes</Text>
            </View>
          </View>
          {walkRecapRewardCopy ? (
            <Text style={styles.walkRecapRewardCopy}>{walkRecapRewardCopy}</Text>
          ) : null}
          <View style={styles.walkShareCard}>
            <View style={styles.walkShareCardBrandRow}>
              <WalkerMark size={20} />
              <Text style={styles.walkShareCardBrand}>Walker</Text>
            </View>
            <Text style={styles.walkShareCardTitle}>{walkerShareCard?.subtitle ?? shareCard?.subtitle}</Text>
            <Text style={styles.walkShareCardMeta}>
              {(walkerShareCard?.stats ?? shareCard?.stats ?? []).join(" - ")}
            </Text>
            {(walkerShareCard?.highlights ?? shareCard?.highlights ?? []).slice(0, 3).map((highlight) => (
                <Text key={highlight} style={styles.walkShareCardHighlight}>{highlight}</Text>
            ))}
          </View>
          <View style={styles.activeWalkProgressRow}>
            <Text style={[styles.activeWalkProgressPill, styles.walkRecapPill]}>{activeWalkRecap.totalStopCount} stops</Text>
            <Text style={[styles.activeWalkProgressPill, styles.walkRecapPill]}>{activeWalkRecap.remainingStopCount} left open</Text>
            {activeWalkRecap.completedAt ? (
              <Text style={[styles.activeWalkProgressPill, styles.walkRecapPill]}>Ended {formatShortTime(activeWalkRecap.completedAt)}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start another walk"
            onPress={onStartWalk}
            style={styles.primaryLightButton}
          >
            <Text style={styles.primaryLightButtonText}>Start another walk</Text>
          </Pressable>
          <View style={styles.activeWalkActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy completed walk itinerary"
              onPress={onCopyItinerary}
              style={styles.secondaryRouteButton}
            >
              <Text style={styles.secondaryRouteButtonText}>Copy summary</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share completed walk summary"
              onPress={onShareRoute}
              style={styles.secondaryRouteButton}
            >
              <Text style={styles.secondaryRouteButtonText}>Share</Text>
            </Pressable>
          </View>
          <WalkerReadinessCard
            report={walkReadinessReport}
            startPointOptions={startPointOptions}
            compact={compact}
            onStartPointMode={onStartPointMode}
            onDismissWarning={onDismissReadinessWarning}
          />
        </View>
      ) : (
        <>
          <View style={styles.routeFirstHeader}>
            <View style={styles.routeFirstTitleBlock}>
              <Text style={styles.routeFirstKicker}>Tonight's walk</Text>
              <Text style={styles.routeFirstTitle}>{displayPlan.summary}</Text>
              <Text style={styles.routeFirstMeta}>{progressCopy}</Text>
            </View>
            {routeMapUrl ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open full ${displayPlan.neighborhood} walking route in maps`}
                onPress={() => {
                  if (routeMapUrl) {
                    void Linking.openURL(routeMapUrl);
                  }
                }}
                style={styles.routeFirstMapButton}
              >
                <ExternalLink size={14} color={colors.paper} />
                <Text style={styles.routeFirstMapButtonText}>Open full route</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routeModeRail}
          >
            {walkModeOptions.map((mode) => (
              <RouteModeButton
                key={mode}
                label={galleryWalkModeLabels[mode]}
                detail={walkModeDetails[mode]}
                active={walkMode === mode}
                onPress={() => onMode(mode)}
              />
            ))}
          </ScrollView>
          <View style={styles.activeWalkActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start walk"
              onPress={onStartWalk}
              style={styles.primaryLightButton}
            >
              <Text style={styles.primaryLightButtonText}>
                {activeWalkSession?.status === "active"
                  ? "Start this route"
                  : walkReadinessReport.primaryActionCopy}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save this walk"
              onPress={onSaveWalk}
              style={styles.secondaryRouteButton}
            >
              <Text style={styles.secondaryRouteButtonText}>Save walk</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy current walk itinerary"
              onPress={onCopyItinerary}
              style={styles.secondaryRouteButton}
            >
              <Copy size={13} color={colors.ink} />
              <Text style={styles.secondaryRouteButtonText}>Copy itinerary</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share current walk route"
              onPress={onShareRoute}
              style={styles.secondaryRouteButton}
            >
              <Share2 size={13} color={colors.ink} />
              <Text style={styles.secondaryRouteButtonText}>Share</Text>
            </Pressable>
          </View>

          <WalkerReadinessCard
            report={walkReadinessReport}
            startPointOptions={startPointOptions}
            compact={compact}
            onStartPointMode={onStartPointMode}
            onDismissWarning={onDismissReadinessWarning}
          />

          <View style={styles.routeFirstStats}>
            <Metric label="stops" value={displayPlan.stops.length} tone="good" />
            <Metric label="minutes" value={displayPlan.totalMinutes} />
            <Metric label="verified" value={`${routeVerifiedStopCount}/${displayPlan.stops.length}`} tone="good" />
            {routeFixtureStopCount > 0 ? (
              <Metric label="demo" value={routeFixtureStopCount} tone="warn" />
            ) : null}
          </View>

          <View style={styles.routeStartRow}>
            <Text style={styles.routeStartPill}>Start {startStop?.exhibition.galleryName ?? "where open"}</Text>
            <Text style={styles.routeStartPill}>Next {displayNextStop?.exhibition.galleryName ?? "best nearby stop"}</Text>
            <Text style={styles.routeStartPill}>{displayPlan.canStartNow ? "Can start now" : "Timing check needed"}</Text>
            <Text style={styles.routeStartPill}>{routeUsabilityReport.label}</Text>
          </View>

          <View style={styles.routeReasonRow}>
            {displayPlan.selectionReasons.slice(0, 4).map((reason) => (
              <Text key={reason} style={styles.routeReasonPill}>{reason}</Text>
            ))}
            {routeWarningChips.map((warning) => (
              <Text key={warning} style={styles.routeWarningPill}>{warning}</Text>
            ))}
          </View>
          <Text style={styles.routeTimingCopy}>{routeUsabilityReport.bestStartReason}</Text>
        </>
      )}
    </View>
  );
}

function ActiveWalkJourneyScreen({
  walkPlan,
  routeMapModel,
  routeMapHandoff,
  currentStop,
  nextStop,
  nextLeg,
  progress,
  journeyStep,
  reaction,
  reactionNote,
  reactionSaved,
  onArrived,
  onContinueToReaction,
  onReaction,
  onReactionNote,
  onToggleSaved,
  onSaveReaction,
  onSkip,
  onEnd,
  onHighlightStop,
  highlightedStopId,
  focusedSwapCandidates,
  onSwapFocusedStop
}: {
  walkPlan: GalleryWalkPlan;
  routeMapModel: GalleryRouteMapModel;
  routeMapHandoff: WalkerRouteMapHandoff;
  currentStop?: GalleryWalkStop;
  nextStop?: GalleryWalkStop;
  nextLeg?: GalleryWalkPlan["legs"][number];
  progress?: GalleryWalkProgress;
  journeyStep: WalkerJourneyStep;
  reaction: WalkerReactionKind;
  reactionNote: string;
  reactionSaved: boolean;
  onArrived: () => void;
  onContinueToReaction: () => void;
  onReaction: (reaction: WalkerReactionKind) => void;
  onReactionNote: (note: string) => void;
  onToggleSaved: () => void;
  onSaveReaction: () => void;
  onSkip: () => void;
  onEnd: () => void;
  onHighlightStop: (stopId: string) => void;
  highlightedStopId?: string;
  focusedSwapCandidates?: GalleryRouteSwapCandidate[];
  onSwapFocusedStop?: (replacementId: string) => void;
}) {
  if (!currentStop || !progress) {
    return null;
  }

  const visual = getWalkerExhibitionBanner(currentStop.exhibition);
  const prompt = getWalkerStopArrivalPrompt(currentStop.exhibition);
  const nextCopy = nextLeg
    ? `${nextLeg.walkingMinutes} min walk - ${nextLeg.distanceMiles.toFixed(1)} mi`
    : nextStop
      ? galleryVisitStatusLabels[nextStop.status]
      : "Final stop";

  if (journeyStep === "arrival") {
    return (
      <View style={styles.arrivalScreen}>
        <ImageBackground
          source={galleryVisualSources[visual.assetKey]}
          accessibilityLabel={visual.alt}
          imageStyle={styles.arrivalImage}
          style={styles.arrivalHero}
        >
          <View style={styles.cardImageShade} />
          <View style={styles.arrivalTopRow}>
            <Text style={styles.arrivalBadge}>Stop {currentStop.stopNumber}</Text>
            <Text style={styles.arrivalBadge}>{galleryVisitStatusLabels[currentStop.status]}</Text>
          </View>
          <View style={styles.arrivalHeroCopy}>
            <Text style={styles.arrivalGallery}>{currentStop.exhibition.galleryName}</Text>
            <Text style={styles.arrivalTitle}>{currentStop.exhibition.title}</Text>
          </View>
        </ImageBackground>
        <View style={styles.arrivalPromptCard}>
          <Text style={styles.arrivalPromptKicker}>{prompt.title}</Text>
          <Text style={styles.arrivalPromptBody}>{prompt.body}</Text>
          <Text style={styles.arrivalPromptSignal}>{prompt.signal}</Text>
        </View>
        <View style={styles.arrivalActionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue to post visit reaction"
            onPress={onContinueToReaction}
            style={styles.walkerPrimaryAction}
          >
            <Text style={styles.walkerPrimaryActionText}>Continue walk</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open map for ${currentStop.exhibition.galleryName}`}
            onPress={() => {
              void Linking.openURL(currentStop.mapUrl);
            }}
            style={styles.walkerSecondaryAction}
          >
            <MapPin size={14} color={colors.teal} />
            <Text style={styles.walkerSecondaryActionText}>Map</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (journeyStep === "reaction") {
    return (
      <View style={styles.reactionScreen}>
        <View style={styles.reactionHeader}>
          <Text style={styles.reactionKicker}>Share your reaction</Text>
          <Text style={styles.reactionTitle}>{currentStop.exhibition.galleryName}</Text>
          <Text style={styles.reactionMeta}>{currentStop.exhibition.title}</Text>
        </View>
        <View style={styles.reactionChipGrid}>
          {walkerReactionOptions.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Reaction ${walkerReactionLabels[option]}`}
              onPress={() => onReaction(option)}
              style={[
                styles.reactionChip,
                reaction === option ? styles.selectedReactionChip : null
              ]}
            >
              <Text
                style={[
                  styles.reactionChipText,
                  reaction === option ? styles.selectedReactionChipText : null
                ]}
              >
                {walkerReactionLabels[option]}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Save this stop to Walker"
          onPress={onToggleSaved}
          style={styles.reactionSaveRow}
        >
          <Text style={styles.reactionSaveLabel}>Save to Walker</Text>
          <Text style={styles.reactionSaveSwitch}>{reactionSaved ? "On" : "Off"}</Text>
        </Pressable>
        <TextInput
          accessibilityLabel="Optional visit note"
          value={reactionNote}
          onChangeText={onReactionNote}
          placeholder="What stood out to you?"
          placeholderTextColor={colors.mutedInk}
          multiline
          style={styles.reactionNoteInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save reaction and continue"
          onPress={onSaveReaction}
          style={styles.walkerPrimaryAction}
        >
          <Text style={styles.walkerPrimaryActionText}>Save & continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.activeJourneyScreen}>
      <View style={styles.activeJourneyHeader}>
        <View>
          <Text style={styles.activeJourneyKicker}>Active walk</Text>
          <Text style={styles.activeJourneyTitle}>{currentStop.exhibition.galleryName}</Text>
          <Text style={styles.activeJourneyMeta}>
            {currentStop.exhibition.neighborhood} - {galleryVisitStatusLabels[currentStop.status]}
          </Text>
        </View>
        <View style={styles.activeJourneyMeter}>
          <Text style={styles.activeJourneyMeterValue}>
            {progress.completedStopCount}/{progress.totalStopCount}
          </Text>
          <Text style={styles.activeJourneyMeterLabel}>complete</Text>
        </View>
      </View>

      <View style={styles.activeJourneyNotice}>
        <Text style={styles.activeJourneyNoticeLabel}>Next stop</Text>
        <Text style={styles.activeJourneyNoticeTitle}>
          {nextStop?.exhibition.galleryName ?? "Walk complete after this stop"}
        </Text>
        <Text style={styles.activeJourneyMeta}>{nextCopy}</Text>
      </View>

      <View style={styles.activeJourneyDots}>
        {walkPlan.stops.map((stop) => {
          const stopProgress = progress.stopProgressById[stop.exhibition.id];

          return (
            <View
              key={stop.exhibition.id}
              style={[
                styles.activeJourneyDot,
                stopProgress === "current" ? styles.currentActiveJourneyDot : null,
                stopProgress === "visited" ? styles.visitedActiveJourneyDot : null,
                stopProgress === "skipped" ? styles.skippedActiveJourneyDot : null
              ]}
            >
              <Text style={styles.activeJourneyDotText}>{stop.stopNumber}</Text>
            </View>
          );
        })}
      </View>

      <RoutePreview
        routeMapModel={routeMapModel}
        routeMapHandoff={routeMapHandoff}
        highlightedStopId={highlightedStopId}
        focusedSwapCandidates={focusedSwapCandidates}
        onHighlightStop={onHighlightStop}
        onSwapFocusedStop={onSwapFocusedStop}
      />

      <View style={styles.activeJourneyStickyActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="I have arrived at this stop"
          onPress={onArrived}
          style={styles.activeJourneyPrimaryButton}
        >
          <Text style={styles.activeJourneyPrimaryText}>I've arrived</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open map for ${currentStop.exhibition.galleryName}`}
          onPress={() => {
            void Linking.openURL(currentStop.mapUrl);
          }}
          style={styles.activeJourneySecondaryButton}
        >
          <Text style={styles.activeJourneySecondaryText}>Open map</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip this stop"
          onPress={onSkip}
          style={styles.activeJourneySecondaryButton}
        >
          <Text style={styles.activeJourneySecondaryText}>Skip</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End this walk"
          onPress={onEnd}
          style={styles.activeJourneySecondaryButton}
        >
          <Text style={styles.activeJourneySecondaryText}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OpeningRadarItem({ signal }: { signal: GalleryEventSignal }) {
  return (
    <View style={styles.radarItem}>
      <View style={styles.radarIcon}>
        <CalendarDays size={18} color={colors.coralDark} />
      </View>
      <View style={styles.radarCopy}>
        <Text style={styles.radarTitle}>{signal.exhibition.title}</Text>
        <Text style={styles.radarMeta}>
          {signal.label} - {signal.timingLabel}
        </Text>
        <Text style={styles.radarMeta}>
          {signal.exhibition.galleryName} - {signal.exhibition.neighborhood} - {signal.routeFit} route fit
        </Text>
        <View style={styles.routeReasonRow}>
          <Text style={styles.walkStopReason}>{signal.requiresRsvp ? "RSVP/link available" : "No RSVP needed"}</Text>
          <Text style={styles.walkStopReason}>{signal.sourceLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function WalkStopRow({
  stop,
  leg,
  isStart,
  isNext,
  isLast,
  progress,
  freshnessLabel,
  advisory,
  highlighted,
  swapCandidates = [],
  onHighlight,
  onSwapStop
}: {
  stop: GalleryWalkPlan["stops"][number];
  leg?: GalleryWalkPlan["legs"][number];
  isStart: boolean;
  isNext: boolean;
  isLast: boolean;
  progress?: GalleryWalkStopProgress;
  freshnessLabel?: string;
  advisory?: GalleryRouteMapModel["stopAdvisories"][number];
  highlighted?: boolean;
  swapCandidates?: GalleryRouteSwapCandidate[];
  onHighlight?: () => void;
  onSwapStop?: (replacementId: string) => void;
}) {
  const trust = getGalleryInventoryTrust(stop.exhibition);
  const receipt = createGallerySourceReceipt(stop.exhibition, referenceNow);
  const groupedShows = stop.exhibitions ?? [stop.exhibition];
  const showCountLabel = `${groupedShows.length} show${groupedShows.length === 1 ? "" : "s"} on view`;

  return (
    <View
      style={[
        styles.walkStop,
        progress === "current" ? styles.currentWalkStop : null,
        progress === "next" ? styles.nextWalkStop : null,
        progress === "visited" ? styles.visitedWalkStop : null,
        progress === "skipped" ? styles.skippedWalkStop : null,
        highlighted ? styles.highlightedWalkStop : null
      ]}
    >
      <View style={styles.stopRail}>
        <View
          style={[
            styles.stopNumber,
            progress === "current" ? styles.currentStopNumber : null,
            progress === "visited" ? styles.visitedStopNumber : null,
            progress === "skipped" ? styles.skippedStopNumber : null
          ]}
        >
          <Text style={styles.stopNumberText}>{stop.stopNumber}</Text>
        </View>
        {!isLast ? <View style={styles.stopRailLine} /> : null}
      </View>
      <View style={styles.walkStopCopy}>
        <View style={styles.stopLabelRow}>
          {isStart ? (
            <Text style={styles.routePill}>Start here</Text>
          ) : null}
          {isNext ? (
            <Text style={styles.routePill}>Next stop</Text>
          ) : null}
          {progress ? (
            <Text style={styles.routePill}>{getRouteProgressLabel(progress)}</Text>
          ) : null}
        </View>
        <Text style={styles.walkStopTitle}>{stop.exhibition.galleryName}</Text>
        <Text style={styles.walkStopMeta}>
          {stop.exhibition.address} - {stop.exhibition.neighborhood} - {galleryVisitStatusLabels[stop.status]}
        </Text>
        <Text style={styles.walkStopShowCount}>{showCountLabel}</Text>
        <View style={styles.groupedShowList}>
          {groupedShows.slice(0, 3).map((exhibition) => (
            <Text key={exhibition.id} style={styles.groupedShowText} numberOfLines={1}>
              {exhibition.title} - {exhibition.artists.join(", ")}
            </Text>
          ))}
          {groupedShows.length > 3 ? (
            <Text style={styles.groupedShowText}>+{groupedShows.length - 3} more here</Text>
          ) : null}
        </View>
        {leg ? (
          <Text style={styles.walkStopMeta}>
            {leg.walkingMinutes} min walk - {leg.distanceMiles.toFixed(1)} mi from previous
          </Text>
        ) : null}
        <View style={styles.routeReasonRow}>
          {stop.reasons.slice(0, 3).map((reason) => (
            <Text key={reason} style={styles.walkStopReason}>{reason}</Text>
          ))}
        </View>
        <Text style={styles.walkStopTrust}>
          {freshnessLabel ?? trust.label} - {receipt.evidenceLabel}
        </Text>
        <Text style={styles.walkStopReceipt} numberOfLines={1}>
          {receipt.label} - {receipt.actionLabel}
        </Text>
        {advisory ? (
          <View style={styles.walkStopAdvisory}>
            <Text style={styles.walkStopAdvisoryTitle}>{advisory.label}</Text>
            <Text style={styles.walkStopAdvisoryCopy}>{advisory.detail}</Text>
            <View style={styles.routeReasonRow}>
              {advisory.reasons.slice(0, 3).map((reason) => (
                <Text key={reason} style={styles.walkStopReason}>{reason}</Text>
              ))}
            </View>
          </View>
        ) : null}
        {swapCandidates.length > 0 ? (
          <View style={styles.swapOptionsBlock}>
            <Text style={styles.swapOptionsTitle}>Swap stop</Text>
            {swapCandidates.map((candidate) => (
              <View key={candidate.exhibition.id} style={styles.swapCandidateRow}>
                <View style={styles.swapCandidateCopy}>
                  <Text style={styles.swapCandidateTitle}>
                    {candidate.exhibition.galleryName}
                  </Text>
                  <Text style={styles.swapCandidateMeta} numberOfLines={1}>
                    {candidate.walkingMinutes} min - {candidate.reasons.slice(0, 3).join(", ")}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Swap ${candidate.exhibition.galleryName} into this route stop`}
                  onPress={() => onSwapStop?.(candidate.exhibition.id)}
                  style={styles.swapCandidateButton}
                >
                  <Text style={styles.swapCandidateButtonText}>Swap</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {stop.isSaved ? (
        <View style={styles.savedPill}>
          <Heart size={13} color={colors.coralDark} fill={colors.coralDark} />
          <Text style={styles.savedPillText}>Saved</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open map for ${stop.exhibition.galleryName}`}
        onPress={() => {
          void Linking.openURL(stop.mapUrl);
        }}
        style={styles.mapIconButton}
      >
        <MapPin size={16} color={colors.ink} />
        <Text style={styles.mapIconButtonText}>Map</Text>
      </Pressable>
      {onHighlight ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Highlight ${stop.exhibition.galleryName} on route map`}
          onPress={onHighlight}
          style={styles.mapIconButton}
        >
          <Route size={16} color={colors.ink} />
          <Text style={styles.mapIconButtonText}>Focus</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function RoutePreview({
  routeMapModel,
  routeMapHandoff,
  highlightedStopId,
  focusedSwapCandidates = [],
  onHighlightStop,
  onSwapFocusedStop
}: {
  routeMapModel: GalleryRouteMapModel;
  routeMapHandoff: WalkerRouteMapHandoff;
  highlightedStopId?: string;
  focusedSwapCandidates?: GalleryRouteSwapCandidate[];
  onHighlightStop: (stopId: string) => void;
  onSwapFocusedStop?: (replacementId: string) => void;
}) {
  if (routeMapModel.pins.length === 0) {
    return null;
  }

  const routePath = routeMapModel.pathPoints
    .map((point) => `${point.xPercent},${point.yPercent}`)
    .join(" ");
  const focusedPin =
    routeMapModel.pins.find((pin) => pin.id === highlightedStopId) ??
    routeMapModel.currentPin ??
    routeMapModel.pins[0];
  const focusedAdvisory = routeMapModel.stopAdvisories.find(
    (advisory) => advisory.stopId === focusedPin?.id
  );
  const routeAdviceChips = routeMapModel.confidence.routeAdvice.slice(0, 3);

  return (
    <View style={styles.routePreview}>
      <View style={styles.routePreviewHeader}>
        <MapPin size={15} color={colors.teal} />
        <Text style={styles.routePreviewTitle}>Route map</Text>
        <Text style={styles.routePreviewMeta}>
          {routeMapModel.mapReadinessLabel} - {routeMapModel.totalDistanceMiles.toFixed(1)} mi
        </Text>
      </View>
      <View style={styles.routeConfidencePanel}>
        <View style={styles.routeConfidenceHeader}>
          <Text style={styles.routeConfidenceScore}>{routeMapModel.confidence.score}</Text>
          <View style={styles.routeConfidenceCopyBlock}>
            <Text style={styles.routeConfidenceLabel}>{routeMapModel.confidence.label}</Text>
            <Text style={styles.routeConfidenceMeta}>
              {routeMapModel.confidence.bestStartLabel}
            </Text>
          </View>
        </View>
        <View style={styles.routeConfidenceChipRow}>
          {routeAdviceChips.map((advice) => (
            <Text key={advice} style={styles.routeConfidenceChip} numberOfLines={1}>
              {advice}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.routeStartHandoffPanel}>
        <View style={styles.routeStartHandoffHeader}>
          <View style={styles.routeStartIcon}>
            <MapPin size={13} color={colors.paper} />
          </View>
          <View style={styles.routeStartCopy}>
            <Text style={styles.routeStartLabel}>Start point</Text>
            <Text style={styles.routeStartTitle}>{routeMapHandoff.startPointLabel}</Text>
          </View>
          <Text style={styles.routeStartHandoffPill}>
            {routeMapHandoff.usedCustomStart ? "Adjusted" : "Default"}
          </Text>
        </View>
        <Text style={styles.routeStartDetail}>{routeMapHandoff.startPointDetail}</Text>
      </View>
      <View style={styles.routeMapSummaryRow}>
        <Text style={styles.routeMapSummaryPill}>
          Current {routeMapModel.currentPin?.galleryName ?? "best start"}
        </Text>
        <Text style={styles.routeMapSummaryPill}>
          Next {routeMapModel.nextPin?.galleryName ?? "finish"}
        </Text>
        <Text style={styles.routeMapSummaryPill}>
          {routeMapModel.totalWalkingMinutes} min walking
        </Text>
      </View>
      <View style={styles.routeMapActionRow}>
        {focusedPin ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open map for selected stop ${focusedPin.galleryName}`}
            onPress={() => {
              if (focusedPin) {
                void Linking.openURL(focusedPin.mapUrl);
              }
            }}
            style={styles.routeMapPrimaryAction}
          >
            <MapPin size={14} color={colors.paper} />
            <Text style={styles.routeMapPrimaryActionText}>Open selected stop</Text>
          </Pressable>
        ) : null}
        {routeMapHandoff.routeMapUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open full route map"
            onPress={() => {
              if (routeMapHandoff.routeMapUrl) {
                void Linking.openURL(routeMapHandoff.routeMapUrl);
              }
            }}
            style={styles.routeMapSecondaryAction}
          >
            <ExternalLink size={14} color={colors.ink} />
            <Text style={styles.routeMapSecondaryActionText}>Full route</Text>
          </Pressable>
        ) : null}
      </View>
      {focusedPin && focusedSwapCandidates.length > 0 ? (
        <View style={styles.routePreviewSwapPanel}>
          <Text style={styles.swapOptionsTitle}>Swap focused stop</Text>
          {focusedSwapCandidates.map((candidate) => (
            <View key={candidate.exhibition.id} style={styles.swapCandidateRow}>
              <View style={styles.swapCandidateCopy}>
                <Text style={styles.swapCandidateTitle}>{candidate.exhibition.galleryName}</Text>
                <Text style={styles.swapCandidateMeta} numberOfLines={1}>
                  {candidate.reasons.slice(0, 3).join(", ")}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Swap focused stop for ${candidate.exhibition.galleryName}`}
                onPress={() => onSwapFocusedStop?.(candidate.exhibition.id)}
                style={styles.swapCandidateButton}
              >
                <Text style={styles.swapCandidateButtonText}>Swap</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.routeMapCanvas}>
        <View style={[styles.routeMapMinorRoad, styles.routeMapMinorRoadOne]} />
        <View style={[styles.routeMapMinorRoad, styles.routeMapMinorRoadTwo]} />
        <View style={[styles.routeMapMinorRoad, styles.routeMapMinorRoadThree]} />
        <View style={[styles.routeMapMinorRoadVertical, styles.routeMapMinorRoadFour]} />
        <View style={[styles.routeMapMinorRoadVertical, styles.routeMapMinorRoadFive]} />
        <View style={[styles.routeMapMinorRoadVertical, styles.routeMapMinorRoadSix]} />
        <View style={[styles.routeMapRoadBand, styles.routeMapRoadBandNorth]} />
        <View style={[styles.routeMapRoadBand, styles.routeMapRoadBandSouth]} />
        <View style={[styles.routeMapRoadBandVertical, styles.routeMapRoadBandWest]} />
        <View style={[styles.routeMapRoadBandVertical, styles.routeMapRoadBandEast]} />
        <View style={styles.routeMapCurrentDot} />
        <Svg style={styles.routeMapSvg} viewBox="0 0 100 100" pointerEvents="none">
          <Polyline
            points={routePath}
            fill="none"
            stroke={colors.teal}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.4}
          />
        </Svg>
        {routeMapModel.segments.slice(0, 4).map((segment) => {
          const fromPin = routeMapModel.pins.find((pin) => pin.id === segment.fromStopId);
          const toPin = routeMapModel.pins.find((pin) => pin.id === segment.toStopId);

          if (!fromPin || !toPin) {
            return null;
          }

          return (
            <Text
              key={segment.id}
              style={[
                styles.routeMapSegmentLabel,
                {
                  left: percentPosition((fromPin.xPercent + toPin.xPercent) / 2),
                  top: percentPosition((fromPin.yPercent + toPin.yPercent) / 2)
                }
              ]}
            >
              {segment.walkingMinutes}m
            </Text>
          );
        })}
        {routeMapModel.pins.map((pin) => (
          <Pressable
            key={pin.id}
            accessibilityRole="button"
            accessibilityLabel={`Focus stop ${pin.stopNumber}, ${pin.galleryName} on the route map`}
            onPress={() => onHighlightStop(pin.id)}
            style={[
              styles.routeMapPin,
              pin.isCurrent || pin.isNext ? styles.routeMapPinActive : null,
              pin.progress === "visited" ? styles.routeMapPinVisited : null,
              pin.progress === "skipped" ? styles.routeMapPinSkipped : null,
              pin.id === focusedPin?.id ? styles.routeMapPinSelected : null,
              {
                left: percentPosition(pin.xPercent),
                top: percentPosition(pin.yPercent)
              }
            ]}
          >
            <Text style={styles.routeMapPinText}>{pin.stopNumber}</Text>
          </Pressable>
        ))}
        <View style={styles.routeMapCanvasLegend}>
          <Text style={styles.routeMapCanvasTitle}>
            {focusedPin ? `${focusedPin.stopNumber}. ${focusedPin.galleryName}` : routeMapModel.title}
          </Text>
          <Text style={styles.routeMapCanvasMeta}>
            {focusedAdvisory?.label ?? `${routeMapModel.pins.length} stops`} - tap a pin to focus
          </Text>
        </View>
        <View style={styles.routeMapStartBadge}>
          <MapPin size={10} color={colors.paper} />
          <Text style={styles.routeMapStartBadgeText}>{routeMapHandoff.startPointLabel}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.routePreviewScroll}
        contentContainerStyle={styles.routePreviewStrip}
      >
        {routeMapModel.pins.map((pin, index) => {
          const nextSegment = routeMapModel.segments[index];

          return (
            <Pressable
              key={pin.id}
              accessibilityRole="button"
              accessibilityLabel={`Focus route stop ${pin.stopNumber}, ${pin.galleryName}`}
              onPress={() => onHighlightStop(pin.id)}
              style={[
                styles.routePreviewStop,
                pin.id === focusedPin?.id ? styles.selectedRoutePreviewStop : null
              ]}
            >
              <View style={styles.routePreviewNodeRow}>
                <View
                  style={[
                    styles.routePreviewNode,
                    pin.isCurrent || pin.isNext ? styles.routePreviewNodeActive : undefined,
                    pin.progress === "visited" ? styles.routePreviewNodeVisited : undefined,
                    pin.progress === "skipped" ? styles.routePreviewNodeSkipped : undefined
                  ]}
                >
                  <Text style={styles.routePreviewNodeText}>{pin.stopNumber}</Text>
                </View>
                {index < routeMapModel.pins.length - 1 ? (
                  <View style={styles.routePreviewLine} />
                ) : null}
              </View>
              <Text style={styles.routePreviewGallery} numberOfLines={1}>
                {pin.galleryName}
              </Text>
              <Text style={styles.routePreviewStatus} numberOfLines={1}>
                {getRouteProgressLabel(pin.progress)}
              </Text>
              <Text style={styles.routePreviewLeg}>
                {nextSegment ? `${nextSegment.label} - ${nextSegment.detail}` : "Finish"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function TasteQuizArtworkCard({
  artwork,
  answer,
  onAnswer
}: {
  artwork: GalleryQuizArtwork;
  answer?: GalleryQuizAnswer;
  onAnswer: (artworkId: string, response: GalleryQuizResponse) => void;
}) {
  return (
    <View style={styles.quizArtworkCard}>
      <ImageBackground
        source={{ uri: artwork.imageUrl }}
        accessibilityLabel={`${artwork.title} by ${artwork.artist}`}
        imageStyle={styles.quizArtworkImage}
        style={styles.quizArtworkVisual}
      >
        <View style={styles.cardImageShade} />
        <View style={styles.quizArtworkTopRow}>
          <Text style={styles.visualBadge}>{artwork.mediums.map((medium) => mediumLabels[medium]).join(", ")}</Text>
          {answer ? <Text style={styles.visualBadge}>{quizResponseLabels[answer.response]}</Text> : null}
        </View>
        <View style={styles.cardVisualCopy}>
          <Text style={styles.cardVisualGallery}>{artwork.artist}</Text>
          <Text style={styles.quizArtworkTitle} numberOfLines={2}>{artwork.title}</Text>
        </View>
      </ImageBackground>
      <View style={styles.quizArtworkBody}>
        <Text style={styles.quizArtworkMeta}>{artwork.dateDisplay} - Art Institute of Chicago</Text>
        <View style={styles.quizAnswerRow}>
          {quizResponseOptions.map((response) => (
            <Pressable
              key={response}
              accessibilityRole="button"
              accessibilityLabel={`${quizResponseLabels[response]} ${artwork.title}`}
              onPress={() => onAnswer(artwork.id, response)}
              style={[
                styles.quizAnswerButton,
                answer?.response === response ? styles.activeQuizAnswerButton : null
              ]}
            >
              <Text
                style={[
                  styles.quizAnswerButtonText,
                  answer?.response === response ? styles.activeQuizAnswerButtonText : null
                ]}
              >
                {quizResponseLabels[response]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function PersonalizedPickRow({
  pick,
  feedback,
  onOpenDetails,
  onFeedback
}: {
  pick: GalleryPersonalizedPick;
  feedback?: GalleryTasteFeedback;
  onOpenDetails: () => void;
  onFeedback: (kind: GalleryTasteFeedbackKind) => void;
}) {
  const status = getGalleryVisitStatus(pick.exhibition, referenceNow);

  return (
    <View style={styles.personalPickRow}>
      <View style={styles.personalPickScore}>
        <Sparkles size={14} color={colors.paper} />
        <Text style={styles.personalPickScoreText}>{Math.round(pick.score)}</Text>
      </View>
      <View style={styles.personalPickCopy}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open details for personalized pick ${pick.exhibition.title}`}
          onPress={onOpenDetails}
        >
          <Text style={styles.personalPickTitle}>{pick.exhibition.title}</Text>
        </Pressable>
        <Text style={styles.personalPickMeta}>
          {pick.exhibition.galleryName} - {pick.exhibition.neighborhood} - {galleryVisitStatusLabels[status]}
        </Text>
        <View style={styles.routeReasonRow}>
          {pick.reasons.slice(0, 3).map((reason) => (
            <Text key={reason} style={styles.walkStopReason}>{reason}</Text>
          ))}
        </View>
        <View style={styles.feedbackRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`More like ${pick.exhibition.title}`}
            onPress={() => onFeedback("more-like-this")}
            style={[
              styles.feedbackButton,
              feedback?.kind === "more-like-this" ? styles.activeFeedbackButton : null
            ]}
          >
            <Text
              style={[
                styles.feedbackButtonText,
                feedback?.kind === "more-like-this" ? styles.activeFeedbackButtonText : null
              ]}
            >
              More like this
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Less like ${pick.exhibition.title}`}
            onPress={() => onFeedback("less-like-this")}
            style={[
              styles.feedbackButton,
              feedback?.kind === "less-like-this" ? styles.activeFeedbackButton : null
            ]}
          >
            <Text
              style={[
                styles.feedbackButtonText,
                feedback?.kind === "less-like-this" ? styles.activeFeedbackButtonText : null
              ]}
            >
              Less
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function QuestRow({ quest }: { quest: GalleryQuest }) {
  const progressWidth: DimensionValue = `${Math.min(
    100,
    Math.round((quest.progressCount / quest.targetCount) * 100)
  )}%`;

  return (
    <View style={styles.questRow}>
      <View style={styles.questHeader}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        <Text style={styles.questProgress}>{quest.progressCount}/{quest.targetCount}</Text>
      </View>
      <Text style={styles.questDescription}>{quest.description}</Text>
      <View style={styles.questProgressTrack}>
        <View style={[styles.questProgressFill, { width: progressWidth }]} />
      </View>
      <Text style={styles.questReason}>{quest.completed ? "Completed" : quest.reason}</Text>
    </View>
  );
}

function GalleryPassportPanel({
  quizAnswers,
  passport,
  picks,
  badges,
  stamps,
  quests,
  memory,
  newBadgeCount,
  activeWalkMode,
  feedback,
  preferences,
  mediumOptions,
  neighborhoodOptions,
  onQuizAnswer,
  onOpenPick,
  onUseForYouRoute,
  onFeedback,
  onTogglePreferredMedium,
  onToggleAvoidedMedium,
  onTogglePreferredNeighborhood,
  onTogglePreferredTag
}: {
  quizAnswers: GalleryQuizAnswer[];
  passport: GalleryTastePassport;
  picks: GalleryPersonalizedPick[];
  badges: GalleryPassportBadge[];
  stamps: GalleryPassportStamp[];
  quests: GalleryQuest[];
  memory: GalleryPassportMemory;
  newBadgeCount: number;
  activeWalkMode: GalleryWalkMode;
  feedback: GalleryTasteFeedback[];
  preferences: GalleryEditableTastePreference;
  mediumOptions: GalleryMedium[];
  neighborhoodOptions: string[];
  onQuizAnswer: (artworkId: string, response: GalleryQuizResponse) => void;
  onOpenPick: (exhibitionId: string) => void;
  onUseForYouRoute: () => void;
  onFeedback: (exhibitionId: string, kind: GalleryTasteFeedbackKind) => void;
  onTogglePreferredMedium: (medium: GalleryMedium) => void;
  onToggleAvoidedMedium: (medium: GalleryMedium) => void;
  onTogglePreferredNeighborhood: (neighborhood: string) => void;
  onTogglePreferredTag: (tag: string) => void;
}) {
  const answerByArtworkId = new Map(quizAnswers.map((answer) => [answer.artworkId, answer]));
  const topSignals = passport.signals.filter((signal) => signal.weight > 0).slice(0, 5);
  const feedbackById = new Map(feedback.map((item) => [item.exhibitionId, item]));
  const normalizedPreferences: GalleryEditableTastePreference = {
    preferredMediums: Array.isArray(preferences.preferredMediums)
      ? preferences.preferredMediums
      : [],
    avoidedMediums: Array.isArray(preferences.avoidedMediums)
      ? preferences.avoidedMediums
      : [],
    preferredNeighborhoods: Array.isArray(preferences.preferredNeighborhoods)
      ? preferences.preferredNeighborhoods
      : [],
    preferredTags: Array.isArray(preferences.preferredTags) ? preferences.preferredTags : []
  };
  const tagOptions = Array.from(
    new Set([...passport.styleLabels, ...passport.subjectLabels, "quiet", "social", "last-look"])
  ).slice(0, 8);

  return (
    <View style={styles.passportBand}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Saved, Journal & Memory</Text>
          <Text style={styles.sectionSubtitle}>
            {quizAnswers.length}/{galleryQuizArtworks.length} taste cards answered - {passport.summary}
          </Text>
        </View>
        <Sparkles size={20} color={colors.ink} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quizRail}
      >
        {galleryQuizArtworks.map((artwork) => (
          <TasteQuizArtworkCard
            key={artwork.id}
            artwork={artwork}
            answer={answerByArtworkId.get(artwork.id)}
            onAnswer={onQuizAnswer}
          />
        ))}
      </ScrollView>

      <View style={styles.passportGrid}>
        <View style={styles.passportSummaryPanel}>
          <Text style={styles.routeFirstKicker}>Taste signal</Text>
          <Text style={styles.passportSummaryTitle}>{passport.confidence === "empty" ? "Quiz not tuned yet" : passport.summary}</Text>
          <View style={styles.routeReasonRow}>
            {(topSignals.length > 0 ? topSignals : [{ id: "starter", label: "Answer the visual quiz", weight: 0, kind: "mood", matchedCount: 0, source: "quiz" }]).map((signal) => (
              <Text key={signal.id} style={styles.passportSignalPill}>{signal.label}</Text>
            ))}
          </View>
          <View style={styles.passportBadgeRow}>
            {badges.slice(0, 5).map((badge) => (
              <Text key={badge.id} style={styles.passportBadge}>{badge.label}</Text>
            ))}
            {newBadgeCount > 0 ? (
              <Text style={styles.newBadgePill}>{newBadgeCount} new</Text>
            ) : null}
            {badges.length === 0 ? <Text style={styles.passportBadge}>No badges yet</Text> : null}
          </View>
          <View style={styles.passportBadgeRow}>
            {stamps.slice(0, 4).map((stamp) => (
              <Text key={stamp.id} style={styles.passportStamp}>{stamp.label}</Text>
            ))}
            {stamps.length === 0 ? <Text style={styles.passportStamp}>No stamps yet</Text> : null}
          </View>
          <View style={styles.passportMemoryCard}>
            <Text style={styles.passportMemoryTitle}>Walker memory</Text>
            <Text style={styles.passportMemoryCopy}>{getWalkerMemorySummary(memory)}</Text>
            <View style={styles.routeReasonRow}>
              <Text style={styles.passportSignalPill}>{memory.visitedStopCount} visited</Text>
              <Text style={styles.passportSignalPill}>{memory.notedStopCount} notes</Text>
              <Text style={styles.passportSignalPill}>{memory.stamps.length} stamps</Text>
            </View>
          </View>
          <View style={styles.preferenceBlock}>
            <Text style={styles.preferenceLabel}>Tune mediums</Text>
            <View style={styles.preferenceRow}>
              {mediumOptions.slice(0, 7).map((medium) => (
                <Pressable
                  key={`preferred-${medium}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Prefer ${mediumLabels[medium]}`}
                  onPress={() => onTogglePreferredMedium(medium)}
                  style={[
                    styles.preferenceChip,
                    normalizedPreferences.preferredMediums.includes(medium) ? styles.activePreferenceChip : null
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceChipText,
                      normalizedPreferences.preferredMediums.includes(medium) ? styles.activePreferenceChipText : null
                    ]}
                  >
                    + {mediumLabels[medium]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.preferenceRow}>
              {mediumOptions.slice(0, 5).map((medium) => (
                <Pressable
                  key={`avoided-${medium}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Avoid ${mediumLabels[medium]}`}
                  onPress={() => onToggleAvoidedMedium(medium)}
                  style={[
                    styles.preferenceChip,
                    normalizedPreferences.avoidedMediums.includes(medium) ? styles.activePreferenceChip : null
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceChipText,
                      normalizedPreferences.avoidedMediums.includes(medium) ? styles.activePreferenceChipText : null
                    ]}
                  >
                    - {mediumLabels[medium]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.preferenceLabel}>Favorite areas</Text>
            <View style={styles.preferenceRow}>
              {neighborhoodOptions.slice(0, 6).map((neighborhood) => (
                <Pressable
                  key={neighborhood}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle preferred ${neighborhood}`}
                  onPress={() => onTogglePreferredNeighborhood(neighborhood)}
                  style={[
                    styles.preferenceChip,
                    normalizedPreferences.preferredNeighborhoods.includes(neighborhood) ? styles.activePreferenceChip : null
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceChipText,
                      normalizedPreferences.preferredNeighborhoods.includes(neighborhood) ? styles.activePreferenceChipText : null
                    ]}
                  >
                    {neighborhood}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.preferenceLabel}>Vibe tags</Text>
            <View style={styles.preferenceRow}>
              {tagOptions.map((tag) => (
                <Pressable
                  key={tag}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${tag} taste tag`}
                  onPress={() => onTogglePreferredTag(tag)}
                  style={[
                    styles.preferenceChip,
                    normalizedPreferences.preferredTags.includes(tag) ? styles.activePreferenceChip : null
                  ]}
                >
                  <Text
                    style={[
                      styles.preferenceChipText,
                      normalizedPreferences.preferredTags.includes(tag) ? styles.activePreferenceChipText : null
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.forYouPanel}>
          <View style={styles.forYouHeader}>
            <View>
              <Text style={styles.routeFirstKicker}>For You Tonight</Text>
              <Text style={styles.forYouTitle}>Taste-ranked verified picks</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use personalized route mode"
              onPress={onUseForYouRoute}
              style={[
                styles.primaryLightButton,
                activeWalkMode === "for-you" ? styles.activeForYouButton : null
              ]}
            >
              <Text style={styles.primaryLightButtonText}>
                {activeWalkMode === "for-you" ? "Using For you" : "Use route"}
              </Text>
            </Pressable>
          </View>
          {picks.slice(0, 4).map((pick) => (
            <PersonalizedPickRow
              key={pick.exhibition.id}
              pick={pick}
              feedback={feedbackById.get(pick.exhibition.id)}
              onOpenDetails={() => onOpenPick(pick.exhibition.id)}
              onFeedback={(kind) => onFeedback(pick.exhibition.id, kind)}
            />
          ))}
          {picks.length === 0 ? (
            <Text style={styles.emptyText}>Answer a few quiz cards to tune personalized picks.</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.questPanel}>
        <View style={styles.questPanelHeader}>
          <Text style={styles.sectionTitle}>Walker Quests</Text>
          <Text style={styles.sectionSubtitle}>Light goals that adapt to verified supply.</Text>
        </View>
        <View style={styles.questGrid}>
          {quests.map((quest) => (
            <QuestRow key={quest.id} quest={quest} />
          ))}
        </View>
      </View>
    </View>
  );
}

function ExhibitionCard({
  exhibition,
  allExhibitions,
  savedIds,
  logEntry,
  onStatus,
  onNote,
  savedAlertArtists,
  savedAlertGalleries,
  savedAlertNeighborhoods,
  savedAlertMediums,
  onToggleAlertArtist,
  onToggleAlertGallery,
  onToggleAlertNeighborhood,
  onToggleAlertMedium,
  onOpenDetails
}: {
  exhibition: GalleryExhibition;
  allExhibitions: GalleryExhibition[];
  savedIds: string[];
  logEntry?: GalleryLogEntry;
  onStatus: (status: GalleryLogStatus) => void;
  onNote: (note: string) => void;
  savedAlertArtists: string[];
  savedAlertGalleries: string[];
  savedAlertNeighborhoods: string[];
  savedAlertMediums: GalleryMedium[];
  onToggleAlertArtist: (artist: string) => void;
  onToggleAlertGallery: (gallery: string) => void;
  onToggleAlertNeighborhood: (neighborhood: string) => void;
  onToggleAlertMedium: (medium: GalleryMedium) => void;
  onOpenDetails: () => void;
}) {
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const reasons = getGalleryWhyGoReasons(exhibition, allExhibitions, referenceNow, savedIds);
  const openingTonight = isGalleryOpeningTonight(exhibition, referenceNow);
  const trust = getGalleryInventoryTrust(exhibition);
  const visual = getWalkerVisualForRole({ role: "card-thumbnail", exhibition });

  return (
    <View style={styles.exhibitionCard}>
      <ImageBackground
        source={galleryVisualSources[visual.assetKey]}
        accessibilityLabel={visual.alt}
        imageStyle={styles.cardImage}
        style={styles.cardVisual}
      >
        <View style={styles.cardImageShade} />
        <View style={styles.cardVisualTopRow}>
          <Text style={styles.visualBadge}>{trust.label}</Text>
          <Text style={styles.visualBadge}>{galleryVisitStatusLabels[status]}</Text>
          <Text style={styles.visualBadge}>{visual.creditLabel}</Text>
        </View>
        <View style={styles.cardVisualCopy}>
          <Text style={styles.cardVisualGallery}>{exhibition.galleryName}</Text>
          <Text style={styles.cardVisualTitle} numberOfLines={2}>{exhibition.title}</Text>
        </View>
      </ImageBackground>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardGalleryName}>{exhibition.neighborhood}</Text>
            <Text style={styles.cardMeta}>{exhibition.artists.join(", ")}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Clock size={13} color={colors.ink} />
            <Text style={styles.statusBadgeText}>{getClosingCopy(exhibition)}</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>{exhibition.description}</Text>

        <View style={styles.cardSignalRow}>
          <Text style={styles.factText}>{exhibition.neighborhood}</Text>
          <Text style={styles.factText}>{formatShortDate(exhibition.opensAt)} to {formatShortDate(exhibition.closesAt)}</Text>
          <Text style={[styles.factText, getDaysUntilGalleryCloses(exhibition, referenceNow) <= 7 ? styles.urgentFactText : null]}>
            {getClosingCopy(exhibition)}
          </Text>
          {openingTonight ? <Text style={styles.openingFactText}>Opening tonight</Text> : null}
          <Text style={styles.trustFactText}>{trust.label}</Text>
        </View>

        <View style={styles.reasonRow}>
          {reasons.map((reason) => (
            <View key={reason} style={styles.reasonPill}>
              <Sparkles size={12} color={colors.plum} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sourceRow}>
          <Text style={styles.sourceText}>{getFreshnessCopy(exhibition)}</Text>
          <Text style={styles.sourceText}>{getSourceCopy(exhibition)}</Text>
          <Text style={styles.sourceText}>{exhibition.mediums.map((medium) => mediumLabels[medium]).join(", ")}</Text>
        </View>

        <View style={styles.cardActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show details for ${exhibition.title}`}
            onPress={onOpenDetails}
            style={styles.primaryLightButton}
          >
            <Text style={styles.primaryLightButtonText}>Details</Text>
          </Pressable>
          {logStatusOptions.map((statusOption) => (
            <ChipButton
              key={statusOption}
              label={logStatusLabels[statusOption]}
              active={logEntry?.status === statusOption}
              compact
              onPress={() => onStatus(statusOption)}
            />
          ))}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open source listing for ${exhibition.title} at ${exhibition.galleryName}`}
            onPress={() => {
              void Linking.openURL(exhibition.externalUrl);
            }}
            style={styles.linkButton}
          >
            <ExternalLink size={14} color={colors.ink} />
            <Text style={styles.linkButtonText}>{trust.hasOfficialLink ? "Official link" : "Listing"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ExhibitionDetailSheet({
  exhibition,
  allExhibitions,
  savedIds,
  logEntry,
  routeProgress,
  routeAdvisory,
  routeConfidenceLabel,
  isInDisplayedRoute,
  hasActiveWalk,
  displayRouteStop,
  swapTargetStop,
  swapCandidates = [],
  conciergeReasons,
  feedback,
  onStatus,
  onNote,
  onMarkRouteVisited,
  onSkipRouteStop,
  onSwapRouteStop,
  onSwapSelectedIntoRoute,
  onFeedback,
  onStartRouteFromHere,
  onAddToActiveWalk,
  onShare,
  onClose
}: {
  exhibition: GalleryExhibition;
  allExhibitions: GalleryExhibition[];
  savedIds: string[];
  logEntry?: GalleryLogEntry;
  routeProgress?: GalleryWalkStopProgress;
  routeAdvisory?: GalleryRouteMapModel["stopAdvisories"][number];
  routeConfidenceLabel: string;
  isInDisplayedRoute: boolean;
  hasActiveWalk: boolean;
  displayRouteStop?: GalleryWalkStop;
  swapTargetStop?: GalleryWalkStop;
  swapCandidates?: GalleryRouteSwapCandidate[];
  conciergeReasons: string[];
  feedback?: GalleryTasteFeedback;
  onStatus: (status: GalleryLogStatus) => void;
  onNote: (note: string) => void;
  onMarkRouteVisited?: () => void;
  onSkipRouteStop?: () => void;
  onSwapRouteStop?: (stopId: string, replacementId: string) => void;
  onSwapSelectedIntoRoute?: (targetStopId: string) => void;
  onFeedback: (kind: GalleryTasteFeedbackKind) => void;
  onStartRouteFromHere: () => void;
  onAddToActiveWalk: () => void;
  onShare: () => void;
  onClose: () => void;
}) {
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const trust = getGalleryInventoryTrust(exhibition);
  const sourceReceipt = createGallerySourceReceipt(exhibition, referenceNow);
  const reasons = getGalleryWhyGoReasons(exhibition, allExhibitions, referenceNow, savedIds);
  const matchReasons = Array.from(
    new Set([
      ...conciergeReasons,
      sourceReceipt.evidenceLabel,
      ...exhibition.mediums.slice(0, 2).map((medium) => mediumLabels[medium])
    ])
  ).slice(0, 5);
  const routeFitCopy = routeAdvisory
    ? routeAdvisory.detail
    : isInDisplayedRoute
      ? "This exhibition is already part of the displayed route."
      : swapTargetStop
        ? `Swap this into the route for ${swapTargetStop.exhibition.galleryName}.`
      : hasActiveWalk
        ? "Not in the active walk yet; use it as a route swap cue before replacing the current route."
        : "Not in this route yet; start from here to build a more personal path.";
  const routeActionLabel = isInDisplayedRoute
    ? "Keep in route"
    : swapTargetStop
      ? "Swap into route"
    : hasActiveWalk
      ? "Use as swap cue"
      : "Add to walk";
  const visual = getWalkerExhibitionBanner(exhibition);
  const openingTonight = isGalleryOpeningTonight(exhibition, referenceNow);
  const groupedShows = allExhibitions.filter(
    (candidate) =>
      candidate.id !== exhibition.id &&
      candidate.galleryName === exhibition.galleryName &&
      candidate.address === exhibition.address
  );
  const nearbyShows = allExhibitions
    .filter(
      (candidate) =>
        candidate.id !== exhibition.id &&
        candidate.areaId === exhibition.areaId &&
        candidate.neighborhood === exhibition.neighborhood &&
        candidate.galleryName !== exhibition.galleryName
    )
    .slice(0, 3);
  const placeConfidenceTitle =
    exhibition.areaId === "camogli"
      ? "Cultural walk place"
      : trust.kind === "manual-verified"
        ? "Verified gallery stop"
        : trust.kind === "fixture-demo"
          ? "Demo gallery stop"
          : "Needs a source check";
  const placeConfidenceDetail =
    exhibition.areaId === "camogli"
      ? "Camogli coverage is intentionally thin; use the official link before walking."
      : trust.hasOfficialLink
        ? "Official source and route context are attached for a field check."
        : "Treat this as discovery inventory until an official source is verified.";
  const routeStatusCopy = routeProgress
    ? getRouteProgressLabel(routeProgress)
    : isInDisplayedRoute
      ? "Planned stop"
      : hasActiveWalk
        ? "Outside active walk"
        : "Route option";

  return (
    <View style={styles.detailSheet}>
      <ImageBackground
        source={galleryVisualSources[visual.assetKey]}
        accessibilityLabel={visual.alt}
        imageStyle={styles.detailImage}
        style={styles.detailVisual}
      >
        <View style={styles.cardImageShade} />
        <View style={styles.detailTopRow}>
          <View style={styles.cardVisualTopRow}>
            <Text style={styles.visualBadge}>{trust.label}</Text>
            <Text style={styles.visualBadge}>{visual.creditLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Close details for ${exhibition.title}`}
            onPress={onClose}
            style={styles.detailCloseButton}
          >
            <X size={16} color={colors.ink} />
          </Pressable>
        </View>
        <View style={styles.cardVisualCopy}>
          <Text style={styles.cardVisualGallery}>{exhibition.galleryName}</Text>
          <Text style={styles.detailVisualTitle}>{exhibition.title}</Text>
        </View>
      </ImageBackground>

      <View style={styles.detailBody}>
        <View style={styles.detailTitleRow}>
          <View style={styles.detailTitleBlock}>
            <Text style={styles.detailEyebrow}>{exhibition.neighborhood}</Text>
            <Text style={styles.detailArtists}>{exhibition.artists.join(", ")}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Clock size={13} color={colors.ink} />
            <Text style={styles.statusBadgeText}>{galleryVisitStatusLabels[status]}</Text>
          </View>
        </View>

        <View style={styles.detailQuickActions}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open map for ${exhibition.galleryName}`}
            onPress={() => {
              void Linking.openURL(getGalleryMapUrl(exhibition));
            }}
            style={styles.detailQuickAction}
          >
            <MapPin size={15} color={colors.teal} />
            <Text style={styles.detailQuickActionText}>Directions</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Save ${exhibition.title}`}
            onPress={() => onStatus(logEntry?.status === "saved" ? "want-to-see" : "saved")}
            style={styles.detailQuickAction}
          >
            <Heart
              size={15}
              color={logEntry?.status === "saved" ? colors.teal : colors.ink}
              fill={logEntry?.status === "saved" ? colors.teal : "transparent"}
            />
            <Text style={styles.detailQuickActionText}>Save</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open official source for ${exhibition.title}`}
            onPress={() => {
              void Linking.openURL(sourceReceipt.officialUrl ?? exhibition.externalUrl);
            }}
            style={styles.detailQuickAction}
          >
            <ExternalLink size={15} color={colors.teal} />
            <Text style={styles.detailQuickActionText}>
              {trust.hasOfficialLink ? "Website" : "Listing"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Share ${exhibition.title}`}
            onPress={onShare}
            style={styles.detailQuickAction}
          >
            <Share2 size={15} color={colors.teal} />
            <Text style={styles.detailQuickActionText}>Share</Text>
          </Pressable>
        </View>

        <View style={styles.placeConfidencePanel}>
          <View style={styles.placeConfidenceHeader}>
            <View style={styles.placeConfidenceIcon}>
              <Check size={14} color={colors.paper} />
            </View>
            <View style={styles.placeConfidenceCopy}>
              <Text style={styles.placeConfidenceKicker}>Place confidence</Text>
              <Text style={styles.placeConfidenceTitle}>{placeConfidenceTitle}</Text>
            </View>
            <Text style={styles.placeConfidencePill}>{routeStatusCopy}</Text>
          </View>
          <Text style={styles.placeConfidenceDetail}>{placeConfidenceDetail}</Text>
          <View style={styles.placeConfidenceGrid}>
            <Text style={styles.placeConfidenceMetric}>{sourceReceipt.evidenceLabel}</Text>
            <Text style={styles.placeConfidenceMetric}>{getFreshnessCopy(exhibition)}</Text>
            <Text style={styles.placeConfidenceMetric}>{galleryVisitStatusLabels[status]}</Text>
          </View>
        </View>

        <View style={styles.detailVisitPanel}>
          <Text style={styles.detailVisitKicker}>Plan your visit</Text>
          <View style={styles.detailVisitRow}>
            <MapPin size={14} color={colors.teal} />
            <Text style={styles.detailVisitText} numberOfLines={2}>{exhibition.address}</Text>
          </View>
          <View style={styles.detailVisitRow}>
            <Clock size={14} color={colors.teal} />
            <Text style={styles.detailVisitText}>
              {galleryVisitStatusLabels[status]} - {getClosingCopy(exhibition)}
            </Text>
          </View>
          <View style={styles.detailVisitRow}>
            <Check size={14} color={colors.teal} />
            <Text style={styles.detailVisitText}>
              {sourceReceipt.evidenceLabel} - {getFreshnessCopy(exhibition)}
            </Text>
          </View>
        </View>

        {routeProgress ? (
          <View
            style={[
              styles.activeRouteDetail,
              routeProgress === "current" ? styles.currentActiveRouteDetail : null
            ]}
          >
            <View style={styles.activeRouteDetailHeader}>
              <Text style={styles.activeRouteStatusPill}>{getRouteProgressLabel(routeProgress)}</Text>
              <Text style={styles.activeRouteDetailTitle}>In your walk</Text>
            </View>
            <Text style={styles.activeRouteDetailText}>
              {getRouteProgressDetail(routeProgress)}
            </Text>
            {routeProgress !== "visited" && routeProgress !== "skipped" ? (
              <View style={styles.activeWalkActionRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${exhibition.title} visited in active walk`}
                  onPress={onMarkRouteVisited}
                  style={styles.primaryLightButton}
                >
                  <Text style={styles.primaryLightButtonText}>Mark visited</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Skip ${exhibition.title} in active walk`}
                  onPress={onSkipRouteStop}
                  style={styles.secondaryRouteButton}
                >
                  <Text style={styles.secondaryRouteButtonText}>Skip stop</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.detailRouteFitBlock}>
          <View style={styles.detailRouteFitHeader}>
            <Text style={styles.detailRouteFitPill}>
              {isInDisplayedRoute ? "In route" : "Route option"}
            </Text>
            <Text style={styles.detailRouteFitTitle}>{routeConfidenceLabel}</Text>
          </View>
          <Text style={styles.detailRouteFitText}>{routeFitCopy}</Text>
          {routeAdvisory ? (
            <View style={styles.routeReasonRow}>
              {routeAdvisory.reasons.map((reason) => (
                <Text key={reason} style={styles.routeReasonPill}>{reason}</Text>
              ))}
            </View>
          ) : null}
          {isInDisplayedRoute && displayRouteStop && swapCandidates.length > 0 ? (
            <View style={styles.detailSwapPanel}>
              <Text style={styles.swapOptionsTitle}>Replacement candidates</Text>
              {swapCandidates.map((candidate) => (
                <View key={candidate.exhibition.id} style={styles.swapCandidateRow}>
                  <View style={styles.swapCandidateCopy}>
                    <Text style={styles.swapCandidateTitle}>{candidate.exhibition.galleryName}</Text>
                    <Text style={styles.swapCandidateMeta} numberOfLines={1}>
                      {candidate.reasons.slice(0, 3).join(", ")}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Swap ${candidate.exhibition.galleryName} into this route stop`}
                    onPress={() =>
                      onSwapRouteStop?.(displayRouteStop.exhibition.id, candidate.exhibition.id)
                    }
                    style={styles.swapCandidateButton}
                  >
                    <Text style={styles.swapCandidateButtonText}>Swap</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          {!isInDisplayedRoute && swapTargetStop ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Swap ${exhibition.galleryName} into the displayed route`}
              onPress={() => onSwapSelectedIntoRoute?.(swapTargetStop.exhibition.id)}
              style={styles.detailSwapIntoRouteButton}
            >
              <Route size={14} color={colors.ink} />
              <Text style={styles.detailSwapIntoRouteButtonText}>
                Replace {swapTargetStop.exhibition.galleryName}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.cardDescription}>{exhibition.description}</Text>

        {conciergeReasons.length > 0 ? (
          <View style={styles.conciergeDetailBlock}>
            <Text style={styles.guidanceTitle}>Concierge says</Text>
            <Text style={styles.guidanceCopy}>{conciergeReasons.slice(0, 2).join(" - ")}</Text>
          </View>
        ) : null}

        <View style={styles.conciergeDetailBlock}>
          <Text style={styles.guidanceTitle}>Why this matches you</Text>
          <View style={styles.routeReasonRow}>
            {(matchReasons.length > 0 ? matchReasons : reasons).slice(0, 5).map((reason) => (
              <Text key={reason} style={styles.routeReasonPill}>{reason}</Text>
            ))}
          </View>
        </View>

        <View style={styles.cardSignalRow}>
          <Text style={styles.factText}>{exhibition.address}</Text>
          <Text style={styles.factText}>{formatShortDate(exhibition.opensAt)} to {formatShortDate(exhibition.closesAt)}</Text>
          <Text style={[styles.factText, getDaysUntilGalleryCloses(exhibition, referenceNow) <= 7 ? styles.urgentFactText : null]}>
            {getClosingCopy(exhibition)}
          </Text>
          {openingTonight ? <Text style={styles.openingFactText}>Opening tonight</Text> : null}
        </View>

        <View style={styles.sourceRow}>
          <Text style={styles.sourceText}>{getFreshnessCopy(exhibition)}</Text>
          <Text style={styles.sourceText}>{getSourceCopy(exhibition)}</Text>
          <Text style={styles.sourceText}>{exhibition.mediums.map((medium) => mediumLabels[medium]).join(", ")}</Text>
        </View>

        <View
          style={[
            styles.sourceReceiptBlock,
            sourceReceipt.needsReview ? styles.sourceReceiptNeedsReview : null
          ]}
        >
          <View style={styles.sourceReceiptHeader}>
            <Check size={14} color={colors.ink} />
            <Text style={styles.sourceReceiptTitle}>{sourceReceipt.label}</Text>
          </View>
          <Text style={styles.sourceReceiptCopy}>
            {sourceReceipt.evidenceLabel} - {sourceReceipt.detail}
          </Text>
          <View style={styles.activeWalkActionRow}>
            {sourceReceipt.officialUrl ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open official gallery source for ${exhibition.title}`}
                onPress={() => {
                  if (sourceReceipt.officialUrl) {
                    void Linking.openURL(sourceReceipt.officialUrl);
                  }
                }}
                style={styles.secondaryRouteButton}
              >
                <ExternalLink size={13} color={colors.ink} />
                <Text style={styles.secondaryRouteButtonText}>Official gallery link</Text>
              </Pressable>
            ) : null}
            <Text style={styles.sourceReceiptAction}>{sourceReceipt.actionLabel}</Text>
          </View>
        </View>

        <View style={styles.reasonRow}>
          {reasons.map((reason) => (
            <View key={reason} style={styles.reasonPill}>
              <Sparkles size={12} color={colors.plum} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

        <View style={styles.conciergeDetailBlock}>
          <Text style={styles.guidanceTitle}>Plan around this</Text>
          <View style={styles.activeWalkActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Start route from ${exhibition.title}`}
              onPress={onStartRouteFromHere}
              style={styles.primaryLightButton}
            >
              <Text style={styles.primaryLightButtonText}>Start route from here</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add ${exhibition.title} to active walk`}
              onPress={onAddToActiveWalk}
              style={styles.secondaryRouteButton}
            >
              <Text style={styles.secondaryRouteButtonText}>{routeActionLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Share ${exhibition.title}`}
              onPress={onShare}
              style={styles.secondaryRouteButton}
            >
              <Share2 size={13} color={colors.ink} />
              <Text style={styles.secondaryRouteButtonText}>Share</Text>
            </Pressable>
          </View>
          <View style={styles.feedbackRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`More like ${exhibition.title}`}
              onPress={() => onFeedback("more-like-this")}
              style={[
                styles.feedbackButton,
                feedback?.kind === "more-like-this" ? styles.activeFeedbackButton : null
              ]}
            >
              <Text
                style={[
                  styles.feedbackButtonText,
                  feedback?.kind === "more-like-this" ? styles.activeFeedbackButtonText : null
                ]}
              >
                More like this
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Less like ${exhibition.title}`}
              onPress={() => onFeedback("less-like-this")}
              style={[
                styles.feedbackButton,
                feedback?.kind === "less-like-this" ? styles.activeFeedbackButton : null
              ]}
            >
              <Text
                style={[
                  styles.feedbackButtonText,
                  feedback?.kind === "less-like-this" ? styles.activeFeedbackButtonText : null
                ]}
              >
                Less like this
              </Text>
            </Pressable>
          </View>
        </View>

        {(groupedShows.length > 0 || nearbyShows.length > 0) ? (
          <View style={styles.conciergeDetailBlock}>
            <Text style={styles.guidanceTitle}>Nearby and same-gallery context</Text>
            {groupedShows.slice(0, 3).map((candidate) => (
              <Text key={candidate.id} style={styles.groupedShowText}>
                Same gallery: {candidate.title}
              </Text>
            ))}
            {nearbyShows.map((candidate) => (
              <Text key={candidate.id} style={styles.groupedShowText}>
                Nearby: {candidate.galleryName} - {candidate.title}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.cardActions}>
          {logStatusOptions.map((statusOption) => (
            <ChipButton
              key={statusOption}
              label={logStatusLabels[statusOption]}
              active={logEntry?.status === statusOption}
              compact
              onPress={() => onStatus(statusOption)}
            />
          ))}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open map for ${exhibition.galleryName}`}
            onPress={() => {
              void Linking.openURL(getGalleryMapUrl(exhibition));
            }}
            style={styles.linkButton}
          >
            <MapPin size={14} color={colors.ink} />
            <Text style={styles.linkButtonText}>Map</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open source listing for ${exhibition.title} at ${exhibition.galleryName}`}
            onPress={() => {
              void Linking.openURL(exhibition.externalUrl);
            }}
            style={styles.linkButton}
          >
            <ExternalLink size={14} color={colors.ink} />
            <Text style={styles.linkButtonText}>{trust.hasOfficialLink ? "Official link" : "Listing"}</Text>
          </Pressable>
        </View>

        <View style={styles.noteRow}>
          <NotebookPen size={15} color={colors.mutedInk} />
          <TextInput
            value={logEntry?.note ?? ""}
            onChangeText={onNote}
            placeholder="Private note"
            placeholderTextColor={colors.mutedInk}
            style={styles.noteInput}
          />
        </View>
      </View>
    </View>
  );
}

export function GalleryApp() {
  const { width: viewportWidth } = useWindowDimensions();
  const persistedState = useMemo(() => readGalleryAppPersistedState(), []);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = "Walker";

      if (!document.getElementById("walker-web-fonts")) {
        const style = document.createElement("style");
        style.id = "walker-web-fonts";
        style.textContent = [
          "@font-face{font-family:'Walker Display';src:url('/fonts/EBGaramond.ttf') format('truetype');font-weight:400 800;font-style:normal;font-display:swap;}",
          "@font-face{font-family:'Walker Sans';src:url('/fonts/Inter.ttf') format('truetype');font-weight:100 900;font-style:normal;font-display:swap;}"
        ].join("");
        document.head.appendChild(style);
      }
    }
  }, []);

  const [selectedAreaId, setSelectedAreaId] = useState<GalleryAreaId>(
    persistedState?.selectedAreaId ?? "nyc"
  );
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>(
    persistedState?.selectedNeighborhood
  );
  const [selectedMedium, setSelectedMedium] = useState<GalleryMedium | undefined>(
    persistedState?.selectedMedium
  );
  const [activeLens, setActiveLens] = useState<GalleryLens>(persistedState?.activeLens ?? "all");
  const [verifiedOnly, setVerifiedOnly] = useState(persistedState?.verifiedOnly ?? false);
  const [walkMode, setWalkMode] = useState<GalleryWalkMode>(
    persistedState?.walkMode ?? "quick-loop"
  );
  const [alertWindowDays, setAlertWindowDays] = useState<3 | 7 | 14>(
    persistedState?.alertWindowDays ?? 14
  );
  const [query, setQuery] = useState("");
  const [mobileTab, setMobileTab] = useState<WalkerMobileTab>("home");
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string | undefined>();
  const [highlightedRouteStopId, setHighlightedRouteStopId] = useState<string | undefined>();
  const [activeWalkSession, setActiveWalkSession] = useState<GalleryWalkSession | undefined>(
    persistedState?.activeWalkSession
  );
  const [logEntries, setLogEntries] = useState<GalleryLogEntry[]>(persistedState?.logEntries ?? []);
  const [savedAlertArtists, setSavedAlertArtists] = useState<string[]>(
    persistedState?.savedAlertArtists ?? []
  );
  const [savedAlertGalleries, setSavedAlertGalleries] = useState<string[]>(
    persistedState?.savedAlertGalleries ?? []
  );
  const [savedAlertNeighborhoods, setSavedAlertNeighborhoods] = useState<string[]>(
    persistedState?.savedAlertNeighborhoods ?? []
  );
  const [savedAlertMediums, setSavedAlertMediums] = useState<GalleryMedium[]>(
    persistedState?.savedAlertMediums ?? []
  );
  const [quizAnswers, setQuizAnswers] = useState<GalleryQuizAnswer[]>(
    persistedState?.quizAnswers ?? []
  );
  const [earnedBadges, setEarnedBadges] = useState<GalleryPassportBadge[]>(
    persistedState?.earnedBadges ?? []
  );
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>(
    persistedState?.completedQuestIds ?? []
  );
  const [completedWalkSessions, setCompletedWalkSessions] = useState<GalleryWalkSession[]>(
    persistedState?.completedWalkSessions ?? []
  );
  const [tasteFeedback, setTasteFeedback] = useState<GalleryTasteFeedback[]>(
    persistedState?.tasteFeedback ?? []
  );
  const [tastePreferences, setTastePreferences] = useState<GalleryEditableTastePreference>(
    persistedState?.tastePreferences ?? defaultTastePreferences
  );
  const [savedWalks, setSavedWalks] = useState<GallerySavedWalk[]>(
    persistedState?.savedWalks ?? []
  );
  const [firstRunChoice, setFirstRunChoice] = useState<GalleryFirstRunChoice | undefined>(
    persistedState?.firstRunChoice
  );
  const [firstRunCompleted, setFirstRunCompleted] = useState(
    persistedState?.firstRunCompleted ?? false
  );
  const [betaCompletedTaskIds, setBetaCompletedTaskIds] = useState<GalleryBetaTaskId[]>(
    persistedState?.betaCompletedTaskIds ?? []
  );
  const [betaFeedback, setBetaFeedback] = useState<GalleryBetaFeedback[]>(
    persistedState?.betaFeedback ?? []
  );
  const [betaChecklistDismissed, setBetaChecklistDismissed] = useState(
    persistedState?.betaChecklistDismissed ?? false
  );
  const [betaFeedbackKind, setBetaFeedbackKind] = useState<GalleryBetaFeedbackKind>("useful");
  const [betaFeedbackNote, setBetaFeedbackNote] = useState("");
  const [draftWalkStopIds, setDraftWalkStopIds] = useState<string[] | undefined>();
  const [eventRouteIntent, setEventRouteIntent] = useState<GalleryEventRouteIntent>("social-opening");
  const [shareStatus, setShareStatus] = useState<string | undefined>();
  const [walkerJourneyStep, setWalkerJourneyStep] = useState<WalkerJourneyStep>("walking");
  const [selectedReaction, setSelectedReaction] = useState<WalkerReactionKind>("inspired");
  const [reactionNote, setReactionNote] = useState("");
  const [reactionSaved, setReactionSaved] = useState(true);
  const [stopReactions, setStopReactions] = useState<WalkerStopReaction[]>(
    persistedState?.stopReactions ?? []
  );
  const [walkerStartPointPreference, setWalkerStartPointPreference] = useState<
    WalkerStartPointPreference | undefined
  >(persistedState?.walkerStartPointPreference);
  const [dismissedReadinessWarningIds, setDismissedReadinessWarningIds] = useState<string[]>(
    persistedState?.dismissedReadinessWarningIds ?? []
  );
  const selectedArea = galleryAreas.find((area) => area.id === selectedAreaId) ?? galleryAreas[0];
  const isCompactLayout = viewportWidth < 720;
  const areaInventory = useMemo(
    () => galleryExhibitions.filter((exhibition) => exhibition.areaId === selectedAreaId),
    [selectedAreaId]
  );
  const selectedNeighborhoods = selectedNeighborhood ? [selectedNeighborhood] : undefined;
  const selectedMediums = selectedMedium ? [selectedMedium] : undefined;
  const visibleExhibitions = useMemo(
    () =>
      filterGalleryExhibitions(galleryExhibitions, {
        areaId: selectedAreaId,
        neighborhoods: selectedNeighborhoods,
        mediums: selectedMediums,
        query,
        openOnly: activeLens === "open-now",
        openingOnly: activeLens === "opening-tonight",
        verifiedOnly,
        lastChanceDays: activeLens === "last-chance" ? 14 : undefined,
        referenceNow
      }),
    [activeLens, query, selectedAreaId, selectedMedium, selectedNeighborhood, verifiedOnly]
  );
  const neighborhoodIntelligence = useMemo(
    () => createNeighborhoodIntelligence(selectedAreaId, galleryExhibitions, referenceNow),
    [selectedAreaId]
  );
  const sourceTrust = useMemo(
    () => createGallerySourceTrustSummary(selectedAreaId, galleryExhibitions, referenceNow),
    [selectedAreaId]
  );
  const freshnessAudit = useMemo(
    () =>
      createGalleryFreshnessAudit({
        areaId: selectedAreaId,
        exhibitions: galleryExhibitions,
        referenceNow
      }),
    [selectedAreaId]
  );
  const dataAudit = useMemo(
    () =>
      createGalleryMarketDataAudit(selectedAreaId, {
        sources: gallerySourceCandidates,
        exhibitions: galleryExhibitions,
        referenceNow
      }),
    [selectedAreaId]
  );
  const savedIds = useMemo(() => getSavedGalleryIdsFromLog(logEntries), [logEntries]);
  const logEntryById = useMemo(
    () => new Map(logEntries.map((entry) => [entry.exhibitionId, entry])),
    [logEntries]
  );
  const quizTastePassport = useMemo(
    () => deriveTastePassportFromQuiz(quizAnswers, galleryQuizArtworks, referenceNow),
    [quizAnswers]
  );
  const behaviorTastePassport = useMemo(
    () =>
      deriveTastePassportFromBehavior(
        logEntries,
        completedWalkSessions,
        {
          artists: savedAlertArtists,
          galleries: savedAlertGalleries,
          neighborhoods: savedAlertNeighborhoods,
          mediums: savedAlertMediums
        },
        galleryExhibitions,
        referenceNow
      ),
    [
      completedWalkSessions,
      logEntries,
      savedAlertArtists,
      savedAlertGalleries,
      savedAlertMediums,
      savedAlertNeighborhoods
    ]
  );
  const tastePassport = useMemo(() => {
    const derivedPassport = mergeGalleryTastePassports(
      quizTastePassport,
      behaviorTastePassport,
      referenceNow,
      tastePreferences
    );
    const feedbackPassport = applyGalleryTasteFeedback(
      derivedPassport,
      tasteFeedback,
      galleryExhibitions,
      referenceNow
    );

    return feedbackPassport.confidence === "empty" && persistedState?.tastePassport
      ? persistedState.tastePassport
      : feedbackPassport;
  }, [behaviorTastePassport, persistedState, quizTastePassport, tasteFeedback, tastePreferences]);
  const openingTonight = useMemo(
    () =>
      filterGalleryExhibitions(galleryExhibitions, {
        areaId: selectedAreaId,
        neighborhoods: selectedNeighborhoods,
        openingOnly: true,
        referenceNow
      }),
    [selectedAreaId, selectedNeighborhood]
  );
  const lastChanceAlerts = useMemo(
    () =>
      getLastChanceGalleryAlerts(galleryExhibitions, {
        areaId: selectedAreaId,
        days: alertWindowDays,
        savedArtists: savedAlertArtists,
        savedGalleries: savedAlertGalleries,
        neighborhoods:
          savedAlertNeighborhoods.length > 0
            ? savedAlertNeighborhoods
            : selectedNeighborhoods,
        mediums: savedAlertMediums.length > 0 ? savedAlertMediums : selectedMediums,
        referenceNow
      }),
    [
      alertWindowDays,
      savedAlertArtists,
      savedAlertGalleries,
      savedAlertMediums,
      savedAlertNeighborhoods,
      selectedAreaId,
      selectedMedium,
      selectedNeighborhood
    ]
  );
  const generatedWalkPlan = useMemo(
    () =>
      walkMode === "for-you"
        ? createPersonalizedGalleryWalkPlan({
            areaId: selectedAreaId,
            passport: tastePassport,
            neighborhood: selectedNeighborhood,
            savedIds,
            referenceNow,
            feedback: tasteFeedback,
            preferences: tastePreferences
          })
        : createGalleryWalkPlan({
            areaId: selectedAreaId,
            mode: walkMode,
            neighborhood: selectedNeighborhood,
            savedIds,
            referenceNow
          }),
    [savedIds, selectedAreaId, selectedNeighborhood, tastePassport, walkMode]
  );
  const walkPlan = useMemo(
    () =>
      draftWalkStopIds
        ? createGalleryWalkPlanFromStopIds({
            basePlan: generatedWalkPlan,
            stopIds: draftWalkStopIds,
            exhibitions: galleryExhibitions,
            savedIds,
            referenceNow
          })
        : generatedWalkPlan,
    [draftWalkStopIds, generatedWalkPlan, savedIds]
  );
  const generatedActiveWalkPlan = useMemo(
    () =>
      activeWalkSession
        ? activeWalkSession.mode === "for-you"
          ? createPersonalizedGalleryWalkPlan({
              areaId: activeWalkSession.areaId,
              passport: tastePassport,
              neighborhood: activeWalkSession.neighborhood,
              savedIds,
              referenceNow,
              feedback: tasteFeedback,
              preferences: tastePreferences
            })
          : createGalleryWalkPlan({
              areaId: activeWalkSession.areaId,
              mode: activeWalkSession.mode,
              neighborhood: activeWalkSession.neighborhood,
              savedIds,
              referenceNow
            })
        : undefined,
    [activeWalkSession, savedIds, tasteFeedback, tastePassport, tastePreferences]
  );
  const activeWalkPlan = useMemo(
    () =>
      activeWalkSession && generatedActiveWalkPlan
        ? createGalleryWalkPlanFromStopIds({
            basePlan: generatedActiveWalkPlan,
            stopIds: activeWalkSession.orderedStopIds,
            exhibitions: galleryExhibitions,
            savedIds,
            referenceNow
          })
        : generatedActiveWalkPlan,
    [activeWalkSession, generatedActiveWalkPlan, savedIds]
  );
  const activeWalkProgress = useMemo(
    () =>
      activeWalkSession
        ? getActiveWalkProgress(activeWalkSession, activeWalkPlan)
        : undefined,
    [activeWalkPlan, activeWalkSession]
  );
  const activeWalkRecap = useMemo(
    () =>
      activeWalkSession && activeWalkPlan
        ? getGalleryWalkRecap(activeWalkSession, activeWalkPlan, logEntries)
        : undefined,
    [activeWalkPlan, activeWalkSession, logEntries]
  );
  const hasDraftWalk = Boolean(draftWalkStopIds?.length);
  const displayWalkPlan =
    activeWalkSession?.status === "active" && activeWalkPlan && !hasDraftWalk
      ? activeWalkPlan
      : walkPlan;
  const displayRouteMapModel = useMemo(
    () =>
      createGalleryRouteMapModel(
        displayWalkPlan,
        activeWalkSession?.status === "active" ? activeWalkSession : undefined
      ),
    [activeWalkSession, displayWalkPlan]
  );
  const routeUsabilityReport = useMemo(
    () =>
      createGalleryRouteUsabilityReport({
        walkPlan: displayWalkPlan,
        referenceNow
      }),
    [displayWalkPlan]
  );
  const rawWalkReadinessReport = useMemo(
    () =>
      createWalkerWalkReadinessReport({
        area: selectedArea,
        walkPlan: displayWalkPlan,
        routeUsabilityReport,
        startPointPreference: walkerStartPointPreference,
        referenceNow
      }),
    [displayWalkPlan, routeUsabilityReport, selectedArea, walkerStartPointPreference]
  );
  const walkReadinessReport = useMemo(
    () => ({
      ...rawWalkReadinessReport,
      warnings: rawWalkReadinessReport.warnings.filter(
        (warning) => !dismissedReadinessWarningIds.includes(warning)
      )
    }),
    [dismissedReadinessWarningIds, rawWalkReadinessReport]
  );
  const walkerStartPointOptions = useMemo(
    () =>
      getWalkerStartPointOptions({
        area: selectedArea,
        neighborhoods: galleryNeighborhoods,
        walkPlan: displayWalkPlan,
        preference: walkerStartPointPreference
      }),
    [displayWalkPlan, selectedArea, walkerStartPointPreference]
  );
  const walkerRouteMapHandoff = useMemo(
    () =>
      createWalkerRouteMapHandoff({
        area: selectedArea,
        neighborhoods: galleryNeighborhoods,
        walkPlan: displayWalkPlan,
        preference: walkerStartPointPreference
      }),
    [displayWalkPlan, selectedArea, walkerStartPointPreference]
  );
  const displayRouteAdvisoryById = useMemo(
    () =>
      new Map(
        displayRouteMapModel.stopAdvisories.map((advisory) => [advisory.stopId, advisory] as const)
      ),
    [displayRouteMapModel]
  );
  const camogliFieldGuide = useMemo(
    () =>
      createCamogliFieldGuide({
        areaId: selectedAreaId,
        walkPlan: displayWalkPlan,
        exhibitions: areaInventory,
        referenceNow
      }),
    [areaInventory, displayWalkPlan, selectedAreaId]
  );
  const walkerFieldTestGuide = useMemo(
    () => createWalkerFieldTestGuide({ areaId: selectedAreaId }),
    [selectedAreaId]
  );
  const walkerImageReadinessReport = useMemo(
    () => createWalkerImageReadinessReport(galleryExhibitions),
    []
  );
  const walkerImageSystemSummary = useMemo(
    () => createWalkerImageSystemSummary(walkerImageReadinessReport),
    [walkerImageReadinessReport]
  );
  const walkerOfflineReadinessSummary = useMemo(
    () =>
      createWalkerOfflineReadinessSummary({
        imageReadiness: walkerImageReadinessReport,
        hasServiceWorker: true
      }),
    [walkerImageReadinessReport]
  );
  useEffect(() => {
    if (
      highlightedRouteStopId &&
      !displayRouteMapModel.pins.some((pin) => pin.id === highlightedRouteStopId)
    ) {
      setHighlightedRouteStopId(undefined);
    }
  }, [displayRouteMapModel, highlightedRouteStopId]);
  useEffect(() => {
    setDraftWalkStopIds(undefined);
  }, [selectedAreaId, selectedNeighborhood, walkMode]);
  const activeWalkRouteMatchesCurrent = Boolean(
    activeWalkSession &&
      !hasDraftWalk &&
      activeWalkSession.areaId === selectedAreaId &&
      activeWalkSession.mode === walkMode &&
      (activeWalkSession.neighborhood ?? undefined) === walkPlan.neighborhood
  );
  const activeWalkIsDraft =
    activeWalkSession?.status === "active" && (!activeWalkRouteMatchesCurrent || hasDraftWalk);
  const showRouteProgress =
    Boolean(activeWalkSession) &&
    activeWalkRouteMatchesCurrent &&
    (activeWalkSession?.status === "active" || activeWalkSession?.status === "completed");
  const activeWalkCurrentStop = activeWalkProgress?.currentStopId
    ? activeWalkPlan?.stops.find(
        (stop) => stop.exhibition.id === activeWalkProgress.currentStopId
      )
    : undefined;
  const activeWalkNextStop = activeWalkProgress?.nextStopId
    ? activeWalkPlan?.stops.find((stop) => stop.exhibition.id === activeWalkProgress.nextStopId)
    : undefined;
  const activeWalkNextLeg =
    activeWalkProgress?.currentStopId && activeWalkProgress.nextStopId
      ? activeWalkPlan?.legs.find(
          (leg) =>
            leg.fromExhibitionId === activeWalkProgress.currentStopId &&
            leg.toExhibitionId === activeWalkProgress.nextStopId
        )
      : undefined;
  const mediumOptions = useMemo(
    () => Array.from(new Set(areaInventory.flatMap((exhibition) => exhibition.mediums))),
    [areaInventory]
  );
  const openNowCount = useMemo(
    () =>
      areaInventory.filter(
        (exhibition) => getGalleryVisitStatus(exhibition, referenceNow) === "open-now"
      ).length,
    [areaInventory]
  );
  const uniqueGalleryCount = useMemo(
    () => new Set(areaInventory.map((exhibition) => exhibition.galleryName.toLowerCase())).size,
    [areaInventory]
  );
  const closingSoonCount = useMemo(
    () =>
      areaInventory.filter((exhibition) => getDaysUntilGalleryCloses(exhibition, referenceNow) <= 7)
        .length,
    [areaInventory]
  );
  const walkReadyCount = neighborhoodIntelligence.filter((item) => item.canSupportWalk).length;
  const marketReadinessCopy = getMarketReadinessCopy({
    verifiedCount: sourceTrust.verifiedExhibitionCount,
    fixtureCount: sourceTrust.fixtureExhibitionCount,
    staleCount: sourceTrust.staleSourceRiskCount + sourceTrust.needsReviewExhibitionCount,
    uniqueGalleryCount,
    walkReadyCount
  });
  const selectedNeighborhoodInsight = selectedNeighborhood
    ? neighborhoodIntelligence.find((item) => item.neighborhood === selectedNeighborhood)
    : undefined;
  const routeVerifiedStopCount = displayWalkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isVerified
  ).length;
  const routeFixtureStopCount = displayWalkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isFixture
  ).length;
  const routeScopeLabel = selectedNeighborhood ?? walkPlan.neighborhood ?? "All neighborhoods";
  const compactAreaName =
    selectedAreaId === "nyc"
      ? "NYC"
      : selectedAreaId === "la"
        ? "LA"
        : selectedAreaId === "camogli"
          ? "Camogli"
          : "Hudson";
  const heroTitle = isCompactLayout
    ? `${compactAreaName} Tonight`
    : `Tonight in ${selectedArea?.name ?? "the city"}`;
  const heroSubtitle = isCompactLayout
    ? selectedAreaId === "camogli"
      ? `${routeScopeLabel} cultural walk`
      : `${routeScopeLabel} route`
    : selectedAreaId === "camogli"
      ? `${walkPlan.title} for ${routeScopeLabel}. Limited verified art inventory; use official links before you go.`
      : `${walkPlan.title} for ${routeScopeLabel}. Open now, nearby, and source-labeled.`;
  const heroRouteSummary = isCompactLayout
    ? `${walkPlan.stops.length} stops`
    : walkPlan.summary;
  const activeFilterCopy = [
    activeLens !== "all" ? lensLabels[activeLens] : undefined,
    verifiedOnly ? "Verified only" : undefined,
    selectedMedium ? mediumLabels[selectedMedium] : undefined,
    query.trim() ? `Search: ${query.trim()}` : undefined
  ]
    .filter(Boolean)
    .join(" - ");
  const tonightPick = openingTonight[0] ?? visibleExhibitions[0];
  const selectedExhibition =
    visibleExhibitions.find((exhibition) => exhibition.id === selectedExhibitionId) ??
    galleryExhibitions.find((exhibition) => exhibition.id === selectedExhibitionId);
  const heroVisual = getWalkerVisualForRole({
    role: "neighborhood-banner",
    areaId: selectedAreaId,
    neighborhood: selectedNeighborhood ?? walkPlan.neighborhood
  });
  const tonightPickVisual = tonightPick ? getWalkerExhibitionBanner(tonightPick) : heroVisual;
  const startStop = walkPlan.stops.find((stop) => stop.exhibition.id === walkPlan.startStopId);
  const nextStop = walkPlan.stops.find((stop) => stop.exhibition.id === walkPlan.nextStopId);
  const betaFeedbackContextChips = useMemo(
    () =>
      [
        selectedArea?.name ?? selectedAreaId.toUpperCase(),
        galleryWalkModeLabels[walkMode],
        displayWalkPlan.neighborhood,
        `Start: ${walkerRouteMapHandoff.startPointLabel}`,
        activeWalkCurrentStop
          ? `Current: ${activeWalkCurrentStop.exhibition.galleryName}`
          : startStop
            ? `First: ${startStop.exhibition.galleryName}`
            : undefined,
        activeWalkNextStop
          ? `Next: ${activeWalkNextStop.exhibition.galleryName}`
          : nextStop
            ? `Next: ${nextStop.exhibition.galleryName}`
            : undefined
      ].filter((chip): chip is string => Boolean(chip)),
    [
      activeWalkCurrentStop,
      activeWalkNextStop,
      displayWalkPlan.neighborhood,
      nextStop,
      selectedArea?.name,
      selectedAreaId,
      startStop,
      walkerRouteMapHandoff.startPointLabel,
      walkMode
    ]
  );
  const routeStopProgressById =
    showRouteProgress
      ? activeWalkProgress?.stopProgressById
      : undefined;
  const selectedActiveWalkStop = selectedExhibition
    ? activeWalkPlan?.stops.find((stop) =>
        stop.exhibitions.some((exhibition) => exhibition.id === selectedExhibition.id)
      )
    : undefined;
  const selectedActiveWalkProgress = selectedActiveWalkStop
    ? activeWalkProgress?.stopProgressById[selectedActiveWalkStop.exhibition.id]
    : undefined;
  const selectedDisplayRouteStop = selectedExhibition
    ? displayWalkPlan.stops.find((stop) =>
        stop.exhibitions.some((exhibition) => exhibition.id === selectedExhibition.id)
      )
    : undefined;
  const highlightedDisplayRouteStop = highlightedRouteStopId
    ? displayWalkPlan.stops.find((stop) => stop.exhibition.id === highlightedRouteStopId)
    : undefined;
  const displayStartStop =
    displayWalkPlan.stops.find((stop) => stop.exhibition.id === displayWalkPlan.startStopId) ??
    displayWalkPlan.stops[0];
  const plannerNextStop = displayWalkPlan.stops.find(
    (stop) => stop.exhibition.id === displayWalkPlan.nextStopId
  );
  const detailSwapTargetStop =
    selectedExhibition && !selectedDisplayRouteStop
      ? highlightedDisplayRouteStop ?? activeWalkCurrentStop ?? displayStartStop
      : undefined;
  const selectedRouteAdvisory = selectedDisplayRouteStop
    ? displayRouteAdvisoryById.get(selectedDisplayRouteStop.exhibition.id)
    : undefined;
  const selectedIsInDisplayedRoute = Boolean(selectedDisplayRouteStop);
  const activeRouteStopIds = activeWalkPlan?.stops.map((stop) => stop.exhibition.id) ?? [];
  const personalizedPicks = useMemo(
    () =>
      rankGalleryExhibitionsForTaste(areaInventory, tastePassport, referenceNow, {
        feedback: tasteFeedback,
        preferences: tastePreferences,
        logEntries,
        activeRouteStopIds
      })
        .filter((pick) => {
          const status = getGalleryVisitStatus(pick.exhibition, referenceNow);

          return status === "open-now" || status === "opens-later";
        })
      .slice(0, 6),
    [activeRouteStopIds, areaInventory, logEntries, tasteFeedback, tastePassport, tastePreferences]
  );
  const personalizedScoreById = useMemo(
    () =>
      Object.fromEntries(
        personalizedPicks.map((pick) => [pick.exhibition.id, pick.score] as const)
      ),
    [personalizedPicks]
  );
  const swapCandidatesByStopId = useMemo(
    () =>
      new Map(
        displayWalkPlan.stops.map((stop) => [
          stop.exhibition.id,
          getGalleryRouteSwapCandidates({
            walkPlan: displayWalkPlan,
            stopId: stop.exhibition.id,
            exhibitions: galleryExhibitions,
            savedIds,
            referenceNow,
            personalizedScores: personalizedScoreById,
            limit: 2
          })
        ] as const)
      ),
    [displayWalkPlan, personalizedScoreById, savedIds]
  );
  const selectedRouteSwapCandidates = selectedDisplayRouteStop
    ? swapCandidatesByStopId.get(selectedDisplayRouteStop.exhibition.id) ?? []
    : [];
  const focusedRouteStopId =
    highlightedRouteStopId ?? displayRouteMapModel.currentPin?.id ?? displayWalkPlan.startStopId;
  const focusedRouteSwapCandidates = focusedRouteStopId
    ? swapCandidatesByStopId.get(focusedRouteStopId) ?? []
    : [];
  const feedbackByExhibitionId = useMemo(
    () => new Map(tasteFeedback.map((item) => [item.exhibitionId, item])),
    [tasteFeedback]
  );
  const selectedConciergeReasons = useMemo(
    () =>
      selectedExhibition
        ? getGalleryConciergeReasons(selectedExhibition, tastePassport, referenceNow, {
            feedback: tasteFeedback,
            preferences: tastePreferences,
            logEntries,
            activeRouteStopIds
          })
        : [],
    [activeRouteStopIds, logEntries, selectedExhibition, tasteFeedback, tastePassport, tastePreferences]
  );
  const eventSignals = useMemo(
    () =>
      createGalleryEventSignals(
        areaInventory.filter((exhibition) =>
          selectedNeighborhood ? exhibition.neighborhood === selectedNeighborhood : true
        ),
        referenceNow
      ),
    [areaInventory, selectedNeighborhood]
  );
  const eventConciergePlan = useMemo(
    () =>
      createOpeningNightConciergePlan({
        areaId: selectedAreaId,
        intent: eventRouteIntent,
        neighborhood: selectedNeighborhood,
        savedIds,
        exhibitions: galleryExhibitions,
        referenceNow
      }),
    [eventRouteIntent, savedIds, selectedAreaId, selectedNeighborhood]
  );
  const conciergeSuggestions = useMemo(
    () =>
      createGalleryConciergeSuggestions({
        areaId: selectedAreaId,
        selectedNeighborhood,
        walkPlan,
        activeWalkSession,
        activeWalkProgress,
        activeWalkPlan,
        eventSignals,
        personalizedPicks,
        logEntries,
        referenceNow
      }),
    [
      activeWalkPlan,
      activeWalkProgress,
      activeWalkSession,
      eventSignals,
      logEntries,
      personalizedPicks,
      selectedAreaId,
      selectedNeighborhood,
      walkPlan
    ]
  );
  const passportBadges = useMemo(
    () =>
      getGalleryPassportBadges(
        completedWalkSessions,
        logEntries,
        galleryExhibitions,
        referenceNow
      ),
    [completedWalkSessions, logEntries]
  );
  const passportStamps = useMemo(
    () => getGalleryPassportStamps(completedWalkSessions),
    [completedWalkSessions]
  );
  const passportMemory = useMemo(
    () =>
      createGalleryPassportMemory({
        completedWalks: completedWalkSessions,
        logEntries,
        badges: passportBadges,
        stamps: passportStamps,
        passport: tastePassport
      }),
    [completedWalkSessions, logEntries, passportBadges, passportStamps, tastePassport]
  );
  const galleryQuests = useMemo(
    () =>
      createGalleryQuests({
        areaId: selectedAreaId,
        exhibitions: galleryExhibitions,
        logEntries,
        passport: tastePassport,
        completedWalks: completedWalkSessions,
        referenceNow
      }),
    [completedWalkSessions, logEntries, selectedAreaId, tastePassport]
  );
  const newBadgeCount = getNewBadgeCount(earnedBadges, passportBadges);
  const completedQuestIdSet = new Set(completedQuestIds);
  const freshCompletedQuestIds = galleryQuests
    .filter((quest) => quest.completed && !completedQuestIdSet.has(quest.id))
    .map((quest) => quest.id);
  const walkRecapRewardCopy =
    activeWalkSession?.status === "completed"
      ? [
          passportBadges
            .filter((badge) => badge.earnedFromSessionId === activeWalkSession.id)
            .map((badge) => badge.label)
            .slice(0, 2)
            .join(", "),
          passportStamps.find((stamp) => stamp.earnedAt === activeWalkSession.completedAt)?.label,
          tastePassport.likedMediums[0]
            ? `Learned: ${mediumLabels[tastePassport.likedMediums[0]]} is a stronger signal.`
            : undefined
        ]
          .filter(Boolean)
          .join(" - ")
      : undefined;
  const activeWalkShareCard = useMemo(
    () =>
      createGalleryWalkShareCard({
        walkPlan:
          activeWalkSession?.status === "active" && !hasDraftWalk && activeWalkPlan
            ? activeWalkPlan
            : displayWalkPlan,
        session: activeWalkSession,
        recap: activeWalkRecap,
        badges: passportBadges,
        stamps: passportStamps
      }),
    [
      activeWalkPlan,
      activeWalkRecap,
      activeWalkSession,
      displayWalkPlan,
      hasDraftWalk,
      passportBadges,
      passportStamps
    ]
  );
  const walkerCompletedShareCard = useMemo(
    () =>
      createWalkerCompletedWalkShareCard({
        walkPlan:
          activeWalkSession?.status === "active" && !hasDraftWalk && activeWalkPlan
            ? activeWalkPlan
            : displayWalkPlan,
        session: activeWalkSession,
        recap: activeWalkRecap,
        reactions: stopReactions
      }),
    [activeWalkPlan, activeWalkRecap, activeWalkSession, displayWalkPlan, hasDraftWalk, stopReactions]
  );
  const betaProgress = useMemo(
    () => getGalleryBetaTasks(betaCompletedTaskIds),
    [betaCompletedTaskIds]
  );
  const personalizationLearningSummary = useMemo(
    () =>
      getPersonalizationLearningSummary({
        logEntries,
        tasteFeedback,
        completedWalks: completedWalkSessions,
        topSignalLabel: tastePassport.signals[0]?.label,
        nextRouteMode: "for-you"
      }),
    [completedWalkSessions, logEntries, tasteFeedback, tastePassport]
  );
  const betaReviewReport = useMemo(
    () =>
      createGalleryBetaReviewReport({
        feedback: betaFeedback,
        routeReport: routeUsabilityReport,
        areaId: selectedAreaId,
        routeMode: walkMode,
        neighborhood: selectedNeighborhood,
        activeWalkStatus: activeWalkSession?.status,
        startPointLabel: walkerRouteMapHandoff.startPointLabel,
        currentStopLabel:
          activeWalkCurrentStop?.exhibition.galleryName ??
          displayStartStop?.exhibition.galleryName,
        nextStopLabel:
          activeWalkNextStop?.exhibition.galleryName ??
          plannerNextStop?.exhibition.galleryName,
        verifiedCount: sourceTrust.verifiedExhibitionCount,
        demoReviewCount: sourceTrust.fixtureExhibitionCount + sourceTrust.needsReviewExhibitionCount,
        fieldTags: betaFeedback.flatMap((entry) => entry.fieldTags ?? []),
        routeWarningLabels: walkReadinessReport.warnings,
        previewUrl: "http://localhost:19006",
        generatedAt: referenceNow
      }),
    [
      activeWalkSession,
      activeWalkCurrentStop,
      activeWalkNextStop,
      betaFeedback,
      displayStartStop,
      plannerNextStop,
      routeUsabilityReport,
      selectedAreaId,
      selectedNeighborhood,
      sourceTrust,
      walkerRouteMapHandoff,
      walkReadinessReport,
      walkMode
    ]
  );
  const showFirstRunPanel =
    firstRunChoice !== "dismissed" &&
    !betaChecklistDismissed &&
    (!firstRunCompleted ||
      (activeWalkSession?.status === "active" && firstRunChoice !== "resume-walk"));

  function completeBetaTask(taskId: GalleryBetaTaskId) {
    setBetaCompletedTaskIds((taskIds) => completeGalleryBetaTask(taskIds, taskId));
  }

  function resetMarket(areaId: GalleryAreaId) {
    setSelectedAreaId(areaId);
    setSelectedNeighborhood(undefined);
    setSelectedMedium(undefined);
    setActiveLens("all");
    setVerifiedOnly(false);
    setWalkMode("quick-loop");
    setSelectedExhibitionId(undefined);
    if (areaId === "hudson") {
      completeBetaTask("check-hudson");
    }
  }

  function chooseCamogliFieldMode(mode: CamogliRouteMode) {
    setSelectedAreaId("camogli");
    setActiveLens("all");
    setVerifiedOnly(false);
    setSelectedMedium(undefined);
    setHighlightedRouteStopId(undefined);
    setSelectedExhibitionId(undefined);
    if (mode === "waterfront") {
      setSelectedNeighborhood("Porto / Waterfront");
    } else if (mode === "hill-walk") {
      setSelectedNeighborhood("San Rocco / Ruta");
    } else {
      setSelectedNeighborhood("Camogli Centro");
    }
    setMobileTab("walks");
    setShareStatus("Camogli field mode uses sparse cultural anchors. Check official links before walking.");
  }

  function chooseWalkerStartPointMode(mode: WalkerStartPointMode) {
    const selectedOption = walkerStartPointOptions.find((option) => option.mode === mode);

    setWalkerStartPointPreference((preference) => ({
      ...preference,
      mode,
      label: selectedOption?.label,
      address: mode === "custom-address" ? preference?.address ?? "Manual start point" : undefined
    }));
    setShareStatus(
      mode === "browser-location"
        ? "Walker will use browser location only if permission is available; external maps still handle live navigation."
        : `${selectedOption?.label ?? "Start point"} selected for this route.`
    );
  }

  function dismissReadinessWarning(warning: string) {
    setDismissedReadinessWarningIds((warningIds) =>
      warningIds.includes(warning) ? warningIds : [...warningIds, warning].slice(-12)
    );
  }

  function chooseWalkerFieldShortcut(neighborhood: string) {
    setSelectedAreaId("camogli");
    setSelectedNeighborhood(neighborhood);
    setSelectedMedium(undefined);
    setActiveLens("all");
    setVerifiedOnly(false);
    setWalkMode("quick-loop");
    setHighlightedRouteStopId(undefined);
    setSelectedExhibitionId(undefined);
    setMobileTab("walks");
    setShareStatus(`${neighborhood} loaded for Camogli field testing. Use official links before walking.`);
  }

  function chooseCamogliTestFirstRun() {
    completeFirstRun("camogli-test");
    resetMarket("camogli");
    setSelectedNeighborhood("Camogli Centro");
    setActiveLens("open-now");
    setShareStatus("Camogli is a cultural-walk test market. Use official links before you go.");
  }

  function completeFirstRun(choice: GalleryFirstRunChoice) {
    setFirstRunChoice(choice);
    setFirstRunCompleted(true);
  }

  function chooseFindWalkFirstRun() {
    completeFirstRun("find-walk");
    completeBetaTask("find-walk");
    setActiveLens("open-now");
    setShareStatus("Showing walk-ready open galleries first.");
  }

  function chooseTasteQuizFirstRun() {
    completeFirstRun("taste-quiz");
    completeBetaTask("taste-quiz");
    setWalkMode("for-you");
    setShareStatus("Taste quiz and For You route are ready below.");
  }

  function chooseResumeWalkFirstRun() {
    completeFirstRun("resume-walk");
    resumeWalk();
    setShareStatus("Active walk resumed.");
  }

  function dismissFirstRun() {
    completeFirstRun("dismissed");
    setBetaChecklistDismissed(true);
  }

  function handleBetaTask(taskId: GalleryBetaTaskId) {
    completeBetaTask(taskId);

    if (taskId === "find-walk") {
      chooseFindWalkFirstRun();
      return;
    }

    if (taskId === "taste-quiz") {
      chooseTasteQuizFirstRun();
      return;
    }

    if (taskId === "start-route") {
      startWalk();
      return;
    }

    if (taskId === "check-hudson") {
      resetMarket("hudson");
      return;
    }

    if (taskId === "send-feedback") {
      setShareStatus("Feedback composer is ready below.");
      return;
    }

    setShareStatus("Beta task marked locally.");
  }

  function tryBetaNycWalk() {
    setSelectedAreaId("nyc");
    setSelectedNeighborhood(undefined);
    setSelectedMedium(undefined);
    setActiveLens("open-now");
    setVerifiedOnly(false);
    setWalkMode("quick-loop");
    setSelectedExhibitionId(undefined);
    setDraftWalkStopIds(undefined);
    completeBetaTask("find-walk");
    setShareStatus("NYC beta walk path loaded.");
  }

  function tryBetaForYou() {
    setWalkMode("for-you");
    setActiveLens("all");
    completeBetaTask("taste-quiz");
    setShareStatus("For You route mode is active and learning from saved, skipped, and visited shows.");
  }

  function checkBetaHudson() {
    resetMarket("hudson");
    setSelectedNeighborhood("Warren Street");
    setShareStatus("Hudson Warren Street loaded. Nearby verified Hudson Valley depth is labeled separately.");
  }

  function openBetaFeedbackComposer() {
    completeBetaTask("send-feedback");
    setShareStatus("Feedback composer is ready below. Copy beta report includes route and trust context.");
  }

  function resetGalleryDemoState() {
    clearGalleryAppPersistedState();
    setSelectedAreaId("nyc");
    setSelectedNeighborhood(undefined);
    setSelectedMedium(undefined);
    setActiveLens("all");
    setVerifiedOnly(false);
    setWalkMode("quick-loop");
    setAlertWindowDays(14);
    setQuery("");
    setSelectedExhibitionId(undefined);
    setHighlightedRouteStopId(undefined);
    setActiveWalkSession(undefined);
    setLogEntries([]);
    setSavedAlertArtists([]);
    setSavedAlertGalleries([]);
    setSavedAlertNeighborhoods([]);
    setSavedAlertMediums([]);
    setQuizAnswers([]);
    setEarnedBadges([]);
    setCompletedQuestIds([]);
    setCompletedWalkSessions([]);
    setTasteFeedback([]);
    setTastePreferences(defaultTastePreferences);
    setSavedWalks([]);
    setFirstRunChoice(undefined);
    setFirstRunCompleted(false);
    setBetaCompletedTaskIds([]);
    setBetaFeedback([]);
    setBetaChecklistDismissed(false);
    setBetaFeedbackKind("useful");
    setBetaFeedbackNote("");
    setDraftWalkStopIds(undefined);
    setWalkerJourneyStep("walking");
    setSelectedReaction("inspired");
    setReactionNote("");
    setReactionSaved(true);
    setStopReactions([]);
    setWalkerStartPointPreference(undefined);
    setDismissedReadinessWarningIds([]);
    setShareStatus("Demo state reset.");
  }

  function saveBetaFeedback() {
    const feedback = createGalleryBetaFeedback(
      {
        kind: betaFeedbackKind,
        note: betaFeedbackNote,
        areaId: selectedAreaId,
        routeMode: walkMode,
        neighborhood: selectedNeighborhood,
        activeWalkStatus: activeWalkSession?.status,
        currentStopLabel:
          activeWalkCurrentStop?.exhibition.galleryName ??
          displayStartStop?.exhibition.galleryName,
        nextStopLabel:
          activeWalkNextStop?.exhibition.galleryName ??
          plannerNextStop?.exhibition.galleryName,
        startPointLabel: walkerRouteMapHandoff.startPointLabel,
        fieldTags: getBetaFeedbackFieldTags(betaFeedbackNote),
        verifiedCount: sourceTrust.verifiedExhibitionCount,
        demoReviewCount: sourceTrust.fixtureExhibitionCount + sourceTrust.needsReviewExhibitionCount
      },
      referenceNow
    );

    setBetaFeedback((entries) => [feedback, ...entries].slice(0, 12));
    setBetaFeedbackNote("");
    completeBetaTask("send-feedback");
    setShareStatus("Beta feedback saved locally.");
  }

  async function copyBetaFeedbackReport() {
    const copied = await writeTextToClipboard(betaReviewReport);

    completeBetaTask("send-feedback");
    setShareStatus(copied ? "Beta review report copied." : "Beta review report is ready to copy.");
  }

  function emailBetaFeedbackReport() {
    const subject = encodeURIComponent("Walker beta feedback");
    const body = encodeURIComponent(betaReviewReport);

    completeBetaTask("send-feedback");
    void Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  }

  function setLogStatus(exhibitionId: string, status: GalleryLogStatus) {
    const currentEntry = logEntryById.get(exhibitionId);

    setLogEntries((entries) =>
      upsertGalleryLogEntry(entries, exhibitionId, status, currentEntry?.note, referenceNow)
    );
  }

  function setLogNote(exhibitionId: string, note: string) {
    const currentEntry = logEntryById.get(exhibitionId);

    setLogEntries((entries) =>
      upsertGalleryLogEntry(
        entries,
        exhibitionId,
        currentEntry?.status ?? "want-to-see",
        note,
        referenceNow
      )
    );
  }

  function answerQuizCard(artworkId: string, response: GalleryQuizResponse) {
    setQuizAnswers((answers) => upsertQuizAnswer(answers, artworkId, response, referenceNow));
  }

  function recordTasteFeedback(exhibitionId: string, kind: GalleryTasteFeedbackKind) {
    setTasteFeedback((feedback) => upsertTasteFeedback(feedback, exhibitionId, kind, referenceNow));
  }

  function togglePreferredMedium(medium: GalleryMedium) {
    setTastePreferences((preferences) =>
      toggleMediumPreference(preferences, medium, "preferredMediums")
    );
  }

  function toggleAvoidedMedium(medium: GalleryMedium) {
    setTastePreferences((preferences) =>
      toggleMediumPreference(preferences, medium, "avoidedMediums")
    );
  }

  function togglePreferredNeighborhood(neighborhood: string) {
    setTastePreferences((preferences) => ({
      ...preferences,
      preferredNeighborhoods: toggleStringPreference(
        Array.isArray(preferences.preferredNeighborhoods)
          ? preferences.preferredNeighborhoods
          : [],
        neighborhood
      )
    }));
  }

  function togglePreferredTag(tag: string) {
    setTastePreferences((preferences) => ({
      ...preferences,
      preferredTags: toggleStringPreference(
        Array.isArray(preferences.preferredTags) ? preferences.preferredTags : [],
        tag
      )
    }));
  }

  async function copyCurrentItinerary() {
    const text =
      activeWalkSession?.status === "completed"
        ? walkerCompletedShareCard.shareText
        : createGalleryWalkItineraryText(displayWalkPlan, activeWalkSession);
    const copied = await writeTextToClipboard(text);

    setShareStatus(copied ? "Itinerary copied." : "Itinerary ready to copy from the route card.");
  }

  async function shareCurrentRoute() {
    const fallbackPayload =
      activeWalkSession?.status === "completed"
        ? {
            title: walkerCompletedShareCard.heading,
            text: walkerCompletedShareCard.shareText,
            url: walkerRouteMapHandoff.routeMapUrl
          }
        : createGalleryWalkShareSummary(displayWalkPlan, activeWalkRecap);
    const payload = activeWalkShareCard
      ? {
          title: activeWalkShareCard.title,
          text: activeWalkShareCard.shareText,
          url: walkerRouteMapHandoff.routeMapUrl ?? activeWalkShareCard.routeMapUrl
        }
      : fallbackPayload;
    const shared = await shareWalkPayload(payload);

    if (!shared) {
      await writeTextToClipboard(payload.text);
    }

    setShareStatus(shared ? "Route shared." : "Route summary copied.");
  }

  function saveCurrentWalk() {
    const savedWalk = createSavedGalleryWalk(displayWalkPlan, activeWalkSession, referenceNow);

    setSavedWalks((walks) => [
      savedWalk,
      ...walks.filter((walk) => walk.id !== savedWalk.id)
    ].slice(0, 6));
    setShareStatus("Walk saved locally.");
  }

  function startRouteFromExhibition(exhibition: GalleryExhibition) {
    setSelectedAreaId(exhibition.areaId);
    setSelectedNeighborhood(exhibition.neighborhood);
    setWalkMode("for-you");
    setLogStatus(exhibition.id, "want-to-see");
    recordTasteFeedback(exhibition.id, "more-like-this");
  }

  function replaceRouteStop(stopId: string, replacementId: string) {
    const replacement = galleryExhibitions.find((exhibition) => exhibition.id === replacementId);

    if (!replacement) {
      return;
    }

    const alreadyInDisplayedRoute = displayWalkPlan.stops.some(
      (stop) => stop.exhibition.id === replacementId
    );

    if (alreadyInDisplayedRoute) {
      setShareStatus("That exhibition is already in this route.");
      return;
    }

    const activeStopIds = new Set(activeWalkPlan?.stops.map((stop) => stop.exhibition.id) ?? []);
    const replacingActiveWalk =
      activeWalkSession?.status === "active" && !activeWalkIsDraft && activeStopIds.has(stopId);

    if (replacingActiveWalk) {
      setActiveWalkSession((session) =>
        session ? replaceGalleryWalkSessionStop(session, stopId, replacementId, referenceNow) : session
      );
      setShareStatus(`Active walk updated with ${replacement.galleryName}.`);
    } else {
      setDraftWalkStopIds(
        walkPlan.stops.map((stop) =>
          stop.exhibition.id === stopId ? replacementId : stop.exhibition.id
        )
      );
      setShareStatus(
        activeWalkSession?.status === "active"
          ? `Draft route swapped in ${replacement.galleryName}. Active walk is unchanged.`
          : `Route swapped in ${replacement.galleryName}.`
      );
    }

    completeBetaTask("swap-stop");
    setHighlightedRouteStopId(replacementId);
  }

  function addExhibitionToActiveWalk(exhibition: GalleryExhibition) {
    const alreadyInActiveRoute = activeWalkPlan?.stops.some((stop) =>
      stop.exhibitions.some((candidate) => candidate.id === exhibition.id)
    );

    setLogStatus(exhibition.id, "want-to-see");
    recordTasteFeedback(exhibition.id, "more-like-this");

    if (!alreadyInActiveRoute && detailSwapTargetStop) {
      replaceRouteStop(detailSwapTargetStop.exhibition.id, exhibition.id);
      return;
    }

    setShareStatus(
      alreadyInActiveRoute
        ? "Already in the displayed route."
        : activeWalkSession?.status === "active"
          ? "Saved as a swap cue for the next route draft."
          : "Added to your intent signals for the next route."
    );
  }

  async function shareExhibition(exhibition: GalleryExhibition) {
    const text = `${exhibition.title} at ${exhibition.galleryName}\n${exhibition.address}\n${exhibition.externalUrl}`;
    const shared = await shareWalkPayload({ title: exhibition.title, text, url: exhibition.externalUrl });

    if (!shared) {
      await writeTextToClipboard(text);
    }

    setShareStatus(shared ? "Exhibition shared." : "Exhibition details copied.");
  }

  function handleConciergeSuggestion(suggestion: GalleryConciergeSuggestion) {
    const intent = applyGalleryConciergeSuggestion(suggestion);

    if (intent.type === "open-exhibition") {
      setSelectedExhibitionId(intent.exhibitionId);
      setShareStatus("Concierge opened the best-fit detail.");
      return;
    }

    if (intent.type === "switch-route-mode") {
      setWalkMode(intent.mode);
      setSelectedNeighborhood(intent.neighborhood);
      setShareStatus(`Concierge switched to ${galleryWalkModeLabels[intent.mode]}.`);
      return;
    }

    if (intent.type === "start-walk") {
      startWalk();
      setShareStatus("Concierge started this walk.");
      return;
    }

    if (intent.type === "save-walk") {
      saveCurrentWalk();
      return;
    }

    if (intent.type === "copy-itinerary") {
      void copyCurrentItinerary();
      return;
    }

    if (intent.type === "mark-current-visited") {
      markRouteStopVisited(intent.stopId, intent.exhibitionId);
      setShareStatus("Concierge advanced your walk.");
      return;
    }

    if (intent.type === "skip-current") {
      skipRouteStop(intent.stopId, intent.exhibitionId);
      setShareStatus("Concierge skipped that stop and advanced the walk.");
    }
  }

  function startWalk() {
    if (walkPlan.stops.length === 0) {
      return;
    }

    setActiveWalkSession(createGalleryWalkSession(walkPlan, referenceNow));
    setDraftWalkStopIds(undefined);
    setWalkerJourneyStep("walking");
    setReactionNote("");
    setSelectedReaction("inspired");
    setReactionSaved(true);
    setMobileTab("walks");
    completeFirstRun("find-walk");
    completeBetaTask("start-route");
  }

  function resumeWalk() {
    if (!activeWalkSession) {
      return;
    }

    setSelectedAreaId(activeWalkSession.areaId);
    setSelectedNeighborhood(activeWalkSession.neighborhood);
    setWalkMode(activeWalkSession.mode);
    setSelectedExhibitionId(undefined);
    setWalkerJourneyStep("walking");
    setMobileTab("walks");
  }

  function arriveAtCurrentStop() {
    if (!activeWalkCurrentStop) {
      return;
    }

    setWalkerJourneyStep("arrival");
    setReactionNote("");
    setSelectedReaction("inspired");
    setReactionSaved(true);
  }

  function continueToReaction() {
    setWalkerJourneyStep("reaction");
  }

  function saveStopReactionAndAdvance() {
    const stopId = activeWalkProgress?.currentStopId;
    const exhibitionId = activeWalkCurrentStop?.exhibition.id;

    if (!stopId || !exhibitionId) {
      setWalkerJourneyStep("walking");
      return;
    }

    const reactionEntry = createWalkerStopReaction({
      exhibitionId,
      sessionId: activeWalkSession?.id,
      reaction: selectedReaction,
      saved: reactionSaved,
      note: reactionNote,
      now: referenceNow
    });

    setStopReactions((entries) => [
      reactionEntry,
      ...entries.filter((entry) => entry.id !== reactionEntry.id)
    ].slice(0, 40));
    setLogEntries((entries) =>
      createWalkerReactionLogEntry({
        entries,
        exhibitionId,
        reaction: selectedReaction,
        saved: reactionSaved,
        note: reactionNote,
        now: referenceNow
      })
    );
    setActiveWalkSession((session) =>
      session ? markGalleryWalkStopVisited(session, stopId, referenceNow) : session
    );
    setWalkerJourneyStep("walking");
    setReactionNote("");
    setSelectedReaction("inspired");
    setReactionSaved(true);
    completeBetaTask("mark-visited");
  }

  function markRouteStopVisited(stopId?: string, exhibitionId?: string) {
    if (!stopId) {
      return;
    }

    setActiveWalkSession((session) =>
      session ? markGalleryWalkStopVisited(session, stopId, referenceNow) : session
    );

    if (exhibitionId) {
      setLogStatus(exhibitionId, "visited");
    }

    setWalkerJourneyStep("walking");
    completeBetaTask("mark-visited");
  }

  function skipRouteStop(stopId?: string, exhibitionId?: string) {
    if (!stopId) {
      return;
    }

    setActiveWalkSession((session) =>
      session ? skipGalleryWalkStop(session, stopId, referenceNow) : session
    );

    if (exhibitionId) {
      setLogStatus(exhibitionId, "skipped");
    }

    setWalkerJourneyStep("walking");
  }

  function endActiveWalk() {
    setActiveWalkSession((session) =>
      session ? completeGalleryWalk(session, referenceNow) : session
    );
    setWalkerJourneyStep("walking");
  }

  function toggleStringValue(values: string[], value: string): string[] {
    return values.includes(value)
      ? values.filter((candidate) => candidate !== value)
      : [...values, value];
  }

  function toggleMediumValue(values: GalleryMedium[], value: GalleryMedium): GalleryMedium[] {
    return values.includes(value)
      ? values.filter((candidate) => candidate !== value)
      : [...values, value];
  }

  const alertSignalCount =
    savedAlertArtists.length +
    savedAlertGalleries.length +
    savedAlertNeighborhoods.length +
    savedAlertMediums.length;

  useEffect(() => {
    if (activeWalkSession?.status === "completed") {
      setCompletedWalkSessions((sessions) =>
        rememberCompletedWalkSession(sessions, activeWalkSession)
      );
    }
  }, [activeWalkSession]);

  useEffect(() => {
    if (passportBadges.length > earnedBadges.length || newBadgeCount > 0) {
      setEarnedBadges(passportBadges);
    }
  }, [earnedBadges.length, newBadgeCount, passportBadges]);

  useEffect(() => {
    if (freshCompletedQuestIds.length > 0) {
      setCompletedQuestIds((questIds) => Array.from(new Set([...questIds, ...freshCompletedQuestIds])));
    }
  }, [freshCompletedQuestIds]);

  useEffect(() => {
    writeGalleryAppPersistedState({
      version: 1,
      selectedAreaId,
      selectedNeighborhood,
      selectedMedium,
      activeLens,
      verifiedOnly,
      walkMode,
      alertWindowDays,
      logEntries,
      savedAlertArtists,
      savedAlertGalleries,
      savedAlertNeighborhoods,
      savedAlertMediums,
      activeWalkSession,
      quizAnswers,
      tastePassport,
      earnedBadges,
      completedQuestIds,
      completedWalkSessions,
      tasteFeedback,
      tastePreferences,
      savedWalks,
      firstRunChoice,
      firstRunCompleted,
      betaCompletedTaskIds,
      betaFeedback,
      betaChecklistDismissed,
      stopReactions,
      walkerStartPointPreference,
      dismissedReadinessWarningIds
    });
  }, [
    activeLens,
    activeWalkSession,
    alertWindowDays,
    betaChecklistDismissed,
    betaCompletedTaskIds,
    betaFeedback,
    completedQuestIds,
    completedWalkSessions,
    dismissedReadinessWarningIds,
    earnedBadges,
    firstRunChoice,
    firstRunCompleted,
    logEntries,
    quizAnswers,
    savedAlertArtists,
    savedAlertGalleries,
    savedAlertMediums,
    savedAlertNeighborhoods,
    selectedAreaId,
    selectedMedium,
    selectedNeighborhood,
    savedWalks,
    tasteFeedback,
    tastePassport,
    tastePreferences,
    stopReactions,
    walkerStartPointPreference,
    verifiedOnly,
    walkMode
  ]);

  const mobileExploreContent = (
    <View style={styles.mobileTabShell}>
      <View style={styles.mobileScreenHeader}>
        <View style={styles.walkerTopBrand}>
          <WalkerMark size={24} />
          <View>
            <Text style={styles.walkerWordmark}>Explore</Text>
            <Text style={styles.mobileDateLabel}>{selectedArea?.name ?? compactAreaName} - {visibleExhibitions.length} results</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show current walk map"
          onPress={() => setMobileTab("walks")}
          style={styles.mobileHeaderIconButton}
        >
          <MapPin size={18} color={colors.teal} />
        </Pressable>
      </View>

      <View style={styles.mobileSearchPanel}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.mutedInk} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search places, exhibits, walks..."
            placeholderTextColor={colors.mutedInk}
            style={styles.searchInput}
          />
          <SlidersHorizontal size={17} color={colors.teal} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediumRow}>
          {galleryAreas.map((area) => (
            <ChipButton
              key={area.id}
              label={area.name}
              active={selectedAreaId === area.id}
              onPress={() => resetMarket(area.id)}
              compact
            />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediumRow}>
          {lensOptions.map((lens) => (
            <ChipButton
              key={lens}
              label={lensLabels[lens]}
              active={activeLens === lens}
              onPress={() => setActiveLens(lens)}
              compact
            />
          ))}
          <ChipButton
            label="Verified"
            active={verifiedOnly}
            onPress={() => setVerifiedOnly((value) => !value)}
            compact
          />
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediumRow}>
          <ChipButton
            label="All media"
            active={!selectedMedium}
            onPress={() => setSelectedMedium(undefined)}
            compact
          />
          {mediumOptions.map((medium) => (
            <ChipButton
              key={medium}
              label={mediumLabels[medium]}
              active={selectedMedium === medium}
              onPress={() => setSelectedMedium(medium)}
              compact
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNeighborhoodRail}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show all neighborhoods"
          onPress={() => {
            setSelectedNeighborhood(undefined);
            setSelectedExhibitionId(undefined);
          }}
          style={[styles.mobileNeighborhoodChip, !selectedNeighborhood ? styles.activeMobileNeighborhoodChip : null]}
        >
          <Text style={styles.mobileNeighborhoodName}>All</Text>
          <Text style={styles.mobileNeighborhoodMeta}>{sourceTrust.verifiedExhibitionCount} verified</Text>
        </Pressable>
        {neighborhoodIntelligence.slice(0, 8).map((item) => (
          <Pressable
            key={item.neighborhood}
            accessibilityRole="button"
            accessibilityLabel={`Explore ${item.neighborhood}`}
            onPress={() => {
              setSelectedNeighborhood(item.neighborhood);
              setSelectedExhibitionId(undefined);
            }}
            style={[
              styles.mobileNeighborhoodChip,
              selectedNeighborhood === item.neighborhood ? styles.activeMobileNeighborhoodChip : null
            ]}
          >
            <Text style={styles.mobileNeighborhoodName} numberOfLines={1}>{item.neighborhood}</Text>
            <Text style={styles.mobileNeighborhoodMeta}>{item.verifiedCount} verified - {item.openNowCount} open</Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedExhibition ? (
        <View style={styles.mobileDetailWrap}>
          <ExhibitionDetailSheet
            exhibition={selectedExhibition}
            allExhibitions={galleryExhibitions}
            savedIds={savedIds}
            logEntry={logEntryById.get(selectedExhibition.id)}
            routeProgress={selectedActiveWalkProgress}
            routeAdvisory={selectedRouteAdvisory}
            routeConfidenceLabel={displayRouteMapModel.confidence.label}
            isInDisplayedRoute={selectedIsInDisplayedRoute}
            hasActiveWalk={activeWalkSession?.status === "active"}
            displayRouteStop={selectedDisplayRouteStop}
            swapTargetStop={detailSwapTargetStop}
            swapCandidates={selectedRouteSwapCandidates}
            conciergeReasons={selectedConciergeReasons}
            feedback={feedbackByExhibitionId.get(selectedExhibition.id)}
            onStatus={(status) => setLogStatus(selectedExhibition.id, status)}
            onNote={(note) => setLogNote(selectedExhibition.id, note)}
            onMarkRouteVisited={() =>
              markRouteStopVisited(selectedActiveWalkStop?.exhibition.id, selectedExhibition.id)
            }
            onSkipRouteStop={() =>
              skipRouteStop(selectedActiveWalkStop?.exhibition.id, selectedExhibition.id)
            }
            onSwapRouteStop={replaceRouteStop}
            onSwapSelectedIntoRoute={(targetStopId) =>
              replaceRouteStop(targetStopId, selectedExhibition.id)
            }
            onFeedback={(kind) => recordTasteFeedback(selectedExhibition.id, kind)}
            onStartRouteFromHere={() => startRouteFromExhibition(selectedExhibition)}
            onAddToActiveWalk={() => addExhibitionToActiveWalk(selectedExhibition)}
            onShare={() => {
              void shareExhibition(selectedExhibition);
            }}
            onClose={() => setSelectedExhibitionId(undefined)}
          />
        </View>
      ) : null}

      <View style={styles.mobileListPanel}>
        <View style={styles.mobileSectionHeading}>
          <Text style={styles.mobileSectionTitle}>Results</Text>
          <Text style={styles.mobileSectionMeta}>{visibleExhibitions.length} shows</Text>
        </View>
        {visibleExhibitions.slice(0, 16).map((exhibition) => (
          <WalkerExploreResultRow
            key={exhibition.id}
            exhibition={exhibition}
            logEntry={logEntryById.get(exhibition.id)}
            onOpenDetails={() => setSelectedExhibitionId(exhibition.id)}
          />
        ))}
      </View>
    </View>
  );

  const showingMobileActiveJourney =
    activeWalkSession?.status === "active" &&
    !activeWalkIsDraft &&
    Boolean(activeWalkCurrentStop && activeWalkProgress && activeWalkPlan);

  const mobileWalkContent = (
    <View style={showingMobileActiveJourney ? styles.activeJourneyMobileShell : styles.mobileTabShell}>
      {showingMobileActiveJourney ? (
        <ActiveWalkJourneyScreen
          walkPlan={activeWalkPlan ?? displayWalkPlan}
          routeMapModel={displayRouteMapModel}
          routeMapHandoff={walkerRouteMapHandoff}
          currentStop={activeWalkCurrentStop}
          nextStop={activeWalkNextStop}
          nextLeg={activeWalkNextLeg}
          progress={activeWalkProgress}
          journeyStep={walkerJourneyStep}
          reaction={selectedReaction}
          reactionNote={reactionNote}
          reactionSaved={reactionSaved}
          onArrived={arriveAtCurrentStop}
          onContinueToReaction={continueToReaction}
          onReaction={setSelectedReaction}
          onReactionNote={setReactionNote}
          onToggleSaved={() => setReactionSaved((saved) => !saved)}
          onSaveReaction={saveStopReactionAndAdvance}
          onSkip={() => skipRouteStop(activeWalkProgress?.currentStopId, activeWalkCurrentStop?.exhibition.id)}
          onEnd={endActiveWalk}
          onHighlightStop={setHighlightedRouteStopId}
          highlightedStopId={highlightedRouteStopId}
          focusedSwapCandidates={focusedRouteSwapCandidates}
          onSwapFocusedStop={(replacementId) => {
            if (focusedRouteStopId) {
              replaceRouteStop(focusedRouteStopId, replacementId);
            }
          }}
        />
      ) : (
        <>
      {camogliFieldGuide ? (
        <CamogliFieldModeCard guide={camogliFieldGuide} onMode={chooseCamogliFieldMode} />
      ) : null}

      {walkerFieldTestGuide ? (
        <WalkerFieldTestShortcutCard
          guide={walkerFieldTestGuide}
          onShortcut={chooseWalkerFieldShortcut}
        />
      ) : null}

      <RouteCommandPanel
        walkPlan={walkPlan}
        walkMode={walkMode}
        routeUsabilityReport={routeUsabilityReport}
        walkReadinessReport={walkReadinessReport}
        startPointOptions={walkerStartPointOptions}
        routeVerifiedStopCount={routeVerifiedStopCount}
        routeFixtureStopCount={routeFixtureStopCount}
        startStop={startStop}
        nextStop={nextStop}
        activeWalkSession={activeWalkSession}
        activeWalkProgress={activeWalkProgress}
        activeWalkRecap={activeWalkRecap}
        activeWalkPlan={activeWalkPlan}
        activeWalkCurrentStop={activeWalkCurrentStop}
        activeWalkNextStop={activeWalkNextStop}
        activeWalkNextLeg={activeWalkNextLeg}
        activeWalkIsDraft={activeWalkIsDraft}
        activeWalkRouteMatchesCurrent={activeWalkRouteMatchesCurrent}
        onMode={setWalkMode}
        onStartWalk={startWalk}
        onResumeWalk={resumeWalk}
        onMarkCurrentVisited={() =>
          markRouteStopVisited(
            activeWalkProgress?.currentStopId,
            activeWalkCurrentStop?.exhibition.id
          )
        }
        onSkipCurrent={() =>
          skipRouteStop(activeWalkProgress?.currentStopId, activeWalkCurrentStop?.exhibition.id)
        }
        onEndWalk={endActiveWalk}
        onCopyItinerary={copyCurrentItinerary}
        onShareRoute={shareCurrentRoute}
        onSaveWalk={saveCurrentWalk}
        onStartPointMode={chooseWalkerStartPointMode}
        onDismissReadinessWarning={dismissReadinessWarning}
        walkRecapRewardCopy={walkRecapRewardCopy}
        routeMapModel={displayRouteMapModel}
        routeMapUrl={walkerRouteMapHandoff.routeMapUrl}
        shareCard={activeWalkShareCard}
        walkerShareCard={walkerCompletedShareCard}
        compact
      />

      <RoutePreview
        routeMapModel={displayRouteMapModel}
        routeMapHandoff={walkerRouteMapHandoff}
        highlightedStopId={highlightedRouteStopId}
        focusedSwapCandidates={focusedRouteSwapCandidates}
        onHighlightStop={setHighlightedRouteStopId}
        onSwapFocusedStop={(replacementId) => {
          if (focusedRouteStopId) {
            replaceRouteStop(focusedRouteStopId, replacementId);
          }
        }}
      />

      <View style={styles.walkStops}>
        {displayWalkPlan.stops.map((stop, index) => (
          <WalkStopRow
            key={stop.exhibition.id}
            stop={stop}
            leg={index > 0 ? displayWalkPlan.legs[index - 1] : undefined}
            isStart={displayWalkPlan.startStopId === stop.exhibition.id}
            isNext={displayWalkPlan.nextStopId === stop.exhibition.id}
            isLast={index === displayWalkPlan.stops.length - 1}
            progress={routeStopProgressById?.[stop.exhibition.id]}
            freshnessLabel={getGalleryFreshnessState(stop.exhibition, referenceNow).label}
            advisory={displayRouteAdvisoryById.get(stop.exhibition.id)}
            highlighted={highlightedRouteStopId === stop.exhibition.id}
            swapCandidates={swapCandidatesByStopId.get(stop.exhibition.id) ?? []}
            onHighlight={() => setHighlightedRouteStopId(stop.exhibition.id)}
            onSwapStop={(replacementId) => replaceRouteStop(stop.exhibition.id, replacementId)}
          />
        ))}
      </View>
        </>
      )}
    </View>
  );

  const mobileJournalContent = (
    <View style={styles.mobileTabShell}>
      <GalleryPassportPanel
        quizAnswers={quizAnswers}
        passport={tastePassport}
        picks={personalizedPicks}
        badges={passportBadges}
        stamps={passportStamps}
        quests={galleryQuests}
        memory={passportMemory}
        newBadgeCount={newBadgeCount}
        feedback={tasteFeedback}
        preferences={tastePreferences}
        mediumOptions={mediumOptions}
        neighborhoodOptions={galleryNeighborhoods
          .filter((neighborhood) => neighborhood.areaId === selectedAreaId)
          .map((neighborhood) => neighborhood.name)}
        activeWalkMode={walkMode}
        onQuizAnswer={answerQuizCard}
        onOpenPick={(exhibitionId) => setSelectedExhibitionId(exhibitionId)}
        onFeedback={recordTasteFeedback}
        onTogglePreferredMedium={togglePreferredMedium}
        onToggleAvoidedMedium={toggleAvoidedMedium}
        onTogglePreferredNeighborhood={togglePreferredNeighborhood}
        onTogglePreferredTag={togglePreferredTag}
        onUseForYouRoute={() => {
          setWalkMode("for-you");
          setMobileTab("walks");
        }}
      />
    </View>
  );

  const mobileSavedContent = (
    <WalkerSavedMemoryPanel
      savedWalks={savedWalks}
      logEntries={logEntries}
      exhibitions={galleryExhibitions}
      memory={passportMemory}
      badges={passportBadges}
      stamps={passportStamps}
      onCopySavedWalk={(savedWalk) => {
        void writeTextToClipboard(savedWalk.itineraryText).then((copied) => {
          setShareStatus(copied ? "Saved itinerary copied." : "Saved itinerary ready.");
        });
      }}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, isCompactLayout ? styles.mobileShellContent : null]}>
        {isCompactLayout ? (
          <View style={styles.mobileAppShell}>
            {mobileTab === "home" ? (
              <ProfessionalMobileHome
                areaLabel={selectedArea?.name ?? compactAreaName}
                dateLabel={`${formatShortDate(referenceNow)} - ${formatShortTime(referenceNow)}`}
                routeScopeLabel={routeScopeLabel}
                walkPlan={walkPlan}
                featuredExhibition={tonightPick}
                featuredVisual={tonightPickVisual}
                personalizedPick={personalizedPicks[0]}
                openingSignal={eventSignals[0]}
                lastChanceAlert={lastChanceAlerts[0]}
                neighborhoods={neighborhoodIntelligence}
                sourceTrust={sourceTrust}
                freshnessLabel={freshnessAudit.summaryLabel}
                openNowCount={openNowCount}
                closingSoonCount={closingSoonCount}
                activeWalk={activeWalkSession?.status === "active"}
                camogliFieldGuide={camogliFieldGuide}
                onFindWalk={() => {
                  chooseFindWalkFirstRun();
                  setMobileTab("walks");
                }}
                onStartWalk={startWalk}
                onOpenRoute={() => {
                  if (walkerRouteMapHandoff.routeMapUrl) {
                    void Linking.openURL(walkerRouteMapHandoff.routeMapUrl);
                  }
                }}
                onForYou={() => {
                  setWalkMode("for-you");
                  setMobileTab("journal");
                  completeBetaTask("taste-quiz");
                }}
                onResumeWalk={resumeWalk}
                onOpenFeatured={() => {
                  if (tonightPick) {
                    setSelectedExhibitionId(tonightPick.id);
                    setMobileTab("explore");
                  }
                }}
                onSelectNeighborhood={(neighborhood) => {
                  setSelectedNeighborhood(neighborhood);
                  setSelectedExhibitionId(undefined);
                  setMobileTab("explore");
                }}
              />
            ) : null}
            {mobileTab === "explore" ? mobileExploreContent : null}
            {mobileTab === "walks" ? mobileWalkContent : null}
            {mobileTab === "saved" ? mobileSavedContent : null}
            {mobileTab === "journal" ? mobileJournalContent : null}
            {shareStatus ? (
              <View style={styles.mobileShareStatusBar}>
                <Share2 size={14} color={colors.teal} />
                <Text style={styles.shareStatusText}>{shareStatus}</Text>
              </View>
            ) : null}
          </View>
        ) : (
        <>
        <View style={styles.headerBand}>
          {isCompactLayout ? (
            <ProfessionalMobileHome
              areaLabel={selectedArea?.name ?? compactAreaName}
              dateLabel={`${formatShortDate(referenceNow)} - ${formatShortTime(referenceNow)}`}
              routeScopeLabel={routeScopeLabel}
              walkPlan={walkPlan}
              featuredExhibition={tonightPick}
              featuredVisual={tonightPickVisual}
              personalizedPick={personalizedPicks[0]}
              openingSignal={eventSignals[0]}
              lastChanceAlert={lastChanceAlerts[0]}
              neighborhoods={neighborhoodIntelligence}
              sourceTrust={sourceTrust}
              freshnessLabel={freshnessAudit.summaryLabel}
              openNowCount={openNowCount}
              closingSoonCount={closingSoonCount}
              activeWalk={activeWalkSession?.status === "active"}
              camogliFieldGuide={camogliFieldGuide}
              onFindWalk={chooseFindWalkFirstRun}
              onStartWalk={startWalk}
              onOpenRoute={() => {
                if (walkerRouteMapHandoff.routeMapUrl) {
                  void Linking.openURL(walkerRouteMapHandoff.routeMapUrl);
                }
              }}
              onForYou={() => {
                setWalkMode("for-you");
                completeBetaTask("taste-quiz");
              }}
              onResumeWalk={resumeWalk}
              onOpenFeatured={() => {
                if (tonightPick) {
                  setSelectedExhibitionId(tonightPick.id);
                }
              }}
              onSelectNeighborhood={(neighborhood) => {
                setSelectedNeighborhood(neighborhood);
                setSelectedExhibitionId(undefined);
              }}
            />
          ) : (
            <ImageBackground
              source={galleryVisualSources[heroVisual.assetKey]}
              accessibilityLabel={heroVisual.alt}
              imageStyle={styles.heroImage}
              style={styles.heroImageCard}
            >
              <View style={styles.heroImageShade} />
              <View style={styles.heroContent}>
                <View style={styles.headerTopline}>
                  <View style={styles.heroHeaderBadgeRow}>
                    <View style={styles.desktopWalkerBrand}>
                      <WalkerMark size={28} />
                      <Text style={styles.desktopWalkerWordmark}>Walker</Text>
                    </View>
                    <Text style={styles.heroEyebrow}>{getAreaRoleCopy(selectedAreaId)}</Text>
                    <Text style={styles.heroEyebrow}>{heroVisual.creditLabel}</Text>
                  </View>
                  <Text style={styles.marketClock}>
                    Demo clock {formatShortDate(referenceNow)}, {formatShortTime(referenceNow)}
                  </Text>
                </View>
                <View style={styles.heroTitleBlock}>
                  <Text style={styles.title}>
                    {heroTitle}
                  </Text>
                  <Text style={styles.subtitle}>
                    {heroSubtitle}
                  </Text>
                </View>
                <View style={styles.heroRouteCard}>
                  <View>
                    <Text style={styles.heroRouteLabel}>Suggested route</Text>
                    <Text style={styles.heroRouteTitle}>{heroRouteSummary}</Text>
                  </View>
                  <Text style={styles.heroRouteMeta}>{walkPlan.totalMinutes} min - {walkPlan.totalDistanceMiles.toFixed(1)} mi</Text>
                </View>
              </View>
            </ImageBackground>
          )}

          {showFirstRunPanel && !isCompactLayout ? (
            <FirstRunChoicePanel
              hasActiveWalk={activeWalkSession?.status === "active"}
              verifiedCount={sourceTrust.verifiedExhibitionCount}
              reviewCount={sourceTrust.fixtureExhibitionCount + sourceTrust.needsReviewExhibitionCount}
              freshnessLabel={freshnessAudit.summaryLabel}
              betaProgress={betaProgress}
              onFindWalk={chooseFindWalkFirstRun}
              onTasteQuiz={chooseTasteQuizFirstRun}
              onCamogliTest={chooseCamogliTestFirstRun}
              onResumeWalk={chooseResumeWalkFirstRun}
              onBetaTask={handleBetaTask}
              onResetDemo={resetGalleryDemoState}
              onDismiss={dismissFirstRun}
            />
          ) : null}

          {!isCompactLayout ? (
            <BetaPreviewPanel
              routeReport={routeUsabilityReport}
              learningSummary={personalizationLearningSummary}
              verifiedCount={sourceTrust.verifiedExhibitionCount}
              demoReviewCount={sourceTrust.fixtureExhibitionCount + sourceTrust.needsReviewExhibitionCount}
              routeModeLabel={galleryWalkModeLabels[walkMode]}
              activeWalkStatus={activeWalkSession?.status}
              onTryNyc={tryBetaNycWalk}
              onTryForYou={tryBetaForYou}
              onCheckHudson={checkBetaHudson}
              onSendFeedback={openBetaFeedbackComposer}
              onCopyReport={copyBetaFeedbackReport}
            />
          ) : null}

          {!isCompactLayout ? (
            <WalkerOfflineReadinessCard
              summary={walkerOfflineReadinessSummary}
              imageSummary={walkerImageSystemSummary}
            />
          ) : null}

          {!isCompactLayout ? (
            <GalleryConciergePanel
              suggestions={conciergeSuggestions}
              onSuggestion={handleConciergeSuggestion}
            />
          ) : null}

          <RouteCommandPanel
            walkPlan={walkPlan}
            walkMode={walkMode}
            routeUsabilityReport={routeUsabilityReport}
            walkReadinessReport={walkReadinessReport}
            startPointOptions={walkerStartPointOptions}
            routeVerifiedStopCount={routeVerifiedStopCount}
            routeFixtureStopCount={routeFixtureStopCount}
            startStop={startStop}
            nextStop={nextStop}
            activeWalkSession={activeWalkSession}
            activeWalkProgress={activeWalkProgress}
            activeWalkRecap={activeWalkRecap}
            activeWalkPlan={activeWalkPlan}
            activeWalkCurrentStop={activeWalkCurrentStop}
            activeWalkNextStop={activeWalkNextStop}
            activeWalkNextLeg={activeWalkNextLeg}
            activeWalkIsDraft={activeWalkIsDraft}
            activeWalkRouteMatchesCurrent={activeWalkRouteMatchesCurrent}
            onMode={setWalkMode}
            onStartWalk={startWalk}
            onResumeWalk={resumeWalk}
            onMarkCurrentVisited={() =>
              markRouteStopVisited(
                activeWalkProgress?.currentStopId,
                activeWalkCurrentStop?.exhibition.id
              )
            }
            onSkipCurrent={() =>
              skipRouteStop(activeWalkProgress?.currentStopId, activeWalkCurrentStop?.exhibition.id)
            }
            onEndWalk={endActiveWalk}
            onCopyItinerary={copyCurrentItinerary}
            onShareRoute={shareCurrentRoute}
            onSaveWalk={saveCurrentWalk}
            onStartPointMode={chooseWalkerStartPointMode}
            onDismissReadinessWarning={dismissReadinessWarning}
            walkRecapRewardCopy={walkRecapRewardCopy}
            routeMapModel={displayRouteMapModel}
            routeMapUrl={walkerRouteMapHandoff.routeMapUrl}
            shareCard={activeWalkShareCard}
            walkerShareCard={walkerCompletedShareCard}
            compact={isCompactLayout}
          />

          {shareStatus ? (
            <View style={styles.shareStatusBar}>
              <Share2 size={14} color={colors.ink} />
              <Text style={styles.shareStatusText}>{shareStatus}</Text>
            </View>
          ) : null}

          <View style={[styles.discoveryControls, isCompactLayout ? styles.compactDiscoveryControls : null]}>
            <View style={styles.areaRow}>
              {galleryAreas.map((area) => (
                <ChipButton
                  key={area.id}
                  label={area.name}
                  active={selectedAreaId === area.id}
                  onPress={() => resetMarket(area.id)}
                />
              ))}
            </View>

            <View style={styles.searchBox}>
              <Search size={18} color={colors.mutedInk} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Artist, gallery, medium, neighborhood"
                placeholderTextColor={colors.mutedInk}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.filterRow}>
              {lensOptions.map((lens) => (
                <ChipButton
                  key={lens}
                  label={lensLabels[lens]}
                  active={activeLens === lens}
                  onPress={() => setActiveLens(lens)}
                  compact
                />
              ))}
              <ChipButton
                label="Verified only"
                active={verifiedOnly}
                onPress={() => setVerifiedOnly((value) => !value)}
                compact
              />
            </View>
          </View>

          {!isCompactLayout ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tonightStatsRail}
          >
            <TonightStat label="Open now" value={openNowCount} detail={`${sourceTrust.exhibitionCount} listings`} dark />
            <TonightStat label="Verified" value={sourceTrust.verifiedExhibitionCount} detail="Official-page checked" />
            <TonightStat label="Closing soon" value={closingSoonCount} detail="Within 7 days" />
          </ScrollView>
          ) : null}

          <View style={[styles.trustBrief, isCompactLayout ? styles.compactTrustBrief : null]}>
            <Check size={16} color={colors.ink} />
            <Text style={styles.trustBriefStatus}>{freshnessAudit.summaryLabel}</Text>
            <Text style={styles.trustBriefText}>
              {freshnessAudit.verifiedRecentlyCount} recent - {freshnessAudit.verifiedAgingCount} aging - {freshnessAudit.needsReviewCount} needs review - {freshnessAudit.fixtureDemoCount} demo
            </Text>
          </View>

          {!isCompactLayout ? (
          <View style={styles.freshnessQueuePanel}>
            <View style={styles.freshnessQueueHeader}>
              <Text style={styles.guidanceTitle}>Freshness queue</Text>
              <Text style={styles.freshnessQueueMeta}>{freshnessAudit.officialLinkCount} official links - {dataAudit.sourceCount} sources</Text>
            </View>
            {freshnessAudit.needsReviewNext.slice(0, 3).map((item) => (
              <View key={item.exhibitionId} style={styles.freshnessQueueRow}>
                <View style={styles.savedWalkCopy}>
                  <Text style={styles.savedWalkTitle}>{item.galleryName}</Text>
                  <Text style={styles.savedWalkMeta}>
                    {item.neighborhood} - {item.receipt.label} - {item.receipt.evidenceLabel}
                  </Text>
                  <Text style={styles.savedWalkMeta}>
                    {item.receipt.detail}
                  </Text>
                </View>
                <Text style={styles.routePlannerFact}>{item.receipt.actionLabel}</Text>
              </View>
            ))}
            {freshnessAudit.needsReviewNext.length === 0 ? (
              <Text style={styles.savedWalkMeta}>No immediate review items for this market.</Text>
            ) : null}
          </View>
          ) : null}

          {tonightPick && !isCompactLayout ? (
            <ImageBackground
              source={galleryVisualSources[tonightPickVisual.assetKey]}
              accessibilityLabel={tonightPickVisual.alt}
              imageStyle={styles.tonightPickImage}
              style={[styles.tonightPick, isCompactLayout ? styles.compactTonightPick : null]}
            >
              <View style={styles.tonightPickShade} />
              <View style={styles.tonightPickCopy}>
                <Text style={styles.tonightPickLabel}>Start browsing here - {tonightPickVisual.creditLabel}</Text>
                <Text style={styles.tonightPickTitle}>{tonightPick.title}</Text>
                <Text style={styles.tonightPickMeta}>
                  {tonightPick.galleryName} - {tonightPick.neighborhood} - {galleryVisitStatusLabels[getGalleryVisitStatus(tonightPick, referenceNow)]}
                </Text>
              </View>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open source listing for ${tonightPick.title}`}
                onPress={() => {
                  void Linking.openURL(tonightPick.externalUrl);
                }}
                style={[styles.heroLinkButton, isCompactLayout ? styles.compactHeroLinkButton : null]}
              >
                <ExternalLink size={14} color={colors.paper} />
                <Text style={styles.heroLinkButtonText}>Official link</Text>
              </Pressable>
            </ImageBackground>
          ) : null}

          {!isCompactLayout ? (
          <PersonalizationLearningPanel summary={personalizationLearningSummary} />
          ) : null}

          {!isCompactLayout ? (
          <GalleryPassportPanel
            quizAnswers={quizAnswers}
            passport={tastePassport}
            picks={personalizedPicks}
            badges={passportBadges}
            stamps={passportStamps}
            quests={galleryQuests}
            memory={passportMemory}
            newBadgeCount={newBadgeCount}
            feedback={tasteFeedback}
            preferences={tastePreferences}
            mediumOptions={mediumOptions}
            neighborhoodOptions={galleryNeighborhoods
              .filter((neighborhood) => neighborhood.areaId === selectedAreaId)
              .map((neighborhood) => neighborhood.name)}
            activeWalkMode={walkMode}
            onQuizAnswer={answerQuizCard}
            onOpenPick={(exhibitionId) => setSelectedExhibitionId(exhibitionId)}
            onFeedback={recordTasteFeedback}
            onTogglePreferredMedium={togglePreferredMedium}
            onToggleAvoidedMedium={toggleAvoidedMedium}
            onTogglePreferredNeighborhood={togglePreferredNeighborhood}
            onTogglePreferredTag={togglePreferredTag}
            onUseForYouRoute={() => setWalkMode("for-you")}
          />
          ) : null}
          {isCompactLayout ? (
            <PersonalizationLearningPanel summary={personalizationLearningSummary} />
          ) : null}
          {isCompactLayout ? (
            <GalleryConciergePanel
              suggestions={conciergeSuggestions}
              onSuggestion={handleConciergeSuggestion}
            />
          ) : null}
          <BetaFeedbackPanel
            selectedKind={betaFeedbackKind}
            note={betaFeedbackNote}
            feedbackCount={betaFeedback.length}
            contextChips={betaFeedbackContextChips}
            routeWarningCount={walkReadinessReport.warnings.length}
            onKind={setBetaFeedbackKind}
            onNote={setBetaFeedbackNote}
            onSubmit={saveBetaFeedback}
            onCopy={copyBetaFeedbackReport}
            onEmail={emailBetaFeedbackReport}
            onResetDemo={resetGalleryDemoState}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Neighborhood Intelligence</Text>
            <Text style={styles.sectionSubtitle}>
              {walkReadyCount} clusters can support a walk today
              {selectedNeighborhood ? ` - planning ${selectedNeighborhood}` : ""}
            </Text>
          </View>
          <SlidersHorizontal size={19} color={colors.ink} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          <Pressable
            onPress={() => {
              setSelectedNeighborhood(undefined);
              setSelectedExhibitionId(undefined);
            }}
            style={[styles.neighborhoodCard, !selectedNeighborhood ? styles.selectedNeighborhoodCard : null]}
          >
            {!selectedNeighborhood ? <Text style={styles.selectedMiniLabel}>Active view</Text> : null}
            <Text style={[styles.neighborhoodName, !selectedNeighborhood ? styles.selectedNeighborhoodText : null]}>All clusters</Text>
            <View style={styles.neighborhoodStatRow}>
              <Text style={[styles.neighborhoodMeta, !selectedNeighborhood ? styles.selectedNeighborhoodSubtext : null]}>{sourceTrust.verifiedExhibitionCount} verified</Text>
              <Text style={[styles.neighborhoodMeta, !selectedNeighborhood ? styles.selectedNeighborhoodSubtext : null]}>{openNowCount} open</Text>
            </View>
            <Text style={[styles.neighborhoodReason, !selectedNeighborhood ? styles.selectedNeighborhoodSubtext : null]}>{marketReadinessCopy}</Text>
          </Pressable>
          {neighborhoodIntelligence.map((item) => (
            (() => {
              const selected = selectedNeighborhood === item.neighborhood;
              return (
            <Pressable
              key={item.neighborhood}
              onPress={() => {
                setSelectedNeighborhood(item.neighborhood);
                setSelectedExhibitionId(undefined);
              }}
              style={[
                styles.neighborhoodCard,
                selected ? styles.selectedNeighborhoodCard : null
              ]}
            >
              {selected ? (
                <Text style={styles.selectedMiniLabel}>Planning here</Text>
              ) : null}
              <Text style={[styles.neighborhoodName, selected ? styles.selectedNeighborhoodText : null]}>{item.neighborhood}</Text>
              <View style={styles.neighborhoodStatRow}>
                <Text style={[styles.neighborhoodMeta, selected ? styles.selectedNeighborhoodSubtext : null]}>{item.verifiedCount} verified</Text>
                <Text style={[styles.neighborhoodMeta, selected ? styles.selectedNeighborhoodSubtext : null]}>{item.openNowCount} open</Text>
              </View>
              <Text style={[styles.neighborhoodTrustMeta, selected ? styles.selectedNeighborhoodSubtext : null]}>
                {item.fixtureCount + item.needsReviewCount} demo/review - {item.uniqueGalleryCount} galleries
              </Text>
              <View style={styles.neighborhoodFooter}>
                <Text style={[styles.neighborhoodFooterText, selected ? styles.selectedNeighborhoodSubtext : null]}>
                  {getNeighborhoodReadinessCopy(item)}
                </Text>
              </View>
            </Pressable>
              );
            })()
          ))}
        </ScrollView>

        <View style={styles.filterBlock}>
          <View style={styles.activeFilterBar}>
            <Text style={styles.activeFilterText}>
              Showing {activeFilterCopy || "all shows"} in {selectedNeighborhood ?? selectedArea?.name ?? "this market"}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediumRow}>
            <ChipButton
              label="All media"
              active={!selectedMedium}
              onPress={() => setSelectedMedium(undefined)}
              compact
            />
            {mediumOptions.map((medium) => (
              <ChipButton
                key={medium}
                label={mediumLabels[medium]}
                active={selectedMedium === medium}
                onPress={() => setSelectedMedium(medium)}
                compact
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.walkBand}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Map Walk Planner</Text>
              <Text style={styles.sectionSubtitle}>
                {selectedNeighborhood ?? displayWalkPlan.neighborhood} - {galleryWalkModeLabels[displayWalkPlan.mode]}
              </Text>
            </View>
            <Route size={21} color={colors.teal} />
          </View>
          <View style={styles.routeCommand}>
            <View style={styles.routeCommandCopy}>
              <Text style={styles.routeCommandKicker}>Recommended walk</Text>
              <Text style={styles.routeCommandTitle}>{displayWalkPlan.summary}</Text>
              <View style={styles.routeStartRow}>
                <Text style={styles.routeStartPill}>Start {displayStartStop?.exhibition.galleryName ?? "where open"}</Text>
                <Text style={styles.routeStartPill}>Next {plannerNextStop?.exhibition.galleryName ?? "best nearby stop"}</Text>
              </View>
              <Text style={styles.routeCommandMeta}>{displayWalkPlan.guidance}</Text>
            </View>
            <View style={styles.routeQualityStack}>
              <Text style={styles.routeQualityLabel}>{displayRouteMapModel.confidence.score}</Text>
              <Text style={styles.routeQualityMeta}>
                {displayRouteMapModel.confidence.label}
              </Text>
            </View>
          </View>
          {activeWalkSession?.status === "active" ? (
            <View style={styles.routePlannerModeBlock}>
              <Text style={styles.routePlannerModeHint}>
                Switch modes here to preview a draft route without changing your active walk.
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.routeModeRail}
              >
                {walkModeOptions.map((mode) => (
                  <RouteModeButton
                    key={mode}
                    label={galleryWalkModeLabels[mode]}
                    detail={walkModeDetails[mode]}
                    active={walkMode === mode}
                    onPress={() => setWalkMode(mode)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
          <View style={styles.routePlannerFacts}>
            <Text style={styles.routePlannerFact}>{displayWalkPlan.stops.length} stops</Text>
            <Text style={styles.routePlannerFact}>{displayWalkPlan.totalMinutes} min</Text>
            <Text style={styles.routePlannerFact}>{displayWalkPlan.totalDistanceMiles.toFixed(1)} mi</Text>
            <Text style={styles.routePlannerFact}>{displayWalkPlan.savedStopCount} saved</Text>
            <Text style={styles.routePlannerFact}>{freshnessAudit.officialLinkCount} official links</Text>
          </View>
          <View style={styles.routeGuidance}>
            <Text style={styles.guidanceTitle}>Why this route works</Text>
            <Text style={styles.routeConfidenceText}>
              {displayRouteMapModel.confidence.bestStartLabel}
            </Text>
            <Text style={styles.guidanceCopy}>
              {displayRouteMapModel.confidence.routeAdvice.join(" ")}
            </Text>
            <View style={styles.routeReasonRow}>
              {displayWalkPlan.selectionReasons.slice(0, 4).map((reason) => (
                <Text key={reason} style={styles.routeReasonPill}>{reason}</Text>
              ))}
            </View>
            {walkerRouteMapHandoff.routeMapUrl ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open full ${displayWalkPlan.neighborhood} walking route in maps`}
                onPress={() => {
                  if (walkerRouteMapHandoff.routeMapUrl) {
                    void Linking.openURL(walkerRouteMapHandoff.routeMapUrl);
                  }
                }}
                style={styles.routeMapButton}
              >
                <ExternalLink size={14} color={colors.paper} />
                <Text style={styles.routeMapButtonText}>Open full route</Text>
              </Pressable>
            ) : null}
          </View>
          {savedWalks.length > 0 ? (
            <View style={styles.savedWalksPanel}>
              <Text style={styles.guidanceTitle}>Saved walks</Text>
              {savedWalks.slice(0, 3).map((savedWalk) => (
                <View key={savedWalk.id} style={styles.savedWalkRow}>
                  <View style={styles.savedWalkCopy}>
                    <Text style={styles.savedWalkTitle}>{savedWalk.title}</Text>
                    <Text style={styles.savedWalkMeta}>{savedWalk.summary}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Copy saved walk ${savedWalk.title}`}
                    onPress={() => {
                      void writeTextToClipboard(savedWalk.itineraryText).then((copied) => {
                        setShareStatus(copied ? "Saved itinerary copied." : "Saved itinerary ready.");
                      });
                    }}
                    style={styles.secondaryRouteButton}
                  >
                    <Copy size={13} color={colors.ink} />
                    <Text style={styles.secondaryRouteButtonText}>Copy</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <RoutePreview
            routeMapModel={displayRouteMapModel}
            routeMapHandoff={walkerRouteMapHandoff}
            highlightedStopId={highlightedRouteStopId}
            focusedSwapCandidates={focusedRouteSwapCandidates}
            onHighlightStop={setHighlightedRouteStopId}
            onSwapFocusedStop={(replacementId) => {
              if (focusedRouteStopId) {
                replaceRouteStop(focusedRouteStopId, replacementId);
              }
            }}
          />
          <View style={styles.walkStops}>
            {displayWalkPlan.stops.length === 0 ? (
              <View style={styles.emptyRouteState}>
                <Text style={styles.emptyRouteText}>
                  No walk-ready route yet. Try another nearby cluster or switch route mode.
                </Text>
              </View>
            ) : (
              displayWalkPlan.stops.map((stop, index) => (
                <WalkStopRow
                  key={stop.exhibition.id}
                  stop={stop}
                  leg={index > 0 ? displayWalkPlan.legs[index - 1] : undefined}
                  isStart={displayWalkPlan.startStopId === stop.exhibition.id}
                  isNext={displayWalkPlan.nextStopId === stop.exhibition.id}
                  isLast={index === displayWalkPlan.stops.length - 1}
                  progress={routeStopProgressById?.[stop.exhibition.id]}
                  freshnessLabel={getGalleryFreshnessState(stop.exhibition, referenceNow).label}
                  advisory={displayRouteAdvisoryById.get(stop.exhibition.id)}
                  highlighted={highlightedRouteStopId === stop.exhibition.id}
                  swapCandidates={swapCandidatesByStopId.get(stop.exhibition.id) ?? []}
                  onHighlight={() => setHighlightedRouteStopId(stop.exhibition.id)}
                  onSwapStop={(replacementId) => replaceRouteStop(stop.exhibition.id, replacementId)}
                />
              ))
            )}
          </View>
        </View>

        <View style={styles.splitSection}>
          <View style={styles.infoPanel}>
            <Text style={styles.sectionTitle}>Opening Night Radar</Text>
            <Text style={styles.sectionSubtitle}>Timed openings, RSVP cues, last looks, and route fit.</Text>
            <View style={styles.filterRow}>
              {eventRouteIntentOptions.map((intent) => (
                <ChipButton
                  key={intent}
                  label={eventRouteIntentLabels[intent]}
                  active={eventRouteIntent === intent}
                  compact
                  onPress={() => setEventRouteIntent(intent)}
                />
              ))}
            </View>
            <View style={styles.eventPlanCard}>
              <Text style={styles.eventPlanTitle}>{eventConciergePlan.summary}</Text>
              <Text style={styles.eventPlanMeta}>
                {eventConciergePlan.stops.length} stops - {eventConciergePlan.totalMinutes} min - {eventConciergePlan.readinessCopy}
              </Text>
            </View>
            {eventSignals.slice(0, 4).map((signal) => (
              <OpeningRadarItem key={signal.id} signal={signal} />
            ))}
            {eventSignals.length === 0 ? (
              <Text style={styles.emptyText}>No timed gallery signals in this filter. The app will fall back to verified exhibitions on view.</Text>
            ) : null}
          </View>

          <View style={styles.infoPanel}>
            <Text style={styles.sectionTitle}>Last-Chance Alerts</Text>
            <Text style={styles.sectionSubtitle}>
              {alertSignalCount} saved alert signals - closing within {alertWindowDays} days.
            </Text>
            <View style={styles.filterRow}>
              {alertWindowOptions.map((days) => (
                <ChipButton
                  key={days}
                  label={`${days} days`}
                  active={alertWindowDays === days}
                  compact
                  onPress={() => setAlertWindowDays(days)}
                />
              ))}
            </View>
            {lastChanceAlerts.slice(0, 5).map((alert) => (
              <View key={alert.exhibition.id} style={styles.alertRow}>
                <Text style={styles.alertTitle}>{alert.exhibition.title}</Text>
                <Text style={styles.alertMeta}>
                  {alert.daysUntilClose} days - {alert.matchedSignals.join(", ")}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>{visibleExhibitions.length} Gallery Shows</Text>
            <Text style={styles.sectionSubtitle}>Tap details for source trust, why-go notes, maps, and your art log.</Text>
          </View>
          <MapPin size={20} color={colors.ink} />
        </View>

        {selectedExhibition ? (
          <View style={styles.detailSheetWrap}>
            <ExhibitionDetailSheet
              exhibition={selectedExhibition}
              allExhibitions={galleryExhibitions}
              savedIds={savedIds}
              logEntry={logEntryById.get(selectedExhibition.id)}
              routeProgress={selectedActiveWalkProgress}
              routeAdvisory={selectedRouteAdvisory}
              routeConfidenceLabel={displayRouteMapModel.confidence.label}
              isInDisplayedRoute={selectedIsInDisplayedRoute}
              hasActiveWalk={activeWalkSession?.status === "active"}
              displayRouteStop={selectedDisplayRouteStop}
              swapTargetStop={detailSwapTargetStop}
              swapCandidates={selectedRouteSwapCandidates}
              conciergeReasons={selectedConciergeReasons}
              feedback={feedbackByExhibitionId.get(selectedExhibition.id)}
              onStatus={(status) => setLogStatus(selectedExhibition.id, status)}
              onNote={(note) => setLogNote(selectedExhibition.id, note)}
              onMarkRouteVisited={() =>
                markRouteStopVisited(selectedActiveWalkStop?.exhibition.id, selectedExhibition.id)
              }
              onSkipRouteStop={() =>
                skipRouteStop(selectedActiveWalkStop?.exhibition.id, selectedExhibition.id)
              }
              onSwapRouteStop={replaceRouteStop}
              onSwapSelectedIntoRoute={(targetStopId) =>
                replaceRouteStop(targetStopId, selectedExhibition.id)
              }
              onFeedback={(kind) => recordTasteFeedback(selectedExhibition.id, kind)}
              onStartRouteFromHere={() => startRouteFromExhibition(selectedExhibition)}
              onAddToActiveWalk={() => addExhibitionToActiveWalk(selectedExhibition)}
              onShare={() => {
                void shareExhibition(selectedExhibition);
              }}
              onClose={() => setSelectedExhibitionId(undefined)}
            />
          </View>
        ) : null}

        <View style={styles.exhibitionList}>
          {visibleExhibitions.map((exhibition) => (
            <ExhibitionCard
              key={exhibition.id}
              exhibition={exhibition}
              allExhibitions={galleryExhibitions}
              savedIds={savedIds}
              logEntry={logEntryById.get(exhibition.id)}
              onStatus={(status) => setLogStatus(exhibition.id, status)}
              onNote={(note) => setLogNote(exhibition.id, note)}
              savedAlertArtists={savedAlertArtists}
              savedAlertGalleries={savedAlertGalleries}
              savedAlertNeighborhoods={savedAlertNeighborhoods}
              savedAlertMediums={savedAlertMediums}
              onToggleAlertArtist={(artist) =>
                setSavedAlertArtists((values) => toggleStringValue(values, artist))
              }
              onToggleAlertGallery={(gallery) =>
                setSavedAlertGalleries((values) => toggleStringValue(values, gallery))
              }
              onToggleAlertNeighborhood={(neighborhood) =>
                setSavedAlertNeighborhoods((values) => toggleStringValue(values, neighborhood))
              }
              onToggleAlertMedium={(medium) =>
                setSavedAlertMediums((values) => toggleMediumValue(values, medium))
              }
              onOpenDetails={() => setSelectedExhibitionId(exhibition.id)}
            />
          ))}
        </View>
        </>
        )}
      </ScrollView>
      {isCompactLayout ? (
        <WalkerBottomNav
          activeTab={mobileTab}
          activeWalk={activeWalkSession?.status === "active"}
          onTab={(tab) => {
            setMobileTab(tab);
            if (tab === "explore") {
              setActiveLens("all");
            }
            if (tab === "walks") {
              setSelectedExhibitionId(undefined);
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.fog
  },
  content: {
    paddingBottom: 112
  },
  mobileShellContent: {
    paddingBottom: 118
  },
  mobileAppShell: {
    backgroundColor: colors.fog,
    gap: spacing.lg,
    minHeight: "100%"
  },
  mobileTabShell: {
    backgroundColor: colors.fog,
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  activeJourneyMobileShell: {
    backgroundColor: colors.teal,
    gap: spacing.lg,
    minHeight: "100%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  activeJourneyScreen: {
    backgroundColor: colors.teal,
    gap: spacing.md,
    minHeight: 760,
    paddingBottom: spacing.xl
  },
  activeJourneyHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  activeJourneyKicker: {
    color: "rgba(250, 246, 239, 0.76)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    lineHeight: 15,
    textTransform: "uppercase"
  },
  activeJourneyTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 31,
    fontWeight: "700",
    lineHeight: 37,
    marginTop: spacing.xs
  },
  activeJourneyMeta: {
    color: "rgba(250, 246, 239, 0.78)",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19,
    marginTop: spacing.xs
  },
  activeJourneyMeter: {
    alignItems: "center",
    backgroundColor: "rgba(250, 246, 239, 0.95)",
    borderRadius: radii.lg,
    minWidth: 76,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  activeJourneyMeterValue: {
    color: colors.teal,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24
  },
  activeJourneyMeterLabel: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  activeJourneyNotice: {
    backgroundColor: "rgba(250, 246, 239, 0.1)",
    borderColor: "rgba(200, 161, 90, 0.36)",
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md
  },
  activeJourneyNoticeLabel: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  activeJourneyNoticeTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 26,
    marginTop: spacing.xs
  },
  activeJourneyDots: {
    flexDirection: "row",
    gap: spacing.xs
  },
  activeJourneyDot: {
    alignItems: "center",
    backgroundColor: "rgba(250, 246, 239, 0.16)",
    borderRadius: radii.pill,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  currentActiveJourneyDot: {
    backgroundColor: colors.gold
  },
  visitedActiveJourneyDot: {
    backgroundColor: colors.paper
  },
  skippedActiveJourneyDot: {
    backgroundColor: "rgba(250, 246, 239, 0.36)"
  },
  activeJourneyDotText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: "800"
  },
  activeJourneyStickyActions: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.sm,
    ...shadows.card
  },
  activeJourneyPrimaryButton: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 46,
    minWidth: 160,
    paddingHorizontal: spacing.md
  },
  activeJourneyPrimaryText: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: "800"
  },
  activeJourneySecondaryButton: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  activeJourneySecondaryText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "800"
  },
  activeJourneySharePreview: {
    backgroundColor: "rgba(250, 246, 239, 0.1)",
    borderColor: "rgba(200, 161, 90, 0.32)",
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md
  },
  activeJourneyShareTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 18,
    fontWeight: "700"
  },
  activeJourneyShareMeta: {
    color: "rgba(250, 246, 239, 0.78)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.xs
  },
  arrivalScreen: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    gap: spacing.md,
    overflow: "hidden",
    paddingBottom: spacing.md
  },
  arrivalHero: {
    minHeight: 300,
    justifyContent: "space-between",
    padding: spacing.md
  },
  arrivalImage: {
    resizeMode: "cover"
  },
  arrivalTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  arrivalBadge: {
    backgroundColor: "rgba(250, 246, 239, 0.92)",
    borderRadius: radii.pill,
    color: colors.teal,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  arrivalHeroCopy: {
    gap: spacing.xs
  },
  arrivalGallery: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 29,
    fontWeight: "700",
    lineHeight: 35
  },
  arrivalTitle: {
    color: "rgba(250, 246, 239, 0.86)",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 19
  },
  arrivalPromptCard: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    padding: spacing.md
  },
  arrivalPromptKicker: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  arrivalPromptBody: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21
  },
  arrivalPromptSignal: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "800"
  },
  arrivalActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.md
  },
  reactionScreen: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    gap: spacing.md,
    padding: spacing.md
  },
  reactionHeader: {
    gap: spacing.xs
  },
  reactionKicker: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  reactionTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 25,
    fontWeight: "700",
    lineHeight: 30
  },
  reactionMeta: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18
  },
  reactionChipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  reactionChip: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  selectedReactionChip: {
    backgroundColor: colors.teal,
    borderColor: colors.teal
  },
  reactionChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  selectedReactionChipText: {
    color: colors.paper
  },
  reactionSaveRow: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  reactionSaveLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  reactionSaveSwitch: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "800"
  },
  reactionNoteInput: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "500",
    minHeight: 110,
    padding: spacing.md,
    textAlignVertical: "top"
  },
  walkerPrimaryAction: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.lg
  },
  walkerPrimaryActionText: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: "800"
  },
  walkerSecondaryAction: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  walkerSecondaryActionText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "800"
  },
  mobileScreenHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 48
  },
  mobileHeaderIconButton: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  mobileSearchPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card
  },
  mobileListPanel: {
    gap: spacing.sm
  },
  walkerExploreRow: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 96,
    padding: spacing.sm,
    ...shadows.card
  },
  walkerExploreThumb: {
    height: 72,
    justifyContent: "flex-start",
    overflow: "hidden",
    padding: spacing.xs,
    width: 72
  },
  walkerExploreThumbImage: {
    borderRadius: 12,
    resizeMode: "cover"
  },
  walkerExploreThumbShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(13, 59, 46, 0.12)"
  },
  walkerExploreDistance: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(250, 246, 239, 0.92)",
    borderRadius: radii.pill,
    color: colors.teal,
    fontFamily: walkerType.uiFamily,
    fontSize: 9,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2
  },
  walkerExploreCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  walkerExploreTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  walkerExploreTitle: {
    color: colors.ink,
    flex: 1,
    fontFamily: walkerType.displayFamily,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
    minWidth: 0
  },
  walkerExploreSubtitle: {
    color: colors.ink,
    fontFamily: walkerType.uiFamily,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16
  },
  walkerExploreMeta: {
    color: colors.mutedInk,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15
  },
  walkerExploreBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  walkerExploreBadge: {
    backgroundColor: colors.fog,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.teal,
    fontFamily: walkerType.uiFamily,
    fontSize: 9,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    textTransform: "uppercase"
  },
  mobileDetailWrap: {
    marginHorizontal: -spacing.md
  },
  mobileShareStatusBar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerBand: {
    backgroundColor: colors.fog,
    paddingBottom: spacing.xl,
    gap: spacing.md
  },
  mobileHomeShell: {
    backgroundColor: colors.fog,
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  mobileTopBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 44
  },
  walkerTopBrand: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: spacing.sm,
    minWidth: 0
  },
  walkerWordmark: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 29,
    textTransform: "uppercase"
  },
  mobileLocationLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  },
  mobileDateLabel: {
    color: colors.mutedInk,
    fontFamily: walkerType.uiFamily,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 1
  },
  mobileVerifiedBadge: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm
  },
  mobileVerifiedBadgeText: {
    color: colors.paper,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "800"
  },
  mobileFeatureCard: {
    borderColor: "rgba(200, 161, 90, 0.35)",
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 314,
    overflow: "hidden",
    ...shadows.card
  },
  mobileFeatureImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  mobileFeatureShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(13, 59, 46, 0.36)"
  },
  mobileFeatureContent: {
    flex: 1,
    justifyContent: "space-between",
    minWidth: 0,
    padding: spacing.md
  },
  mobileFeatureTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    minWidth: 0,
    width: "100%"
  },
  mobileFeaturePill: {
    backgroundColor: "rgba(250, 246, 239, 0.94)",
    borderRadius: radii.pill,
    color: colors.teal,
    flexShrink: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 10,
    fontWeight: "800",
    maxWidth: "100%",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  mobileFeatureCopy: {
    minWidth: 0,
    width: "100%"
  },
  mobileFeatureTitle: {
    color: colors.paper,
    flexShrink: 1,
    fontFamily: walkerType.displayFamily,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 38,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  mobileFeatureSubtitle: {
    color: "#FAF6EF",
    flexShrink: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: spacing.sm,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%"
  },
  mobileFeatureActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    minWidth: 0,
    width: "100%"
  },
  mobilePrimaryCta: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    maxWidth: "100%",
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: spacing.md
  },
  mobilePrimaryCtaText: {
    color: colors.paper,
    flexShrink: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 14,
    fontWeight: "800",
    minWidth: 0
  },
  mobileSecondaryCta: {
    alignItems: "center",
    backgroundColor: "rgba(250, 246, 239, 0.9)",
    borderColor: "rgba(200, 161, 90, 0.48)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  mobileSecondaryCtaText: {
    color: colors.teal,
    flexShrink: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 13,
    fontWeight: "800",
    minWidth: 0
  },
  mobileTrustStrip: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    padding: spacing.sm
  },
  mobileTrustItem: {
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    color: colors.teal,
    flexGrow: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: "center"
  },
  camogliFieldCard: {
    backgroundColor: colors.paper,
    borderColor: "rgba(200, 161, 90, 0.36)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card
  },
  compactCamogliFieldCard: {
    gap: spacing.sm,
    padding: spacing.sm
  },
  camogliFieldHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  camogliFieldBadge: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    lineHeight: 14,
    textTransform: "uppercase"
  },
  camogliFieldTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 26
  },
  camogliFieldTime: {
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  camogliFieldCopy: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18
  },
  camogliFieldStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  camogliFieldStat: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexGrow: 1,
    gap: 2,
    minWidth: 130,
    padding: spacing.sm
  },
  camogliFieldStatLabel: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  camogliFieldStatValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  camogliFieldModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  camogliFieldModeChip: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  selectedCamogliFieldModeChip: {
    backgroundColor: colors.teal,
    borderColor: colors.teal
  },
  camogliFieldModeText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800"
  },
  selectedCamogliFieldModeText: {
    color: colors.paper
  },
  camogliStopList: {
    gap: spacing.sm
  },
  camogliStopLabel: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: 2,
    paddingTop: spacing.sm
  },
  camogliStopPrimary: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "800"
  },
  camogliStopSecondary: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  camogliStopWarning: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16
  },
  walkerReadinessCard: {
    backgroundColor: colors.fog,
    borderColor: "rgba(13, 59, 46, 0.1)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  compactWalkerReadinessCard: {
    padding: spacing.sm
  },
  walkerReadinessHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  walkerReadinessTitleBlock: {
    flex: 1,
    minWidth: 190
  },
  walkerReadinessBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.1)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.teal,
    fontFamily: walkerType.uiFamily,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  walkerReadinessReady: {
    backgroundColor: "rgba(39, 125, 87, 0.12)",
    borderColor: "rgba(39, 125, 87, 0.25)",
    color: colors.success
  },
  walkerReadinessWatch: {
    backgroundColor: "rgba(200, 161, 90, 0.15)",
    borderColor: "rgba(200, 161, 90, 0.32)",
    color: colors.gold
  },
  walkerReadinessThin: {
    backgroundColor: "rgba(214, 69, 69, 0.1)",
    borderColor: "rgba(214, 69, 69, 0.22)",
    color: colors.coral
  },
  walkerReadinessTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 29,
    marginTop: spacing.xs
  },
  walkerReadinessSummary: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: spacing.xs
  },
  walkerReadinessClock: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.sm
  },
  walkerReadinessClockText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900"
  },
  walkerStartPointCard: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 2,
    padding: spacing.md
  },
  walkerStartPointLabel: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  walkerStartPointTitle: {
    color: colors.ink,
    fontFamily: walkerType.displayFamily,
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 24
  },
  walkerStartPointDetail: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  walkerStartPointRail: {
    gap: spacing.sm,
    paddingRight: spacing.md
  },
  walkerStartPointChip: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 3,
    minHeight: 76,
    padding: spacing.sm,
    width: 156
  },
  selectedWalkerStartPointChip: {
    backgroundColor: colors.teal,
    borderColor: colors.teal
  },
  disabledWalkerStartPointChip: {
    opacity: 0.45
  },
  walkerStartPointChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  selectedWalkerStartPointChipText: {
    color: colors.paper
  },
  walkerStartPointChipDetail: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14
  },
  walkerReadinessChecklist: {
    gap: spacing.sm
  },
  walkerReadinessItem: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  },
  walkerReadinessDot: {
    borderRadius: radii.pill,
    height: 10,
    marginTop: 4,
    width: 10
  },
  walkerReadinessDotReady: {
    backgroundColor: colors.success
  },
  walkerReadinessDotWatch: {
    backgroundColor: colors.gold
  },
  walkerReadinessDotBlocked: {
    backgroundColor: colors.coral
  },
  walkerReadinessItemCopy: {
    flex: 1,
    minWidth: 0
  },
  walkerReadinessItemLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  walkerReadinessItemDetail: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 1
  },
  walkerReadinessWarningRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  walkerReadinessWarning: {
    alignItems: "center",
    backgroundColor: "rgba(200, 161, 90, 0.1)",
    borderColor: "rgba(200, 161, 90, 0.26)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  walkerReadinessWarningText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "900"
  },
  walkerFieldShortcutCard: {
    backgroundColor: colors.paper,
    borderColor: "rgba(200, 161, 90, 0.32)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    ...shadows.card
  },
  walkerFieldShortcutHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  walkerFieldShortcutTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27,
    marginTop: spacing.xs
  },
  walkerFieldShortcutSubtitle: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19
  },
  walkerFieldShortcutList: {
    gap: spacing.sm
  },
  walkerFieldShortcutRow: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  walkerFieldShortcutCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  walkerFieldShortcutLabel: {
    color: colors.ink,
    fontFamily: walkerType.displayFamily,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22
  },
  walkerFieldShortcutDetail: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
  },
  walkerFieldShortcutWarning: {
    color: colors.coral,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2
  },
  walkerFieldShortcutArea: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.teal,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: "center"
  },
  walkerOfflineCard: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    ...shadows.card
  },
  walkerOfflineTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27,
    marginTop: spacing.xs
  },
  walkerOfflineState: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  walkerOfflineDetail: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20
  },
  walkerImageSummaryBlock: {
    backgroundColor: colors.fog,
    borderColor: "rgba(200, 161, 90, 0.28)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  walkerImageSummaryHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  walkerImageSummaryProvenance: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  walkerOfflineGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  walkerOfflineColumn: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minWidth: 240,
    padding: spacing.md
  },
  walkerOfflineColumnTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  walkerOfflineBullet: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18
  },
  mobileFeaturedShow: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  mobileFeaturedShowCopy: {
    flex: 1,
    minWidth: 0
  },
  mobileFeedLabel: {
    color: colors.gold,
    fontFamily: walkerType.uiFamily,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  mobileFeaturedShowTitle: {
    color: colors.ink,
    fontFamily: walkerType.displayFamily,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.xs
  },
  mobileFeaturedShowMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  mobileFeaturedShowAction: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  mobileTonightFeed: {
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  mobileSectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  mobileSectionTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 21,
    fontWeight: "700"
  },
  mobileSectionMeta: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800"
  },
  mobileFeedRow: {
    alignItems: "center",
    borderTopColor: "rgba(13, 59, 46, 0.08)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  mobileFeedCopy: {
    flex: 1,
    minWidth: 0
  },
  mobileFeedTitle: {
    color: colors.ink,
    fontFamily: walkerType.uiFamily,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: spacing.xs
  },
  mobileFeedDetail: {
    color: colors.mutedInk,
    fontFamily: walkerType.uiFamily,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 2
  },
  mobileFeedMeta: {
    color: colors.ink,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    marginTop: 2
  },
  mobileFeedAction: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.teal,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  mobileNeighborhoodRail: {
    gap: spacing.sm,
    paddingBottom: spacing.xs
  },
  mobileNeighborhoodChip: {
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 66,
    padding: spacing.sm,
    width: 148
  },
  activeMobileNeighborhoodChip: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal
  },
  mobileNeighborhoodName: {
    color: colors.teal,
    fontFamily: walkerType.uiFamily,
    fontSize: 13,
    fontWeight: "800"
  },
  mobileNeighborhoodMeta: {
    color: colors.mutedInk,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    marginTop: spacing.xs
  },
  mobileMemoryShell: {
    backgroundColor: colors.fog,
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  mobileMemoryHero: {
    backgroundColor: colors.teal,
    borderColor: "rgba(200, 161, 90, 0.38)",
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card
  },
  mobileMemoryTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 35
  },
  mobileMemoryWordmark: {
    color: colors.paper
  },
  mobileMemoryDateLabel: {
    color: "#EFE6E1"
  },
  mobileMemoryCopy: {
    color: "#EFE6E1",
    fontFamily: walkerType.uiFamily,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  },
  mobileMemoryStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  mobileMemoryStat: {
    backgroundColor: "rgba(255, 253, 247, 0.12)",
    borderColor: "rgba(255, 253, 247, 0.22)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.paper,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  mobileCollectionPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.card
  },
  mobileMemoryTabStrip: {
    gap: spacing.sm,
    paddingBottom: spacing.xs
  },
  mobileMemoryTab: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.1)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md
  },
  activeMobileMemoryTab: {
    backgroundColor: colors.teal,
    borderColor: colors.teal
  },
  mobileMemoryTabLabel: {
    color: colors.ink,
    fontFamily: walkerType.uiFamily,
    fontSize: 12,
    fontWeight: "800"
  },
  mobileMemoryTabCount: {
    color: colors.mutedInk,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "800"
  },
  activeMobileMemoryTabLabel: {
    color: colors.paper
  },
  mobileSavedRow: {
    alignItems: "center",
    borderTopColor: "rgba(13, 59, 46, 0.08)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  mobileSavedThumb: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  mobileFeedActionButton: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  mobileJournalRow: {
    alignItems: "flex-start",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  mobileTimelineDot: {
    backgroundColor: colors.teal,
    borderColor: colors.gold,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 14,
    marginTop: spacing.xs,
    width: 14
  },
  mobileRecapCard: {
    backgroundColor: colors.teal,
    borderColor: colors.gold,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  mobileRecapTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34
  },
  heroImageCard: {
    minHeight: 372,
    overflow: "hidden"
  },
  heroImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover"
  },
  heroImageShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(13, 59, 46, 0.38)"
  },
  heroContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg
  },
  headerTopline: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md
  },
  heroHeaderBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  desktopWalkerBrand: {
    alignItems: "center",
    backgroundColor: "rgba(250, 246, 239, 0.92)",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  desktopWalkerWordmark: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  compactHeaderTopline: {
    alignItems: "flex-start",
    justifyContent: "flex-start"
  },
  heroEyebrow: {
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  eyebrow: {
    color: colors.coralDark,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  marketClock: {
    color: "#F0ECE4",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right"
  },
  compactMarketClock: {
    textAlign: "left",
    width: "100%"
  },
  heroTitleRow: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  heroTitleBlock: {
    flex: 1,
    justifyContent: "flex-end",
    maxWidth: 760,
    minWidth: 0,
    paddingTop: spacing.xxl
  },
  title: {
    color: colors.paper,
    flexShrink: 1,
    fontFamily: walkerType.displayFamily,
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 48,
    maxWidth: "100%"
  },
  compactTitle: {
    fontSize: 24,
    lineHeight: 29
  },
  subtitle: {
    color: "#F0ECE4",
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: "100%"
  },
  heroRouteCard: {
    alignItems: "flex-end",
    backgroundColor: "rgba(13, 59, 46, 0.82)",
    borderColor: "rgba(200, 161, 90, 0.34)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md
  },
  compactHeroRouteCard: {
    alignItems: "flex-start",
    flexDirection: "column",
    minWidth: 0
  },
  heroRouteLabel: {
    color: "#D9D2C6",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  heroRouteTitle: {
    color: colors.paper,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: "100%"
  },
  compactHeroRouteTitle: {
    fontSize: 15,
    lineHeight: 20
  },
  heroRouteMeta: {
    color: "#F0ECE4",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: spacing.xs,
    maxWidth: "100%"
  },
  compactHeroRouteMeta: {
    fontSize: 12,
    lineHeight: 17
  },
  areaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: "transparent",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  compactChip: {
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  activeChip: {
    backgroundColor: colors.teal,
    borderColor: colors.teal
  },
  chipText: {
    color: colors.ink,
    fontFamily: walkerType.uiFamily,
    fontSize: 13,
    fontWeight: "800"
  },
  activeChipText: {
    color: colors.paper
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 15,
    fontWeight: "600",
    minWidth: 0
  },
  tonightBrief: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  discoveryControls: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  compactDiscoveryControls: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    padding: spacing.md
  },
  tonightStatsRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  tonightStat: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    minWidth: 118,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  darkTonightStat: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  tonightStatValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800"
  },
  tonightStatLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase"
  },
  tonightStatDetail: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  },
  darkTonightStatText: {
    color: colors.paper
  },
  darkTonightStatDetail: {
    color: "#D9D2C6"
  },
  trustBrief: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radii.md,
    borderWidth: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  compactTrustBrief: {
    alignItems: "flex-start",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "column",
    marginHorizontal: spacing.md,
    padding: spacing.md
  },
  trustBriefStatus: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  trustBriefText: {
    color: colors.mutedInk,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: spacing.xs
  },
  freshnessQueuePanel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md
  },
  freshnessQueueHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  freshnessQueueMeta: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800"
  },
  freshnessQueueRow: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  tonightPick: {
    alignItems: "flex-end",
    borderRadius: radii.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    minHeight: 166,
    overflow: "hidden",
    padding: spacing.md
  },
  compactTonightPick: {
    alignItems: "flex-start",
    flexDirection: "column",
    justifyContent: "flex-end"
  },
  tonightPickImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover"
  },
  tonightPickShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.42)"
  },
  tonightPickCopy: {
    flex: 1,
    minWidth: 190
  },
  tonightPickLabel: {
    color: "#E9E2D7",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  tonightPickTitle: {
    color: colors.paper,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 27,
    marginTop: spacing.xs
  },
  tonightPickMeta: {
    color: "#F0ECE4",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  heroLinkButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md
  },
  compactHeroLinkButton: {
    alignSelf: "flex-start"
  },
  heroLinkButtonText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "800"
  },
  passportBand: {
    gap: spacing.md,
    paddingTop: spacing.md
  },
  quizRail: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  quizArtworkCard: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    width: 246,
    ...shadows.card
  },
  quizArtworkVisual: {
    height: 220,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: spacing.md
  },
  quizArtworkImage: {
    height: "100%",
    resizeMode: "cover",
    width: "100%"
  },
  quizArtworkTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "space-between"
  },
  quizArtworkTitle: {
    color: colors.paper,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25
  },
  quizArtworkBody: {
    gap: spacing.sm,
    padding: spacing.md
  },
  quizArtworkMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  quizAnswerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  quizAnswerButton: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 32,
    paddingHorizontal: spacing.sm
  },
  activeQuizAnswerButton: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  quizAnswerButtonText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 30
  },
  activeQuizAnswerButtonText: {
    color: colors.paper
  },
  passportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  passportSummaryPanel: {
    backgroundColor: colors.teal,
    borderColor: "rgba(200, 161, 90, 0.28)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexGrow: 1,
    gap: spacing.md,
    minWidth: 280,
    padding: spacing.lg
  },
  passportSummaryTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 29
  },
  passportSignalPill: {
    backgroundColor: "rgba(255, 253, 248, 0.12)",
    borderColor: "rgba(255, 253, 248, 0.2)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  passportBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  passportBadge: {
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    color: colors.teal,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  newBadgePill: {
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    color: colors.teal,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  passportStamp: {
    backgroundColor: "rgba(255, 253, 248, 0.1)",
    borderColor: "rgba(255, 253, 248, 0.18)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  forYouPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexGrow: 2,
    gap: spacing.sm,
    minWidth: 300,
    padding: spacing.lg,
    ...shadows.card
  },
  forYouHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  forYouTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 25,
    marginTop: spacing.xs
  },
  activeForYouButton: {
    backgroundColor: colors.gold,
    borderColor: colors.gold
  },
  personalPickRow: {
    alignItems: "flex-start",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.md
  },
  personalPickScore: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.lg,
    gap: 2,
    justifyContent: "center",
    minHeight: 46,
    width: 46
  },
  personalPickScoreText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "800"
  },
  personalPickCopy: {
    flex: 1,
    minWidth: 0
  },
  personalPickTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  },
  personalPickMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  questPanel: {
    backgroundColor: "transparent",
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  questPanelHeader: {
    paddingTop: spacing.sm
  },
  questGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md
  },
  questRow: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexGrow: 1,
    gap: spacing.sm,
    minWidth: 240,
    padding: spacing.md
  },
  questHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  questTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19
  },
  questProgress: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  questDescription: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  questProgressTrack: {
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    height: 6,
    overflow: "hidden"
  },
  questProgressFill: {
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    height: 6
  },
  questReason: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  conciergePanel: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    ...shadows.card
  },
  conciergeHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    minWidth: 0
  },
  conciergeTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  conciergeBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  conciergeBadge: {
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  conciergeBadgeMeta: {
    color: "#DAD8D0",
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  conciergeTitle: {
    color: colors.paper,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 29,
    marginTop: spacing.sm
  },
  conciergeCopy: {
    color: "#E8E1D7",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: spacing.xs
  },
  conciergeRail: {
    gap: spacing.sm,
    paddingRight: spacing.lg
  },
  conciergeSuggestionCard: {
    backgroundColor: "rgba(255, 253, 248, 0.08)",
    borderColor: "rgba(255, 253, 248, 0.16)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 146,
    padding: spacing.md,
    width: 238
  },
  conciergeSuggestionTitle: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19
  },
  conciergeSuggestionBody: {
    color: "#DAD8D0",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  conciergeSuggestionCta: {
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    marginTop: "auto",
    textTransform: "uppercase"
  },
  conciergePrimaryButton: {
    backgroundColor: colors.paper,
    borderColor: colors.paper,
    borderWidth: 1
  },
  conciergePrimaryButtonText: {
    color: colors.ink
  },
  conciergeReasonPill: {
    backgroundColor: "rgba(255, 253, 248, 0.1)",
    borderColor: "rgba(255, 253, 248, 0.18)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  firstRunPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    ...shadows.card
  },
  firstRunHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  firstRunTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
    marginTop: spacing.xs
  },
  firstRunSubtitle: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  firstRunDismissButton: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  firstRunActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  firstRunPrimaryAction: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  firstRunPrimaryActionText: {
    color: colors.paper,
    fontSize: 13,
    fontWeight: "800"
  },
  firstRunSecondaryAction: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  firstRunSecondaryActionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  firstRunTrustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  firstRunTrustPill: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  betaTaskGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  betaTaskPill: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  completedBetaTaskPill: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  betaTaskText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800"
  },
  completedBetaTaskText: {
    color: colors.paper
  },
  resetDemoButton: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.sm
  },
  resetDemoButtonText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800"
  },
  betaPreviewPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    ...shadows.card
  },
  betaPreviewHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  betaPreviewTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
    marginTop: spacing.xs
  },
  betaPreviewCopy: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  betaPreviewBadge: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  betaPreviewStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  betaPreviewStat: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  betaPreviewLearning: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  betaFeedbackPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    ...shadows.card
  },
  betaFeedbackHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  betaFeedbackTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
    marginTop: spacing.xs
  },
  betaFeedbackContextPanel: {
    backgroundColor: colors.fog,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm
  },
  betaFeedbackContextHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  betaFeedbackContextTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 12,
    fontWeight: "800"
  },
  betaFeedbackContextMeta: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  betaFeedbackContextChip: {
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  betaFeedbackInputRow: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  betaFeedbackInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 0
  },
  mobileCommandBar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.paper,
    borderColor: "rgba(200, 161, 90, 0.32)",
    borderRadius: radii.lg,
    borderWidth: 1,
    bottom: spacing.sm,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
    left: spacing.md,
    padding: spacing.xs,
    position: "absolute",
    right: spacing.md,
    ...shadows.card
  },
  mobileCommandButton: {
    alignItems: "center",
    borderRadius: radii.lg,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.xs
  },
  activeMobileCommandButton: {
    backgroundColor: colors.teal
  },
  mobileCommandText: {
    color: colors.teal,
    fontSize: 10,
    fontWeight: "800"
  },
  activeMobileCommandText: {
    color: colors.paper
  },
  routeFirstPanel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card
  },
  compactRouteFirstPanel: {
    marginHorizontal: spacing.md,
    marginTop: 0,
    paddingHorizontal: spacing.md
  },
  activeWalkNotice: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  activeWalkNoticeCopy: {
    flex: 1,
    minWidth: 210
  },
  activeWalkNoticeTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  activeWalkNoticeText: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  routeFirstHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  routeFirstTitleBlock: {
    flex: 1,
    minWidth: 220
  },
  routeFirstKicker: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  activeWalkKicker: {
    color: "#DAD8D0"
  },
  routeFirstTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 25,
    marginTop: spacing.xs
  },
  routeFirstMeta: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: spacing.xs
  },
  activeWalkCommandSurface: {
    backgroundColor: colors.teal,
    borderColor: "rgba(200, 161, 90, 0.28)",
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  activeWalkCommandTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  activeWalkCurrentCopy: {
    flex: 1,
    minWidth: 210
  },
  activeWalkCurrentTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 29,
    marginTop: spacing.xs
  },
  activeWalkCurrentMeta: {
    color: "#DAD8D0",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  activeWalkProgressMeter: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    minWidth: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeWalkProgressValue: {
    color: colors.teal,
    fontSize: 20,
    fontWeight: "800"
  },
  activeWalkProgressLabel: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  activeWalkNextCard: {
    backgroundColor: "rgba(255, 253, 248, 0.08)",
    borderColor: "rgba(200, 161, 90, 0.3)",
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md
  },
  activeWalkNextLabel: {
    color: "#DAD8D0",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  activeWalkNextTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.xs
  },
  activeWalkProgressRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  activeWalkProgressPill: {
    backgroundColor: "rgba(255, 253, 248, 0.12)",
    borderColor: "rgba(255, 253, 248, 0.16)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  activeWalkStickyActions: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.sm
  },
  activeWalkMapButton: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 170,
    paddingHorizontal: spacing.md
  },
  activeWalkMapButtonText: {
    color: colors.paper,
    fontSize: 13,
    fontWeight: "800"
  },
  activeWalkVisitButton: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  activeWalkVisitButtonText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "800"
  },
  walkRecapCard: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  walkRecapHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  walkRecapTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 27,
    marginTop: spacing.xs
  },
  walkRecapNeighborhood: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  walkRecapCopy: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  walkRecapRewardCopy: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  walkRecapPill: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    color: colors.ink
  },
  completedStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  completedStatTile: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 100,
    padding: spacing.sm
  },
  completedStatValue: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27
  },
  completedStatLabel: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  routeFirstMapButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  routeFirstMapButtonText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "800"
  },
  routeFirstActionStack: {
    alignItems: "flex-end",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  routeFirstStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  routeFirstModeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  routeModeRail: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingRight: spacing.lg
  },
  activeWalkActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  marketSnapshot: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  metric: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    minWidth: 128,
    padding: spacing.md
  },
  goodMetric: {
    backgroundColor: colors.tealSoft,
    borderColor: "#A6D5CF"
  },
  warnMetric: {
    backgroundColor: "#FFF2D7",
    borderColor: "#E8C77A"
  },
  metricValue: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "800"
  },
  metricLabel: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs,
    textTransform: "uppercase"
  },
  statusLine: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md
  },
  statusLineText: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl
  },
  sectionTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 22,
    fontWeight: "700"
  },
  sectionSubtitle: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: spacing.xs
  },
  horizontalList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  neighborhoodCard: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 122,
    padding: spacing.md,
    width: 196
  },
  selectedNeighborhoodCard: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  selectedMiniLabel: {
    alignSelf: "flex-start",
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: spacing.sm,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: "uppercase"
  },
  neighborhoodName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800"
  },
  selectedNeighborhoodText: {
    color: colors.paper
  },
  selectedNeighborhoodSubtext: {
    color: "#E7E0D5"
  },
  neighborhoodStatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm
  },
  neighborhoodMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
  },
  neighborhoodTrustMeta: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: spacing.xs
  },
  neighborhoodReason: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: spacing.md
  },
  neighborhoodFooter: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.sm
  },
  neighborhoodFooterText: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  filterBlock: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  activeFilterBar: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeFilterText: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  mediumRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg
  },
  walkBand: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    paddingBottom: spacing.lg
  },
  routeCommand: {
    alignItems: "stretch",
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg
  },
  routeCommandCopy: {
    flex: 1,
    minWidth: 240
  },
  routeCommandKicker: {
    color: "#DAD8D0",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  routeCommandTitle: {
    color: colors.paper,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 27,
    marginTop: spacing.sm
  },
  routeCommandMeta: {
    color: "#E8E1D7",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: spacing.sm
  },
  routeQualityStack: {
    backgroundColor: colors.paper,
    borderColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 150,
    padding: spacing.md
  },
  routeQualityLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  routeQualityMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  routeStartRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm
  },
  routeStartHandoffPill: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  routeModeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  routePlannerModeBlock: {
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  routePlannerModeHint: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    paddingHorizontal: spacing.lg
  },
  routeModeButton: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 154
  },
  activeRouteModeButton: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  routeModeLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  activeRouteModeLabel: {
    color: colors.paper
  },
  routeModeDetail: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14,
    marginTop: spacing.xs
  },
  activeRouteModeDetail: {
    color: "#E7E0D5"
  },
  walkStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  routePlannerFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  routePlannerFact: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  routeGuidance: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  guidanceTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19
  },
  guidanceCopy: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  routeConfidenceText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  routeMapButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  routeMapButtonText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "800"
  },
  routePreview: {
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.card
  },
  routePreviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md
  },
  routePreviewTitle: {
    color: colors.ink,
    fontFamily: walkerType.displayFamily,
    fontSize: 18,
    fontWeight: "700"
  },
  routePreviewMeta: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: spacing.sm,
    textAlign: "right"
  },
  routePreviewScroll: {
    marginTop: spacing.md
  },
  routePreviewStrip: {
    paddingHorizontal: spacing.md,
    paddingRight: spacing.lg
  },
  routePreviewStop: {
    marginRight: spacing.md,
    minHeight: 86,
    padding: spacing.xs,
    width: 124
  },
  selectedRoutePreviewStop: {
    backgroundColor: colors.fog,
    borderColor: "rgba(200, 161, 90, 0.45)",
    borderRadius: 16,
    borderWidth: 1
  },
  routePreviewNodeRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 30
  },
  routePreviewNode: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  routePreviewNodeActive: {
    backgroundColor: colors.gold
  },
  routePreviewNodeVisited: {
    backgroundColor: colors.teal
  },
  routePreviewNodeSkipped: {
    backgroundColor: colors.mutedInk
  },
  routePreviewNodeText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "800"
  },
  routePreviewLine: {
    backgroundColor: colors.line,
    flex: 1,
    height: 2,
    marginLeft: spacing.xs
  },
  routePreviewGallery: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  routePreviewStatus: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  routePreviewLeg: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  routeMapSummaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  routeMapSummaryPill: {
    backgroundColor: colors.fog,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  routeMapActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  routeMapPrimaryAction: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  routeMapPrimaryActionText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "800"
  },
  routeMapSecondaryAction: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.12)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  routeMapSecondaryActionText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  routePreviewSwapPanel: {
    backgroundColor: colors.fog,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.sm
  },
  routeConfidencePanel: {
    backgroundColor: colors.teal,
    borderRadius: 18,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md
  },
  routeConfidenceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  routeConfidenceScore: {
    color: colors.paper,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34
  },
  routeConfidenceCopyBlock: {
    flex: 1,
    minWidth: 0
  },
  routeConfidenceLabel: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: "800"
  },
  routeConfidenceMeta: {
    color: "#DAD8D0",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: 2
  },
  routeConfidenceAdvice: {
    color: "#F0ECE4",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  routeConfidenceChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  routeConfidenceChip: {
    backgroundColor: "rgba(255, 253, 248, 0.12)",
    borderColor: "rgba(255, 253, 248, 0.18)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: "#F0ECE4",
    fontSize: 11,
    fontWeight: "800",
    maxWidth: "100%",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  routeStartHandoffPanel: {
    backgroundColor: colors.fog,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  routeStartHandoffHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  routeStartIcon: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  routeStartCopy: {
    flex: 1,
    minWidth: 0
  },
  routeStartLabel: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  routeStartTitle: {
    color: colors.ink,
    fontFamily: walkerType.displayFamily,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2
  },
  routeStartPill: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  routeStartDetail: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  routeMapCanvas: {
    backgroundColor: "#EEF2EA",
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    height: 254,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    overflow: "hidden",
    position: "relative"
  },
  routeMapSvg: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  routeMapMinorRoad: {
    backgroundColor: "rgba(255, 253, 247, 0.64)",
    borderColor: "rgba(13, 59, 46, 0.04)",
    borderWidth: 1,
    height: 18,
    left: "-8%",
    position: "absolute",
    width: "120%"
  },
  routeMapMinorRoadOne: {
    top: "9%",
    transform: [{ rotate: "4deg" }]
  },
  routeMapMinorRoadTwo: {
    top: "43%",
    transform: [{ rotate: "-3deg" }]
  },
  routeMapMinorRoadThree: {
    bottom: "6%",
    transform: [{ rotate: "6deg" }]
  },
  routeMapMinorRoadVertical: {
    backgroundColor: "rgba(255, 253, 247, 0.54)",
    borderColor: "rgba(13, 59, 46, 0.04)",
    borderWidth: 1,
    height: "120%",
    position: "absolute",
    top: "-10%",
    width: 18
  },
  routeMapMinorRoadFour: {
    left: "9%",
    transform: [{ rotate: "-5deg" }]
  },
  routeMapMinorRoadFive: {
    left: "52%",
    transform: [{ rotate: "7deg" }]
  },
  routeMapMinorRoadSix: {
    right: "6%",
    transform: [{ rotate: "-4deg" }]
  },
  routeMapRoadBand: {
    backgroundColor: "rgba(255, 253, 247, 0.9)",
    borderColor: "rgba(13, 59, 46, 0.06)",
    borderWidth: 1,
    height: 34,
    left: "-10%",
    position: "absolute",
    width: "122%"
  },
  routeMapRoadBandNorth: {
    top: "20%",
    transform: [{ rotate: "-9deg" }]
  },
  routeMapRoadBandSouth: {
    bottom: "16%",
    transform: [{ rotate: "7deg" }]
  },
  routeMapRoadBandVertical: {
    backgroundColor: "rgba(255, 253, 247, 0.76)",
    borderColor: "rgba(13, 59, 46, 0.07)",
    borderWidth: 1,
    height: "118%",
    position: "absolute",
    top: "-8%",
    width: 30
  },
  routeMapRoadBandWest: {
    left: "24%",
    transform: [{ rotate: "12deg" }]
  },
  routeMapRoadBandEast: {
    right: "18%",
    transform: [{ rotate: "-7deg" }]
  },
  routeMapSegmentLabel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    position: "absolute",
    transform: [{ translateX: -14 }, { translateY: -10 }]
  },
  routeMapCurrentDot: {
    backgroundColor: "#2F80ED",
    borderColor: colors.paper,
    borderRadius: radii.pill,
    borderWidth: 3,
    bottom: "14%",
    height: 20,
    left: "26%",
    position: "absolute",
    width: 20,
    zIndex: 2
  },
  routeMapPin: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderColor: colors.paper,
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    ...shadows.card
  },
  routeMapPinActive: {
    backgroundColor: colors.gold
  },
  routeMapPinVisited: {
    backgroundColor: colors.teal
  },
  routeMapPinSkipped: {
    backgroundColor: colors.line,
    borderColor: colors.mutedInk
  },
  routeMapPinSelected: {
    borderColor: colors.gold,
    borderWidth: 4,
    height: 36,
    transform: [{ translateX: -18 }, { translateY: -18 }],
    width: 36,
    zIndex: 3
  },
  routeMapPinText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "800"
  },
  routeMapCanvasLegend: {
    backgroundColor: "rgba(255, 253, 248, 0.92)",
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    bottom: spacing.sm,
    left: spacing.sm,
    maxWidth: "72%",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "absolute"
  },
  routeMapCanvasTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  routeMapCanvasMeta: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2
  },
  routeMapStartBadge: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderColor: "rgba(255, 253, 248, 0.7)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    maxWidth: "76%",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: "absolute",
    right: spacing.sm,
    top: spacing.sm
  },
  routeMapStartBadgeText: {
    color: colors.paper,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "800"
  },
  walkStops: {
    gap: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  emptyRouteState: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md
  },
  emptyRouteText: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  walkStop: {
    alignItems: "flex-start",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  currentWalkStop: {
    backgroundColor: colors.paper,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: 1,
    ...shadows.card,
    paddingHorizontal: spacing.md
  },
  nextWalkStop: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md
  },
  visitedWalkStop: {
    opacity: 0.68
  },
  skippedWalkStop: {
    backgroundColor: colors.fog,
    borderRadius: radii.md,
    opacity: 0.7,
    paddingHorizontal: spacing.md
  },
  highlightedWalkStop: {
    backgroundColor: colors.paper,
    borderColor: colors.gold,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md
  },
  stopRail: {
    alignItems: "center",
    alignSelf: "stretch",
    width: 34
  },
  stopLabelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.xs
  },
  routePill: {
    backgroundColor: colors.tealSoft,
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: "uppercase"
  },
  stopNumber: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  currentStopNumber: {
    backgroundColor: colors.gold
  },
  visitedStopNumber: {
    backgroundColor: colors.mutedInk
  },
  skippedStopNumber: {
    backgroundColor: colors.line
  },
  stopRailLine: {
    backgroundColor: colors.line,
    flex: 1,
    marginTop: spacing.xs,
    minHeight: 42,
    width: 2
  },
  stopNumberText: {
    color: colors.paper,
    fontSize: 13,
    fontWeight: "800"
  },
  walkStopCopy: {
    flex: 1,
    minWidth: 0
  },
  walkStopTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  walkStopMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  walkStopShowCount: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  groupedShowList: {
    gap: 2,
    marginTop: spacing.xs
  },
  groupedShowText: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15
  },
  walkStopReason: {
    backgroundColor: colors.tealSoft,
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  walkStopTrust: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  walkStopReceipt: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  },
  walkStopAdvisory: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm
  },
  walkStopAdvisoryTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  walkStopAdvisoryCopy: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
  },
  swapOptionsBlock: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm
  },
  swapOptionsTitle: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  swapCandidateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  swapCandidateCopy: {
    flex: 1,
    minWidth: 0
  },
  swapCandidateTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17
  },
  swapCandidateMeta: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
    marginTop: 2
  },
  swapCandidateButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: spacing.sm
  },
  swapCandidateButtonText: {
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800"
  },
  routeReasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  routeReasonPill: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  mapIconButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 2,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    width: 48
  },
  mapIconButtonText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800"
  },
  savedPill: {
    alignItems: "center",
    backgroundColor: "#FFE8E2",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  savedPillText: {
    color: colors.coralDark,
    fontSize: 11,
    fontWeight: "800"
  },
  splitSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl
  },
  infoPanel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.sm,
    minWidth: 280,
    padding: spacing.lg
  },
  radarItem: {
    alignItems: "center",
    borderColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.md
  },
  radarIcon: {
    alignItems: "center",
    backgroundColor: "#FFE8E2",
    borderRadius: radii.pill,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  radarCopy: {
    flex: 1,
    minWidth: 0
  },
  radarTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  radarMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  alertRow: {
    borderColor: colors.line,
    borderTopWidth: 1,
    paddingTop: spacing.md
  },
  alertTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  alertMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  emptyText: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  exhibitionList: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  detailSheetWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  detailSheet: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.card
  },
  detailVisual: {
    minHeight: 318,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: spacing.md
  },
  detailImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover"
  },
  detailTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md
  },
  detailCloseButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 253, 248, 0.92)",
    borderRadius: radii.pill,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  detailVisualTitle: {
    color: colors.paper,
    flexShrink: 1,
    fontFamily: walkerType.displayFamily,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 31,
    maxWidth: "100%"
  },
  detailBody: {
    gap: spacing.md,
    padding: spacing.lg
  },
  detailTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  detailTitleBlock: {
    flex: 1,
    minWidth: 220
  },
  detailEyebrow: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  detailArtists: {
    color: colors.ink,
    fontFamily: walkerType.displayFamily,
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 24,
    marginTop: spacing.xs
  },
  detailQuickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  detailQuickAction: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 70,
    minWidth: 0,
    paddingHorizontal: spacing.xs
  },
  detailQuickActionText: {
    color: colors.ink,
    fontFamily: walkerType.uiFamily,
    fontSize: 11,
    fontWeight: "800"
  },
  placeConfidencePanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(200, 161, 90, 0.34)",
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.card
  },
  placeConfidenceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  placeConfidenceIcon: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  placeConfidenceCopy: {
    flex: 1,
    minWidth: 0
  },
  placeConfidenceKicker: {
    color: colors.gold,
    fontFamily: walkerType.uiFamily,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  placeConfidenceTitle: {
    color: colors.ink,
    fontFamily: walkerType.displayFamily,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2
  },
  placeConfidencePill: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  placeConfidenceDetail: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  placeConfidenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  placeConfidenceMetric: {
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  detailVisitPanel: {
    backgroundColor: colors.fog,
    borderColor: "rgba(13, 59, 46, 0.08)",
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  detailVisitKicker: {
    color: colors.gold,
    fontFamily: walkerType.uiFamily,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  detailVisitRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  },
  detailVisitText: {
    color: colors.ink,
    flex: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    minWidth: 0
  },
  exhibitionCard: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.card
  },
  cardVisual: {
    height: 220,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: spacing.md
  },
  cardImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover"
  },
  cardImageShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.28)"
  },
  cardVisualTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "space-between"
  },
  visualBadge: {
    backgroundColor: "rgba(255, 253, 248, 0.92)",
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  cardVisualCopy: {
    gap: spacing.xs
  },
  cardVisualGallery: {
    color: "#F0ECE4",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  cardVisualTitle: {
    color: colors.paper,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 29
  },
  cardBody: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
    padding: spacing.lg
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  cardGalleryName: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.xs
  },
  cardMeta: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: spacing.xs
  },
  statusBadge: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  statusBadgeText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800"
  },
  cardDescription: {
    color: colors.ink,
    flexShrink: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    maxWidth: "100%"
  },
  cardSignalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  factRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  factText: {
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  urgentFactText: {
    backgroundColor: colors.tealSoft,
    color: colors.ink
  },
  openingFactText: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    color: colors.paper,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  trustFactText: {
    backgroundColor: colors.tealSoft,
    borderRadius: radii.pill,
    color: colors.teal,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  reasonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  activeRouteDetail: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  detailRouteFitBlock: {
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md
  },
  detailRouteFitHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  detailRouteFitPill: {
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: "uppercase"
  },
  detailRouteFitTitle: {
    color: colors.paper,
    flex: 1,
    fontFamily: walkerType.uiFamily,
    fontSize: 13,
    fontWeight: "800",
    minWidth: 120
  },
  detailRouteFitText: {
    color: "#F0ECE4",
    fontFamily: walkerType.uiFamily,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  detailSwapPanel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm
  },
  detailSwapIntoRouteButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md
  },
  detailSwapIntoRouteButtonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  currentActiveRouteDetail: {
    backgroundColor: colors.paper,
    borderColor: colors.ink
  },
  activeRouteDetailHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  activeRouteStatusPill: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: "uppercase"
  },
  activeRouteDetailCopy: {
    gap: spacing.xs
  },
  activeRouteDetailTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  activeRouteDetailText: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  routeWarningPill: {
    backgroundColor: "#EFE7D7",
    borderColor: "rgba(17, 17, 17, 0.1)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  routeTimingCopy: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  reasonPill: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  reasonText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  sourceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  sourceText: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700"
  },
  sourceReceiptBlock: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  sourceReceiptNeedsReview: {
    backgroundColor: colors.paper
  },
  sourceReceiptHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  sourceReceiptTitle: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    fontWeight: "800"
  },
  sourceReceiptCopy: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  sourceReceiptAction: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  feedbackRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  feedbackButton: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 32,
    paddingHorizontal: spacing.sm
  },
  activeFeedbackButton: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  feedbackButtonText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 30
  },
  feedbackTagButton: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  feedbackTagText: {
    color: colors.teal,
    fontSize: 11,
    fontWeight: "800"
  },
  activeFeedbackButtonText: {
    color: colors.paper
  },
  preferenceBlock: {
    borderTopColor: "rgba(255, 253, 248, 0.16)",
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  learningPanel: {
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    padding: spacing.md
  },
  learningPanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  learningKicker: {
    color: "#DAD8D0",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  learningTitle: {
    color: colors.paper,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 23,
    marginTop: spacing.xs
  },
  learningCopy: {
    color: "#E8E1D7",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  learningChip: {
    backgroundColor: "rgba(255, 253, 248, 0.1)",
    borderColor: "rgba(255, 253, 248, 0.18)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  preferenceLabel: {
    color: "#DAD8D0",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  preferenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  preferenceChip: {
    backgroundColor: "rgba(255, 253, 248, 0.1)",
    borderColor: "rgba(255, 253, 248, 0.22)",
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 30,
    paddingHorizontal: spacing.sm
  },
  activePreferenceChip: {
    backgroundColor: colors.paper,
    borderColor: colors.paper
  },
  preferenceChipText: {
    color: colors.paper,
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 28
  },
  activePreferenceChipText: {
    color: colors.ink
  },
  conciergeDetailBlock: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  shareStatusBar: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  shareStatusText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  savedWalksPanel: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md
  },
  savedWalkRow: {
    alignItems: "center",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  savedWalkCopy: {
    flex: 1,
    minWidth: 190
  },
  savedWalkTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  savedWalkMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  walkShareCard: {
    backgroundColor: colors.teal,
    borderColor: "rgba(200, 161, 90, 0.42)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  walkShareCardBrandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  walkShareCardBrand: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 18,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  walkShareCardTitle: {
    color: colors.paper,
    fontFamily: walkerType.displayFamily,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27
  },
  walkShareCardMeta: {
    color: "rgba(250, 246, 239, 0.78)",
    fontSize: 12,
    fontWeight: "600"
  },
  walkShareCardHighlight: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "700"
  },
  passportMemoryCard: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  passportMemoryTitle: {
    color: colors.teal,
    fontFamily: walkerType.displayFamily,
    fontSize: 13,
    fontWeight: "700"
  },
  passportMemoryCopy: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17
  },
  eventPlanCard: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  eventPlanTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19
  },
  eventPlanMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
  },
  alertSeedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  cardActions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  primaryLightButton: {
    alignItems: "center",
    backgroundColor: colors.teal,
    borderRadius: radii.pill,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  primaryLightButtonText: {
    color: colors.paper,
    fontSize: 13,
    fontWeight: "800"
  },
  secondaryRouteButton: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  secondaryRouteButtonText: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "800"
  },
  linkButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  linkButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  noteRow: {
    alignItems: "center",
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  noteInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 0
  }
});
