import { areas } from "../data/catalog";
import {
  broadApiCandidates,
  type BroadApiCandidate,
  type BroadApiCandidateStatus
} from "../data/broadApiCandidates";
import {
  localCalendarEvents,
  localCalendarSources,
  type LocalCalendarEvent,
  type LocalCalendarSource
} from "../data/localCalendarFeeds";
import type {
  DiscoverySourceLane,
  DiscoverySourcePlan,
  DiscoverySourceType,
  Show,
  ShowCategory
} from "../types";
import { normalizeCalendarEvent } from "./calendarFeedProvider";
import { getRecommendedBroadApiCandidates } from "./discoveryAcquisition";
import { getDiscoveryMarketPlan } from "./discoveryPlanning";
import { getResidentAdvisorReadiness } from "./residentAdvisorReadiness";
import {
  createSourceInventorySummaries,
  type SourceInventorySummary
} from "./sourceInventoryAudit";
import { getSafeTicketUrl } from "./ticketLinks";

export type SourceReadinessLegalStatus =
  | "adapter-ready"
  | "partner-or-api-required"
  | "public-calendar-review"
  | "checked-in-fixture"
  | "research-required"
  | "deferred";

export type SourceReadinessIntegrationEffort = "low" | "medium" | "high";
export type SourceReadinessMarketLift = "high" | "medium" | "low" | "none";

export type SourceReadinessCandidateKind =
  | "inventory-source"
  | "broad-api"
  | "local-calendar"
  | "planned-local-pipeline"
  | "resident-advisor";

export type SourceReadinessCandidate = {
  id: string;
  label: string;
  areaId: string;
  kind: SourceReadinessCandidateKind;
  sourceType?: DiscoverySourceType | "resident-advisor";
  lane?: DiscoverySourceLane | "partner-candidate";
  eventCountAdded: number;
  ticketLinkCount: number;
  ticketLinkCoveragePercent: number;
  duplicateRatePercent: number;
  activeCategoryCount: number;
  categoryLift: ShowCategory[];
  marketLift: SourceReadinessMarketLift;
  legalStatus: SourceReadinessLegalStatus;
  integrationEffort: SourceReadinessIntegrationEffort;
  readinessScore: number;
  recommendedNextAction: string;
  notes: string;
  referenceUrls: string[];
};

export type SourceReadinessAuditSummary = {
  areaId: string;
  generatedAt: string;
  candidateCount: number;
  rankedCandidates: SourceReadinessCandidate[];
  sourceInventoryEventCount: number;
  sourceInventoryTicketLinkCount: number;
  sourceInventoryTicketLinkCoveragePercent: number;
  sourceInventoryDuplicateRatePercent: number;
  activeCategoryCount: number;
  spotifyMatchableInventoryCount: number;
  recommendedNextAction: string;
  residentAdvisorDecision: Pick<
    SourceReadinessCandidate,
    "legalStatus" | "marketLift" | "recommendedNextAction" | "notes" | "referenceUrls"
  >;
};

export type SourceReadinessAuditOptions = {
  areaId: string;
  referenceNow?: string;
  sourceSummaries?: SourceInventorySummary[];
  parsedCalendarEvents?: LocalCalendarEvent[];
  ticketmasterConfigured?: boolean;
};

const legalStatusBaseScore: Record<SourceReadinessLegalStatus, number> = {
  "adapter-ready": 86,
  "public-calendar-review": 74,
  "checked-in-fixture": 52,
  "research-required": 42,
  "partner-or-api-required": 32,
  deferred: 8
};

const effortPenalty: Record<SourceReadinessIntegrationEffort, number> = {
  low: 0,
  medium: 9,
  high: 18
};

const broadApiStatusLegalStatus: Record<BroadApiCandidateStatus, SourceReadinessLegalStatus> = {
  "adapter-ready": "adapter-ready",
  research: "research-required",
  deferred: "deferred"
};

