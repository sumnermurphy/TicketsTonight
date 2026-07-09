import { localSourceBuildStages, localSourceCandidates } from "../data/localSourceCandidates";
import type {
  LocalSourceBuildStage,
  LocalSourceCandidate,
  LocalSourceCandidateStatus,
  LocalSourceIntakeKind,
  LocalSourceTermsPosture,
  LocalSourceTrustLevel
} from "../data/localSourceCandidates";
import type { DiscoverySourceType, ShowCategory } from "../types";
import { getDiscoveryMarketPlan } from "./discoveryPlanning";

export type LocalSourceCandidateRecommendation = LocalSourceCandidate & {
  matchingCategories: ShowCategory[];
  missingCategories: ShowCategory[];
  readinessScore: number;
  rationale: string;
};

export type LocalSourceCategoryCoverage = {
  category: ShowCategory;
  candidateCount: number;
  readyCandidateCount: number;
  topCandidateIds: string[];
};

export type LocalSourceDirectorySummary = {
  areaId: string;
  candidateCount: number;
  readyCandidateCount: number;
  partnerNeededCount: number;
  permissionRequiredCount: number;
  structuredCandidateCount: number;
  ticketLinkCandidateCount: number;
  categoriesCovered: ShowCategory[];
  missingCategoryCount: number;
  categoryCoverage: LocalSourceCategoryCoverage[];
  intakeMix: { intakeKind: LocalSourceIntakeKind; count: number }[];
  sourceTypeMix: { sourceType: DiscoverySourceType; count: number }[];
  topCandidateIds: string[];
  recommendedNextAction: string;
};

export type LocalSourceOnboardingChecklist = {
  areaId: string;
  requiredFields: Array<keyof LocalSourceCandidate>;
  stages: LocalSourceBuildStage[];
  sourceMixTargets: { intakeKind: LocalSourceIntakeKind; minimumCandidateCount: number }[];
};

const readyStatuses = new Set<LocalSourceCandidateStatus>(["fixture-backed", "parser-ready"]);

const statusScore: Record<LocalSourceCandidateStatus, number> = {
  "parser-ready": 92,
  "fixture-backed": 78,
  "sample-needed": 58,
  "partner-needed": 44,
  "seeded-research": 32,
  deferred: 4
};

const intakeScore: Record<LocalSourceIntakeKind, number> = {
  ics: 22,
  "partner-feed": 22,
  "html-calendar": 20,
  api: 18,
  rss: 14,
  "manual-import": 12,
  newsletter: 10,
  "research-lead": 6
};

const sourceTypeScore: Record<DiscoverySourceType, number> = {
  "calendar-feed": 16,
  "partner-feed": 14,
  "venue-direct": 13,
  "promoter-feed": 12,
  "marketplace-api": 8,
  "seed-catalog": 2
};

const trustScore: Record<LocalSourceTrustLevel, number> = {
  official: 14,
  partner: 12,
  community: 6,
  research: 2
};

const termsScore: Record<LocalSourceTermsPosture, number> = {
  "public-calendar-review": 12,
  "api-terms-review": 6,
  "manual-lead-only": 2,
  "partner-permission-required": -8,
  "do-not-ingest": -80
};

export function getLocalSourceCandidates(areaId?: string): LocalSourceCandidate[] {
  const candidates = areaId
    ? localSourceCandidates.filter((candidate) => candidate.areaId === areaId)
    : localSourceCandidates;

  return [...candidates].sort((first, second) => first.priority - second.priority);
}

export function getRankedLocalSourceCandidates(
  areaId: string,
  categories?: ShowCategory[]
): LocalSourceCandidateRecommendation[] {
  const plan = getDiscoveryMarketPlan(areaId);
  const targetCategories = categories?.length ? categories : plan?.categoryFocus ?? [];

  return getLocalSourceCandidates(areaId)
    .map((candidate) => createCandidateRecommendation(candidate, targetCategories))
    .sort(
      (first, second) =>
        second.readinessScore - first.readinessScore || first.priority - second.priority
    );
}

export function createLocalSourceDirectorySummary(
  areaId: string
): LocalSourceDirectorySummary {
  const candidates = getLocalSourceCandidates(areaId);
  const rankedCandidates = getRankedLocalSourceCandidates(areaId);
  const plan = getDiscoveryMarketPlan(areaId);
  const targetCategories = plan?.categoryFocus ?? uniqueCategories(candidates);
  const readyCandidates = candidates.filter(isReadyCandidate);
  const categoriesCovered = targetCategories.filter((category) =>
    candidates.some((candidate) => candidate.categories.includes(category))
  );

  return {
    areaId,
    candidateCount: candidates.length,
    readyCandidateCount: readyCandidates.length,
    partnerNeededCount: candidates.filter((candidate) => candidate.status === "partner-needed")
      .length,
    permissionRequiredCount: candidates.filter((candidate) => candidate.requiresPermission).length,
    structuredCandidateCount: candidates.filter((candidate) => candidate.hasStructuredListings)
      .length,
    ticketLinkCandidateCount: candidates.filter((candidate) => candidate.hasTicketLinks).length,
    categoriesCovered,
    missingCategoryCount: Math.max(0, targetCategories.length - categoriesCovered.length),
    categoryCoverage: targetCategories.map((category) =>
      createCategoryCoverage(category, rankedCandidates)
    ),
    intakeMix: createCountMix(candidates, (candidate) => candidate.intakeKind, "intakeKind"),
    sourceTypeMix: createCountMix(candidates, (candidate) => candidate.sourceType, "sourceType"),
    topCandidateIds: rankedCandidates.slice(0, 5).map((candidate) => candidate.id),
    recommendedNextAction: getRecommendedNextAction(rankedCandidates)
  };
}

