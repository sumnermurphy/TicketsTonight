import { galleryExhibitions, galleryNeighborhoods } from "../data/galleryCatalog";
import type {
  Coordinates,
  GalleryAreaId,
  GalleryExhibition,
  GalleryLogEntry,
  GalleryLogStatus,
  GalleryMedium,
  GalleryNeighborhood,
  GallerySubmissionDraft
} from "../types";

export type GalleryVisitStatus =
  | "open-now"
  | "opens-later"
  | "closed-for-day"
  | "closed-today"
  | "not-yet-open"
  | "closed";

export type GalleryWalkMode =
  | "quick-loop"
  | "two-hour"
  | "opening-night"
  | "last-chance";

export type GalleryDiscoveryFilters = {
  areaId: GalleryAreaId;
  neighborhoods?: string[];
  mediums?: GalleryMedium[];
  query?: string;
  openOnly?: boolean;
  openingOnly?: boolean;
  lastChanceDays?: 3 | 7 | 14;
  referenceNow?: string;
};

export type GalleryWalkPlanInput = {
  areaId: GalleryAreaId;
  mode: GalleryWalkMode;
  neighborhood?: string;
  savedIds?: string[];
  referenceNow?: string;
  timeBudgetMinutes?: number;
  exhibitions?: GalleryExhibition[];
};

export type GalleryWalkStop = {
  exhibition: GalleryExhibition;
  status: GalleryVisitStatus;
  reasons: string[];
  isSaved: boolean;
  minutesAtStop: number;
};

export type GalleryWalkPlan = {
  areaId: GalleryAreaId;
  mode: GalleryWalkMode;
  neighborhood?: string;
  title: string;
  summary: string;
  stops: GalleryWalkStop[];
  savedStopCount: number;
  totalMinutes: number;
  totalDistanceMiles: number;
  startsAt: string;
  canStartNow: boolean;
};

export type GalleryNeighborhoodIntelligence = {
  neighborhood: string;
  walkLabel: string;
  exhibitionCount: number;
  openNowCount: number;
  opensLaterCount: number;
  openingTonightCount: number;
  lastChanceCount: number;
  canSupportWalk: boolean;
  topReason: string;
};

export type GallerySourceTrustSummary = {
  areaId: GalleryAreaId;
  exhibitionCount: number;
  openingCount: number;
  hoursCoveragePercent: number;
  addressCoveragePercent: number;
  externalLinkCoveragePercent: number;
  staleSourceRiskCount: number;
  freshSourceCount: number;
  officialOrSubmissionCount: number;
  recommendedNextAction: string;
};

export type GalleryAlertPreferences = {
  areaId?: GalleryAreaId;
  days: 3 | 7 | 14;
  savedArtists?: string[];
  savedGalleries?: string[];
  neighborhoods?: string[];
  mediums?: GalleryMedium[];
  referenceNow?: string;
};

export type GalleryLastChanceAlert = {
  exhibition: GalleryExhibition;
  daysUntilClose: number;
  matchedSignals: string[];
};

export type GallerySubmissionDraftInput = {
  galleryName?: string;
  areaId?: GalleryAreaId;
  title?: string;
  artists?: string[];
  opensAt?: string;
  closesAt?: string;
  receptionAt?: string;
  externalUrl?: string;
  submitterEmail?: string;
  notes?: string;
  createdAt?: string;
};

export type GallerySubmissionDraftResult = {
  draft: GallerySubmissionDraft;
  errors: string[];
};

const defaultReferenceNow = "2026-07-09T15:30:00-04:00";
const dayMs = 24 * 60 * 60 * 1000;

const visitStatusPriority: Record<GalleryVisitStatus, number> = {
  "open-now": 0,
  "opens-later": 1,
  "closed-for-day": 2,
  "closed-today": 3,
  "not-yet-open": 4,
  closed: 5
};

const walkModeConfig: Record<
  GalleryWalkMode,
  { label: string; minutes: number; maxStops: number; lastChanceDays?: 3 | 7 | 14 }
