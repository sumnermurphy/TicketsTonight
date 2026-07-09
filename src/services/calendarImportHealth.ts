import type { LocalCalendarSource } from "../data/localCalendarFeeds";
import type { ShowCategory } from "../types";
import type { HtmlCalendarImportResult } from "./htmlCalendarImporter";
import { normalizeCategory } from "./feedProvider";

export type CalendarImportIssue =
  | "missing-title"
  | "missing-start"
  | "missing-venue"
  | "missing-ticket-link"
  | "invalid-json"
  | "unsupported-source-kind";

export type CalendarImportIssueCount = {
  issue: CalendarImportIssue;
  count: number;
};

export type CalendarImportHealthSummary = {
  sourceId: string;
  label: string;
  areaId: string;
  importedAt: string;
  rawEventCount: number;
  importedEventCount: number;
  skippedEventCount: number;
  ticketLinkCount: number;
  ticketLinkCoveragePercent: number;
  duplicateCount: number;
  duplicateRatePercent: number;
  activeCategories: ShowCategory[];
  categoryLift: ShowCategory[];
  issueCounts: CalendarImportIssueCount[];
  recommendedNextAction: string;
};

export function createCalendarImportHealthSummary(
  source: LocalCalendarSource,
  result: HtmlCalendarImportResult
): CalendarImportHealthSummary {
  const ticketLinkCount = result.events.filter((event) => Boolean(event.ticketUrl)).length;
  const duplicateCount = getDuplicateCount(result.events);
  const activeCategories = getActiveCategories(result);
  const issueCounts = createIssueCounts(result);

  return {
    sourceId: source.id,
    label: source.label,
    areaId: source.areaId,
    importedAt: result.importedAt,
    rawEventCount: result.rawEventCount,
    importedEventCount: result.importedEventCount,
    skippedEventCount: result.skippedEventCount,
    ticketLinkCount,
    ticketLinkCoveragePercent: getPercent(ticketLinkCount, result.importedEventCount),
    duplicateCount,
    duplicateRatePercent: getPercent(duplicateCount, result.importedEventCount),
    activeCategories,
    categoryLift: source.categories.filter((category) => activeCategories.includes(category)),
    issueCounts,
    recommendedNextAction: getRecommendedNextAction(source, result, issueCounts)
  };
}

function createIssueCounts(result: HtmlCalendarImportResult): CalendarImportIssueCount[] {
  const counts = new Map<CalendarImportIssue, number>();

  for (const skippedReason of result.skippedReasons) {
    counts.set(
      skippedReason.reason,
      (counts.get(skippedReason.reason) ?? 0) + skippedReason.count
    );
  }

  for (const event of result.events) {
    if (!event.ticketUrl) {
      counts.set("missing-ticket-link", (counts.get("missing-ticket-link") ?? 0) + 1);
    }

    if (!event.venueName) {
      counts.set("missing-venue", (counts.get("missing-venue") ?? 0) + 1);
    }
  }

  return [...counts.entries()].map(([issue, count]) => ({ issue, count }));
}

function getRecommendedNextAction(
  source: LocalCalendarSource,
  result: HtmlCalendarImportResult,
  issueCounts: CalendarImportIssueCount[]
): string {
  const missingRequiredFields = issueCounts.some(
    (issue) => issue.issue === "missing-title" || issue.issue === "missing-start"
  );
  const missingLinks = issueCounts.find((issue) => issue.issue === "missing-ticket-link")?.count ?? 0;

  if (source.parserProfile?.legalStatus === "blocked") {
    return "Do not import this source; legal/terms status blocks ingestion.";
  }

  if (result.importedEventCount === 0) {
    return "Keep as parser-ready candidate and collect a fixture with event dates before ingestion.";
  }

  if (missingRequiredFields) {
    return "Fix required-field extraction before promoting this calendar beyond fixture-backed imports.";
  }

  if (missingLinks > 0) {
    return "Improve ticket-link extraction before relying on this source for live discovery.";
  }

  if (source.areaId === "hudson") {
    return "Use this parser-backed calendar to expand Hudson depth while legal review remains explicit.";
  }

  return "Use this parser-ready calendar to measure category lift before venue-specific adapters.";
}

function getDuplicateCount(events: HtmlCalendarImportResult["events"]): number {
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const event of events) {
    const key = [
      event.areaId,
      event.title.trim().toLowerCase(),
      event.venueName.trim().toLowerCase(),
      event.startsAt.slice(0, 16)
    ].join("|");

    if (seen.has(key)) {
      duplicateCount += 1;
    } else {
      seen.add(key);
    }
  }

  return duplicateCount;
}

function getActiveCategories(result: HtmlCalendarImportResult): ShowCategory[] {
  const categories = new Set<ShowCategory>();

  for (const event of result.events) {
    categories.add(normalizeCategory(event.taxonomy));
  }

  return [...categories];
}

function getPercent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}
