import { areas } from "../data/catalog";
import { discoveryMarketPlans } from "../data/discoveryPlans";
import type {
  DiscoveryMarketPlan,
  DiscoverySourceLane,
  DiscoverySourcePlan,
  DiscoverySourceStatus,
  ShowCategory
} from "../types";

const readyStatuses = new Set<DiscoverySourceStatus>(["active-fixture", "integration-ready"]);
const nextLocalSourceStatusRank: Record<DiscoverySourceStatus, number> = {
  "integration-ready": 0,
  "partner-needed": 1,
  deferred: 2,
  "active-fixture": 3
};

export type DiscoverySourceStrategySummary = {
  areaId: string;
  broadApiSourceCount: number;
  readyBroadApiSourceCount: number;
  localPipelineSourceCount: number;
  readyLocalPipelineSourceCount: number;
  seedFixtureSourceCount: number;
  activeFixtureSourceCount: number;
  partnerNeededLocalPipelineCount: number;
};

export type DiscoveryCategoryCoverageLevel =
  | "ready-local"
  | "broad-api-ready"
  | "fixture-only"
  | "planned"
  | "uncovered";

export type DiscoveryCategoryCoverage = {
  areaId: string;
  category: ShowCategory;
  coverageLevel: DiscoveryCategoryCoverageLevel;
  sourceIds: string[];
  readySourceIds: string[];
  readyBroadApiSourceIds: string[];
  readyLocalPipelineSourceIds: string[];
  activeFixtureSourceIds: string[];
  partnerNeededLocalPipelineSourceIds: string[];
  needsLocalPipeline: boolean;
};

export function getDiscoveryMarketPlans(): DiscoveryMarketPlan[] {
  return areas
    .map((area) => getDiscoveryMarketPlan(area.id))
    .filter((plan): plan is DiscoveryMarketPlan => Boolean(plan))
    .sort((first, second) => first.priority - second.priority);
}

export function getDiscoveryMarketPlan(areaId: string): DiscoveryMarketPlan | undefined {
  return discoveryMarketPlans.find((plan) => plan.areaId === areaId);
}

export function getPrimaryDiscoveryMarketPlan(): DiscoveryMarketPlan | undefined {
  return getDiscoveryMarketPlans()[0];
}

export function getReadyDiscoverySources(areaId: string): DiscoverySourcePlan[] {
  const plan = getDiscoveryMarketPlan(areaId);

  if (!plan) {
    return [];
  }

  return plan.sources.filter(isReadySource);
}

export function getDiscoverySourceStrategy(
  areaId: string
): DiscoverySourceStrategySummary | undefined {
  const plan = getDiscoveryMarketPlan(areaId);

  if (!plan) {
    return undefined;
  }

  const broadApiSources = getSourcesByLane(plan, "broad-api");
  const localPipelineSources = getSourcesByLane(plan, "local-pipeline");
  const seedFixtureSources = getSourcesByLane(plan, "seed-fixture");

  return {
    areaId,
    broadApiSourceCount: broadApiSources.length,
    readyBroadApiSourceCount: broadApiSources.filter(isReadySource).length,
    localPipelineSourceCount: localPipelineSources.length,
    readyLocalPipelineSourceCount: localPipelineSources.filter(isReadySource).length,
    seedFixtureSourceCount: seedFixtureSources.length,
    activeFixtureSourceCount: plan.sources.filter((source) => source.status === "active-fixture")
      .length,
    partnerNeededLocalPipelineCount: localPipelineSources.filter(
      (source) => source.status === "partner-needed"
    ).length
  };
}

export function getNextLocalDiscoverySources(areaId: string): DiscoverySourcePlan[] {
  const plan = getDiscoveryMarketPlan(areaId);

  if (!plan) {
    return [];
  }

  return getSourcesByLane(plan, "local-pipeline")
    .filter((source) => source.status === "integration-ready" || source.status === "partner-needed")
    .sort(
      (first, second) =>
        nextLocalSourceStatusRank[first.status] - nextLocalSourceStatusRank[second.status]
    );
}

