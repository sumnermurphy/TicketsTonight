import {
  broadApiCandidates,
  type BroadApiCandidate,
  type BroadApiCandidateRole,
  type BroadApiCandidateStatus
} from "../data/broadApiCandidates";
import type { ShowCategory } from "../types";
import {
  getDiscoveryMarketPlan,
  getLocalPipelinePriorityCategories,
  getNextLocalDiscoverySources
} from "./discoveryPlanning";

export type BroadApiCandidateRecommendation = BroadApiCandidate & {
  matchingCategories: ShowCategory[];
  missingCategories: ShowCategory[];
  readinessScore: number;
  rationale: string;
};

export type DiscoveryAcquisitionPlan = {
  areaId: string;
  firstBroadApiCandidateId?: string;
  nextBroadApiCandidateIds: string[];
  broadApiCoverageGapCategories: ShowCategory[];
  localPipelineTriggerCategories: ShowCategory[];
  nextLocalPipelineSourceIds: string[];
  shouldDelayBespokeVenueWork: boolean;
  summary: string;
};

const statusScore: Record<BroadApiCandidateStatus, number> = {
  "adapter-ready": 100,
  research: 45,
  deferred: 5
};

const roleScore: Record<BroadApiCandidateRole, number> = {
  "ticketed-baseline": 24,
  "community-events": 18,
  "price-inventory": 16,
  "coverage-gap-map": 12,
  "music-depth": 8
};

export function getBroadApiCandidates(): BroadApiCandidate[] {
  return [...broadApiCandidates].sort((first, second) => first.priority - second.priority);
}

export function getRecommendedBroadApiCandidates(
  areaId: string,
  categories?: ShowCategory[]
): BroadApiCandidateRecommendation[] {
  const plan = getDiscoveryMarketPlan(areaId);

  if (!plan) {
    return [];
  }

  const targetCategories = categories?.length ? categories : plan.categoryFocus;

  return getBroadApiCandidates()
    .map((candidate) => getCandidateRecommendation(candidate, areaId, targetCategories))
    .filter((candidate) => candidate.matchingCategories.length > 0)
    .sort(
      (first, second) =>
        second.readinessScore - first.readinessScore || first.priority - second.priority
    );
}

export function getBroadApiCoverageGaps(
  areaId: string,
  candidateIds: string[]
): ShowCategory[] {
  const plan = getDiscoveryMarketPlan(areaId);

  if (!plan) {
    return [];
  }

  const selectedCandidates = broadApiCandidates.filter((candidate) =>
    candidateIds.includes(candidate.id)
  );
  const coveredCategories = new Set(
    selectedCandidates.flatMap((candidate) => candidate.categories)
  );

  return plan.categoryFocus.filter((category) => !coveredCategories.has(category));
}

export function getDiscoveryAcquisitionPlan(areaId: string): DiscoveryAcquisitionPlan | undefined {
  const recommendations = getRecommendedBroadApiCandidates(areaId);
  const firstBroadApiCandidateId = recommendations[0]?.id;
  const nextBroadApiCandidateIds = recommendations.slice(0, 3).map((candidate) => candidate.id);
  const broadApiCoverageGapCategories = getBroadApiCoverageGaps(
    areaId,
    firstBroadApiCandidateId ? [firstBroadApiCandidateId] : []
  );
  const localPipelineTriggerCategories = getLocalPipelinePriorityCategories(areaId);
  const nextLocalPipelineSourceIds = getNextLocalDiscoverySources(areaId).map(
    (source) => source.id
  );

  if (!recommendations.length) {
    return undefined;
  }

  return {
    areaId,
    firstBroadApiCandidateId,
    nextBroadApiCandidateIds,
    broadApiCoverageGapCategories,
    localPipelineTriggerCategories,
    nextLocalPipelineSourceIds,
    shouldDelayBespokeVenueWork:
      broadApiCoverageGapCategories.length === 0 && nextLocalPipelineSourceIds.length > 0,
    summary: getAcquisitionSummary({
      firstBroadApiCandidateId,
      broadApiCoverageGapCategories,
      localPipelineTriggerCategories,
      nextLocalPipelineSourceIds
    })
  };
}

function getCandidateRecommendation(
  candidate: BroadApiCandidate,
  areaId: string,
  targetCategories: ShowCategory[]
): BroadApiCandidateRecommendation {
  const matchingCategories = targetCategories.filter((category) =>
    candidate.categories.includes(category)
  );
  const missingCategories = targetCategories.filter(
    (category) => !candidate.categories.includes(category)
  );
  const marketScore = candidate.marketIds.includes(areaId) ? 18 : -20;
  const readinessScore =
    statusScore[candidate.status] +
    marketScore +
    matchingCategories.length * 4 +
    candidate.roles.reduce((score, role) => score + roleScore[role], 0) -
    candidate.priority;

  return {
    ...candidate,
    matchingCategories,
    missingCategories,
    readinessScore,
    rationale: getRecommendationRationale(candidate, matchingCategories, missingCategories)
  };
}

function getRecommendationRationale(
  candidate: BroadApiCandidate,
  matchingCategories: ShowCategory[],
  missingCategories: ShowCategory[]
): string {
  const coverageCopy =
    missingCategories.length === 0
      ? "covers the full target category set"
      : `covers ${matchingCategories.length} target categories`;
  const statusCopy =
    candidate.status === "adapter-ready" ? "adapter-ready" : `${candidate.status} candidate`;

  return `${candidate.label} is a ${statusCopy} that ${coverageCopy}.`;
}

function getAcquisitionSummary({
  firstBroadApiCandidateId,
  broadApiCoverageGapCategories,
  localPipelineTriggerCategories,
  nextLocalPipelineSourceIds
}: Pick<
  DiscoveryAcquisitionPlan,
  | "firstBroadApiCandidateId"
  | "broadApiCoverageGapCategories"
  | "localPipelineTriggerCategories"
  | "nextLocalPipelineSourceIds"
>): string {
  if (!firstBroadApiCandidateId) {
    return "Research broad APIs before starting venue-specific local work.";
  }

  if (broadApiCoverageGapCategories.length > 0) {
    return `Start with ${firstBroadApiCandidateId}, then use local pipelines for ${broadApiCoverageGapCategories.join(
      ", "
    )}.`;
  }

  if (localPipelineTriggerCategories.length > 0 && nextLocalPipelineSourceIds.length > 0) {
    return `Start with ${firstBroadApiCandidateId}, then measure local depth before ${nextLocalPipelineSourceIds[0]}.`;
  }

  return `Start with ${firstBroadApiCandidateId}; local pipelines can wait until measured gaps appear.`;
}
