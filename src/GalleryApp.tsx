import { StatusBar } from "expo-status-bar";
import {
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  NotebookPen,
  Route,
  Search,
  SlidersHorizontal,
  Sparkles,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
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

import {
  galleryAreas,
  galleryExhibitions,
  galleryNeighborhoods
} from "./data/galleryCatalog";
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
  advanceGalleryWalk,
  completeGalleryWalk,
  createGalleryWalkSession,
  getActiveWalkProgress,
  markGalleryWalkStopVisited,
  skipGalleryWalkStop,
  type GalleryWalkProgress,
  type GalleryWalkSession,
  type GalleryWalkStopProgress
} from "./services/galleryWalkSession";
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
const walkModeOptions: GalleryWalkMode[] = [
  "quick-loop",
  "two-hour",
  "opening-night",
  "last-chance"
];
const lensOptions: GalleryLens[] = ["all", "open-now", "opening-tonight", "last-chance"];
const walkModeDetails: Record<GalleryWalkMode, string> = {
  "quick-loop": "Fastest good loop",
  "two-hour": "Deeper neighborhood pass",
  "opening-night": "Timed around receptions",
  "last-chance": "Closing soon first"
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

function getTonightEvent(exhibition: GalleryExhibition) {
  const today = referenceNow.slice(0, 10);

  return exhibition.specialEvents.find((event) => event.startsAt.slice(0, 10) === today);
}

function getFreshnessCopy(exhibition: GalleryExhibition): string {
  return getGalleryInventoryTrust(exhibition).checkedLabel;
}

function getSourceCopy(exhibition: GalleryExhibition): string {
  return getGalleryInventoryTrust(exhibition).sourceLabel;
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
  routeConfidenceCopy,
  routeVerifiedStopCount,
  routeFixtureStopCount,
  startStop,
  nextStop,
  activeWalkSession,
  activeWalkProgress,
  activeWalkPlan,
  activeWalkCurrentStop,
  activeWalkNextStop,
  activeWalkNextLeg,
  activeWalkIsDraft,
  onMode,
  onStartWalk,
  onResumeWalk,
  onMarkCurrentVisited,
  onSkipCurrent,
  onAdvance,
  onEndWalk,
  compact = false
}: {
  walkPlan: GalleryWalkPlan;
  walkMode: GalleryWalkMode;
  routeConfidenceCopy: string;
  routeVerifiedStopCount: number;
  routeFixtureStopCount: number;
  startStop?: GalleryWalkStop;
  nextStop?: GalleryWalkStop;
  activeWalkSession?: GalleryWalkSession;
  activeWalkProgress?: GalleryWalkProgress;
  activeWalkPlan?: GalleryWalkPlan;
  activeWalkCurrentStop?: GalleryWalkStop;
  activeWalkNextStop?: GalleryWalkStop;
  activeWalkNextLeg?: GalleryWalkPlan["legs"][number];
  activeWalkIsDraft: boolean;
  onMode: (mode: GalleryWalkMode) => void;
  onStartWalk: () => void;
  onResumeWalk: () => void;
  onMarkCurrentVisited: () => void;
  onSkipCurrent: () => void;
  onAdvance: () => void;
  onEndWalk: () => void;
  compact?: boolean;
}) {
  const showingActiveWalk =
    activeWalkSession?.status === "active" &&
    !activeWalkIsDraft &&
    Boolean(activeWalkProgress && activeWalkPlan);
  const displayPlan = showingActiveWalk && activeWalkPlan ? activeWalkPlan : walkPlan;
  const currentStop = showingActiveWalk ? activeWalkCurrentStop : startStop;
  const displayNextStop = showingActiveWalk ? activeWalkNextStop : nextStop;
  const progressCopy =
    showingActiveWalk && activeWalkProgress
      ? `${activeWalkProgress.completedStopCount}/${activeWalkProgress.totalStopCount} stops complete - ${activeWalkProgress.remainingStopIds.length} remaining`
      : routeConfidenceCopy;

  return (
    <View style={[styles.routeFirstPanel, compact ? styles.compactRouteFirstPanel : null]}>
      {activeWalkSession?.status === "active" && activeWalkIsDraft ? (
        <View style={styles.activeWalkNotice}>
          <View style={styles.activeWalkNoticeCopy}>
            <Text style={styles.activeWalkNoticeTitle}>Active walk preserved</Text>
            <Text style={styles.activeWalkNoticeText}>
              Resume {galleryWalkModeLabels[activeWalkSession.mode]} in {activeWalkSession.neighborhood ?? activeWalkSession.areaId.toUpperCase()}, or start this draft route.
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
      <View style={styles.routeFirstHeader}>
        <View style={styles.routeFirstTitleBlock}>
          <Text style={styles.routeFirstKicker}>
            {showingActiveWalk ? "Active walk" : "Tonight's walk"}
          </Text>
          <Text style={styles.routeFirstTitle}>
            {showingActiveWalk && currentStop
              ? `Current stop: ${currentStop.exhibition.galleryName}`
              : displayPlan.summary}
          </Text>
          <Text style={styles.routeFirstMeta}>
            {showingActiveWalk && displayNextStop
              ? `Next: ${displayNextStop.exhibition.galleryName}${
                  activeWalkNextLeg
                    ? ` - ${activeWalkNextLeg.walkingMinutes} min, ${activeWalkNextLeg.distanceMiles.toFixed(1)} mi`
                    : ""
                }`
              : progressCopy}
          </Text>
        </View>
        <View style={styles.routeFirstActionStack}>
          {showingActiveWalk && currentStop ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Open map for current stop ${currentStop.exhibition.galleryName}`}
              onPress={() => {
                void Linking.openURL(currentStop.mapUrl);
              }}
              style={styles.routeFirstMapButton}
            >
              <MapPin size={14} color={colors.paper} />
              <Text style={styles.routeFirstMapButtonText}>Current map</Text>
            </Pressable>
          ) : null}
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
      </View>

      {showingActiveWalk ? (
        <View style={styles.activeWalkActionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark current stop visited"
            onPress={onMarkCurrentVisited}
            style={styles.primaryLightButton}
          >
            <Text style={styles.primaryLightButtonText}>Mark visited</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip current stop"
            onPress={onSkipCurrent}
            style={styles.secondaryRouteButton}
          >
            <Text style={styles.secondaryRouteButtonText}>Skip stop</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to next stop"
            onPress={onAdvance}
            style={styles.secondaryRouteButton}
          >
            <Text style={styles.secondaryRouteButtonText}>Next stop</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="End active walk"
            onPress={onEndWalk}
            style={styles.secondaryRouteButton}
          >
            <Text style={styles.secondaryRouteButtonText}>End walk</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.routeFirstModeGrid}>
            {walkModeOptions.map((mode) => (
              <RouteModeButton
                key={mode}
                label={galleryWalkModeLabels[mode]}
                detail={walkModeDetails[mode]}
                active={walkMode === mode}
                onPress={() => onMode(mode)}
              />
            ))}
          </View>
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
          </View>
        </>
      )}

      <View style={styles.routeFirstStats}>
        <Metric label="stops" value={displayPlan.stops.length} tone="good" />
        <Metric label="minutes" value={displayPlan.totalMinutes} />
        <Metric label="miles" value={displayPlan.totalDistanceMiles.toFixed(1)} />
        <Metric label="verified" value={`${routeVerifiedStopCount}/${walkPlan.stops.length}`} tone="good" />
        <Metric label="demo" value={routeFixtureStopCount} tone={routeFixtureStopCount > 0 ? "warn" : "neutral"} />
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
    </View>
  );
}

function OpeningRadarItem({ exhibition }: { exhibition: GalleryExhibition }) {
  const event = getTonightEvent(exhibition);

  return (
    <View style={styles.radarItem}>
      <View style={styles.radarIcon}>
        <CalendarDays size={18} color={colors.coralDark} />
      </View>
      <View style={styles.radarCopy}>
        <Text style={styles.radarTitle}>{exhibition.title}</Text>
        <Text style={styles.radarMeta}>
          {event?.title ?? "Opening reception"} - {formatShortTime(event?.startsAt ?? exhibition.receptionAt ?? referenceNow)}
        </Text>
        {event?.rsvpUrl || exhibition.rsvpUrl ? (
          <Text style={styles.radarMeta}>RSVP needed</Text>
        ) : null}
        <Text style={styles.radarMeta}>{exhibition.galleryName} - {exhibition.neighborhood}</Text>
      </View>
    </View>
  );
}

function WalkStopRow({
  stop,
  leg,
  isStart,
  isNext,
  progress
}: {
  stop: GalleryWalkPlan["stops"][number];
  leg?: GalleryWalkPlan["legs"][number];
  isStart: boolean;
  isNext: boolean;
  progress?: GalleryWalkStopProgress;
}) {
  const trust = getGalleryInventoryTrust(stop.exhibition);
  const groupedShows = stop.exhibitions ?? [stop.exhibition];
  const showCountLabel = `${groupedShows.length} show${groupedShows.length === 1 ? "" : "s"} on view`;
  const progressLabel: Partial<Record<GalleryWalkStopProgress, string>> = {
    current: "Current",
    next: "Next",
    visited: "Visited",
    skipped: "Skipped",
    planned: "Planned"
  };

  return (
    <View
      style={[
        styles.walkStop,
        progress === "current" ? styles.currentWalkStop : null,
        progress === "next" ? styles.nextWalkStop : null,
        progress === "visited" ? styles.visitedWalkStop : null,
        progress === "skipped" ? styles.skippedWalkStop : null
      ]}
    >
      <View style={styles.stopNumber}>
        <Text style={styles.stopNumberText}>{stop.stopNumber}</Text>
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
            <Text style={styles.routePill}>{progressLabel[progress]}</Text>
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
        <Text style={styles.walkStopTrust}>{trust.label} - {trust.sourceLabel}</Text>
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
    </View>
  );
}

function RoutePreview({ walkPlan }: { walkPlan: GalleryWalkPlan }) {
  if (walkPlan.stops.length === 0) {
    return null;
  }

  return (
    <View style={styles.routePreview}>
      <View style={styles.routePreviewHeader}>
        <MapPin size={15} color={colors.teal} />
        <Text style={styles.routePreviewTitle}>Route preview</Text>
        <Text style={styles.routePreviewMeta}>
          {walkPlan.totalMinutes} min - {walkPlan.totalDistanceMiles.toFixed(1)} mi
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.routePreviewScroll}
        contentContainerStyle={styles.routePreviewStrip}
      >
        {walkPlan.stops.map((stop, index) => {
          const nextLeg = walkPlan.legs[index];
          const isStart = walkPlan.startStopId === stop.exhibition.id;
          const isNext = walkPlan.nextStopId === stop.exhibition.id;
          const groupedCount = stop.groupedExhibitionCount ?? 1;

          return (
            <View key={stop.exhibition.id} style={styles.routePreviewStop}>
              <View style={styles.routePreviewNodeRow}>
                <View
                  style={[
                    styles.routePreviewNode,
                    isStart || isNext ? styles.routePreviewNodeActive : undefined
                  ]}
                >
                  <Text style={styles.routePreviewNodeText}>{stop.stopNumber}</Text>
                </View>
                {index < walkPlan.stops.length - 1 ? (
                  <View style={styles.routePreviewLine} />
                ) : null}
              </View>
              <Text style={styles.routePreviewGallery} numberOfLines={1}>
                {stop.exhibition.galleryName}
              </Text>
              <Text style={styles.routePreviewStatus} numberOfLines={1}>
                {groupedCount > 1
                  ? `${groupedCount} shows here`
                  : isStart
                    ? "Start here"
                    : isNext
                      ? "Next stop"
                      : galleryVisitStatusLabels[stop.status]}
              </Text>
              <Text style={styles.routePreviewLeg}>
                {nextLeg ? `${nextLeg.walkingMinutes} min to next` : "Finish"}
              </Text>
            </View>
          );
        })}
      </ScrollView>
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
  onStatus,
  onNote,
  onMarkRouteVisited,
  onSkipRouteStop,
  onClose
}: {
  exhibition: GalleryExhibition;
  allExhibitions: GalleryExhibition[];
  savedIds: string[];
  logEntry?: GalleryLogEntry;
  routeProgress?: GalleryWalkStopProgress;
  onStatus: (status: GalleryLogStatus) => void;
  onNote: (note: string) => void;
  onMarkRouteVisited?: () => void;
  onSkipRouteStop?: () => void;
  onClose: () => void;
}) {
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const trust = getGalleryInventoryTrust(exhibition);
  const reasons = getGalleryWhyGoReasons(exhibition, allExhibitions, referenceNow, savedIds);
  const visual = getGalleryVisual(exhibition);
  const openingTonight = isGalleryOpeningTonight(exhibition, referenceNow);

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

        <Text style={styles.cardDescription}>{exhibition.description}</Text>

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

        {routeProgress ? (
          <View style={styles.activeRouteDetail}>
            <View style={styles.activeRouteDetailCopy}>
              <Text style={styles.activeRouteDetailTitle}>In active walk</Text>
              <Text style={styles.activeRouteDetailText}>
                {routeProgress === "current"
                  ? "This is your current stop."
                  : routeProgress === "next"
                    ? "This is your next stop."
                    : routeProgress === "visited"
                      ? "You marked this stop visited."
                      : routeProgress === "skipped"
                        ? "You skipped this stop."
                        : "This stop is still planned."}
              </Text>
            </View>
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

        <View style={styles.reasonRow}>
          {reasons.map((reason) => (
            <View key={reason} style={styles.reasonPill}>
              <Sparkles size={12} color={colors.plum} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

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
      createGalleryWalkPlan({
        areaId: selectedAreaId,
        mode: walkMode,
        neighborhood: selectedNeighborhood,
        savedIds,
        referenceNow
      }),
    [savedIds, selectedAreaId, selectedNeighborhood, walkMode]
  );
  const activeWalkPlan = useMemo(
    () =>
      activeWalkSession
        ? createGalleryWalkPlan({
            areaId: activeWalkSession.areaId,
            mode: activeWalkSession.mode,
            neighborhood: activeWalkSession.neighborhood,
            savedIds,
            referenceNow
          })
        : undefined,
    [activeWalkSession, savedIds]
  );
  const activeWalkProgress = useMemo(
    () =>
      activeWalkSession
        ? getActiveWalkProgress(activeWalkSession, activeWalkPlan)
        : undefined,
    [activeWalkPlan, activeWalkSession]
  );
  const activeWalkIsDraft =
    activeWalkSession?.status === "active" &&
    (activeWalkSession.areaId !== selectedAreaId ||
      activeWalkSession.mode !== walkMode ||
      (activeWalkSession.neighborhood ?? undefined) !== walkPlan.neighborhood);
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
  const routeUniqueGalleryCount = new Set(
    walkPlan.stops.map((stop) => stop.exhibition.galleryName.toLowerCase())
  ).size;
  const routeConfidenceCopy =
    walkPlan.stops.length === 0
      ? "Not ready: no verified route stops yet."
      : routeVerifiedStopCount === walkPlan.stops.length &&
          routeUniqueGalleryCount === walkPlan.stops.length
      ? "Reliable: all stops verified and unique."
      : routeVerifiedStopCount >= Math.min(2, walkPlan.stops.length)
        ? `Usable: ${routeVerifiedStopCount} verified stops, ${routeFixtureStopCount} demo.`
        : "Thin: verified route supply is still limited.";
  const routeScopeLabel = selectedNeighborhood ?? walkPlan.neighborhood;
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
    activeWalkSession?.status === "active" && !activeWalkIsDraft
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

  function advanceActiveWalk() {
    if (!activeWalkSession || !activeWalkPlan) {
      return;
    }

    const currentStopId = activeWalkProgress?.currentStopId;

    setActiveWalkSession(advanceGalleryWalk(activeWalkSession, activeWalkPlan, referenceNow));

    if (currentStopId) {
      setLogStatus(currentStopId, "visited");
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
      activeWalkSession
    });
  }, [
    activeLens,
    activeWalkSession,
    alertWindowDays,
    logEntries,
    savedAlertArtists,
    savedAlertGalleries,
    savedAlertMediums,
    savedAlertNeighborhoods,
    selectedAreaId,
    selectedMedium,
    selectedNeighborhood,
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
                  Tonight in {selectedArea?.name ?? "the city"}
                </Text>
                <Text style={styles.subtitle}>
                  {walkPlan.title} for {routeScopeLabel}. Open now, nearby, and source-labeled.
                </Text>
              </View>
              <View style={styles.heroRouteCard}>
                <View>
                  <Text style={styles.heroRouteLabel}>Suggested route</Text>
                  <Text style={styles.heroRouteTitle}>{walkPlan.summary}</Text>
                </View>
                <Text style={styles.heroRouteMeta}>{walkPlan.totalMinutes} min - {walkPlan.totalDistanceMiles.toFixed(1)} mi</Text>
              </View>
            </View>
          </ImageBackground>

          <RouteCommandPanel
            walkPlan={walkPlan}
            walkMode={walkMode}
            routeConfidenceCopy={routeConfidenceCopy}
            routeVerifiedStopCount={routeVerifiedStopCount}
            routeFixtureStopCount={routeFixtureStopCount}
            startStop={startStop}
            nextStop={nextStop}
            activeWalkSession={activeWalkSession}
            activeWalkProgress={activeWalkProgress}
            activeWalkPlan={activeWalkPlan}
            activeWalkCurrentStop={activeWalkCurrentStop}
            activeWalkNextStop={activeWalkNextStop}
            activeWalkNextLeg={activeWalkNextLeg}
            activeWalkIsDraft={activeWalkIsDraft}
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
            onAdvance={advanceActiveWalk}
            onEndWalk={endActiveWalk}
            compact={isCompactLayout}
          />

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
            <TonightStat
              label="Demo"
              value={sourceTrust.fixtureExhibitionCount}
              detail={`${sourceTrust.needsReviewExhibitionCount} needs review`}
            />
            <TonightStat label="Sources" value={dataAudit.sourceCount} detail={`${dataAudit.officialLinkCoveragePercent}% official links`} />
            <TonightStat label="Closing soon" value={closingSoonCount} detail="Within 7 days" />
          </ScrollView>

          <View style={styles.trustBrief}>
            <Check size={16} color={colors.ink} />
            <Text style={styles.trustBriefStatus}>{marketReadinessCopy}</Text>
            <Text style={styles.trustBriefText}>
              {sourceTrust.verifiedExhibitionCount} verified - {sourceTrust.fixtureExhibitionCount} demo - {dataAudit.sourceCount} sources
            </Text>
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
              <Text style={styles.routeQualityLabel}>{walkPlan.readinessLevel}</Text>
              <Text style={styles.routeQualityMeta}>
                {walkPlan.canStartNow ? "Can start now" : "Timing check needed"}
              </Text>
            </View>
          </View>
          <View style={styles.routeModeGrid}>
            {walkModeOptions.map((mode) => (
              <RouteModeButton
                key={mode}
                label={galleryWalkModeLabels[mode]}
                detail={walkModeDetails[mode]}
                active={walkMode === mode}
                onPress={() => setWalkMode(mode)}
              />
            ))}
          </View>
          <View style={styles.walkStats}>
            <Metric label="stops" value={walkPlan.stops.length} tone="good" />
            <Metric label="minutes" value={walkPlan.totalMinutes} />
            <Metric label="route miles" value={walkPlan.totalDistanceMiles.toFixed(1)} />
            <Metric label="saved stops" value={walkPlan.savedStopCount} tone={walkPlan.savedStopCount > 0 ? "good" : "neutral"} />
          </View>
          <View style={styles.routeGuidance}>
            <Text style={styles.guidanceTitle}>Why this route works</Text>
            <Text style={styles.routeConfidenceText}>{routeConfidenceCopy}</Text>
            <Text style={styles.guidanceCopy}>{walkPlan.readinessCopy}</Text>
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
          <RoutePreview walkPlan={walkPlan} />
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
                  progress={routeStopProgressById?.[stop.exhibition.id]}
                />
              ))
            )}
          </View>
        </View>

        <View style={styles.splitSection}>
          <View style={styles.infoPanel}>
            <Text style={styles.sectionTitle}>Opening Night Radar</Text>
            <Text style={styles.sectionSubtitle}>Separate tonight events from exhibitions simply on view.</Text>
            {openingTonight.slice(0, 4).map((exhibition) => (
              <OpeningRadarItem key={exhibition.id} exhibition={exhibition} />
            ))}
            {openingTonight.length === 0 ? (
              <Text style={styles.emptyText}>No receptions or talks tonight in this filter.</Text>
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
              onStatus={(status) => setLogStatus(selectedExhibition.id, status)}
              onNote={(note) => setLogNote(selectedExhibition.id, note)}
              onMarkRouteVisited={() =>
                markRouteStopVisited(selectedActiveWalkStop?.exhibition.id, selectedExhibition.id)
              }
              onSkipRouteStop={() =>
                skipRouteStop(selectedActiveWalkStop?.exhibition.id, selectedExhibition.id)
              }
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
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 48
  },
  compactTitle: {
    fontSize: 34,
    lineHeight: 38
  },
  subtitle: {
    color: "#F0ECE4",
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 680
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
  heroRouteLabel: {
    color: "#D9D2C6",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroRouteTitle: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  heroRouteMeta: {
    color: "#F0ECE4",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: spacing.xs
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
  routeFirstPanel: {
    backgroundColor: colors.paper,
    borderColor: "rgba(17, 17, 17, 0.08)",
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    padding: spacing.lg,
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
  routeFirstTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
    marginTop: spacing.xs
  },
  routeFirstMeta: {
    color: colors.mutedInk,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: spacing.xs
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
  routeModeButton: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 136,
    flexGrow: 1,
    minHeight: 58,
    minWidth: 132,
    padding: spacing.md
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
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 15,
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
    width: 124
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
    backgroundColor: colors.fog,
    borderColor: colors.ink,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md
  },
  nextWalkStop: {
    backgroundColor: "#F8FAF5",
    borderRadius: radii.md,
    paddingHorizontal: spacing.md
  },
  visitedWalkStop: {
    opacity: 0.72
  },
  skippedWalkStop: {
    backgroundColor: "#F7F1ED",
    borderRadius: radii.md,
    opacity: 0.76,
    paddingHorizontal: spacing.md
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
    minHeight: 300,
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
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35
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
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20
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
