import { galleryExhibitions } from "../data/galleryCatalog";
import { gallerySourceCandidates } from "../data/gallerySources";
import {
  createGallerySubmissionDraft,
  createNeighborhoodIntelligence,
  getGalleryVisitStatus
} from "./galleryDiscovery";
import type {
  GalleryAreaId,
  GalleryExhibition,
  GalleryImportPayload,
  GalleryImportRecord,
  GalleryImportRecordKind,
  GalleryMedium,
  GallerySourceCandidate,
  GallerySourceFreshness,
  GallerySubmissionDraft,
  GallerySubmissionQueueItem,
  GallerySubmissionReviewStatus
} from "../types";

export type GallerySourceDirectoryFilters = {
  areaId?: GalleryAreaId;
  neighborhoods?: string[];
  freshness?: GallerySourceFreshness[];
};

export type GallerySubmissionReviewDecision = {
  status: GallerySubmissionReviewStatus;
  reviewedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
  sourceCandidateId?: string;
};

export type GalleryApprovalResult = {
  queueItem: GallerySubmissionQueueItem;
  importRecord: GalleryImportRecord;
  exhibition: GalleryExhibition;
};

export type GalleryMarketDataAudit = {
  areaId: GalleryAreaId;
  sourceCount: number;
  activeExhibitionCount: number;
  sourceFreshness: Record<GallerySourceFreshness, number>;
  officialLinkCoveragePercent: number;
  hoursCoveragePercent: number;
  staleListingCount: number;
  staleSourceCount: number;
  seedExhibitionCount: number;
  submittedExhibitionCount: number;
  importedExhibitionCount: number;
  manualSeedImportCount: number;
  partnerSubmissionImportCount: number;
  officialPageReadySourceCount: number;
  neighborhoodsWithSources: string[];
  walkReadyNeighborhoods: string[];
  needsReviewSourceIds: string[];
};

const dayMs = 24 * 60 * 60 * 1000;
const defaultReviewUser = "internal-review";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function toSlug(value: string): string {
  const slug = normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "gallery-data";
}

function getDateTimestamp(iso: string): number {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return new Date(iso).getTime();
  }

  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function getDaysSince(iso: string, referenceNow: string): number {
  return Math.floor((getDateTimestamp(referenceNow) - getDateTimestamp(iso)) / dayMs);
}

function isExampleUrl(url: string): boolean {
  return url.includes("example.org") || url.includes("example.com");
}

function getCoveragePercent(total: number, covered: number): number {
  return total === 0 ? 0 : Math.round((covered / total) * 100);
}

function getSourceForImport(
  sourceCandidateId: string,
  candidates: GallerySourceCandidate[]
): GallerySourceCandidate {
  const source = candidates.find((candidate) => candidate.id === sourceCandidateId);

  if (!source) {
    throw new Error(`Unknown gallery source candidate: ${sourceCandidateId}`);
  }

  return source;
}

function getDefaultMediums(payload: GalleryImportPayload): GalleryMedium[] {
  return payload.mediums.length > 0 ? payload.mediums : ["mixed-media"];
}

export function getGallerySourceCandidates(
  candidates: GallerySourceCandidate[] = gallerySourceCandidates,
  filters: GallerySourceDirectoryFilters = {}
): GallerySourceCandidate[] {
  const neighborhoodSet = new Set(filters.neighborhoods ?? []);
  const freshnessSet = new Set(filters.freshness ?? []);

  return candidates
    .filter((candidate) => !filters.areaId || candidate.areaId === filters.areaId)
    .filter(
      (candidate) => neighborhoodSet.size === 0 || neighborhoodSet.has(candidate.neighborhood)
    )
    .filter(
      (candidate) => freshnessSet.size === 0 || freshnessSet.has(candidate.sourceFreshness)
    )
    .sort((left, right) => {
      const areaDelta = left.areaId.localeCompare(right.areaId);

      if (areaDelta !== 0) {
        return areaDelta;
      }

      const neighborhoodDelta = left.neighborhood.localeCompare(right.neighborhood);

      if (neighborhoodDelta !== 0) {
        return neighborhoodDelta;
      }

      return right.confidence - left.confidence;
    });
}

export function getGallerySourceEffectiveFreshness(
  source: GallerySourceCandidate,
  referenceNow: string,
  staleAfterDays = 30
): GallerySourceFreshness {
  if (source.sourceFreshness === "stale-risk") {
    return "stale-risk";
  }

  const daysSinceChecked = getDaysSince(source.lastCheckedAt, referenceNow);

  if (daysSinceChecked > staleAfterDays) {
    return "stale-risk";
  }

  if (daysSinceChecked > Math.floor(staleAfterDays / 2)) {
    return "needs-review";
  }

  return source.sourceFreshness;
}

