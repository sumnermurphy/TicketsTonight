import { areas } from "../data/catalog";
import { discoveryMarketPlans } from "../data/discoveryPlans";
import type { DiscoveryMarketPlan, DiscoverySourcePlan, DiscoverySourceStatus } from "../types";

const readyStatuses = new Set<DiscoverySourceStatus>(["active-fixture", "integration-ready"]);

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

  return plan.sources.filter((source) => readyStatuses.has(source.status));
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
