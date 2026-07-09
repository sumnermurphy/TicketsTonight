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
  if (exhibition.externalUrl.includes("example.org")) {
    return "Fixture source";
  }

  if (exhibition.sourceFreshness === "fresh") {
    return "Fresh source";
  }

  if (exhibition.sourceFreshness === "needs-review") {
    return "Needs review";
  }

  return "Stale-source risk";
}

function getSourceCopy(exhibition: GalleryExhibition): string {
  if (exhibition.externalUrl.includes("example.org")) {
    return "Needs live source";
  }

  if (exhibition.importRecordId) {
    return "Imported record";
  }

  if (exhibition.sourceLegalStatus === "official-public-page") {
    return "Official page";
  }

  if (exhibition.sourceLegalStatus === "partner-submission") {
    return "Gallery submission";
  }

  if (exhibition.sourceLegalStatus === "permission-required") {
    return "Review before ingest";
  }

  return "Do not ingest";
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
  index
}: {
  stop: ReturnType<typeof createGalleryWalkPlan>["stops"][number];
  index: number;
}) {
  return (
    <View style={styles.walkStop}>
      <View style={styles.stopNumber}>
        <Text style={styles.stopNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.walkStopCopy}>
        <Text style={styles.walkStopTitle}>{stop.exhibition.title}</Text>
        <Text style={styles.walkStopMeta}>
          {stop.exhibition.galleryName} - {galleryVisitStatusLabels[stop.status]}
        </Text>
        <Text style={styles.walkStopReason}>{stop.reasons[0] ?? "Good route stop"}</Text>
      </View>
      {stop.isSaved ? (
        <View style={styles.savedPill}>
          <Heart size={13} color={colors.coralDark} fill={colors.coralDark} />
          <Text style={styles.savedPillText}>Saved</Text>
        </View>
      ) : null}
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

  return (
    <View style={styles.exhibitionCard}>
      <View style={[styles.toneRail, { backgroundColor: exhibition.imageTone }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.eyebrow}>{exhibition.neighborhood}</Text>
            <Text style={styles.cardTitle}>{exhibition.title}</Text>
            <Text style={styles.cardMeta}>
              {exhibition.artists.join(", ")} at {exhibition.galleryName}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Clock size={13} color={colors.teal} />
            <Text style={styles.statusBadgeText}>{galleryVisitStatusLabels[status]}</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>{exhibition.description}</Text>

        <View style={styles.factRow}>
          <Text style={styles.factText}>{formatShortDate(exhibition.opensAt)} to {formatShortDate(exhibition.closesAt)}</Text>
          <Text style={styles.factText}>{getClosingCopy(exhibition)}</Text>
          {openingTonight ? <Text style={styles.factText}>Social tonight</Text> : null}
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
            onPress={() => {
              void Linking.openURL(exhibition.externalUrl);
            }}
            style={styles.linkButton}
          >
            <ExternalLink size={14} color={colors.ink} />
            <Text style={styles.linkButtonText}>Listing</Text>
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
          <View style={styles.headerTopline}>
            <Text style={styles.eyebrow}>{getAreaRoleCopy(selectedAreaId)}</Text>
            <Text style={styles.marketClock}>Demo clock {formatShortDate(referenceNow)}, {formatShortTime(referenceNow)}</Text>
          </View>
          <Text style={styles.title}>Gallery Walks</Text>
          <Text style={styles.subtitle}>
            {selectedArea?.name ?? "Market"} discovery tuned for what is open, closing, social, and walkable.
          </Text>

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
        </View>

        <View style={styles.marketSnapshot}>
          <Metric label="exhibitions" value={sourceTrust.exhibitionCount} tone="good" />
          <Metric label="gallery sources" value={dataAudit.sourceCount} tone="good" />
          <Metric label="openings tonight" value={sourceTrust.openingCount} tone="good" />
          <Metric label="hours coverage" value={`${sourceTrust.hoursCoveragePercent}%`} />
          <Metric
            label="stale risk"
            value={sourceTrust.staleSourceRiskCount}
            tone={sourceTrust.staleSourceRiskCount > 0 ? "warn" : "good"}
          />
        </View>

        <View style={styles.statusLine}>
          <Check size={16} color={colors.teal} />
          <Text style={styles.statusLineText}>
            Source directory ready: {dataAudit.officialLinkCoveragePercent}% official links, {dataAudit.hoursCoveragePercent}% source hours. Inventory still includes {dataAudit.seedExhibitionCount} seed fixtures needing live replacement.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Neighborhood Intelligence</Text>
            <Text style={styles.sectionSubtitle}>{neighborhoodIntelligence.filter((item) => item.canSupportWalk).length} clusters can support a walk today</Text>
          </View>
          <SlidersHorizontal size={19} color={colors.ink} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          <Pressable
            onPress={() => setSelectedNeighborhood(undefined)}
            style={[styles.neighborhoodCard, !selectedNeighborhood ? styles.selectedNeighborhoodCard : null]}
          >
            <Text style={styles.neighborhoodName}>All clusters</Text>
            <Text style={styles.neighborhoodMeta}>{areaInventory.length} seeded listings</Text>
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
              <Text style={styles.neighborhoodName}>{item.neighborhood}</Text>
              <Text style={styles.neighborhoodMeta}>
                {item.exhibitionCount} shows - {item.openNowCount} open now
              </Text>
              <Text style={styles.neighborhoodReason}>{item.topReason}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.filterBlock}>
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
              <Text style={styles.sectionTitle}>Gallery Walk Builder</Text>
              <Text style={styles.sectionSubtitle}>{walkPlan.summary}</Text>
            </View>
            <Route size={21} color={colors.teal} />
          </View>
          <View style={styles.filterRow}>
            {walkModeOptions.map((mode) => (
              <ChipButton
                key={mode}
                label={galleryWalkModeLabels[mode]}
                active={walkMode === mode}
                onPress={() => setWalkMode(mode)}
                compact
              />
            ))}
          </View>
          <View style={styles.walkStats}>
            <Metric label="stops" value={walkPlan.stops.length} tone="good" />
            <Metric label="minutes" value={walkPlan.totalMinutes} />
            <Metric label="route miles" value={walkPlan.totalDistanceMiles.toFixed(1)} />
            <Metric label="saved stops" value={walkPlan.savedStopCount} tone={walkPlan.savedStopCount > 0 ? "good" : "neutral"} />
          </View>
          <View style={styles.walkStops}>
            {walkPlan.stops.map((stop, index) => (
              <WalkStopRow key={stop.exhibition.id} stop={stop} index={index} />
            ))}
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
    backgroundColor: colors.paper,
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
    justifyContent: "space-between",
    gap: spacing.md
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
    fontSize: 12,
    fontWeight: "700"
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: colors.mutedInk,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 680
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
    borderWidth: 2
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
  filterBlock: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
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
  walkStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  walkStops: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
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
  walkStopReason: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: "800",
    marginTop: spacing.xs
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