export function createGalleryImportRecord(
  source: GallerySourceCandidate,
  payload: GalleryImportPayload,
  options: {
    kind: GalleryImportRecordKind;
    sourceCheckedAt: string;
    confidence?: number;
  }
): GalleryImportRecord {
  const errors: string[] = [];

  if (!payload.title.trim()) {
    errors.push("title is required");
  }

  if (payload.artists.length === 0) {
    errors.push("at least one artist is required");
  }

  if (!payload.externalUrl.trim()) {
    errors.push("externalUrl is required");
  }

  return {
    id: `import-${toSlug(source.galleryName)}-${toSlug(payload.title)}`,
    sourceCandidateId: source.id,
    kind: options.kind,
    sourceUrl: payload.externalUrl || source.exhibitionsUrl,
    sourceCheckedAt: options.sourceCheckedAt,
    sourceFreshness: getGallerySourceEffectiveFreshness(source, options.sourceCheckedAt),
    sourceLegalStatus: source.sourceLegalStatus,
    confidence: options.confidence ?? source.confidence,
    payload,
    errors
  };
}

export function convertImportRecordToExhibition(
  record: GalleryImportRecord,
  source: GallerySourceCandidate
): GalleryExhibition {
  return {
    id: `imported-${toSlug(source.galleryName)}-${toSlug(record.payload.title)}`,
    sourceCandidateId: source.id,
    importRecordId: record.id,
    title: record.payload.title,
    artists: record.payload.artists,
    galleryName: source.galleryName,
    galleryKind: source.galleryKind,
    areaId: source.areaId,
    neighborhood: source.neighborhood,
    address: source.address,
    coordinates: source.coordinates,
    distanceMiles: 0.4,
    mediums: getDefaultMediums(record.payload),
    opensAt: record.payload.opensAt,
    closesAt: record.payload.closesAt,
    receptionAt: record.payload.receptionAt,
    specialEvents: record.payload.receptionAt
      ? [
          {
            id: `${record.id}-reception`,
            kind: "opening-reception",
            title: "Reception",
            startsAt: record.payload.receptionAt
          }
        ]
      : [],
    hours: source.defaultHours,
    externalUrl: record.payload.externalUrl,
    imageTone: record.payload.imageTone ?? "#47606F",
    source: record.kind === "partner-submission" ? "gallery-submission" : "manual-review",
    sourceLegalStatus: record.sourceLegalStatus,
    sourceFreshness: record.sourceFreshness,
    sourceUpdatedAt: record.sourceCheckedAt,
    description: record.payload.description,
    whyGoSignals: ["imported", record.kind, source.neighborhood]
  };
}

export function createGallerySubmissionQueueItem(
  draft: GallerySubmissionDraft,
  options: {
    submittedAt?: string;
    sourceCandidateId?: string;
  } = {}
): GallerySubmissionQueueItem {
  return {
    id: `queue-${draft.id}`,
    draft,
    sourceCandidateId: options.sourceCandidateId,
    status: draft.status === "ready-for-review" ? "needs-review" : "needs-more-info",
    submittedAt: options.submittedAt ?? draft.createdAt
  };
}

export function reviewGallerySubmissionQueueItem(
  item: GallerySubmissionQueueItem,
  decision: GallerySubmissionReviewDecision
): GallerySubmissionQueueItem {
  return {
    ...item,
    status: decision.status,
    sourceCandidateId: decision.sourceCandidateId ?? item.sourceCandidateId,
    reviewedAt: decision.reviewedAt,
    reviewedBy: decision.reviewedBy ?? defaultReviewUser,
    reviewNotes: decision.reviewNotes
  };
}

export function approveGallerySubmissionQueueItem(
  item: GallerySubmissionQueueItem,
  source: GallerySourceCandidate,
  options: {
    reviewedAt: string;
    reviewedBy?: string;
    reviewNotes?: string;
    mediums?: GalleryMedium[];
    description?: string;
    imageTone?: string;
  }
): GalleryApprovalResult {
  if (item.draft.status !== "ready-for-review") {
    throw new Error("Submission draft needs required fields before approval.");
  }

  const importRecord = createGalleryImportRecord(
    source,
    {
      title: item.draft.title,
      artists: item.draft.artists,
      mediums: options.mediums ?? ["mixed-media"],
      opensAt: item.draft.opensAt,
      closesAt: item.draft.closesAt,
      receptionAt: item.draft.receptionAt,
      externalUrl: item.draft.externalUrl,
      description:
        options.description ??
        `${item.draft.title} was approved from the internal gallery submission queue.`,
      imageTone: options.imageTone
    },
    {
      kind: "partner-submission",
      sourceCheckedAt: options.reviewedAt,
      confidence: Math.max(source.confidence, 0.86)
    }
  );
  const exhibition = convertImportRecordToExhibition(importRecord, source);
  const approvedImportRecord = {
    ...importRecord,
    normalizedExhibitionId: exhibition.id
  };
  const queueItem = reviewGallerySubmissionQueueItem(item, {
    status: "approved",
    sourceCandidateId: source.id,
    reviewedAt: options.reviewedAt,
    reviewedBy: options.reviewedBy,
    reviewNotes: options.reviewNotes
  });

  return {
    queueItem: {
      ...queueItem,
      approvedImportRecordId: approvedImportRecord.id,
      approvedExhibitionId: exhibition.id
    },
    importRecord: approvedImportRecord,
    exhibition
  };
}

