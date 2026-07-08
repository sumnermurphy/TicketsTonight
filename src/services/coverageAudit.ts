import { categoryLabels } from "../data/catalog";
import type { InventorySource, Show, ShowCategory } from "../types";
import { isWithinDateWindow } from "./eventCatalog";
import { getSafeTicketUrl } from "./ticketLinks";

export type CoverageAuditStatus =
  | "ready"
  | "needs-events"
  | "needs-links"
  | "needs-category-depth";

export type CoverageAuditCategoryGroupTarget = {
  id: string;
  label: string;
  categories: ShowCategory[];
  targetCount: number;
};

export type CoverageAuditTarget = {
  eventCount: number;
  ticketLinkCoveragePercent: number;
  windowDays: number;
  categoryGroups: CoverageAuditCategoryGroupTarget[];
};

export type CoverageAuditCategoryCount = {
  category: ShowCategory;
  label: string;
  count: number;
};

export type CoverageAuditCategoryGroupCount = CoverageAuditCategoryGroupTarget & {
  count: number;
  passes: boolean;
};

export type CoverageAuditSourceCount = {
  source: InventorySource;
  count: number;
};

export type CoverageAuditSummary = {
  areaId: string;
  windowDays: number;
  eventCount: number;
  targetEventCount: number;
  eventProgressPercent: number;
  ticketLinkCount: number;
  ticketLinkCoveragePercent: number;
  targetTicketLinkCoveragePercent: number;
  status: CoverageAuditStatus;
  categoryCounts: CoverageAuditCategoryCount[];
  categoryGroupCounts: CoverageAuditCategoryGroupCount[];
  weakCategoryGroups: CoverageAuditCategoryGroupCount[];
  sourceCounts: CoverageAuditSourceCount[];
  dateWindowCounts: {
    tonight: number;
    week: number;
    weekend: number;
  };
};

type CoverageAuditOptions = {
  areaId: string;
  referenceNow?: string;
  windowDays?: number;
  target?: CoverageAuditTarget;
};

const baseCategoryGroups: Array<Omit<CoverageAuditCategoryGroupTarget, "targetCount">> = [
  {
    id: "music-nightlife",
    label: "Music and nightlife",
    categories: ["concert", "dj"]
  },
  {
    id: "stage-comedy",
    label: "Stage and comedy",
    categories: ["play", "theater", "comedy"]
  },
  {
    id: "performing-arts",
    label: "Performing arts",
    categories: ["dance", "ballet", "opera"]
  },
  {
    id: "adjacent-live",
    label: "Adjacent live",
    categories: ["variety"]
  }
];

const marketTargetCounts: Record<
  string,
  {
    eventCount: number;
    ticketLinkCoveragePercent: number;
    windowDays: number;
    groupTargets: Record<string, number>;
  }
> = {
  nyc: {
    eventCount: 200,
    ticketLinkCoveragePercent: 70,
    windowDays: 30,
    groupTargets: {
      "music-nightlife": 60,
      "stage-comedy": 60,
      "performing-arts": 40,
      "adjacent-live": 20
    }
  },
  la: {
    eventCount: 100,
    ticketLinkCoveragePercent: 70,
    windowDays: 30,
    groupTargets: {
      "music-nightlife": 40,
      "stage-comedy": 20,
      "performing-arts": 25,
      "adjacent-live": 10
    }
  },
  hudson: {
    eventCount: 30,
    ticketLinkCoveragePercent: 60,
    windowDays: 30,
    groupTargets: {
      "music-nightlife": 10,
      "stage-comedy": 8,
      "performing-arts": 8,
      "adjacent-live": 4
    }
  }
};