export function getLocalSourceBuildStages(): LocalSourceBuildStage[] {
  return [...localSourceBuildStages];
}

export function createLocalSourceOnboardingChecklist(
  areaId: string
): LocalSourceOnboardingChecklist {
  return {
    areaId,
    requiredFields: [
      "id",
      "label",
      "areaId",
      "neighborhood",
      "sourceType",
      "intakeKind",
      "status",
      "categories",
      "sourceUrl",
      "termsPosture",
      "requiresPermission",
      "nextStep"
    ],
    stages: getLocalSourceBuildStages(),
    sourceMixTargets: [
      { intakeKind: "html-calendar", minimumCandidateCount: 5 },
      { intakeKind: "partner-feed", minimumCandidateCount: 1 },
      { intakeKind: "manual-import", minimumCandidateCount: 1 }
    ]
  };
}

function createCandidateRecommendation(
  candidate: LocalSourceCandidate,
  targetCategories: ShowCategory[]
): LocalSourceCandidateRecommendation {
  const matchingCategories = targetCategories.filter((category) =>
    candidate.categories.includes(category)
  );
  const missingCategories = targetCategories.filter(
    (category) => !candidate.categories.includes(category)
  );
  const readinessScore =
    statusScore[candidate.status] +
    intakeScore[candidate.intakeKind] +
    sourceTypeScore[candidate.sourceType] +
    trustScore[candidate.trustLevel] +
    termsScore[candidate.termsPosture] +
    matchingCategories.length * 5 +
    (candidate.hasStructuredListings ? 8 : 0) +
    (candidate.hasTicketLinks ? 7 : 0) -
    (candidate.requiresPermission ? 12 : 0) -
    candidate.priority;

  return {
    ...candidate,
    matchingCategories,
    missingCategories,
    readinessScore,
    rationale: createRationale(candidate, matchingCategories)
  };
}

function createRationale(
  candidate: LocalSourceCandidate,
  matchingCategories: ShowCategory[]
): string {
  const categoryCopy = matchingCategories.length
    ? `covers ${matchingCategories.length} target categories`
    : "needs category validation";
  const rightsCopy = candidate.requiresPermission
    ? "requires permission before ingestion"
    : "can start with public-calendar review";

  return `${candidate.label} ${categoryCopy} and ${rightsCopy}.`;
}

function createCategoryCoverage(
  category: ShowCategory,
  rankedCandidates: LocalSourceCandidateRecommendation[]
): LocalSourceCategoryCoverage {
  const categoryCandidates = rankedCandidates.filter((candidate) =>
    candidate.categories.includes(category)
  );

  return {
    category,
    candidateCount: categoryCandidates.length,
    readyCandidateCount: categoryCandidates.filter(isReadyCandidate).length,
    topCandidateIds: categoryCandidates.slice(0, 3).map((candidate) => candidate.id)
  };
}

function getRecommendedNextAction(
  rankedCandidates: LocalSourceCandidateRecommendation[]
): string {
  const firstAutomatable = rankedCandidates.find(
    (candidate) =>
      candidate.termsPosture === "public-calendar-review" ||
      candidate.termsPosture === "api-terms-review"
  );
  const firstCandidate = firstAutomatable ?? rankedCandidates[0];

  if (!firstCandidate) {
    return "Seed at least five local sources before building a market-specific adapter.";
  }

  if (firstCandidate.status === "fixture-backed" || firstCandidate.status === "parser-ready") {
    return `Promote ${firstCandidate.label} through freshness and duplicate checks before adding another one-off source.`;
  }

  if (firstCandidate.requiresPermission) {
    return `Confirm partner rights for ${firstCandidate.label} before ingestion.`;
  }

  return `Collect sample listings for ${firstCandidate.label}, then run the normalize/dedupe checklist.`;
}

function isReadyCandidate(candidate: Pick<LocalSourceCandidate, "status">): boolean {
  return readyStatuses.has(candidate.status);
}

function uniqueCategories(candidates: LocalSourceCandidate[]): ShowCategory[] {
  const categories = new Set<ShowCategory>();

  for (const candidate of candidates) {
    for (const category of candidate.categories) {
      categories.add(category);
    }
  }

  return [...categories];
}

function createCountMix<T extends string, K extends string>(
  candidates: LocalSourceCandidate[],
  getValue: (candidate: LocalSourceCandidate) => T,
  key: K
): Array<Record<K, T> & { count: number }> {
  const counts = new Map<T, number>();

  for (const candidate of candidates) {
    const value = getValue(candidate);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ [key]: value, count }) as Record<K, T> & { count: number })
    .sort((first, second) => second.count - first.count);
}
