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
  | "last-chance"
  | "for-you";

export type GalleryDiscoveryFilters = {
  areaId: GalleryAreaId;
  neighborhoods?: string[];
  mediums?: GalleryMedium[];
  query?: string;
  openOnly?: boolean;
  openingOnly?: boolean;
  verifiedOnly?: boolean;
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
  personalizedScores?: Record<string, number>;
  personalizedReasons?: Record<string, string[]>;
};

export type GalleryWalkStop = {
  exhibition: GalleryExhibition;
  exhibitions: GalleryExhibition[];
  groupedExhibitionCount: number;
  status: GalleryVisitStatus;
  reasons: string[];
  isSaved: boolean;
  minutesAtStop: number;
  stopNumber: number;
  mapUrl: string;
};

export type GalleryWalkLeg = {
  fromStopNumber: number;
  toStopNumber: number;
  fromExhibitionId: string;
  toExhibitionId: string;
  distanceMiles: number;
  walkingMinutes: number;
  mapUrl: string;
};

export type GalleryWalkReadinessLevel = "ready" | "thin" | "not-ready";

export type GalleryWalkPlan = {
  areaId: GalleryAreaId;
  mode: GalleryWalkMode;
  neighborhood?: string;
  title: string;
  summary: string;
  stops: GalleryWalkStop[];
  legs: GalleryWalkLeg[];
  savedStopCount: number;
  totalMinutes: number;
  totalDistanceMiles: number;
  startsAt: string;
  canStartNow: boolean;
  startStopId?: string;
  nextStopId?: string;
  routeMapUrl?: string;
  guidance: string;
  readinessLevel: GalleryWalkReadinessLevel;
  readinessCopy: string;
  selectionReasons: string[];
};

export type GalleryNeighborhoodIntelligence = {
  neighborhood: string;
  walkLabel: string;
  exhibitionCount: number;
  verifiedCount: number;
  fixtureCount: number;
  needsReviewCount: number;
  uniqueGalleryCount: number;
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
  verifiedExhibitionCount: number;
  fixtureExhibitionCount: number;
  submittedExhibitionCount: number;
  needsReviewExhibitionCount: number;
  openingCount: number;
  hoursCoveragePercent: number;
  addressCoveragePercent: number;
  externalLinkCoveragePercent: number;
  staleSourceRiskCount: number;
  freshSourceCount: number;
  officialOrSubmissionCount: number;
  recommendedNextAction: string;
};

export type GalleryInventoryTrustKind =
  | "fixture-demo"
  | "manual-verified"
  | "partner-submitted"
  | "needs-review"
  | "stale-needs-review";