export function createCoverageAudit(
  shows: Show[],
  options: CoverageAuditOptions
): CoverageAuditSummary {
  const referenceNow = options.referenceNow ?? new Date().toISOString();
  const target = options.target ?? getDefaultCoverageAuditTarget(options.areaId);
  const windowDays = options.windowDays ?? target.windowDays;
  const auditedShows = shows
    .filter((show) => show.areaId === options.areaId)
    .filter((show) => isWithinRollingWindow(show.startsAt, referenceNow, windowDays));
  const ticketLinkCount = auditedShows.filter(hasTicketLink).length;
  const ticketLinkCoveragePercent = getPercent(ticketLinkCount, auditedShows.length);
  const categoryCounts = createCategoryCounts(auditedShows);
  const categoryCountsByCategory = new Map(
    categoryCounts.map((categoryCount) => [categoryCount.category, categoryCount.count])
  );
  const categoryGroupCounts = target.categoryGroups.map((group) => {
    const count = group.categories.reduce(
      (total, category) => total + (categoryCountsByCategory.get(category) ?? 0),
      0
    );

    return {
      ...group,
      count,
      passes: count >= group.targetCount
    };
  });
  const weakCategoryGroups = categoryGroupCounts.filter((group) => !group.passes);
  const status = getAuditStatus({
    eventCount: auditedShows.length,
    ticketLinkCoveragePercent,
    target,
    weakCategoryGroups
  });

  return {
    areaId: options.areaId,
    windowDays,
    eventCount: auditedShows.length,
    targetEventCount: target.eventCount,
    eventProgressPercent: getPercent(auditedShows.length, target.eventCount),
    ticketLinkCount,
    ticketLinkCoveragePercent,
    targetTicketLinkCoveragePercent: target.ticketLinkCoveragePercent,
    status,
    categoryCounts,
    categoryGroupCounts,
    weakCategoryGroups,
    sourceCounts: createSourceCounts(auditedShows),
    dateWindowCounts: {
      tonight: auditedShows.filter((show) =>
        isWithinDateWindow(show.startsAt, "tonight", referenceNow)
      ).length,
      week: auditedShows.filter((show) =>
        isWithinDateWindow(show.startsAt, "week", referenceNow)
      ).length,
      weekend: auditedShows.filter((show) =>
        isWithinDateWindow(show.startsAt, "weekend", referenceNow)
      ).length
    }
  };
}

export function getDefaultCoverageAuditTarget(areaId: string): CoverageAuditTarget {
  const fallbackTargetCounts = marketTargetCounts.nyc;

  if (!fallbackTargetCounts) {
    throw new Error("NYC coverage audit target is not configured.");
  }

  const targetCounts = marketTargetCounts[areaId] ?? fallbackTargetCounts;

  return {
    eventCount: targetCounts.eventCount,
    ticketLinkCoveragePercent: targetCounts.ticketLinkCoveragePercent,
    windowDays: targetCounts.windowDays,
    categoryGroups: baseCategoryGroups.map((group) => ({
      ...group,
      targetCount: targetCounts.groupTargets[group.id] ?? 0
    }))
  };
}

export function getCoverageAuditStatusCopy(summary: CoverageAuditSummary): string {
  if (summary.status === "ready") {
    return "Target met";
  }

  if (summary.status === "needs-links") {
    return "Link gap";
  }

  if (summary.status === "needs-category-depth") {
    return "Category gaps";
  }

  return "Needs supply";
}

export function getCoverageAuditActionCopy(summary: CoverageAuditSummary): string {
  if (summary.status === "ready") {
    return `${summary.eventCount} events with ${summary.ticketLinkCoveragePercent}% ticket-link coverage`;
  }

  if (summary.status === "needs-links") {
    return `${summary.ticketLinkCoveragePercent}% ticket-link coverage; target ${summary.targetTicketLinkCoveragePercent}%`;
  }

  if (summary.status === "needs-category-depth") {
    return `Weak lanes: ${summary.weakCategoryGroups.map((group) => group.label).join(", ")}`;
  }

  const remainingEvents = Math.max(0, summary.targetEventCount - summary.eventCount);

  return `${remainingEvents} more events needed for the ${summary.windowDays}-day target`;
}

function createCategoryCounts(shows: Show[]): CoverageAuditCategoryCount[] {
  return (Object.keys(categoryLabels) as ShowCategory[]).map((category) => ({
    category,
    label: categoryLabels[category],
    count: shows.filter((show) => show.category === category).length
  }));
}

function createSourceCounts(shows: Show[]): CoverageAuditSourceCount[] {
  const countsBySource = new Map<InventorySource, number>();

  for (const show of shows) {
    countsBySource.set(show.source, (countsBySource.get(show.source) ?? 0) + 1);
  }

  return Array.from(countsBySource.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((first, second) => second.count - first.count || first.source.localeCompare(second.source));
}

function getAuditStatus({
  eventCount,
  ticketLinkCoveragePercent,
  target,
  weakCategoryGroups
}: {
  eventCount: number;
  ticketLinkCoveragePercent: number;
  target: CoverageAuditTarget;
  weakCategoryGroups: CoverageAuditCategoryGroupCount[];
}): CoverageAuditStatus {
  if (eventCount < target.eventCount) {
    return "needs-events";
  }

  if (ticketLinkCoveragePercent < target.ticketLinkCoveragePercent) {
    return "needs-links";
  }

  if (weakCategoryGroups.length) {
    return "needs-category-depth";
  }

  return "ready";
}

function isWithinRollingWindow(startsAt: string, referenceNow: string, windowDays: number): boolean {
  const showTime = new Date(startsAt).getTime();
  const now = new Date(referenceNow).getTime();

  return showTime >= now && showTime <= now + windowDays * 24 * 60 * 60 * 1000;
}

function hasTicketLink(show: Show): boolean {
  return show.ticketOffers.some((offer) => Boolean(getSafeTicketUrl(offer.externalUrl)));
}

function getPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}