export function createSourceReadinessAudits(
  options: Omit<SourceReadinessAuditOptions, "areaId"> = {}
): SourceReadinessAuditSummary[] {
  return areas.map((area) =>
    createSourceReadinessAudit({
      ...options,
      areaId: area.id
    })
  );
}

export function createSourceReadinessAudit(
  options: SourceReadinessAuditOptions
): SourceReadinessAuditSummary {
  const referenceNow = options.referenceNow ?? new Date().toISOString();
  const sourceSummaries =
    options.sourceSummaries ??
    createSourceInventorySummaries({
      areaId: options.areaId,
      referenceNow,
      parsedCalendarEvents: options.parsedCalendarEvents,
      ticketmasterConfigured: options.ticketmasterConfigured ?? false
    });
  const candidates = dedupeCandidates([
    ...createInventoryCandidates(options.areaId, sourceSummaries),
    ...createLocalCalendarCandidates(options.areaId),
    ...createPlannedSourceCandidates(options.areaId),
    ...createBroadApiCandidates(options.areaId),
    createResidentAdvisorCandidate(options.areaId)
  ]).sort((first, second) => second.readinessScore - first.readinessScore);
  const sourceInventoryEventCount = sumBy(sourceSummaries, (summary) => summary.eventCount);
  const sourceInventoryTicketLinkCount = sumBy(
    sourceSummaries,
    (summary) => summary.ticketLinkCount
  );
  const sourceInventoryDuplicateCount = sumBy(
    sourceSummaries,
    (summary) => summary.duplicateCount ?? 0
  );
  const activeCategoryCount = new Set(
    candidates.flatMap((candidate) =>
      candidate.eventCountAdded > 0 ? candidate.categoryLift : []
    )
  ).size;
  const recommendedCandidate = getRecommendedActionCandidate(candidates);
  const residentAdvisorCandidate = candidates.find(
    (candidate) => candidate.id === "resident-advisor"
  );

  return {
    areaId: options.areaId,
    generatedAt: referenceNow,
    candidateCount: candidates.length,
    rankedCandidates: candidates,
    sourceInventoryEventCount,
    sourceInventoryTicketLinkCount,
    sourceInventoryTicketLinkCoveragePercent: getPercent(
      sourceInventoryTicketLinkCount,
      sourceInventoryEventCount
    ),
    sourceInventoryDuplicateRatePercent: getPercent(
      sourceInventoryDuplicateCount,
      sourceInventoryEventCount + sourceInventoryDuplicateCount
    ),
    activeCategoryCount,
    spotifyMatchableInventoryCount: getSpotifyMatchableInventoryCount(options.areaId),
    recommendedNextAction:
      recommendedCandidate?.recommendedNextAction ??
      "Validate source feasibility before building adapters.",
    residentAdvisorDecision: {
      legalStatus: residentAdvisorCandidate?.legalStatus ?? "partner-or-api-required",
      marketLift: residentAdvisorCandidate?.marketLift ?? "none",
      recommendedNextAction:
        residentAdvisorCandidate?.recommendedNextAction ??
        "Do not ingest RA until a partner/API path is confirmed.",
      notes: residentAdvisorCandidate?.notes ?? "Resident Advisor readiness was not available.",
      referenceUrls: residentAdvisorCandidate?.referenceUrls ?? ["https://ra.co/terms"]
    }
  };
}

function getRecommendedActionCandidate(
  candidates: SourceReadinessCandidate[]
): SourceReadinessCandidate | undefined {
  return (
    candidates.find(
      (candidate) => candidate.kind !== "inventory-source" && candidate.eventCountAdded > 0
    ) ??
    candidates.find((candidate) => candidate.legalStatus !== "checked-in-fixture") ??
    candidates[0]
  );
}

