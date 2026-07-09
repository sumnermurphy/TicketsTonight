import { StatusBar } from "expo-status-bar";
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Heart,
  MapPin,
  NotebookPen,
  Route,
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
  createGallerySourceTrustSummary,
  createGalleryWalkPlan,
  createNeighborhoodIntelligence,
  filterGalleryExhibitions,
  getGalleryInventoryTrust,
  galleryVisitStatusLabels,
  galleryWalkModeLabels,
  getDaysUntilGalleryCloses,
  getGalleryVisitStatus,
  getGalleryWhyGoReasons,
  getLastChanceGalleryAlerts,
  getSavedGalleryIdsFromLog,
  isGalleryOpeningTonight,
  upsertGalleryLogEntry,
  type GalleryWalkMode
} from "./services/galleryDiscovery";
import {
  readGalleryAppPersistedState,
  writeGalleryAppPersistedState,
  type GalleryPersistedLens
} from "./services/galleryAppPersistence";
import { createGalleryMarketDataAudit } from "./services/galleryDataFoundation";
import {
  getGalleryHeroVisual,
  getGalleryVisual,
  type GalleryVisualKey
} from "./services/galleryVisuals";
import {
  completeGalleryWalk,
  createGalleryWalkSession,
  getActiveWalkProgress,
  getGalleryWalkRecap,
  markGalleryWalkStopVisited,
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
  createGalleryRouteMapModel,
  type GalleryRouteMapModel
} from "./services/galleryRouteMap";
import {
  createGalleryPassportMemory,
  createGalleryWalkShareCard,
  type GalleryPassportMemory,
  type GalleryWalkShareCard
} from "./services/galleryPassportMemory";
import { colors, radii, shadows, spacing } from "./theme";
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

const referenceNow = "2026-07-09T15:30:00-04:00";

declare const require: (path: string) => ImageSourcePropType;