export type GalleryInventoryTrust = {
  kind: GalleryInventoryTrustKind;
  label: string;
  sourceLabel: string;
  checkedLabel: string;
  isFixture: boolean;
  isVerified: boolean;
  hasOfficialLink: boolean;
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

type GalleryOpeningTimingStatus = "upcoming" | "active" | "ended";

type GalleryOpeningTiming = {
  startsAt: string;
  endsAt?: string;
  status: GalleryOpeningTimingStatus;
  sortMinutes: number;
  label: string;
};

type GalleryRouteGroup = {
  key: string;
  exhibition: GalleryExhibition;
  exhibitions: GalleryExhibition[];
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
  "last-chance": { label: "last-chance route", minutes: 95, maxStops: 4, lastChanceDays: 14 },
  "for-you": { label: "personalized walk", minutes: 105, maxStops: 4 }
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
  "quick-loop": "Quick loop",
  "two-hour": "2-hour walk",
  "opening-night": "Opening-night crawl",
  "last-chance": "Last-chance route",
  "for-you": "For you"
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

function getTimeLabel(iso: string): string {
  const totalMinutes = getLocalTimeMinutes(iso);
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  const minuteLabel = minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;

  return `${hour12}${minuteLabel} ${period}`;
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

function isExampleUrl(url: string): boolean {
  return url.includes("example.org") || url.includes("example.com");
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

function getWalkingMinutes(distanceMiles: number): number {
  if (distanceMiles <= 0) {
    return 0;
  }

  return Math.max(2, Math.round(distanceMiles * 20));
}

function getMapQuery(value: string): string {
  return encodeURIComponent(value);
}

export function getGalleryStopMapUrl(exhibition: GalleryExhibition): string {
  return `https://www.google.com/maps/search/?api=1&query=${getMapQuery(
    `${exhibition.galleryName}, ${exhibition.address}`
  )}`;
}

function getGalleryDirectionsMapUrl(stops: GalleryWalkStop[]): string | undefined {
  if (stops.length === 0) {
    return undefined;
  }

  const routeStops = stops.map((stop) => `${stop.exhibition.galleryName}, ${stop.exhibition.address}`);
  const origin = routeStops[0];
  const destination = routeStops[routeStops.length - 1];
  const waypoints = routeStops.slice(1, -1);
  const waypointQuery = waypoints.length > 0 ? `&waypoints=${getMapQuery(waypoints.join("|"))}` : "";

  return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${getMapQuery(
    origin ?? ""
  )}&destination=${getMapQuery(destination ?? origin ?? "")}${waypointQuery}`;
}

function getGalleryLegMapUrl(from: GalleryExhibition, to: GalleryExhibition): string {
  return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${getMapQuery(
    `${from.galleryName}, ${from.address}`
  )}&destination=${getMapQuery(`${to.galleryName}, ${to.address}`)}`;
}

export function isGalleryFixtureInventory(exhibition: GalleryExhibition): boolean {
  return exhibition.source === "seed-fixture" || isExampleUrl(exhibition.externalUrl);
}

export function isGalleryVerifiedInventory(exhibition: GalleryExhibition): boolean {
  return (
    !isGalleryFixtureInventory(exhibition) &&
    exhibition.sourceLegalStatus === "official-public-page" &&
    exhibition.sourceFreshness === "fresh" &&
    exhibition.externalUrl.trim().length > 0
  );
}

export function getGalleryInventoryTrust(exhibition: GalleryExhibition): GalleryInventoryTrust {
  const isFixture = isGalleryFixtureInventory(exhibition);
  const isVerified = isGalleryVerifiedInventory(exhibition);
  const checkedAt =
    exhibition.verifiedAsOf ?? exhibition.sourceCheckedAt ?? exhibition.sourceUpdatedAt;
  const checkedLabel = isFixture
    ? "Fixture/demo"
    : isVerified
      ? `Verified as of ${formatTrustDate(checkedAt)}`
      : exhibition.sourceFreshness === "stale-risk"
        ? "Needs review"
        : exhibition.sourceFreshness === "needs-review"
          ? "Needs review"
          : `Source checked ${formatTrustDate(checkedAt)}`;

  if (isFixture) {
    return {
      kind: "fixture-demo",
      label: "Fixture/demo",
      sourceLabel: "Demo listing",
      checkedLabel,
      isFixture,
      isVerified: false,
      hasOfficialLink: false
    };
  }

  if (exhibition.sourceLegalStatus === "partner-submission") {
    return {
      kind: "partner-submitted",
      label: "Partner/submitted",
      sourceLabel: "Submitted listing",
      checkedLabel,
      isFixture,
      isVerified: false,
      hasOfficialLink: exhibition.externalUrl.trim().length > 0
    };
  }

  if (exhibition.sourceFreshness === "stale-risk") {
    return {
      kind: "stale-needs-review",
      label: "Needs review",
      sourceLabel: "Stale source",
      checkedLabel,
      isFixture,
      isVerified: false,
      hasOfficialLink: exhibition.externalUrl.trim().length > 0
    };
  }

  if (!isVerified || exhibition.sourceFreshness === "needs-review") {
    return {
      kind: "needs-review",
      label: "Needs review",
      sourceLabel: "Review source",
      checkedLabel,
      isFixture,
      isVerified: false,
      hasOfficialLink: exhibition.externalUrl.trim().length > 0
    };
  }

  return {
    kind: "manual-verified",
    label: "Manually verified",
    sourceLabel: "Official gallery link",
    checkedLabel,
    isFixture,
    isVerified,
    hasOfficialLink: true
  };
}

function formatTrustDate(iso: string): string {
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

function getDatePart(iso: string, index: number): string {
  return iso.match(/^(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?/)?.[index] ?? "";
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
  return isOnView(exhibition, referenceNow) && getGalleryOpeningTimings(exhibition, referenceNow).length > 0;
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

function isRouteUsableStatus(status: GalleryVisitStatus): boolean {
  return status === "open-now" || status === "opens-later";
}

function getRouteTrustPriority(exhibition: GalleryExhibition): number {
  const trust = getGalleryInventoryTrust(exhibition);

  if (trust.isVerified) {
    return 0;
  }

  if (trust.kind === "partner-submitted") {
    return 1;
  }

  if (trust.kind === "needs-review" || trust.kind === "stale-needs-review") {
    return 2;
  }

  return 3;
}

function getGalleryRouteNameKey(exhibition: GalleryExhibition): string {
  return normalizeText(exhibition.galleryName);
}

function getGalleryRouteGroupKey(exhibition: GalleryExhibition): string {
  return normalizeText(`${exhibition.galleryName}|${exhibition.address}`);
}

function getOpeningTimingStatus(
  startsAt: string,
  endsAt: string | undefined,
  referenceNow: string
): GalleryOpeningTimingStatus {
  const nowMinutes = getLocalTimeMinutes(referenceNow);
  const startMinutes = getLocalTimeMinutes(startsAt);
  const endMinutes = endsAt ? getLocalTimeMinutes(endsAt) : startMinutes + 120;

  if (nowMinutes >= endMinutes) {
    return "ended";
  }

  if (nowMinutes >= startMinutes) {
    return "active";
  }

  return "upcoming";
}

function getOpeningTimingLabel(timing: GalleryOpeningTiming): string {
  if (timing.status === "active") {
    return "Reception still active";
  }

  if (timing.status === "ended") {
    return "Too late for this opening";
  }

  return `Starts at ${getTimeLabel(timing.startsAt)}`;
}

function getGalleryOpeningTimings(
  exhibition: GalleryExhibition,
  referenceNow: string
): GalleryOpeningTiming[] {
  const today = getLocalDateKey(referenceNow);
  const timings = exhibition.specialEvents
    .filter(
      (event) =>
        getLocalDateKey(event.startsAt) === today &&
        (event.kind === "opening-reception" ||
          event.kind === "artist-talk" ||
          event.kind === "walkthrough" ||
          event.kind === "rsvp-preview")
    )
    .map((event): GalleryOpeningTiming => {
      const status = getOpeningTimingStatus(event.startsAt, event.endsAt, referenceNow);

      return {
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        status,
        sortMinutes: getLocalTimeMinutes(event.startsAt),
        label: getOpeningTimingLabel({
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          status,
          sortMinutes: getLocalTimeMinutes(event.startsAt),
          label: ""
        })
      };
    });

  if (
    typeof exhibition.receptionAt === "string" &&
    getLocalDateKey(exhibition.receptionAt) === today &&
    !timings.some((timing) => timing.startsAt === exhibition.receptionAt)
  ) {
    const status = getOpeningTimingStatus(exhibition.receptionAt, undefined, referenceNow);

    timings.push({
      startsAt: exhibition.receptionAt,
      status,
      sortMinutes: getLocalTimeMinutes(exhibition.receptionAt),
      label: getOpeningTimingLabel({
        startsAt: exhibition.receptionAt,
        status,
        sortMinutes: getLocalTimeMinutes(exhibition.receptionAt),
        label: ""
      })
    });
  }

  return timings.sort((left, right) => {
    const statusRank: Record<GalleryOpeningTimingStatus, number> = {
      active: 0,
      upcoming: 1,
      ended: 2
    };
    const statusDelta = statusRank[left.status] - statusRank[right.status];

    if (statusDelta !== 0) {
      return statusDelta;
    }

    return left.sortMinutes - right.sortMinutes;
  });
}

function getBestGalleryOpeningTiming(
  exhibition: GalleryExhibition,
  referenceNow: string
): GalleryOpeningTiming | undefined {
  return getGalleryOpeningTimings(exhibition, referenceNow)[0];
}

function getRouteModeScore(
  exhibition: GalleryExhibition,
  referenceNow: string,
  mode: GalleryWalkMode
): number {
  if (mode === "opening-night") {
    const timing = getBestGalleryOpeningTiming(exhibition, referenceNow);
    const statusRank: Record<GalleryOpeningTimingStatus, number> = {
      active: 0,
      upcoming: 1,
      ended: 3
    };

    return timing ? statusRank[timing.status] * 10000 + timing.sortMinutes : 50000;
  }

  if (mode === "last-chance") {
    const daysUntilClose = getDaysUntilGalleryCloses(exhibition, referenceNow);

    return daysUntilClose >= 0 ? daysUntilClose : 30;
  }

  return 0;
}

function getRouteCandidateScore(input: {
  candidate: GalleryExhibition;
  previous?: GalleryExhibition;
  referenceNow: string;
  savedIdSet: Set<string>;
  selectedGalleryNames?: Set<string>;
  mode: GalleryWalkMode;
  personalizedScores?: Map<string, number>;
}): number {
  const status = getGalleryVisitStatus(input.candidate, input.referenceNow);
  const distance = input.previous
    ? getDistanceMiles(input.previous.coordinates, input.candidate.coordinates)
    : input.candidate.distanceMiles;
  const isDuplicateGallery =
    input.selectedGalleryNames?.has(getGalleryRouteNameKey(input.candidate)) ?? false;
  const savedScore = input.savedIdSet.has(input.candidate.id) ? -1000 : 0;
  const duplicatePenalty = isDuplicateGallery ? 90 : 0;
  const personalizedScore =
    input.mode === "for-you" ? input.personalizedScores?.get(input.candidate.id) ?? 0 : 0;

  return (
    savedScore +
    duplicatePenalty +
    personalizedScore * -2 +
    visitStatusPriority[status] * 45 +
    getRouteTrustPriority(input.candidate) * 18 +
    getRouteModeScore(input.candidate, input.referenceNow, input.mode) +
    distance * 20
  );
}

function sortRouteGroupExhibitions(
  exhibitions: GalleryExhibition[],
  referenceNow: string,
  savedIdSet: Set<string>,
  mode: GalleryWalkMode,
  personalizedScores?: Map<string, number>
): GalleryExhibition[] {
  return [...exhibitions].sort((left, right) => {
    const savedDelta = Number(savedIdSet.has(right.id)) - Number(savedIdSet.has(left.id));

    if (savedDelta !== 0) {
      return savedDelta;
    }

    const scoreDelta =
      getRouteCandidateScore({
        candidate: left,
        referenceNow,
        savedIdSet,
        mode,
        personalizedScores
      }) -
      getRouteCandidateScore({
        candidate: right,
        referenceNow,
        savedIdSet,
        mode,
        personalizedScores
      });

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return left.title.localeCompare(right.title);
  });
}

function createGalleryRouteGroups(
  routeCandidates: GalleryExhibition[],
  groupSourceCandidates: GalleryExhibition[],
  referenceNow: string,
  savedIdSet: Set<string>,
  mode: GalleryWalkMode,
  personalizedScores?: Map<string, number>
): GalleryRouteGroup[] {
  const sourceGroups = new Map<string, GalleryExhibition[]>();
  const routeGroups = new Map<string, GalleryExhibition[]>();

  for (const exhibition of groupSourceCandidates) {
    const key = getGalleryRouteGroupKey(exhibition);
    const group = sourceGroups.get(key) ?? [];

    group.push(exhibition);
    sourceGroups.set(key, group);
  }

  for (const exhibition of routeCandidates) {
    const key = getGalleryRouteGroupKey(exhibition);
    const group = routeGroups.get(key) ?? [];

    group.push(exhibition);
    routeGroups.set(key, group);
  }

  return Array.from(routeGroups.entries()).flatMap(([key, groupRouteCandidates]) => {
    const sortedRouteCandidates = sortRouteGroupExhibitions(
      groupRouteCandidates,
      referenceNow,
      savedIdSet,
      mode,
      personalizedScores
    );
    const exhibition = sortedRouteCandidates[0] ?? groupRouteCandidates[0];

    if (!exhibition) {
      return [];
    }

    const sourceGroup = sourceGroups.get(key) ?? groupRouteCandidates;
    const groupedExhibitions = exhibition
      ? [
          exhibition,
          ...sortRouteGroupExhibitions(
            sourceGroup,
            referenceNow,
            savedIdSet,
            mode,
            personalizedScores
          ).filter((candidate) => candidate.id !== exhibition.id)
        ]
      : sortRouteGroupExhibitions(sourceGroup, referenceNow, savedIdSet, mode, personalizedScores);

    return [{
      key,
      exhibition,
      exhibitions: groupedExhibitions
    }];
  });
}

function getRouteReasonSet(
  exhibition: GalleryExhibition,
  previous: GalleryExhibition | undefined,
  referenceNow: string,
  options: {
    groupedExhibitionCount?: number;
    mode?: GalleryWalkMode;
  } = {}
): string[] {
  const reasons: string[] = [];
  const status = getGalleryVisitStatus(exhibition, referenceNow);
  const trust = getGalleryInventoryTrust(exhibition);
  const daysUntilClose = getDaysUntilGalleryCloses(exhibition, referenceNow);
  const openingTiming = getBestGalleryOpeningTiming(exhibition, referenceNow);

  if ((options.groupedExhibitionCount ?? 1) > 1) {
    reasons.push(`Grouped ${options.groupedExhibitionCount} shows here`);
  }

  if (status === "open-now") {
    reasons.push("Open now");
  } else if (status === "opens-later") {
    reasons.push("Opens later");
  }

  if (previous) {
    const distance = getDistanceMiles(previous.coordinates, exhibition.coordinates);

    if (distance <= 0.25) {
      reasons.push(trust.isVerified ? "Closest verified next stop" : "Very nearby");
    } else if (distance <= 0.5) {
      reasons.push("Nearby");
    }

    reasons.push("Avoids repeat gallery stops");
  } else {
    reasons.push("Start here");
  }

  if (daysUntilClose >= 0 && daysUntilClose <= 7) {
    reasons.push("Closing soon");
  }

  if (isGalleryOpeningTonight(exhibition, referenceNow)) {
    reasons.push("Opening tonight");
  }

  if (options.mode === "opening-night" && openingTiming) {
    reasons.push(openingTiming.label);
    reasons.push("Best opening-time sequence");
  }

  if (options.mode === "for-you") {
    reasons.push("Personalized pick");
  }

  if (trust.isVerified) {
    reasons.push("Verified official source");
  } else if (trust.isFixture) {
    reasons.push("Fixture/demo");
  } else if (trust.kind === "partner-submitted") {
    reasons.push("Partner/submitted");
  }

  return Array.from(new Set(reasons)).slice(0, 5);
}

function getFirstRouteCandidate(
  candidates: GalleryExhibition[],
  referenceNow: string,
  savedIdSet: Set<string> = new Set(),
  mode: GalleryWalkMode = "quick-loop",
  personalizedScores?: Map<string, number>
): GalleryExhibition | undefined {
  return [...candidates].sort((left, right) => {
    const scoreDelta =
      getRouteCandidateScore({
        candidate: left,
        referenceNow,
        savedIdSet,
        mode,
        personalizedScores
      }) -
      getRouteCandidateScore({
        candidate: right,
        referenceNow,
        savedIdSet,
        mode,
        personalizedScores
      });

    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return left.title.localeCompare(right.title);
  })[0];
}

function orderGalleryWalkCandidates(
  candidates: GalleryExhibition[],
  referenceNow: string,
  savedIdSet: Set<string> = new Set(),
  mode: GalleryWalkMode = "quick-loop",
  personalizedScores?: Map<string, number>
): GalleryExhibition[] {
  const firstCandidate = getFirstRouteCandidate(
    candidates,
    referenceNow,
    savedIdSet,
    mode,
    personalizedScores
  );

  if (!firstCandidate) {
    return [];
  }

  const ordered = [firstCandidate];
  const remaining = candidates.filter((candidate) => candidate.id !== firstCandidate.id);

  while (remaining.length > 0) {
    const previous = ordered[ordered.length - 1];
    const selectedGalleryNames = new Set(ordered.map(getGalleryRouteNameKey));
    const nextIndex = remaining
      .map((candidate, index) => ({
        candidate,
        index,
        distance: previous ? getDistanceMiles(previous.coordinates, candidate.coordinates) : 0
      }))
      .sort((left, right) => {
        const scoreDelta =
          getRouteCandidateScore({
            candidate: left.candidate,
            previous,
            referenceNow,
            savedIdSet,
            selectedGalleryNames,
            mode,
            personalizedScores
          }) -
          getRouteCandidateScore({
            candidate: right.candidate,
            previous,
            referenceNow,
            savedIdSet,
            selectedGalleryNames,
            mode,
            personalizedScores
          });

        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        const distanceDelta = left.distance - right.distance;

        if (distanceDelta !== 0) {
          return distanceDelta;
        }

        return left.candidate.title.localeCompare(right.candidate.title);
      })[0]?.index;

    if (typeof nextIndex !== "number") {
      break;
    }

    const [nextCandidate] = remaining.splice(nextIndex, 1);

    if (nextCandidate) {
      ordered.push(nextCandidate);
    }
  }

  return ordered;
}

function getWalkReadiness(
  stops: GalleryWalkStop[],
  neighborhood: string,
  modeLabel: string,
  mode: GalleryWalkMode
): {
  readinessLevel: GalleryWalkReadinessLevel;
  readinessCopy: string;
} {
  const usableStops = stops.filter((stop) => isRouteUsableStatus(stop.status)).length;
  const verifiedStops = stops.filter((stop) => getGalleryInventoryTrust(stop.exhibition).isVerified)
    .length;
  const uniqueGalleryCount = new Set(stops.map((stop) => getGalleryRouteNameKey(stop.exhibition)))
    .size;
  const repeatedGalleryCount = stops.length - uniqueGalleryCount;
  const requiredUniqueStops = mode === "quick-loop" ? 2 : 3;
  const requiredVerifiedStops = Math.min(2, requiredUniqueStops);

  if (
    stops.length >= requiredUniqueStops &&
    usableStops >= requiredUniqueStops &&
    verifiedStops >= requiredVerifiedStops &&
    uniqueGalleryCount >= requiredUniqueStops
  ) {
    return {
      readinessLevel: "ready",
      readinessCopy: `${neighborhood} has enough verified, open listings for this ${modeLabel}.`
    };
  }

  if (stops.length > 0 && stops.length < requiredUniqueStops) {
    return {
      readinessLevel: stops.length >= 2 && usableStops >= 1 ? "thin" : "not-ready",
      readinessCopy: `${neighborhood} has only ${stops.length} unique gallery stop${
        stops.length === 1 ? "" : "s"
      } for this ${modeLabel}; group depth is useful, but the neighborhood is thin today.`
    };
  }

  if (stops.length >= 2 && usableStops >= 1) {
    if (repeatedGalleryCount > 0) {
      return {
        readinessLevel: "thin",
        readinessCopy: `${neighborhood} can support a light walk, but this route repeats a gallery because unique verified alternatives are thin.`
      };
    }

    return {
      readinessLevel: "thin",
      readinessCopy: `${neighborhood} can support a light walk, but verified inventory is still thin.`
    };
  }

  return {
    readinessLevel: "not-ready",
    readinessCopy: `${neighborhood} does not have enough verified, open listings for a strong ${modeLabel} yet.`
  };
}

function getFallbackNeighborhoodCopy(
  intelligence: GalleryNeighborhoodIntelligence[],
  currentNeighborhood: string
): string {
  const fallback = intelligence
    .filter(
      (item) =>
        item.neighborhood !== currentNeighborhood &&
        item.canSupportWalk &&
        item.openNowCount + item.opensLaterCount > 0
    )
    .sort((left, right) => {
      const usableDelta =
        right.openNowCount + right.opensLaterCount - (left.openNowCount + left.opensLaterCount);

      if (usableDelta !== 0) {
        return usableDelta;
      }

      return right.exhibitionCount - left.exhibitionCount;
    })[0];

  return fallback ? ` Try ${fallback.neighborhood} for a stronger route.` : "";
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
    .filter((exhibition) => !filters.verifiedOnly || getGalleryInventoryTrust(exhibition).isVerified)
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
  const personalizedScores = new Map(
    Object.entries(input.personalizedScores ?? {}).map(([id, score]) => [id, Number(score)] as const)
  );
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
  const openingCandidates = onViewCandidates.filter((exhibition) =>
    isGalleryOpeningTonight(exhibition, referenceNow)
  );
  const currentOpeningCandidates = openingCandidates.filter(
    (exhibition) => getBestGalleryOpeningTiming(exhibition, referenceNow)?.status !== "ended"
  );
  const modeCandidates =
    input.mode === "opening-night"
      ? currentOpeningCandidates.length > 0
        ? currentOpeningCandidates
        : openingCandidates
      : input.mode === "last-chance"
        ? onViewCandidates.filter((exhibition) =>
            isGalleryLastChance(exhibition, referenceNow, config.lastChanceDays ?? 14)
          )
        : onViewCandidates.filter((exhibition) => {
            const status = getGalleryVisitStatus(exhibition, referenceNow);

            return status === "open-now" || status === "opens-later";
          });
  const preSortedCandidates = (modeCandidates.length > 0 ? modeCandidates : onViewCandidates).sort(
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
  const usableCandidates = preSortedCandidates.filter((exhibition) =>
    isRouteUsableStatus(getGalleryVisitStatus(exhibition, referenceNow))
  );
  const routeCandidates =
    usableCandidates.length >= Math.min(2, maxStops) ? usableCandidates : preSortedCandidates;
  const routeGroups = createGalleryRouteGroups(
    routeCandidates,
    onViewCandidates,
    referenceNow,
    savedIdSet,
    input.mode,
    personalizedScores
  );
  const routeGroupByPrimaryId = new Map(
    routeGroups.map((group) => [group.exhibition.id, group] as const)
  );
  const selectedGroups = orderGalleryWalkCandidates(
    routeGroups.map((group) => group.exhibition),
    referenceNow,
    savedIdSet,
    input.mode,
    personalizedScores
  )
    .slice(0, maxStops)
    .map((exhibition) => routeGroupByPrimaryId.get(exhibition.id))
    .filter((group): group is GalleryRouteGroup => Boolean(group));
  const stops = selectedGroups.map((group, index) => {
    const exhibition = group.exhibition;
    const previous = selectedGroups[index - 1]?.exhibition;
    const routeReasons = getRouteReasonSet(exhibition, previous, referenceNow, {
      groupedExhibitionCount: group.exhibitions.length,
      mode: input.mode
    });
    const personalizedReasons = input.personalizedReasons?.[exhibition.id] ?? [];
    const whyGoReasons = getGalleryWhyGoReasons(
      exhibition,
      sourceExhibitions,
      referenceNow,
      input.savedIds ?? []
    );
    const isSaved = group.exhibitions.some((candidate) => savedIdSet.has(candidate.id));
    const savedReasons = isSaved ? ["Saved by user"] : [];
    const stopMinutesAtStop = minutesAtStop + Math.min(12, Math.max(0, group.exhibitions.length - 1) * 6);

    return {
      exhibition,
      exhibitions: group.exhibitions,
      groupedExhibitionCount: group.exhibitions.length,
      status: getGalleryVisitStatus(exhibition, referenceNow),
      reasons: Array.from(
        new Set([...savedReasons, ...personalizedReasons, ...routeReasons, ...whyGoReasons])
      ).slice(0, 5),
      isSaved,
      minutesAtStop: stopMinutesAtStop,
      stopNumber: index + 1,
      mapUrl: getGalleryStopMapUrl(exhibition)
    };
  });
  const legs = stops.slice(1).map((stop, index): GalleryWalkLeg => {
    const previous = stops[index];

    const distance = previous
      ? getDistanceMiles(previous.exhibition.coordinates, stop.exhibition.coordinates)
      : 0;

    return {
      fromStopNumber: previous?.stopNumber ?? stop.stopNumber,
      toStopNumber: stop.stopNumber,
      fromExhibitionId: previous?.exhibition.id ?? stop.exhibition.id,
      toExhibitionId: stop.exhibition.id,
      distanceMiles: Number(distance.toFixed(2)),
      walkingMinutes: getWalkingMinutes(distance),
      mapUrl: previous ? getGalleryLegMapUrl(previous.exhibition, stop.exhibition) : stop.mapUrl
    };
  });
  const routeDistance = legs.reduce((total, leg) => total + leg.distanceMiles, 0);
  const walkingMinutes = legs.reduce((total, leg) => total + leg.walkingMinutes, 0);
  const totalMinutes =
    stops.reduce((total, stop) => total + stop.minutesAtStop, 0) + walkingMinutes;
  const savedStopCount = stops.filter((stop) => stop.isSaved).length;
  const modeLabel = config.label;
  const startStop = stops[0];
  const nextStop = stops[1];
  let { readinessLevel, readinessCopy } = getWalkReadiness(
    stops,
    neighborhood,
    modeLabel,
    input.mode
  );

  if (readinessLevel !== "ready") {
    readinessCopy = `${readinessCopy}${getFallbackNeighborhoodCopy(intelligence, neighborhood)}`;
  }

  const startOpeningTiming =
    input.mode === "opening-night" && startStop
      ? getBestGalleryOpeningTiming(startStop.exhibition, referenceNow)
      : undefined;
  const nextOpeningTiming =
    input.mode === "opening-night" && nextStop
      ? getBestGalleryOpeningTiming(nextStop.exhibition, referenceNow)
      : undefined;
  const guidance = startStop
    ? `${
        startOpeningTiming?.status === "upcoming"
          ? `Start at ${getTimeLabel(startOpeningTiming.startsAt)}`
          : startOpeningTiming?.status === "active"
            ? "Start while the reception is active"
            : startStop.status === "open-now"
              ? "Start here"
              : "Start when open"
      }: ${startStop.exhibition.galleryName}. ${
        nextStop
          ? `Next stop: ${nextStop.exhibition.galleryName}, ${legs[0]?.walkingMinutes ?? 0} min walk${
              nextOpeningTiming?.status === "upcoming"
                ? ` for ${getTimeLabel(nextOpeningTiming.startsAt)}`
                : nextOpeningTiming?.status === "active"
                  ? " while its reception is active"
                  : ""
            }.`
          : "No second stop is strong enough yet."
      }`
    : `No ${modeLabel} is ready in ${neighborhood} yet.`;
  const selectionReasons = Array.from(new Set(stops.flatMap((stop) => stop.reasons))).slice(0, 8);
  const routeMapUrl = getGalleryDirectionsMapUrl(stops);

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
    legs,
    savedStopCount,
    totalMinutes,
    totalDistanceMiles: Number(routeDistance.toFixed(2)),
    startsAt: referenceNow,
    canStartNow: startStop?.status === "open-now",
    startStopId: startStop?.exhibition.id,
    nextStopId: nextStop?.exhibition.id,
    routeMapUrl,
    guidance,
    readinessLevel,
    readinessCopy,
    selectionReasons
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
    const verifiedCount = neighborhoodExhibitions.filter(
      (exhibition) => getGalleryInventoryTrust(exhibition).isVerified
    ).length;
    const fixtureCount = neighborhoodExhibitions.filter(
      (exhibition) => getGalleryInventoryTrust(exhibition).isFixture
    ).length;
    const needsReviewCount = neighborhoodExhibitions.filter((exhibition) => {
      const trust = getGalleryInventoryTrust(exhibition);

      return trust.kind === "needs-review" || trust.kind === "stale-needs-review";
    }).length;
    const uniqueGalleryCount = new Set(neighborhoodExhibitions.map(getGalleryRouteNameKey)).size;
    const openNowCount = neighborhoodExhibitions.filter(
      (exhibition) => getGalleryVisitStatus(exhibition, referenceNow) === "open-now"
    ).length;
    const opensLaterCount = neighborhoodExhibitions.filter(
      (exhibition) => getGalleryVisitStatus(exhibition, referenceNow) === "opens-later"
    ).length;
    const usableGalleryStopCount = new Set(
      neighborhoodExhibitions
        .filter((exhibition) => isRouteUsableStatus(getGalleryVisitStatus(exhibition, referenceNow)))
        .map(getGalleryRouteGroupKey)
    ).size;
    const openingTonightCount = neighborhoodExhibitions.filter((exhibition) =>
      isGalleryOpeningTonight(exhibition, referenceNow)
    ).length;
    const lastChanceCount = neighborhoodExhibitions.filter((exhibition) =>
      isGalleryLastChance(exhibition, referenceNow, 14)
    ).length;
    const canSupportWalk = usableGalleryStopCount >= 2;
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
      verifiedCount,
      fixtureCount,
      needsReviewCount,
      uniqueGalleryCount,
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
  const verifiedExhibitionCount = marketExhibitions.filter((exhibition) =>
    getGalleryInventoryTrust(exhibition).isVerified
  ).length;
  const fixtureExhibitionCount = marketExhibitions.filter((exhibition) =>
    getGalleryInventoryTrust(exhibition).isFixture
  ).length;
  const submittedExhibitionCount = marketExhibitions.filter(
    (exhibition) => getGalleryInventoryTrust(exhibition).kind === "partner-submitted"
  ).length;
  const needsReviewExhibitionCount = marketExhibitions.filter((exhibition) => {
    const trust = getGalleryInventoryTrust(exhibition);

    return trust.kind === "needs-review" || trust.kind === "stale-needs-review";
  }).length;
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
    areaId === "nyc" && verifiedExhibitionCount < 30
      ? "Convert more official NYC pages into verified inventory before featuring full-market claims."
      : fixtureExhibitionCount > verifiedExhibitionCount
        ? "Replace fixture/demo listings with official-page verified records."
        : staleSourceRiskCount > 0
          ? "Review stale sources before featuring them heavily."
          : openingCount === 0
            ? "Add opening-night sources for this market."
            : "Market is ready for gallery-walk discovery.";

  return {
    areaId,
    exhibitionCount,
    verifiedExhibitionCount,
    fixtureExhibitionCount,
    submittedExhibitionCount,
    needsReviewExhibitionCount,
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
