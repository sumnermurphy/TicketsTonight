import { categoryLabels } from "../data/catalog";
import type { DateWindow, DiscoverySortMode, ShowCategory } from "../types";
import { formatMoney } from "../utils/format";

export type DiscoveryFilterSummaryInput = {
  categories: ShowCategory[];
  neighborhoods: string[];
  query: string;
  onlyDeals: boolean;
  maxPriceCents?: number;
  dateWindow: DateWindow;
  sortMode: DiscoverySortMode;
};

export type DiscoveryFilterSummary = {
  activeCount: number;
  labels: string[];
  hasActiveFilters: boolean;
};

const dateWindowSummaryLabels: Record<DateWindow, string> = {
  all: "All dates",
  tonight: "Tonight",
  week: "This week",
  weekend: "Weekend"
};

const sortModeSummaryLabels: Record<DiscoverySortMode, string> = {
  soonest: "Soonest",
  cheapest: "Cheapest first",
  nearby: "Nearby first"
};

export function getDiscoveryFilterSummary(
  input: DiscoveryFilterSummaryInput
): DiscoveryFilterSummary {
  const labels: string[] = [];
  const trimmedQuery = input.query.trim();

  if (input.categories.length === 1) {
    labels.push(categoryLabels[input.categories[0]!]);
  } else if (input.categories.length > 1) {
    labels.push(`${input.categories.length} types`);
  }

  if (input.neighborhoods.length === 1) {
    labels.push(input.neighborhoods[0]!);
  } else if (input.neighborhoods.length > 1) {
    labels.push(`${input.neighborhoods.length} neighborhoods`);
  }

  if (trimmedQuery) {
    labels.push(`Search "${trimmedQuery}"`);
  }

  if (input.onlyDeals) {
    labels.push("Deals only");
  }

  if (input.maxPriceCents) {
    labels.push(`Under ${formatMoney(input.maxPriceCents)}`);
  }

  if (input.dateWindow !== "all") {
    labels.push(dateWindowSummaryLabels[input.dateWindow]);
  }

  if (input.sortMode !== "soonest") {
    labels.push(sortModeSummaryLabels[input.sortMode]);
  }

  return {
    activeCount: labels.length,
    labels,
    hasActiveFilters: labels.length > 0
  };
}