> = {
  "quick-loop": { label: "45-minute quick loop", minutes: 45, maxStops: 2 },
  "two-hour": { label: "2-hour Saturday walk", minutes: 120, maxStops: 5 },
  "opening-night": { label: "opening-night crawl", minutes: 95, maxStops: 4 },
  "last-chance": { label: "last-chance route", minutes: 95, maxStops: 4, lastChanceDays: 14 }
};

export const galleryVisitStatusLabels: Record<GalleryVisitStatus, string> = {
  "open-now": "Open now",
  "opens-later": "Opens later today",
  "closed-for-day": "Closed for today",
  "closed-today": "Closed today",
  "not-yet-open": "Not open yet",
  closed: "Closed"
};

export const galleryWalkModeLabels: Record<GalleryWalkMode, string> = {
  "quick-loop": "45-minute loop",
  "two-hour": "2-hour walk",
  "opening-night": "Opening crawl",
  "last-chance": "Last chance"
};

function getIsoMatch(iso: string): RegExpMatchArray | null {
  return iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
}

function getDateOnlyTimestamp(iso: string): number {
  const match = getIsoMatch(iso);
  const year = Number(match?.[1] ?? "1970");
  const month = Number(match?.[2] ?? "1");
  const day = Number(match?.[3] ?? "1");

  return Date.UTC(year, month - 1, day);
}

