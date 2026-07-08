import {
  createCoverageAudit,
  getDefaultCoverageAuditTarget,
  type CoverageAuditCategoryGroupCount
} from "./coverageAudit";
import type { Show } from "../types";

export type LiveSupplyAuditStatus = "ready" | "needs-events" | "needs-links";

export type LiveSupplyAuditSummary = {
  areaId: string;
  windowDays: number;
  eventCount: number;
  targetEventCount: number;
  eventGapCount: number;
  eventProgressPercent: number;
  ticketLinkCount: number;
  ticketLinkCoveragePercent: number;
  targetTicketLinkCoveragePercent: number;
  pricedOfferCount: number;
  linkOnlyOfferCount: number;
  status: LiveSupplyAuditStatus;
  categoryGroupCounts: CoverageAuditCategoryGroupCount[];
};

export type LiveSupplyAuditOptions = {
  areaId: string;
  referenceNow?: string;
  windowDays?: number;
  targetEventCount?: number;
  targetTicketLinkCoveragePercent?: number;
};

export function createLiveSupplyAudit(
  shows: Show[],
  options: LiveSupplyAuditOptions
): LiveSupplyAuditSummary {
  const defaultTarget = getDefaultCoverageAuditTarget(options.areaId);
  const targetEventCount = options.targetEventCount ?? 50;
  const targetTicketLinkCoveragePercent =
    options.targetTicketLinkCoveragePercent ?? defaultTarget.ticketLinkCoveragePercent;
  const coverageAudit = createCoverageAudit(shows, {
    areaId: options.areaId,
    referenceNow: options.referenceNow,
    windowDays: options.windowDays ?? defaultTarget.windowDays,
    target: {
      ...defaultTarget,
      eventCount: targetEventCount,
      ticketLinkCoveragePercent: targetTicketLinkCoveragePercent,
      categoryGroups: defaultTarget.categoryGroups.map((group) => ({
        ...group,
        targetCount: 0
      }))
    }
  });
  const eventGapCount = Math.max(0, targetEventCount - coverageAudit.eventCount);

  return {
    areaId: options.areaId,
    windowDays: coverageAudit.windowDays,
    eventCount: coverageAudit.eventCount,
    targetEventCount,
    eventGapCount,
    eventProgressPercent: coverageAudit.eventProgressPercent,
    ticketLinkCount: coverageAudit.ticketLinkCount,
    ticketLinkCoveragePercent: coverageAudit.ticketLinkCoveragePercent,
    targetTicketLinkCoveragePercent,
    pricedOfferCount: coverageAudit.pricedOfferCount,
    linkOnlyOfferCount: coverageAudit.linkOnlyOfferCount,
    status: getLiveSupplyAuditStatus(
      eventGapCount,
      coverageAudit.ticketLinkCoveragePercent,
      targetTicketLinkCoveragePercent
    ),
    categoryGroupCounts: coverageAudit.categoryGroupCounts
  };
}

export function getLiveSupplyAuditStatusCopy(summary: LiveSupplyAuditSummary): string {
  if (summary.status === "ready") {
    return "Live supply target met";
  }

  if (summary.status === "needs-links") {
    return "Enough events; ticket-link coverage gap remains";
  }

  return "Needs more live events";
}

export function getLiveSupplyAuditActionCopy(summary: LiveSupplyAuditSummary): string {
  if (summary.status === "ready") {
    return `${summary.eventCount} NYC events with ${summary.ticketLinkCoveragePercent}% ticket-link coverage`;
  }

  if (summary.status === "needs-links") {
    return `${summary.ticketLinkCoveragePercent}% ticket-link coverage; target ${summary.targetTicketLinkCoveragePercent}%`;
  }

  return `${summary.eventGapCount} more NYC events needed to reach ${summary.targetEventCount}`;
}

function getLiveSupplyAuditStatus(
  eventGapCount: number,
  ticketLinkCoveragePercent: number,
  targetTicketLinkCoveragePercent: number
): LiveSupplyAuditStatus {
  if (eventGapCount > 0) {
    return "needs-events";
  }

  if (ticketLinkCoveragePercent < targetTicketLinkCoveragePercent) {
    return "needs-links";
  }

  return "ready";
}
