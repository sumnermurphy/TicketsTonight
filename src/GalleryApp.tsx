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
  Sparkles
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
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
import { createGalleryMarketDataAudit } from "./services/galleryDataFoundation";
import { colors, radii, shadows, spacing } from "./theme";
import type {
  GalleryAreaId,
  GalleryExhibition,
  GalleryLogEntry,
  GalleryLogStatus,
  GalleryMedium
} from "./types";

type GalleryLens = "all" | "open-now" | "opening-tonight" | "last-chance";
type GalleryWalkPlan = ReturnType<typeof createGalleryWalkPlan>;

const referenceNow = "2026-07-09T15:30:00-04:00";

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

function SignalCard({
  label,
  value,
  detail,
  compact = false,
  compactWidth,
  tone = "neutral"
}: {
  label: string;
  value: string | number;
  detail: string;
  compact?: boolean;
  compactWidth?: number;
  tone?: "neutral" | "good" | "warn" | "dark";
}) {
  return (
    <View
      style={[
        styles.signalCard,
        compact ? styles.compactSignalCard : null,
        compact && compactWidth ? { flexBasis: compactWidth, maxWidth: compactWidth, width: compactWidth } : null,
        tone === "good" ? styles.goodSignalCard : null,
        tone === "warn" ? styles.warnSignalCard : null,
        tone === "dark" ? styles.darkSignalCard : null
      ]}
    >
      <Text style={[styles.signalValue, tone === "dark" ? styles.darkSignalText : null]}>
        {value}
      </Text>
      <Text style={[styles.signalLabel, tone === "dark" ? styles.darkSignalText : null]}>
        {label}
      </Text>
      <Text style={[styles.signalDetail, tone === "dark" ? styles.darkSignalDetail : null]}>
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
  isNext
}: {
  stop: GalleryWalkPlan["stops"][number];
  leg?: GalleryWalkPlan["legs"][number];
  isStart: boolean;
  isNext: boolean;
}) {
  const trust = getGalleryInventoryTrust(stop.exhibition);
  const groupedShows = stop.exhibitions ?? [stop.exhibition];
  const showCountLabel = `${groupedShows.length} show${groupedShows.length === 1 ? "" : "s"} on view`;

  return (
    <View style={styles.walkStop}>
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
  onToggleAlertMedium
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
}) {
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const reasons = getGalleryWhyGoReasons(exhibition, allExhibitions, referenceNow, savedIds);
  const openingTonight = isGalleryOpeningTonight(exhibition, referenceNow);
  const primaryArtist = exhibition.artists[0];
  const primaryMedium = exhibition.mediums[0];
  const trust = getGalleryInventoryTrust(exhibition);

  return (
    <View style={styles.exhibitionCard}>
      <View style={[styles.toneRail, { backgroundColor: exhibition.imageTone }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardGalleryName}>{exhibition.galleryName}</Text>
            <Text style={styles.cardTitle}>{exhibition.title}</Text>
            <Text style={styles.cardMeta}>{exhibition.artists.join(", ")}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Clock size={13} color={colors.teal} />
            <Text style={styles.statusBadgeText}>{galleryVisitStatusLabels[status]}</Text>
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

        <View style={styles.alertSeedRow}>
          {primaryArtist ? (
            <ChipButton
              label="Alert artist"
              active={savedAlertArtists.includes(primaryArtist)}
              compact
              onPress={() => onToggleAlertArtist(primaryArtist)}
            />
          ) : null}
          <ChipButton
            label="Alert gallery"
            active={savedAlertGalleries.includes(exhibition.galleryName)}
            compact
            onPress={() => onToggleAlertGallery(exhibition.galleryName)}
          />
          <ChipButton
            label="Alert area"
            active={savedAlertNeighborhoods.includes(exhibition.neighborhood)}
            compact
            onPress={() => onToggleAlertNeighborhood(exhibition.neighborhood)}
          />
          {primaryMedium ? (
            <ChipButton
              label="Alert medium"
              active={savedAlertMediums.includes(primaryMedium)}
              compact
              onPress={() => onToggleAlertMedium(primaryMedium)}
            />
          ) : null}
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
  const [selectedAreaId, setSelectedAreaId] = useState<GalleryAreaId>("nyc");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>();
  const [selectedMedium, setSelectedMedium] = useState<GalleryMedium | undefined>();
  const [activeLens, setActiveLens] = useState<GalleryLens>("all");
  const [walkMode, setWalkMode] = useState<GalleryWalkMode>("quick-loop");
  const [alertWindowDays, setAlertWindowDays] = useState<3 | 7 | 14>(14);
  const [query, setQuery] = useState("");
  const [logEntries, setLogEntries] = useState<GalleryLogEntry[]>([]);
  const [savedAlertArtists, setSavedAlertArtists] = useState<string[]>([]);
  const [savedAlertGalleries, setSavedAlertGalleries] = useState<string[]>([]);
  const [savedAlertNeighborhoods, setSavedAlertNeighborhoods] = useState<string[]>([]);
  const [savedAlertMediums, setSavedAlertMediums] = useState<GalleryMedium[]>([]);
  const selectedArea = galleryAreas.find((area) => area.id === selectedAreaId) ?? galleryAreas[0];
  const isCompactLayout = viewportWidth < 720;
  const compactSignalCardWidth = isCompactLayout
    ? Math.min(175, Math.max(120, Math.floor((viewportWidth - spacing.lg * 2 - spacing.sm) / 2)))
    : undefined;
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
        lastChanceDays: activeLens === "last-chance" ? 14 : undefined,
        referenceNow
      }),
    [activeLens, query, selectedAreaId, selectedMedium, selectedNeighborhood]
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
  const neighborhoods = useMemo(
    () => galleryNeighborhoods.filter((neighborhood) => neighborhood.areaId === selectedAreaId),
    [selectedAreaId]
  );
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
  const closingSoonCount = useMemo(
    () =>
      areaInventory.filter((exhibition) => getDaysUntilGalleryCloses(exhibition, referenceNow) <= 7)
        .length,
    [areaInventory]
  );
  const walkReadyCount = neighborhoodIntelligence.filter((item) => item.canSupportWalk).length;
  const selectedNeighborhoodInsight = selectedNeighborhood
    ? neighborhoodIntelligence.find((item) => item.neighborhood === selectedNeighborhood)
    : undefined;
  const routeScopeLabel = selectedNeighborhood ?? walkPlan.neighborhood;
  const activeFilterCopy = [
    activeLens !== "all" ? lensLabels[activeLens] : undefined,
    selectedMedium ? mediumLabels[selectedMedium] : undefined,
    query.trim() ? `Search: ${query.trim()}` : undefined
  ]
    .filter(Boolean)
    .join(" - ");
  const discoveryLead = selectedNeighborhoodInsight
    ? `${selectedNeighborhoodInsight.exhibitionCount} shows, ${selectedNeighborhoodInsight.openNowCount} open now`
    : `${walkReadyCount} walkable clusters`;
  const tonightPick = openingTonight[0] ?? visibleExhibitions[0];

  function resetMarket(areaId: GalleryAreaId) {
    setSelectedAreaId(areaId);
    setSelectedNeighborhood(undefined);
    setSelectedMedium(undefined);
    setActiveLens("all");
    setWalkMode("quick-loop");
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBand}>
          <View style={[styles.headerTopline, isCompactLayout ? styles.compactHeaderTopline : null]}>
            <Text style={styles.heroEyebrow}>{getAreaRoleCopy(selectedAreaId)}</Text>
            <Text style={[styles.marketClock, isCompactLayout ? styles.compactMarketClock : null]}>Demo clock {formatShortDate(referenceNow)}, {formatShortTime(referenceNow)}</Text>
          </View>
          <View style={styles.heroTitleRow}>
            <View style={styles.heroTitleBlock}>
              <Text style={styles.title}>Tonight in {selectedArea?.name ?? "the city"}</Text>
              <Text style={styles.subtitle}>
                Open-now gallery discovery, verified source trust, and a practical walk route for {routeScopeLabel}.
              </Text>
            </View>
            <View style={styles.heroRouteCard}>
              <Text style={styles.heroRouteLabel}>Suggested route</Text>
              <Text style={styles.heroRouteTitle}>{walkPlan.title}</Text>
              <Text style={styles.heroRouteMeta}>{walkPlan.summary}</Text>
            </View>
          </View>

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

          <View style={styles.tonightBrief}>
            <SignalCard
              label="Open now"
              value={openNowCount}
              detail={`${sourceTrust.exhibitionCount} total listings`}
              compact={isCompactLayout}
              compactWidth={compactSignalCardWidth}
              tone="dark"
            />
            <SignalCard
              label="Verified"
              value={sourceTrust.verifiedExhibitionCount}
              detail="Official-page checked"
              compact={isCompactLayout}
              compactWidth={compactSignalCardWidth}
              tone="good"
            />
            <SignalCard
              label="Demo/review"
              value={sourceTrust.fixtureExhibitionCount + sourceTrust.needsReviewExhibitionCount}
              detail={`${sourceTrust.fixtureExhibitionCount} demo, ${sourceTrust.needsReviewExhibitionCount} review`}
              compact={isCompactLayout}
              compactWidth={compactSignalCardWidth}
              tone={sourceTrust.fixtureExhibitionCount + sourceTrust.needsReviewExhibitionCount > 0 ? "warn" : "good"}
            />
            <SignalCard
              label="Walkable"
              value={walkReadyCount}
              detail={discoveryLead}
              compact={isCompactLayout}
              compactWidth={compactSignalCardWidth}
              tone="good"
            />
            <SignalCard
              label="Opening"
              value={sourceTrust.openingCount}
              detail="Social signals tonight"
              compact={isCompactLayout}
              compactWidth={compactSignalCardWidth}
              tone={sourceTrust.openingCount > 0 ? "warn" : "neutral"}
            />
            <SignalCard
              label="Closing soon"
              value={closingSoonCount}
              detail="Within 7 days"
              compact={isCompactLayout}
              compactWidth={compactSignalCardWidth}
              tone={closingSoonCount > 0 ? "warn" : "neutral"}
            />
          </View>

          <View style={styles.trustBrief}>
            <View style={styles.trustBriefIcon}>
              <Check size={16} color={colors.teal} />
            </View>
            <Text style={styles.trustBriefText}>
              {isCompactLayout
                ? `${sourceTrust.verifiedExhibitionCount} verified official-page. ${sourceTrust.fixtureExhibitionCount} demo. ${dataAudit.sourceCount} sources.`
                : selectedAreaId === "nyc"
                  ? `NYC mixes ${sourceTrust.verifiedExhibitionCount} manually verified official-page listings with ${sourceTrust.fixtureExhibitionCount} fixture/demo listings still marked as demo. Source directory: ${dataAudit.sourceCount} candidates, ${dataAudit.officialLinkCoveragePercent}% official links.`
                  : `${selectedArea?.name ?? "Market"} has ${sourceTrust.verifiedExhibitionCount} verified listings and ${sourceTrust.fixtureExhibitionCount} fixture/demo listings; thin walks are labeled honestly. Source directory: ${dataAudit.sourceCount} candidates, ${dataAudit.officialLinkCoveragePercent}% official links.`}
            </Text>
          </View>

          {tonightPick ? (
            <View style={[styles.tonightPick, isCompactLayout ? styles.compactTonightPick : null]}>
              <View style={[styles.tonightPickCopy, isCompactLayout ? styles.compactTonightPickCopy : null]}>
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
                <Text style={styles.heroLinkButtonText}>Open link</Text>
              </Pressable>
            </View>
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
            onPress={() => setSelectedNeighborhood(undefined)}
            style={[styles.neighborhoodCard, !selectedNeighborhood ? styles.selectedNeighborhoodCard : null]}
          >
            {!selectedNeighborhood ? <Text style={styles.selectedMiniLabel}>Active view</Text> : null}
            <Text style={styles.neighborhoodName}>All clusters</Text>
            <Text style={styles.neighborhoodMeta}>{areaInventory.length} listings - {openNowCount} open now</Text>
            <Text style={styles.neighborhoodReason}>Scan the full market</Text>
          </Pressable>
          {neighborhoodIntelligence.map((item) => (
            <Pressable
              key={item.neighborhood}
              onPress={() => setSelectedNeighborhood(item.neighborhood)}
              style={[
                styles.neighborhoodCard,
                selectedNeighborhood === item.neighborhood ? styles.selectedNeighborhoodCard : null
              ]}
            >
              {selectedNeighborhood === item.neighborhood ? (
                <Text style={styles.selectedMiniLabel}>Planning here</Text>
              ) : null}
              <Text style={styles.neighborhoodName}>{item.neighborhood}</Text>
              <Text style={styles.neighborhoodMeta}>
                {item.exhibitionCount} shows - {item.openNowCount} open now
              </Text>
              <Text style={styles.neighborhoodReason}>{item.topReason}</Text>
              <View style={styles.neighborhoodFooter}>
                <Text style={styles.neighborhoodFooterText}>
                  {item.canSupportWalk ? "Walk-ready" : "Thin today"}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.filterBlock}>
          <View style={styles.activeFilterBar}>
            <Text style={styles.activeFilterText}>
              Showing {activeFilterCopy || "all shows"} in {selectedNeighborhood ?? selectedArea?.name ?? "this market"}
            </Text>
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
            <Text style={styles.sectionSubtitle}>Why-go cards include hours, closing pressure, source trust, and your art log.</Text>
          </View>
          <MapPin size={20} color={colors.ink} />
        </View>

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
    backgroundColor: "#FBF7F2",
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md
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
    color: colors.coralDark,
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
    color: colors.mutedInk,
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
    minWidth: 280
  },
  title: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 40
  },
  subtitle: {
    color: colors.mutedInk,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 680
  },
  heroRouteCard: {
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: "center",
    minWidth: 250,
    padding: spacing.lg
  },
  heroRouteLabel: {
    color: "#DEB6B2",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroRouteTitle: {
    color: colors.paper,
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  heroRouteMeta: {
    color: "#DAD8D0",
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
    borderColor: colors.line,
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
    backgroundColor: colors.fog,
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
  signalCard: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexBasis: 160,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 132,
    padding: spacing.md
  },
  compactSignalCard: {
    flexGrow: 0,
    minWidth: 0
  },
  goodSignalCard: {
    backgroundColor: colors.tealSoft,
    borderColor: "#A6D5CF"
  },
  warnSignalCard: {
    backgroundColor: "#FFF2D7",
    borderColor: "#E8C77A"
  },
  darkSignalCard: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  signalValue: {
    color: colors.ink,
    fontSize: 25,
    fontWeight: "900"
  },
  signalLabel: {
    color: colors.mutedInk,
    fontSize: 11,
    fontWeight: "900",
    marginTop: spacing.xs,
    textTransform: "uppercase"
  },
  signalDetail: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: spacing.xs
  },
  darkSignalText: {
    color: colors.paper
  },
  darkSignalDetail: {
    color: "#DAD8D0"
  },
  trustBrief: {
    alignItems: "center",
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  trustBriefIcon: {
    alignItems: "center",
    backgroundColor: colors.tealSoft,
    borderRadius: radii.pill,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  trustBriefText: {
    color: colors.mutedInk,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    minWidth: 0
  },
  tonightPick: {
    alignItems: "center",
    backgroundColor: "#F1E8DC",
    borderColor: "#D8C4AA",
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "flex-start",
    padding: spacing.md
  },
  compactTonightPick: {
    alignItems: "flex-start",
    flexDirection: "column",
    justifyContent: "flex-start"
  },
  tonightPickCopy: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0
  },
  compactTonightPickCopy: {
    minWidth: 0,
    width: "100%"
  },
  tonightPickLabel: {
    color: colors.coralDark,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  tonightPickTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  tonightPickMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: spacing.xs
  },
  heroLinkButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.md,
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
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 122,
    padding: spacing.md,
    width: 206
  },
  selectedNeighborhoodCard: {
    borderColor: colors.teal,
    borderWidth: 2,
    backgroundColor: colors.tealSoft
  },
  selectedMiniLabel: {
    alignSelf: "flex-start",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    color: colors.paper,
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
  neighborhoodMeta: {
    color: colors.mutedInk,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  neighborhoodReason: {
    color: colors.teal,
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
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingBottom: spacing.lg
  },
  routeCommand: {
    alignItems: "stretch",
    backgroundColor: colors.ink,
    borderRadius: radii.md,
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
    color: "#DEB6B2",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  routeCommandTitle: {
    color: colors.paper,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
    marginTop: spacing.sm
  },
  routeCommandMeta: {
    color: "#DAD8D0",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: spacing.sm
  },
  routeQualityStack: {
    backgroundColor: "#252C35",
    borderColor: "#3B4652",
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
    flexGrow: 1,
    minHeight: 58,
    minWidth: 148,
    padding: spacing.md
  },
  activeRouteModeButton: {
    backgroundColor: colors.teal,
    borderColor: colors.teal
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
    color: "#E6F3F1"
  },
  walkStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  routeGuidance: {
    backgroundColor: colors.fog,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md
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
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
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
    backgroundColor: colors.teal
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
    color: colors.teal,
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
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md
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
    color: colors.teal,
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
    color: colors.teal,
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
  exhibitionCard: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    ...shadows.card
  },
  toneRail: {
    width: 8
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
    color: colors.coralDark,
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
    backgroundColor: colors.tealSoft,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  statusBadgeText: {
    color: colors.teal,
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
    backgroundColor: "#FFE8E2",
    color: colors.coralDark
  },
  openingFactText: {
    backgroundColor: "#EFE8F4",
    borderRadius: radii.pill,
    color: colors.plum,
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
  reasonPill: {
    alignItems: "center",
    backgroundColor: "#EFE8F4",
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  reasonText: {
    color: colors.plum,
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