function getLocalDateKey(iso: string): string {
  const match = getIsoMatch(iso);

  if (!match) {
    return iso.slice(0, 10);
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function getLocalDayOfWeek(iso: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const timestamp = getDateOnlyTimestamp(iso);

  return new Date(timestamp).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

function getLocalTimeMinutes(iso: string): number {
  const match = getIsoMatch(iso);
  const hour = Number(match?.[4] ?? "0");
  const minute = Number(match?.[5] ?? "0");

  return hour * 60 + minute;
}

function parseClockMinutes(clock: string): number {
  const parts = clock.split(":");
  const hour = Number(parts[0] ?? "0");
  const minute = Number(parts[1] ?? "0");

  return hour * 60 + minute;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function toSlug(value: string): string {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "gallery-submission";
}

function getOnViewScore(exhibition: GalleryExhibition, referenceNow: string): number {
  const opensAt = getDateOnlyTimestamp(exhibition.opensAt);
  const closesAt = getDateOnlyTimestamp(exhibition.closesAt);
  const now = getDateOnlyTimestamp(referenceNow);

  if (now < opensAt) {
    return 1;
  }

  if (now > closesAt) {
    return -1;
  }

  return 0;
}

function isOnView(exhibition: GalleryExhibition, referenceNow: string): boolean {
  return getOnViewScore(exhibition, referenceNow) === 0;
}

function getDistanceMiles(from: Coordinates, to: Coordinates): number {
  const earthRadiusMiles = 3958.8;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const fromLatitude = (from.latitude * Math.PI) / 180;
  const toLatitude = (to.latitude * Math.PI) / 180;
  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

function getNeighborhoodsForArea(areaId: GalleryAreaId): GalleryNeighborhood[] {
  return galleryNeighborhoods.filter((neighborhood) => neighborhood.areaId === areaId);
}

function getDefaultWalkNeighborhood(
  areaId: GalleryAreaId,
  intelligence: GalleryNeighborhoodIntelligence[],
  mode: GalleryWalkMode
): string | undefined {
  if (mode === "opening-night") {
    const openingNeighborhood = intelligence.find((item) => item.openingTonightCount > 0);

    if (openingNeighborhood) {
      return openingNeighborhood.neighborhood;
    }
  }

  if (mode === "last-chance") {
    const lastChanceNeighborhood = intelligence.find((item) => item.lastChanceCount > 0);

    if (lastChanceNeighborhood) {
      return lastChanceNeighborhood.neighborhood;
    }
  }

  const supportable = intelligence.find((item) => item.canSupportWalk);
  const firstNeighborhood = getNeighborhoodsForArea(areaId)[0];

  return supportable?.neighborhood ?? firstNeighborhood?.name;
}

export function getDaysUntilGalleryCloses(
  exhibition: GalleryExhibition,
  referenceNow = defaultReferenceNow
): number {
  const closesAt = getDateOnlyTimestamp(exhibition.closesAt);
  const now = getDateOnlyTimestamp(referenceNow);

  return Math.ceil((closesAt - now) / dayMs);
}

export function getGalleryVisitStatus(
  exhibition: GalleryExhibition,
  referenceNow = defaultReferenceNow
): GalleryVisitStatus {
  const onViewScore = getOnViewScore(exhibition, referenceNow);

  if (onViewScore > 0) {
    return "not-yet-open";
  }

  if (onViewScore < 0) {
    return "closed";
  }

  const localDay = getLocalDayOfWeek(referenceNow);
  const todayIntervals = exhibition.hours
    .filter((interval) => interval.day === localDay)
    .sort((left, right) => parseClockMinutes(left.opens) - parseClockMinutes(right.opens));

  if (todayIntervals.length === 0) {
    return "closed-today";
  }

  const nowMinutes = getLocalTimeMinutes(referenceNow);
  const firstInterval = todayIntervals[0];
  const lastInterval = todayIntervals[todayIntervals.length - 1];

  if (firstInterval && nowMinutes < parseClockMinutes(firstInterval.opens)) {
    return "opens-later";
  }

  const openInterval = todayIntervals.find((interval) => {
    const opens = parseClockMinutes(interval.opens);
    const closes = parseClockMinutes(interval.closes);

    return nowMinutes >= opens && nowMinutes < closes;
  });

  if (openInterval) {
    return "open-now";
  }

  if (lastInterval && nowMinutes >= parseClockMinutes(lastInterval.closes)) {
    return "closed-for-day";
  }

  return "opens-later";
}

export function isGalleryOpeningTonight(
  exhibition: GalleryExhibition,
  referenceNow = defaultReferenceNow
): boolean {
  const today = getLocalDateKey(referenceNow);
  const receptionIsTonight =
    typeof exhibition.receptionAt === "string" && getLocalDateKey(exhibition.receptionAt) === today;
  const specialEventIsTonight = exhibition.specialEvents.some(
    (event) =>
      getLocalDateKey(event.startsAt) === today &&
      (event.kind === "opening-reception" ||
        event.kind === "artist-talk" ||
        event.kind === "walkthrough" ||
        event.kind === "rsvp-preview")
  );

  return isOnView(exhibition, referenceNow) && (receptionIsTonight || specialEventIsTonight);
}

export function isGalleryLastChance(
  exhibition: GalleryExhibition,
  referenceNow = defaultReferenceNow,
  days: 3 | 7 | 14 = 7
): boolean {
  const daysUntilClose = getDaysUntilGalleryCloses(exhibition, referenceNow);

  return daysUntilClose >= 0 && daysUntilClose <= days;
}

export function getGalleryWhyGoReasons(
  exhibition: GalleryExhibition,
  allExhibitions: GalleryExhibition[] = galleryExhibitions,
  referenceNow = defaultReferenceNow,
  savedIds: string[] = []
): string[] {
  const reasons: string[] = [];
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const daysUntilClose = getDaysUntilGalleryCloses(exhibition, referenceNow);
  const savedIdSet = new Set(savedIds);
  const savedNearbyCount = allExhibitions.filter(
    (candidate) =>
      candidate.id !== exhibition.id &&
      savedIdSet.has(candidate.id) &&
      candidate.areaId === exhibition.areaId &&
      candidate.neighborhood === exhibition.neighborhood
  ).length;

  if (status === "open-now" && exhibition.distanceMiles <= 0.5) {
    reasons.push("Good first stop");
  }

  if (isGalleryOpeningTonight(exhibition, referenceNow)) {
    reasons.push("Opening reception tonight");
  }

  if (daysUntilClose >= 0 && daysUntilClose <= 3) {
    reasons.push("Closing this weekend");
  } else if (daysUntilClose >= 0 && daysUntilClose <= 7) {
    reasons.push("Closing this week");
  }

  if (exhibition.mediums.includes("photography")) {
    reasons.push("Strong photography show");
  }

  if (savedNearbyCount >= 3) {
    reasons.push("Near three other saved shows");
  } else if (savedNearbyCount > 0) {
    reasons.push(`Near ${savedNearbyCount} saved show${savedNearbyCount === 1 ? "" : "s"}`);
  }

  if (exhibition.galleryKind === "emerging") {
    reasons.push("Emerging gallery");
  }

  if (exhibition.galleryKind === "nonprofit") {
    reasons.push("Nonprofit space");
  }

  if (exhibition.galleryKind === "blue-chip") {
    reasons.push("Blue-chip gallery");
  }

  if (reasons.length === 0 && exhibition.whyGoSignals.length > 0) {
    reasons.push(exhibition.whyGoSignals[0] ?? "Worth a look");
  }

  return Array.from(new Set(reasons)).slice(0, 5);
}

export function filterGalleryExhibitions(
  exhibitions: GalleryExhibition[],
  filters: GalleryDiscoveryFilters
): GalleryExhibition[] {
  const referenceNow = filters.referenceNow ?? defaultReferenceNow;
  const normalizedQuery = normalizeText(filters.query ?? "");
  const neighborhoodSet = new Set(filters.neighborhoods ?? []);
  const mediumSet = new Set(filters.mediums ?? []);

  return exhibitions
    .filter((exhibition) => exhibition.areaId === filters.areaId)
    .filter((exhibition) => neighborhoodSet.size === 0 || neighborhoodSet.has(exhibition.neighborhood))
    .filter(
      (exhibition) =>
        mediumSet.size === 0 || exhibition.mediums.some((medium) => mediumSet.has(medium))
    )
    .filter((exhibition) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = normalizeText(
        [
          exhibition.title,
          exhibition.galleryName,
          exhibition.neighborhood,
          exhibition.artists.join(" "),
          exhibition.mediums.join(" "),
          exhibition.description
        ].join(" ")
      );

      return haystack.includes(normalizedQuery);
    })
    .filter((exhibition) => !filters.openOnly || getGalleryVisitStatus(exhibition, referenceNow) === "open-now")
    .filter((exhibition) => !filters.openingOnly || isGalleryOpeningTonight(exhibition, referenceNow))
    .filter(
      (exhibition) =>
        !filters.lastChanceDays ||
        isGalleryLastChance(exhibition, referenceNow, filters.lastChanceDays)
    )
    .sort((left, right) => {
      const leftStatus = getGalleryVisitStatus(left, referenceNow);
      const rightStatus = getGalleryVisitStatus(right, referenceNow);
      const leftOpening = isGalleryOpeningTonight(left, referenceNow) ? -1 : 0;
      const rightOpening = isGalleryOpeningTonight(right, referenceNow) ? -1 : 0;
      const openingDelta = leftOpening - rightOpening;

      if (openingDelta !== 0) {
        return openingDelta;
      }

      const statusDelta = visitStatusPriority[leftStatus] - visitStatusPriority[rightStatus];

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return left.distanceMiles - right.distanceMiles;
    });
}

export function createGalleryWalkPlan(input: GalleryWalkPlanInput): GalleryWalkPlan {
  const referenceNow = input.referenceNow ?? defaultReferenceNow;
  const config = walkModeConfig[input.mode];
  const sourceExhibitions = input.exhibitions ?? galleryExhibitions;
  const intelligence = createNeighborhoodIntelligence(input.areaId, sourceExhibitions, referenceNow);
  const neighborhood =
    input.neighborhood ??
    getDefaultWalkNeighborhood(input.areaId, intelligence, input.mode) ??
    "Gallery district";
  const savedIdSet = new Set(input.savedIds ?? []);
  const minutesAtStop = 18;
  const transferMinutes = 7;
  const timeBudget = input.timeBudgetMinutes ?? config.minutes;
  const maxStopsByBudget = Math.max(
    1,
    Math.floor((timeBudget + transferMinutes) / (minutesAtStop + transferMinutes))
  );
  const maxStops = Math.min(config.maxStops, maxStopsByBudget);
  const baseCandidates = sourceExhibitions.filter(
    (exhibition) => exhibition.areaId === input.areaId && exhibition.neighborhood === neighborhood
  );
  const onViewCandidates = baseCandidates.filter((exhibition) => isOnView(exhibition, referenceNow));
  const modeCandidates =
    input.mode === "opening-night"
      ? onViewCandidates.filter((exhibition) => isGalleryOpeningTonight(exhibition, referenceNow))
      : input.mode === "last-chance"
        ? onViewCandidates.filter((exhibition) =>
            isGalleryLastChance(exhibition, referenceNow, config.lastChanceDays ?? 14)
          )
        : onViewCandidates.filter((exhibition) => {
            const status = getGalleryVisitStatus(exhibition, referenceNow);

            return status === "open-now" || status === "opens-later";
          });
  const candidates = (modeCandidates.length > 0 ? modeCandidates : onViewCandidates).sort(
    (left, right) => {
      const savedDelta = Number(savedIdSet.has(right.id)) - Number(savedIdSet.has(left.id));

      if (savedDelta !== 0) {
        return savedDelta;
      }

      const leftOpening = isGalleryOpeningTonight(left, referenceNow) ? -1 : 0;
      const rightOpening = isGalleryOpeningTonight(right, referenceNow) ? -1 : 0;
      const openingDelta = leftOpening - rightOpening;

      if (openingDelta !== 0) {
        return openingDelta;
      }

      if (input.mode === "last-chance") {
        return (
          getDaysUntilGalleryCloses(left, referenceNow) -
          getDaysUntilGalleryCloses(right, referenceNow)
        );
      }

      const statusDelta =
        visitStatusPriority[getGalleryVisitStatus(left, referenceNow)] -
        visitStatusPriority[getGalleryVisitStatus(right, referenceNow)];

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return left.distanceMiles - right.distanceMiles;
    }
  );
  const stops = candidates.slice(0, maxStops).map((exhibition) => ({
    exhibition,
    status: getGalleryVisitStatus(exhibition, referenceNow),
    reasons: getGalleryWhyGoReasons(exhibition, sourceExhibitions, referenceNow, input.savedIds ?? []),
    isSaved: savedIdSet.has(exhibition.id),
    minutesAtStop
  }));
  const routeDistance = stops.reduce((total, stop, index) => {
    const previous = stops[index - 1];

    if (!previous) {
      return total;
    }

    return total + getDistanceMiles(previous.exhibition.coordinates, stop.exhibition.coordinates);
  }, 0);
  const totalMinutes =
    stops.length * minutesAtStop + Math.max(0, stops.length - 1) * transferMinutes;
  const savedStopCount = stops.filter((stop) => stop.isSaved).length;
  const modeLabel = config.label;

  return {
    areaId: input.areaId,
    mode: input.mode,
    neighborhood,
    title: `${modeLabel}: ${neighborhood}`,
    summary:
      stops.length > 0
        ? `${stops.length} stops, ${totalMinutes} minutes, ${routeDistance.toFixed(1)} miles.`
        : `No ${modeLabel} is ready in ${neighborhood} yet.`,
    stops,
    savedStopCount,
    totalMinutes,
    totalDistanceMiles: Number(routeDistance.toFixed(2)),
    startsAt: referenceNow,
    canStartNow: stops.some((stop) => stop.status === "open-now")
  };
}

export function createNeighborhoodIntelligence(
  areaId: GalleryAreaId,
  exhibitions: GalleryExhibition[] = galleryExhibitions,
  referenceNow = defaultReferenceNow
): GalleryNeighborhoodIntelligence[] {
  return getNeighborhoodsForArea(areaId).map((neighborhood) => {
    const neighborhoodExhibitions = exhibitions.filter(
      (exhibition) =>
        exhibition.areaId === areaId &&
        exhibition.neighborhood === neighborhood.name &&
        isOnView(exhibition, referenceNow)
    );
    const openNowCount = neighborhoodExhibitions.filter(
      (exhibition) => getGalleryVisitStatus(exhibition, referenceNow) === "open-now"
    ).length;
    const opensLaterCount = neighborhoodExhibitions.filter(
      (exhibition) => getGalleryVisitStatus(exhibition, referenceNow) === "opens-later"
    ).length;
    const openingTonightCount = neighborhoodExhibitions.filter((exhibition) =>
      isGalleryOpeningTonight(exhibition, referenceNow)
    ).length;
    const lastChanceCount = neighborhoodExhibitions.filter((exhibition) =>
      isGalleryLastChance(exhibition, referenceNow, 14)
    ).length;
    const canSupportWalk =
      neighborhoodExhibitions.length >= 2 && openNowCount + opensLaterCount >= 2;
    const topReason =
      openingTonightCount > 0
        ? "Opening-night supply"
        : lastChanceCount > 0
          ? "Last-chance route possible"
          : canSupportWalk
            ? "Enough supply for a walk"
            : "Needs more current listings";

    return {
      neighborhood: neighborhood.name,
      walkLabel: neighborhood.walkLabel,
      exhibitionCount: neighborhoodExhibitions.length,
      openNowCount,
      opensLaterCount,
      openingTonightCount,
      lastChanceCount,
      canSupportWalk,
      topReason
    };
  });
}

export function createGallerySourceTrustSummary(
  areaId: GalleryAreaId,
  exhibitions: GalleryExhibition[] = galleryExhibitions,
  referenceNow = defaultReferenceNow
): GallerySourceTrustSummary {
  const marketExhibitions = exhibitions.filter(
    (exhibition) => exhibition.areaId === areaId && isOnView(exhibition, referenceNow)
  );
  const exhibitionCount = marketExhibitions.length;
  const coveragePercent = (covered: number) =>
    exhibitionCount === 0 ? 0 : Math.round((covered / exhibitionCount) * 100);
  const openingCount = marketExhibitions.filter((exhibition) =>
    isGalleryOpeningTonight(exhibition, referenceNow)
  ).length;
  const hoursCoveragePercent = coveragePercent(
    marketExhibitions.filter((exhibition) => exhibition.hours.length > 0).length
  );
  const addressCoveragePercent = coveragePercent(
    marketExhibitions.filter((exhibition) => exhibition.address.trim().length > 0).length
  );
  const externalLinkCoveragePercent = coveragePercent(
    marketExhibitions.filter((exhibition) => exhibition.externalUrl.trim().length > 0).length
  );
  const staleSourceRiskCount = marketExhibitions.filter(
    (exhibition) => exhibition.sourceFreshness === "stale-risk"
  ).length;
  const freshSourceCount = marketExhibitions.filter(
    (exhibition) => exhibition.sourceFreshness === "fresh"
  ).length;
  const officialOrSubmissionCount = marketExhibitions.filter(
    (exhibition) =>
      exhibition.sourceLegalStatus === "official-public-page" ||
      exhibition.sourceLegalStatus === "partner-submission"
  ).length;
  const recommendedNextAction =
    staleSourceRiskCount > 0
      ? "Review stale sources before featuring them heavily."
      : openingCount === 0
        ? "Add opening-night sources for this market."
        : "Market is ready for gallery-walk discovery.";

  return {
    areaId,
    exhibitionCount,
    openingCount,
    hoursCoveragePercent,
    addressCoveragePercent,
    externalLinkCoveragePercent,
    staleSourceRiskCount,
    freshSourceCount,
    officialOrSubmissionCount,
    recommendedNextAction
  };
}

export function getLastChanceGalleryAlerts(
  exhibitions: GalleryExhibition[],
  preferences: GalleryAlertPreferences
): GalleryLastChanceAlert[] {
  const referenceNow = preferences.referenceNow ?? defaultReferenceNow;
  const savedArtistSet = new Set((preferences.savedArtists ?? []).map(normalizeText));
  const savedGallerySet = new Set((preferences.savedGalleries ?? []).map(normalizeText));
  const neighborhoodSet = new Set(preferences.neighborhoods ?? []);
  const mediumSet = new Set(preferences.mediums ?? []);
  const hasCriteria =
    savedArtistSet.size > 0 ||
    savedGallerySet.size > 0 ||
    neighborhoodSet.size > 0 ||
    mediumSet.size > 0;

  return exhibitions
    .filter((exhibition) => !preferences.areaId || exhibition.areaId === preferences.areaId)
    .filter((exhibition) => isGalleryLastChance(exhibition, referenceNow, preferences.days))
    .map((exhibition) => {
      const matchedSignals: string[] = [];

      if (exhibition.artists.some((artist) => savedArtistSet.has(normalizeText(artist)))) {
        matchedSignals.push("saved artist");
      }

      if (savedGallerySet.has(normalizeText(exhibition.galleryName))) {
        matchedSignals.push("saved gallery");
      }

      if (neighborhoodSet.has(exhibition.neighborhood)) {
        matchedSignals.push("saved neighborhood");
      }

      if (exhibition.mediums.some((medium) => mediumSet.has(medium))) {
        matchedSignals.push("saved medium");
      }

      if (!hasCriteria) {
        matchedSignals.push("closing soon");
      }

      return {
        exhibition,
        daysUntilClose: getDaysUntilGalleryCloses(exhibition, referenceNow),
        matchedSignals
      };
    })
    .filter((alert) => alert.matchedSignals.length > 0)
    .sort((left, right) => left.daysUntilClose - right.daysUntilClose);
}

export function upsertGalleryLogEntry(
  entries: GalleryLogEntry[],
  exhibitionId: string,
  status: GalleryLogStatus,
  note: string | undefined,
  updatedAt = new Date().toISOString()
): GalleryLogEntry[] {
  const nextEntry: GalleryLogEntry = {
    exhibitionId,
    status,
    note,
    updatedAt
  };
  const existingIndex = entries.findIndex((entry) => entry.exhibitionId === exhibitionId);

  if (existingIndex < 0) {
    return [...entries, nextEntry];
  }

  return entries.map((entry, index) => (index === existingIndex ? nextEntry : entry));
}

export function createGallerySubmissionDraft(
  input: GallerySubmissionDraftInput
): GallerySubmissionDraftResult {
  const errors: string[] = [];
  const galleryName = input.galleryName?.trim() ?? "";
  const title = input.title?.trim() ?? "";
  const artists = (input.artists ?? []).map((artist) => artist.trim()).filter(Boolean);
  const opensAt = input.opensAt?.trim() ?? "";
  const closesAt = input.closesAt?.trim() ?? "";
  const externalUrl = input.externalUrl?.trim() ?? "";
  const areaId = input.areaId ?? "nyc";
  const createdAt = input.createdAt ?? new Date().toISOString();

  if (!galleryName) {
    errors.push("galleryName is required");
  }

  if (!title) {
    errors.push("title is required");
  }

  if (artists.length === 0) {
    errors.push("at least one artist is required");
  }

  if (!opensAt) {
    errors.push("opensAt is required");
  }

  if (!closesAt) {
    errors.push("closesAt is required");
  }

  if (!externalUrl) {
    errors.push("externalUrl is required");
  }

  const draft: GallerySubmissionDraft = {
    id: `submission-${toSlug(galleryName)}-${toSlug(title)}`,
    galleryName: galleryName || "Missing gallery",
    areaId,
    title: title || "Missing title",
    artists,
    opensAt: opensAt || createdAt,
    closesAt: closesAt || createdAt,
    receptionAt: input.receptionAt,
    externalUrl: externalUrl || "https://example.org/missing-submission-url",
    submitterEmail: input.submitterEmail,
    notes: input.notes,
    sourceLegalStatus: "partner-submission",
    status: errors.length === 0 ? "ready-for-review" : "needs-required-fields",
    createdAt
  };

  return { draft, errors };
}

export function getSavedGalleryIdsFromLog(entries: GalleryLogEntry[]): string[] {
  return entries
    .filter((entry) => entry.status === "saved" || entry.status === "want-to-see")
    .map((entry) => entry.exhibitionId);
}