export function getDiscoveryCategoryCoverage(areaId: string): DiscoveryCategoryCoverage[] {
  const plan = getDiscoveryMarketPlan(areaId);

  if (!plan) {
    return [];
  }

  return plan.categoryFocus.map((category) => getCategoryCoverage(plan, category));
}

export function getLocalPipelinePriorityCategories(areaId: string): ShowCategory[] {
  return getDiscoveryCategoryCoverage(areaId)
    .filter((coverage) => coverage.needsLocalPipeline)
    .map((coverage) => coverage.category);
}

export function getMarketDiscoveryGaps(areaId: string): DiscoveryMarketPlan["categoryFocus"] {
  const plan = getDiscoveryMarketPlan(areaId);

  if (!plan) {
    return [];
  }

  const coveredCategories = new Set(
    plan.sources
      .filter((source) => readyStatuses.has(source.status) || source.status === "partner-needed")
      .flatMap((source) => source.categories)
  );

  return plan.categoryFocus.filter((category) => !coveredCategories.has(category));
}

export function getDiscountLeversForMarket(areaId: string): string[] {
  return getDiscoveryMarketPlan(areaId)?.discountLevers ?? [];
}

function getSourcesByLane(
  plan: DiscoveryMarketPlan,
  lane: DiscoverySourceLane
): DiscoverySourcePlan[] {
  return plan.sources.filter((source) => source.lane === lane);
}

function isReadySource(source: DiscoverySourcePlan): boolean {
  return readyStatuses.has(source.status);
}

function getCategoryCoverage(
  plan: DiscoveryMarketPlan,
  category: ShowCategory
): DiscoveryCategoryCoverage {
  const sources = plan.sources.filter((source) => source.categories.includes(category));
  const readySources = sources.filter(isReadySource);
  const readyBroadApiSources = readySources.filter((source) => source.lane === "broad-api");
  const readyLocalPipelineSources = readySources.filter(
    (source) => source.lane === "local-pipeline"
  );
  const activeFixtureSources = sources.filter((source) => source.status === "active-fixture");
  const partnerNeededLocalPipelineSources = sources.filter(
    (source) => source.lane === "local-pipeline" && source.status === "partner-needed"
  );
  const coverageLevel = getCoverageLevel({
    activeFixtureSources,
    readyBroadApiSources,
    readyLocalPipelineSources,
    sources
  });

  return {
    areaId: plan.areaId,
    category,
    coverageLevel,
    sourceIds: sources.map((source) => source.id),
    readySourceIds: readySources.map((source) => source.id),
    readyBroadApiSourceIds: readyBroadApiSources.map((source) => source.id),
    readyLocalPipelineSourceIds: readyLocalPipelineSources.map((source) => source.id),
    activeFixtureSourceIds: activeFixtureSources.map((source) => source.id),
    partnerNeededLocalPipelineSourceIds: partnerNeededLocalPipelineSources.map(
      (source) => source.id
    ),
    needsLocalPipeline:
      readyLocalPipelineSources.length === 0 && partnerNeededLocalPipelineSources.length > 0
  };
}

function getCoverageLevel({
  activeFixtureSources,
  readyBroadApiSources,
  readyLocalPipelineSources,
  sources
}: {
  activeFixtureSources: DiscoverySourcePlan[];
  readyBroadApiSources: DiscoverySourcePlan[];
  readyLocalPipelineSources: DiscoverySourcePlan[];
  sources: DiscoverySourcePlan[];
}): DiscoveryCategoryCoverageLevel {
  if (readyLocalPipelineSources.length > 0) {
    return "ready-local";
  }

  if (readyBroadApiSources.length > 0) {
    return "broad-api-ready";
  }

  if (activeFixtureSources.length > 0) {
    return "fixture-only";
  }

  return sources.length > 0 ? "planned" : "uncovered";
}