const galleryVisualSources: Record<GalleryVisualKey, ImageSourcePropType> = {
  hero: require("../assets/gallery/gallery-hero.png"),
  painting: require("../assets/gallery/gallery-painting.png"),
  sculpture: require("../assets/gallery/gallery-sculpture.png"),
  "photo-video": require("../assets/gallery/gallery-photo-video.png")
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

function RouteCommandPanel({
  walkPlan,
  walkMode,
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
  walkRecapRewardCopy,
  routeMapModel,
  shareCard,
  compact = false
}: {
  walkPlan: GalleryWalkPlan;
  walkMode: GalleryWalkMode;
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
  walkRecapRewardCopy?: string;
  routeMapModel: GalleryRouteMapModel;
  shareCard?: GalleryWalkShareCard;
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
              <Check size={14} color={colors.ink} />
              <Text style={styles.activeWalkVisitButtonText}>Mark visited</Text>
            </Pressable>
            {displayPlan.routeMapUrl ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open full ${displayPlan.neighborhood} walking route in maps`}
                onPress={() => {
                  if (displayPlan.routeMapUrl) {
                    void Linking.openURL(displayPlan.routeMapUrl);
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
              <Text style={styles.routeFirstKicker}>Walk recap</Text>
              <Text style={styles.walkRecapTitle}>Walk complete</Text>
            </View>
            <Text style={styles.walkRecapNeighborhood}>
              {activeWalkRecap.neighborhoods.join(", ") || displayPlan.neighborhood}
            </Text>
          </View>
          <Text style={styles.walkRecapCopy}>
            {activeWalkRecap.visitedStopCount} visited, {activeWalkRecap.skippedStopCount} skipped, {activeWalkRecap.notedStopCount} notes saved.
          </Text>
          {walkRecapRewardCopy ? (
            <Text style={styles.walkRecapRewardCopy}>{walkRecapRewardCopy}</Text>
          ) : null}
          {shareCard ? (
            <View style={styles.walkShareCard}>
              <Text style={styles.walkShareCardTitle}>{shareCard.subtitle}</Text>
              <Text style={styles.walkShareCardMeta}>{shareCard.stats.join(" - ")}</Text>
              {shareCard.highlights.slice(0, 2).map((highlight) => (
                <Text key={highlight} style={styles.walkShareCardHighlight}>{highlight}</Text>
              ))}
            </View>
          ) : null}
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
              <Text style={styles.secondaryRouteButtonText}>Copy itinerary</Text>
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
        </View>
      ) : (
        <>
          <View style={styles.routeFirstHeader}>
            <View style={styles.routeFirstTitleBlock}>
              <Text style={styles.routeFirstKicker}>Tonight's walk</Text>
              <Text style={styles.routeFirstTitle}>{displayPlan.summary}</Text>
              <Text style={styles.routeFirstMeta}>{progressCopy}</Text>
            </View>
            {displayPlan.routeMapUrl ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open full ${displayPlan.neighborhood} walking route in maps`}
                onPress={() => {
                  if (displayPlan.routeMapUrl) {
                    void Linking.openURL(displayPlan.routeMapUrl);
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
                {activeWalkSession?.status === "active" ? "Start this route" : "Start walk"}
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

          <View style={styles.routeFirstStats}>
            <Metric label="stops" value={displayPlan.stops.length} tone="good" />
            <Metric label="minutes" value={displayPlan.totalMinutes} />
            <Metric label="verified" value={`${routeVerifiedStopCount}/${walkPlan.stops.length}`} tone="good" />
            {routeFixtureStopCount > 0 ? (
              <Metric label="demo" value={routeFixtureStopCount} tone="warn" />
            ) : null}
          </View>

          <View style={styles.routeStartRow}>
            <Text style={styles.routeStartPill}>Start {startStop?.exhibition.galleryName ?? "where open"}</Text>
            <Text style={styles.routeStartPill}>Next {displayNextStop?.exhibition.galleryName ?? "best nearby stop"}</Text>
            <Text style={styles.routeStartPill}>{displayPlan.canStartNow ? "Can start now" : "Timing check needed"}</Text>
          </View>

          <View style={styles.routeReasonRow}>
            {displayPlan.selectionReasons.slice(0, 4).map((reason) => (
              <Text key={reason} style={styles.routeReasonPill}>{reason}</Text>
            ))}
          </View>
        </>
      )}
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
  onHighlight
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
  onHighlight?: () => void;
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
  highlightedStopId,
  onHighlightStop
}: {
  routeMapModel: GalleryRouteMapModel;
  highlightedStopId?: string;
  onHighlightStop: (stopId: string) => void;
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
        <Text style={styles.routeConfidenceAdvice}>
          {routeMapModel.confidence.routeAdvice.slice(0, 2).join(" ")}
        </Text>
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
        {routeMapModel.routeMapUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open full route map"
            onPress={() => {
              if (routeMapModel.routeMapUrl) {
                void Linking.openURL(routeMapModel.routeMapUrl);
              }
            }}
            style={styles.routeMapSecondaryAction}
          >
            <ExternalLink size={14} color={colors.ink} />
            <Text style={styles.routeMapSecondaryActionText}>Full route</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.routeMapCanvas}>
        <View style={[styles.routeMapRoadBand, styles.routeMapRoadBandNorth]} />
        <View style={[styles.routeMapRoadBand, styles.routeMapRoadBandSouth]} />
        <View style={[styles.routeMapRoadBandVertical, styles.routeMapRoadBandWest]} />
        <View style={[styles.routeMapRoadBandVertical, styles.routeMapRoadBandEast]} />
        <Svg style={styles.routeMapSvg} viewBox="0 0 100 100" pointerEvents="none">
          <Polyline
            points={routePath}
            fill="none"
            stroke={colors.ink}
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
          <Text style={styles.sectionTitle}>Art Taste Passport</Text>
          <Text style={styles.sectionSubtitle}>
            {quizAnswers.length}/{galleryQuizArtworks.length} quiz cards answered - {passport.summary}
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
            <Text style={styles.passportMemoryTitle}>Passport memory</Text>
            <Text style={styles.passportMemoryCopy}>{memory.summary}</Text>
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
          <Text style={styles.sectionTitle}>Gallery Quests</Text>
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
  const visual = getGalleryVisual(exhibition);

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
  conciergeReasons,
  feedback,
  onStatus,
  onNote,
  onMarkRouteVisited,
  onSkipRouteStop,
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
  conciergeReasons: string[];
  feedback?: GalleryTasteFeedback;
  onStatus: (status: GalleryLogStatus) => void;
  onNote: (note: string) => void;
  onMarkRouteVisited?: () => void;
  onSkipRouteStop?: () => void;
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
      : hasActiveWalk
        ? "Not in the active walk yet; use it as a route swap cue before replacing the current route."
        : "Not in this route yet; start from here to build a more personal path.";
  const routeActionLabel = isInDisplayedRoute
    ? "Keep in route"
    : hasActiveWalk
      ? "Use as swap cue"
      : "Add to walk";
  const visual = getGalleryVisual(exhibition);
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
          <Text style={styles.visualBadge}>{trust.label}</Text>
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
  const [eventRouteIntent, setEventRouteIntent] = useState<GalleryEventRouteIntent>("social-opening");
  const [shareStatus, setShareStatus] = useState<string | undefined>();
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
  const walkPlan = useMemo(
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
  const activeWalkPlan = useMemo(
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
  const displayWalkPlan =
    activeWalkSession?.status === "active" && activeWalkPlan ? activeWalkPlan : walkPlan;
  const displayRouteMapModel = useMemo(
    () =>
      createGalleryRouteMapModel(
        displayWalkPlan,
        activeWalkSession?.status === "active" ? activeWalkSession : undefined
      ),
    [activeWalkSession, displayWalkPlan]
  );
  const displayRouteAdvisoryById = useMemo(
    () =>
      new Map(
        displayRouteMapModel.stopAdvisories.map((advisory) => [advisory.stopId, advisory] as const)
      ),
    [displayRouteMapModel]
  );
  useEffect(() => {
    if (
      highlightedRouteStopId &&
      !displayRouteMapModel.pins.some((pin) => pin.id === highlightedRouteStopId)
    ) {
      setHighlightedRouteStopId(undefined);
    }
  }, [displayRouteMapModel, highlightedRouteStopId]);
  const activeWalkRouteMatchesCurrent = Boolean(
    activeWalkSession &&
      activeWalkSession.areaId === selectedAreaId &&
      activeWalkSession.mode === walkMode &&
      (activeWalkSession.neighborhood ?? undefined) === walkPlan.neighborhood
  );
  const activeWalkIsDraft =
    activeWalkSession?.status === "active" && !activeWalkRouteMatchesCurrent;
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
  const routeVerifiedStopCount = walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isVerified
  ).length;
  const routeFixtureStopCount = walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isFixture
  ).length;
  const routeScopeLabel = selectedNeighborhood ?? walkPlan.neighborhood;
  const compactAreaName =
    selectedAreaId === "nyc" ? "NYC" : selectedAreaId === "la" ? "LA" : "Hudson";
  const heroTitle = isCompactLayout
    ? `${compactAreaName} Tonight`
    : `Tonight in ${selectedArea?.name ?? "the city"}`;
  const heroSubtitle = isCompactLayout
    ? `${routeScopeLabel} route`
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
  const heroVisual = getGalleryHeroVisual(selectedAreaId);
  const tonightPickVisual = tonightPick ? getGalleryVisual(tonightPick) : heroVisual;
  const startStop = walkPlan.stops.find((stop) => stop.exhibition.id === walkPlan.startStopId);
  const nextStop = walkPlan.stops.find((stop) => stop.exhibition.id === walkPlan.nextStopId);
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
        walkPlan: activeWalkPlan ?? walkPlan,
        session: activeWalkSession,
        recap: activeWalkRecap,
        badges: passportBadges,
        stamps: passportStamps
      }),
    [activeWalkPlan, activeWalkRecap, activeWalkSession, passportBadges, passportStamps, walkPlan]
  );

  function resetMarket(areaId: GalleryAreaId) {
    setSelectedAreaId(areaId);
    setSelectedNeighborhood(undefined);
    setSelectedMedium(undefined);
    setActiveLens("all");
    setVerifiedOnly(false);
    setWalkMode("quick-loop");
    setSelectedExhibitionId(undefined);
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
    const copied = await writeTextToClipboard(createGalleryWalkItineraryText(walkPlan, activeWalkSession));

    setShareStatus(copied ? "Itinerary copied." : "Itinerary ready to copy from the route card.");
  }

  async function shareCurrentRoute() {
    const fallbackPayload = createGalleryWalkShareSummary(walkPlan, activeWalkRecap);
    const payload = activeWalkShareCard
      ? {
          title: activeWalkShareCard.title,
          text: activeWalkShareCard.shareText,
          url: activeWalkShareCard.routeMapUrl
        }
      : fallbackPayload;
    const shared = await shareWalkPayload(payload);

    if (!shared) {
      await writeTextToClipboard(payload.text);
    }

    setShareStatus(shared ? "Route shared." : "Route summary copied.");
  }

  function saveCurrentWalk() {
    const savedWalk = createSavedGalleryWalk(walkPlan, activeWalkSession, referenceNow);

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

  function addExhibitionToActiveWalk(exhibition: GalleryExhibition) {
    const alreadyInActiveRoute = activeWalkPlan?.stops.some((stop) =>
      stop.exhibitions.some((candidate) => candidate.id === exhibition.id)
    );

    setLogStatus(exhibition.id, "want-to-see");
    recordTasteFeedback(exhibition.id, "more-like-this");
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
  }

  function resumeWalk() {
    if (!activeWalkSession) {
      return;
    }

    setSelectedAreaId(activeWalkSession.areaId);
    setSelectedNeighborhood(activeWalkSession.neighborhood);
    setWalkMode(activeWalkSession.mode);
    setSelectedExhibitionId(undefined);
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
  }

  function endActiveWalk() {
    setActiveWalkSession((session) =>
      session ? completeGalleryWalk(session, referenceNow) : session
    );
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
      savedWalks
    });
  }, [
    activeLens,
    activeWalkSession,
    alertWindowDays,
    completedQuestIds,
    completedWalkSessions,
    earnedBadges,
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
    verifiedOnly,
    walkMode
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBand}>
          <ImageBackground
            source={galleryVisualSources[heroVisual.assetKey]}
            accessibilityLabel={heroVisual.alt}
            imageStyle={styles.heroImage}
            style={styles.heroImageCard}
          >
            <View style={styles.heroImageShade} />
            <View style={styles.heroContent}>
              <View style={[styles.headerTopline, isCompactLayout ? styles.compactHeaderTopline : null]}>
                <Text style={styles.heroEyebrow}>{getAreaRoleCopy(selectedAreaId)}</Text>
                <Text style={[styles.marketClock, isCompactLayout ? styles.compactMarketClock : null]}>
                  Demo clock {formatShortDate(referenceNow)}, {formatShortTime(referenceNow)}
                </Text>
              </View>
              <View style={styles.heroTitleBlock}>
                <Text style={[styles.title, isCompactLayout ? styles.compactTitle : null]}>
                  {heroTitle}
                </Text>
                <Text style={styles.subtitle}>
                  {heroSubtitle}
                </Text>
              </View>
              <View style={[styles.heroRouteCard, isCompactLayout ? styles.compactHeroRouteCard : null]}>
                <View>
                  <Text style={styles.heroRouteLabel}>Suggested route</Text>
                  <Text style={[styles.heroRouteTitle, isCompactLayout ? styles.compactHeroRouteTitle : null]}>{heroRouteSummary}</Text>
                </View>
                <Text style={[styles.heroRouteMeta, isCompactLayout ? styles.compactHeroRouteMeta : null]}>{walkPlan.totalMinutes} min - {walkPlan.totalDistanceMiles.toFixed(1)} mi</Text>
              </View>
            </View>
          </ImageBackground>

          <GalleryConciergePanel
            suggestions={conciergeSuggestions}
            onSuggestion={handleConciergeSuggestion}
          />

          <RouteCommandPanel
            walkPlan={walkPlan}
            walkMode={walkMode}
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
            walkRecapRewardCopy={walkRecapRewardCopy}
            routeMapModel={displayRouteMapModel}
            shareCard={activeWalkShareCard}
            compact={isCompactLayout}
          />

          {shareStatus ? (
            <View style={styles.shareStatusBar}>
              <Share2 size={14} color={colors.ink} />
              <Text style={styles.shareStatusText}>{shareStatus}</Text>
            </View>
          ) : null}

          <View style={styles.discoveryControls}>
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tonightStatsRail}
          >
            <TonightStat label="Open now" value={openNowCount} detail={`${sourceTrust.exhibitionCount} listings`} dark />
            <TonightStat label="Verified" value={sourceTrust.verifiedExhibitionCount} detail="Official-page checked" />
            <TonightStat label="Closing soon" value={closingSoonCount} detail="Within 7 days" />
          </ScrollView>

          <View style={styles.trustBrief}>
            <Check size={16} color={colors.ink} />
            <Text style={styles.trustBriefStatus}>{freshnessAudit.summaryLabel}</Text>
            <Text style={styles.trustBriefText}>
              {freshnessAudit.verifiedRecentlyCount} recent - {freshnessAudit.verifiedAgingCount} aging - {freshnessAudit.needsReviewCount} needs review - {freshnessAudit.fixtureDemoCount} demo
            </Text>
          </View>

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

          {tonightPick ? (
            <ImageBackground
              source={galleryVisualSources[tonightPickVisual.assetKey]}
              accessibilityLabel={tonightPickVisual.alt}
              imageStyle={styles.tonightPickImage}
              style={[styles.tonightPick, isCompactLayout ? styles.compactTonightPick : null]}
            >
              <View style={styles.tonightPickShade} />
              <View style={styles.tonightPickCopy}>
                <Text style={styles.tonightPickLabel}>Start browsing here</Text>
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
                {selectedNeighborhood ?? walkPlan.neighborhood} - {galleryWalkModeLabels[walkMode]}
              </Text>
            </View>
            <Route size={21} color={colors.teal} />
          </View>
          <View style={styles.routeCommand}>
            <View style={styles.routeCommandCopy}>
              <Text style={styles.routeCommandKicker}>Recommended walk</Text>
              <Text style={styles.routeCommandTitle}>{walkPlan.summary}</Text>
              <View style={styles.routeStartRow}>
                <Text style={styles.routeStartPill}>Start {startStop?.exhibition.galleryName ?? "where open"}</Text>
                <Text style={styles.routeStartPill}>Next {nextStop?.exhibition.galleryName ?? "best nearby stop"}</Text>
              </View>
              <Text style={styles.routeCommandMeta}>{walkPlan.guidance}</Text>
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
            <Text style={styles.routePlannerFact}>{walkPlan.stops.length} stops</Text>
            <Text style={styles.routePlannerFact}>{walkPlan.totalMinutes} min</Text>
            <Text style={styles.routePlannerFact}>{walkPlan.totalDistanceMiles.toFixed(1)} mi</Text>
            <Text style={styles.routePlannerFact}>{walkPlan.savedStopCount} saved</Text>
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
              {walkPlan.selectionReasons.slice(0, 4).map((reason) => (
                <Text key={reason} style={styles.routeReasonPill}>{reason}</Text>
              ))}
            </View>
            {walkPlan.routeMapUrl ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open full ${walkPlan.neighborhood} walking route in maps`}
                onPress={() => {
                  if (walkPlan.routeMapUrl) {
                    void Linking.openURL(walkPlan.routeMapUrl);
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
            highlightedStopId={highlightedRouteStopId}
            onHighlightStop={setHighlightedRouteStopId}
          />
          <View style={styles.walkStops}>
            {walkPlan.stops.length === 0 ? (
              <View style={styles.emptyRouteState}>
                <Text style={styles.emptyRouteText}>
                  No walk-ready route yet. Try another nearby cluster or switch route mode.
                </Text>
              </View>
            ) : (
              walkPlan.stops.map((stop, index) => (
                <WalkStopRow
                  key={stop.exhibition.id}
                  stop={stop}
                  leg={index > 0 ? walkPlan.legs[index - 1] : undefined}
                  isStart={walkPlan.startStopId === stop.exhibition.id}
                  isNext={walkPlan.nextStopId === stop.exhibition.id}
                  isLast={index === walkPlan.stops.length - 1}
                  progress={routeStopProgressById?.[stop.exhibition.id]}
                  freshnessLabel={getGalleryFreshnessState(stop.exhibition, referenceNow).label}
                  advisory={displayRouteAdvisoryById.get(stop.exhibition.id)}
                  highlighted={highlightedRouteStopId === stop.exhibition.id}
                  onHighlight={() => setHighlightedRouteStopId(stop.exhibition.id)}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.fog
  },
  content: {
    paddingBottom: spacing.xxl
  },
  headerBand: {
    backgroundColor: colors.fog,
    paddingBottom: spacing.xl,
    gap: spacing.md
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
    backgroundColor: "rgba(0, 0, 0, 0.34)"
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
  compactHeaderTopline: {
    alignItems: "flex-start",
    justifyContent: "flex-start"
  },
  heroEyebrow: {
    color: colors.paper,
    fontSize: 11,
    fontWeight: "900",
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
    fontSize: 44,
    fontWeight: "900",
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
    backgroundColor: "rgba(17, 17, 17, 0.72)",
    borderRadius: radii.md,
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
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroRouteTitle: {
    color: colors.paper,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "900",
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
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  chipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  activeChipText: {
    color: colors.paper
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
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
    fontWeight: "900"
  },
  tonightStatLabel: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
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
  trustBriefStatus: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
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
    fontWeight: "900"
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
    fontWeight: "900",
    textTransform: "uppercase"
  },
  tonightPickTitle: {
    color: colors.paper,
    fontSize: 22,
    fontWeight: "900",
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
    fontWeight: "900"
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
    fontWeight: "900",
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
    fontWeight: "900",
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
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    flexGrow: 1,
    gap: spacing.md,
    minWidth: 280,
    padding: spacing.lg
  },
  passportSummaryTitle: {
    color: colors.paper,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 29
  },
  passportSignalPill: {
    backgroundColor: "rgba(255, 253, 248, 0.12)",
    borderColor: "rgba(255, 253, 248, 0.2)",
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.paper,
    fontSize: 11,
    fontWeight: "900",
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
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  newBadgePill: {
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
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
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  forYouPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
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
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
    marginTop: spacing.xs
  },
  activeForYouButton: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.ink
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
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    gap: 2,
    justifyContent: "center",
    minHeight: 46,
    width: 46
  },
  personalPickScoreText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "900"
  },
  personalPickCopy: {
    flex: 1,
    minWidth: 0
  },
  personalPickTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
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
    borderRadius: radii.md,
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
    fontWeight: "900",
    lineHeight: 19
  },
  questProgress: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
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
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    height: 6
  },
  questReason: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "900",
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
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "uppercase"
  },
  conciergeBadgeMeta: {
    color: "#DAD8D0",
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  conciergeTitle: {
    color: colors.paper,
    fontSize: 24,
    fontWeight: "900",
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
    fontWeight: "900",
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
    fontWeight: "900",
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
  routeFirstPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card
  },
  compactRouteFirstPanel: {
    marginTop: 0
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
    fontWeight: "900"
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
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  activeWalkKicker: {
    color: "#DAD8D0"
  },
  routeFirstTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
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
    backgroundColor: colors.ink,
    borderRadius: radii.md,
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
    fontSize: 24,
    fontWeight: "900",
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
    borderRadius: radii.md,
    minWidth: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeWalkProgressValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  activeWalkProgressLabel: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  activeWalkNextCard: {
    backgroundColor: "rgba(255, 253, 248, 0.08)",
    borderColor: "rgba(255, 253, 248, 0.18)",
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md
  },
  activeWalkNextLabel: {
    color: "#DAD8D0",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  activeWalkNextTitle: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: "900",
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
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  activeWalkStickyActions: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.sm
  },
  activeWalkMapButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
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
    fontWeight: "900"
  },
  activeWalkVisitButton: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  activeWalkVisitButtonText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
  },
  walkRecapCard: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
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
    fontWeight: "900",
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
    fontWeight: "900",
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
    fontWeight: "900",
    lineHeight: 18
  },
  walkRecapPill: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    color: colors.ink
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
    fontWeight: "900"
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
    fontWeight: "900"
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
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
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
    fontWeight: "900",
    marginBottom: spacing.sm,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: "uppercase"
  },
  neighborhoodName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
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
    fontWeight: "900",
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
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingBottom: spacing.lg
  },
  routeCommand: {
    alignItems: "stretch",
    backgroundColor: colors.fog,
    borderColor: colors.line,
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
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  routeCommandTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
    marginTop: spacing.sm
  },
  routeCommandMeta: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: spacing.sm
  },
  routeQualityStack: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minWidth: 150,
    padding: spacing.md
  },
  routeQualityLabel: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  routeQualityMeta: {
    color: "#DAD8D0",
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
  routeStartPill: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
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
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: 146
  },
  activeRouteModeButton: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  routeModeLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
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
    fontWeight: "900",
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
    fontWeight: "900",
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
    fontWeight: "900",
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
    fontWeight: "900"
  },
  routePreview: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md
  },
  routePreviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md
  },
  routePreviewTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
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
    borderColor: colors.line,
    borderRadius: radii.md,
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
    fontWeight: "900"
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
    fontWeight: "900",
    marginTop: spacing.sm
  },
  routePreviewStatus: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
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
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
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
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  routeMapPrimaryActionText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "900"
  },
  routeMapSecondaryAction: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  routeMapSecondaryActionText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  routeConfidencePanel: {
    backgroundColor: colors.ink,
    borderRadius: radii.md,
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
    fontWeight: "900",
    lineHeight: 34
  },
  routeConfidenceCopyBlock: {
    flex: 1,
    minWidth: 0
  },
  routeConfidenceLabel: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: "900"
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
  routeMapCanvas: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 252,
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
  routeMapRoadBand: {
    backgroundColor: "rgba(255, 253, 248, 0.86)",
    borderColor: "rgba(17, 17, 17, 0.06)",
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
    backgroundColor: "rgba(255, 253, 248, 0.72)",
    borderColor: "rgba(17, 17, 17, 0.05)",
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
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    position: "absolute",
    transform: [{ translateX: -14 }, { translateY: -10 }]
  },
  routeMapPin: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderColor: colors.paper,
    borderRadius: radii.pill,
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
    backgroundColor: colors.mutedInk
  },
  routeMapPinSkipped: {
    backgroundColor: colors.line,
    borderColor: colors.mutedInk
  },
  routeMapPinSelected: {
    borderColor: colors.gold,
    borderWidth: 3,
    height: 34,
    transform: [{ translateX: -17 }, { translateY: -17 }],
    width: 34
  },
  routeMapPinText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: "900"
  },
  routeMapCanvasLegend: {
    backgroundColor: "rgba(255, 253, 248, 0.92)",
    borderColor: colors.line,
    borderRadius: radii.md,
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
    fontWeight: "900"
  },
  routeMapCanvasMeta: {
    color: colors.mutedInk,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2
  },
  walkStops: {
    gap: spacing.sm,
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
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
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
    fontWeight: "900",
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
    fontWeight: "900"
  },
  walkStopCopy: {
    flex: 1,
    minWidth: 0
  },
  walkStopTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
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
    fontWeight: "900",
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
    fontWeight: "900"
  },
  walkStopAdvisoryCopy: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
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
    fontWeight: "900"
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
    fontWeight: "900"
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
    fontWeight: "900"
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
    fontWeight: "900"
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
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.card
  },
  detailVisual: {
    minHeight: 340,
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
    fontSize: 26,
    fontWeight: "900",
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
    fontWeight: "900",
    textTransform: "uppercase"
  },
  detailArtists: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: spacing.xs
  },
  exhibitionCard: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
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
    fontWeight: "900",
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
    fontWeight: "900",
    textTransform: "uppercase"
  },
  cardVisualTitle: {
    color: colors.paper,
    fontSize: 24,
    fontWeight: "900",
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
    fontWeight: "900",
    textTransform: "uppercase"
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
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
    fontWeight: "900"
  },
  cardDescription: {
    color: colors.ink,
    flexShrink: 1,
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
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  trustFactText: {
    backgroundColor: colors.tealSoft,
    borderRadius: radii.pill,
    color: colors.teal,
    fontSize: 12,
    fontWeight: "900",
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
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: "uppercase"
  },
  detailRouteFitTitle: {
    color: colors.paper,
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    minWidth: 120
  },
  detailRouteFitText: {
    color: "#F0ECE4",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17
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
    fontWeight: "900",
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
    fontWeight: "900"
  },
  activeRouteDetailText: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
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
    fontWeight: "900"
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
    fontWeight: "900"
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
    fontWeight: "900",
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
    fontWeight: "900",
    lineHeight: 30
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
  preferenceLabel: {
    color: "#DAD8D0",
    fontSize: 11,
    fontWeight: "900",
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
    fontWeight: "900",
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
    fontWeight: "900"
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
    fontWeight: "900"
  },
  savedWalkMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  walkShareCard: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  walkShareCardTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  },
  walkShareCardMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800"
  },
  walkShareCardHighlight: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800"
  },
  passportMemoryCard: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  passportMemoryTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
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
    fontWeight: "900",
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
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  primaryLightButtonText: {
    color: colors.paper,
    fontSize: 13,
    fontWeight: "900"
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
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900"
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
    fontWeight: "900"
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