function createInventoryCandidates(
  areaId: string,
  sourceSummaries: SourceInventorySummary[]
): SourceReadinessCandidate[] {
  return sourceSummaries.map((summary) =>
    createCandidate({
      id: summary.id.endsWith("-ticketmaster-discovery")
        ? "ticketmaster-discovery"
        : summary.id,
      label: summary.label,
      areaId,
      kind: "inventory-source",
      sourceType: summary.importMode === "live-api" ? "marketplace-api" : undefined,
      lane: summary.importMode === "live-api" ? "broad-api" : undefined,
      eventCountAdded: summary.eventCount,
      ticketLinkCount: summary.ticketLinkCount,
      duplicateRatePercent: summary.duplicateRatePercent ?? 0,
      categoryLift: getSummaryCategoryLift(summary),
      legalStatus: getInventoryLegalStatus(summary),
      integrationEffort: "low",
      recommendedNextAction: getInventoryRecommendedAction(summary),
      notes: summary.notes,
      referenceUrls: []
    })
  );
}

function createLocalCalendarCandidates(areaId: string): SourceReadinessCandidate[] {
  return localCalendarSources
    .filter((source) => source.areaId === areaId)
    .map((source) => {
      const events = localCalendarEvents.filter((event) => event.calendarId === source.id);
      const shows = events.map(normalizeCalendarEvent);
      const ticketLinkCount = shows.filter(hasTicketLink).length;

      return createCandidate({
        id: source.id,
        label: source.label,
        areaId,
        kind: "local-calendar",
        sourceType: "calendar-feed",
        lane: "local-pipeline",
        eventCountAdded: events.length,
        ticketLinkCount,
        duplicateRatePercent: getDuplicateRatePercent(shows),
        categoryLift: source.categories,
        legalStatus: "public-calendar-review",
        integrationEffort: source.status === "parser-ready" ? "low" : "medium",
        recommendedNextAction: getLocalCalendarRecommendedAction(source, events.length),
        notes: source.parserNotes,
        referenceUrls: [source.sourceUrl]
      });
    });
}

function createPlannedSourceCandidates(areaId: string): SourceReadinessCandidate[] {
  const plan = getDiscoveryMarketPlan(areaId);

  if (!plan) {
    return [];
  }

  return plan.sources
    .filter((source) => source.lane === "local-pipeline" && source.status !== "active-fixture")
    .map((source) =>
      createCandidate({
        id: source.id,
        label: source.label,
        areaId,
        kind: "planned-local-pipeline",
        sourceType: source.sourceType,
        lane: source.lane,
        eventCountAdded: 0,
        ticketLinkCount: 0,
        duplicateRatePercent: 0,
        categoryLift: source.categories,
        legalStatus: getPlanLegalStatus(source),
        integrationEffort: getPlanIntegrationEffort(source),
        recommendedNextAction: getPlanRecommendedAction(source),
        notes: source.notes,
        referenceUrls: []
      })
    );
}

function createBroadApiCandidates(areaId: string): SourceReadinessCandidate[] {
  const recommendations = getRecommendedBroadApiCandidates(areaId);

  return recommendations
    .filter((candidate) => candidate.id !== "ticketmaster-discovery")
    .map((candidate) =>
      createCandidate({
        id: candidate.id,
        label: candidate.label,
        areaId,
        kind: "broad-api",
        sourceType: "marketplace-api",
        lane: "broad-api",
        eventCountAdded: 0,
        ticketLinkCount: 0,
        duplicateRatePercent: 0,
        categoryLift: candidate.matchingCategories,
        legalStatus: broadApiStatusLegalStatus[candidate.status],
        integrationEffort: candidate.status === "adapter-ready" ? "low" : "medium",
        recommendedNextAction: candidate.nextStep,
        notes: candidate.rationale,
        referenceUrls: getBroadApiReferenceUrls(candidate)
      })
    );
}