export function createPartnerSubmissionApproval(
  input: Parameters<typeof createGallerySubmissionDraft>[0],
  source: GallerySourceCandidate,
  reviewedAt: string
): GalleryApprovalResult {
  const draftResult = createGallerySubmissionDraft({
    ...input,
    areaId: input.areaId ?? source.areaId,
    createdAt: input.createdAt ?? reviewedAt
  });
  const queueItem = createGallerySubmissionQueueItem(draftResult.draft, {
    sourceCandidateId: source.id,
    submittedAt: draftResult.draft.createdAt
  });

  return approveGallerySubmissionQueueItem(queueItem, source, {
    reviewedAt,
    reviewNotes: "Approved through partner-submission import path."
  });
}

export function createGalleryMarketDataAudit(
  areaId: GalleryAreaId,
  options: {
    sources?: GallerySourceCandidate[];
    exhibitions?: GalleryExhibition[];
    importRecords?: GalleryImportRecord[];
    referenceNow?: string;
  } = {}
): GalleryMarketDataAudit {
  const referenceNow = options.referenceNow ?? "2026-07-09T15:30:00-04:00";
  const sources = getGallerySourceCandidates(options.sources ?? gallerySourceCandidates, { areaId });
  const exhibitions = (options.exhibitions ?? galleryExhibitions).filter(
    (exhibition) => exhibition.areaId === areaId
  );
  const activeExhibitions = exhibitions.filter((exhibition) => {
    const status = getGalleryVisitStatus(exhibition, referenceNow);

    return status !== "closed" && status !== "not-yet-open";
  });
  const importRecords = (options.importRecords ?? []).filter((record) =>
    sources.some((source) => source.id === record.sourceCandidateId)
  );
  const sourceFreshness = sources.reduce<Record<GallerySourceFreshness, number>>(
    (counts, source) => {
      const freshness = getGallerySourceEffectiveFreshness(source, referenceNow);
      counts[freshness] += 1;

      return counts;
    },
    { fresh: 0, "needs-review": 0, "stale-risk": 0 }
  );
  const officialLinkCoveragePercent = getCoveragePercent(
    sources.length,
    sources.filter(
      (source) =>
        source.websiteUrl.length > 0 &&
        source.exhibitionsUrl.length > 0 &&
        source.sourceLegalStatus === "official-public-page"
    ).length
  );
  const hoursCoveragePercent = getCoveragePercent(
    sources.length,
    sources.filter((source) => source.defaultHours.length > 0 || Boolean(source.hoursUrl)).length
  );
  const staleListingCount = activeExhibitions.filter(
    (exhibition) =>
      exhibition.sourceFreshness === "stale-risk" || isExampleUrl(exhibition.externalUrl)
  ).length;
  const neighborhoodSummary = createNeighborhoodIntelligence(areaId, activeExhibitions, referenceNow);

  return {
    areaId,
    sourceCount: sources.length,
    activeExhibitionCount: activeExhibitions.length,
    sourceFreshness,
    officialLinkCoveragePercent,
    hoursCoveragePercent,
    staleListingCount,
    staleSourceCount: sourceFreshness["stale-risk"],
    seedExhibitionCount: activeExhibitions.filter((exhibition) => isExampleUrl(exhibition.externalUrl))
      .length,
    submittedExhibitionCount: activeExhibitions.filter(
      (exhibition) => exhibition.source === "gallery-submission"
    ).length,
    importedExhibitionCount: activeExhibitions.filter((exhibition) => exhibition.importRecordId)
      .length,
    manualSeedImportCount: importRecords.filter((record) => record.kind === "manual-seed").length,
    partnerSubmissionImportCount: importRecords.filter(
      (record) => record.kind === "partner-submission"
    ).length,
    officialPageReadySourceCount: sources.filter(
      (source) => source.preferredImportLane === "official-page-ready"
    ).length,
    neighborhoodsWithSources: Array.from(new Set(sources.map((source) => source.neighborhood))).sort(),
    walkReadyNeighborhoods: neighborhoodSummary
      .filter((neighborhood) => neighborhood.canSupportWalk)
      .map((neighborhood) => neighborhood.neighborhood),
    needsReviewSourceIds: sources
      .filter(
        (source) =>
          getGallerySourceEffectiveFreshness(source, referenceNow) !== "fresh" ||
          source.confidence < 0.7
      )
      .map((source) => source.id)
  };
}