function createResidentAdvisorCandidate(areaId: string): SourceReadinessCandidate {
  const readiness = getResidentAdvisorReadiness(areaId);
  const categoryLift =
    areaId === "hudson" ? ([] as ShowCategory[]) : (["dj", "concert"] as ShowCategory[]);
  const observedVolumeScore = areaId === "la" ? 22 : areaId === "nyc" ? 16 : 0;
  const legalStatus: SourceReadinessLegalStatus = "partner-or-api-required";

  return createCandidate(
    {
      id: "resident-advisor",
      label: "Resident Advisor",
      areaId,
      kind: "resident-advisor",
      sourceType: "resident-advisor",
      lane: "partner-candidate",
      eventCountAdded: 0,
      ticketLinkCount: 0,
      duplicateRatePercent: 0,
      categoryLift,
      legalStatus,
      integrationEffort: "high",
      recommendedNextAction:
        readiness.status === "low-fit"
          ? "Do not use RA for this market yet; keep discovery local-calendar-led."
          : "Open a partner/API conversation with RA; do not build scraping or unauthorized ingestion.",
      notes: `${readiness.availability} ${readiness.legalPartnerPath}`,
      referenceUrls: readiness.referenceUrls
    },
    observedVolumeScore
  );
}

function createCandidate(
  input: Omit<
    SourceReadinessCandidate,
    | "ticketLinkCoveragePercent"
    | "activeCategoryCount"
    | "marketLift"
    | "readinessScore"
  >,
  observedVolumeScore = 0
): SourceReadinessCandidate {
  const ticketLinkCoveragePercent = getPercent(input.ticketLinkCount, input.eventCountAdded);
  const activeCategoryCount = new Set(input.categoryLift).size;
  const marketLift = getMarketLift({
    eventCountAdded: input.eventCountAdded,
    categoryLift: input.categoryLift,
    legalStatus: input.legalStatus,
    observedVolumeScore
  });

  return {
    ...input,
    ticketLinkCoveragePercent,
    activeCategoryCount,
    marketLift,
    readinessScore: getReadinessScore({
      legalStatus: input.legalStatus,
      integrationEffort: input.integrationEffort,
      eventCountAdded: input.eventCountAdded,
      ticketLinkCoveragePercent,
      categoryLiftCount: activeCategoryCount,
      observedVolumeScore
    })
  };
}

function dedupeCandidates(candidates: SourceReadinessCandidate[]): SourceReadinessCandidate[] {
  const byId = new Map<string, SourceReadinessCandidate>();

  for (const candidate of candidates) {
    const existing = byId.get(candidate.id);

    if (!existing || candidate.readinessScore > existing.readinessScore) {
      byId.set(candidate.id, candidate);
    }
  }

  return [...byId.values()];
}

function getReadinessScore({
  legalStatus,
  integrationEffort,
  eventCountAdded,
  ticketLinkCoveragePercent,
  categoryLiftCount,
  observedVolumeScore
}: {
  legalStatus: SourceReadinessLegalStatus;
  integrationEffort: SourceReadinessIntegrationEffort;
  eventCountAdded: number;
  ticketLinkCoveragePercent: number;
  categoryLiftCount: number;
  observedVolumeScore: number;
}): number {
  const eventScore = Math.min(35, eventCountAdded * 4);
  const linkScore = Math.round(ticketLinkCoveragePercent / 8);
  const categoryScore = categoryLiftCount * 4;
  const legalPenalty = legalStatus === "partner-or-api-required" ? 14 : 0;

  return (
    legalStatusBaseScore[legalStatus] +
    eventScore +
    linkScore +
    categoryScore +
    observedVolumeScore -
    effortPenalty[integrationEffort] -
    legalPenalty
  );
}

function getMarketLift({
  eventCountAdded,
  categoryLift,
  legalStatus,
  observedVolumeScore
}: {
  eventCountAdded: number;
  categoryLift: ShowCategory[];
  legalStatus: SourceReadinessLegalStatus;
  observedVolumeScore: number;
}): SourceReadinessMarketLift {
  if (eventCountAdded >= 8 || observedVolumeScore >= 22) {
    return legalStatus === "partner-or-api-required" && eventCountAdded === 0 ? "medium" : "high";
  }

  if (eventCountAdded >= 3 || categoryLift.length >= 5 || observedVolumeScore >= 16) {
    return "medium";
  }

  if (eventCountAdded > 0 || categoryLift.length > 0) {
    return "low";
  }

  return "none";
}

function getInventoryLegalStatus(summary: SourceInventorySummary): SourceReadinessLegalStatus {
  if (summary.importMode === "live-api") {
    return "adapter-ready";
  }

  if (summary.importMode === "calendar-html-import") {
    return "public-calendar-review";
  }

  return "checked-in-fixture";
}

function getInventoryRecommendedAction(summary: SourceInventorySummary): string {
  if (summary.importMode === "live-api" && summary.status === "not-configured") {
    return "Configure provider credentials outside git to measure live inventory.";
  }

  if (summary.importMode === "live-api") {
    return "Keep measuring duplicate rate, category lift, and ticket-link coverage before adding another broad provider.";
  }

  if (summary.importMode === "calendar-html-import") {
    return "Promote parser-backed calendars only after legal review and source quality checks.";
  }

  return "Use as fallback and regression coverage; do not treat fixtures as live supply.";
}

function getLocalCalendarRecommendedAction(
  source: LocalCalendarSource,
  eventCount: number
): string {
  if (eventCount === 0) {
    return "Review calendar structure and terms, then add a fixture-backed parser sample.";
  }

  if (source.areaId === "hudson") {
    return "Keep expanding Hudson through reusable regional calendars before bespoke venue adapters.";
  }

  return "Measure category lift and ticket-link preservation before adding venue-specific adapters.";
}

function getPlanLegalStatus(source: DiscoverySourcePlan): SourceReadinessLegalStatus {
  if (source.status === "integration-ready" && source.sourceType === "calendar-feed") {
    return "public-calendar-review";
  }

  if (source.status === "integration-ready") {
    return "adapter-ready";
  }

  if (source.status === "partner-needed") {
    return "partner-or-api-required";
  }

  return "deferred";
}

function getPlanIntegrationEffort(
  source: DiscoverySourcePlan
): SourceReadinessIntegrationEffort {
  if (source.sourceType === "calendar-feed") {
    return "medium";
  }

  if (source.status === "partner-needed") {
    return "high";
  }

  return "medium";
}

function getPlanRecommendedAction(source: DiscoverySourcePlan): string {
  if (source.status === "partner-needed") {
    return "Confirm partner rights and a sample feed before implementation.";
  }

  if (source.sourceType === "calendar-feed") {
    return "Build one reusable calendar parser before adding one-off venue adapters.";
  }

  return "Measure this source against broad API gaps before implementation.";
}

function getSummaryCategoryLift(summary: SourceInventorySummary): ShowCategory[] {
  return summary.activeCategories;
}

function getBroadApiReferenceUrls(candidate: BroadApiCandidate): string[] {
  if (candidate.id === "eventbrite-marketplace") {
    return ["https://www.eventbrite.com/platform/api"];
  }

  if (candidate.id === "seatgeek-platform") {
    return ["https://platform.seatgeek.com/"];
  }

  if (candidate.id === "predicthq-events") {
    return ["https://www.predicthq.com/apis"];
  }

  if (candidate.id === "bandsintown-music") {
    return ["https://www.artists.bandsintown.com/support/api-installation"];
  }

  return [];
}

function getSpotifyMatchableInventoryCount(areaId: string): number {
  return localCalendarEvents
    .filter((event) => event.areaId === areaId)
    .filter((event) => event.recommendationSignals?.some((signal) => signal.startsWith("spotify:")))
    .length;
}

function hasTicketLink(show: Show): boolean {
  return show.ticketOffers.some((offer) => Boolean(getSafeTicketUrl(offer.externalUrl)));
}

function getDuplicateRatePercent(shows: Show[]): number {
  if (shows.length === 0) {
    return 0;
  }

  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const show of shows) {
    const key = `${show.title.toLowerCase()}|${show.venue.toLowerCase()}|${show.startsAt.slice(
      0,
      10
    )}`;

    if (seen.has(key)) {
      duplicateCount += 1;
    } else {
      seen.add(key);
    }
  }

  return getPercent(duplicateCount, shows.length);
}

function getPercent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}
