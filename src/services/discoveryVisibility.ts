import type { Show } from "../types";
import { getSafeTicketUrl } from "./ticketLinks";

export const initialDiscoveryVisibleCount = 60;
export const discoveryVisibleIncrement = 60;

export type DiscoveryInventoryStatus = {
  tone: "live" | "fallback" | "local" | "warning";
  copy: string;
};

export function getPagedDiscoveryResults(shows: Show[], visibleCount: number): Show[] {
  return shows.slice(0, normalizeVisibleCount(visibleCount));
}

export function getNextVisibleDiscoveryCount(
  currentVisibleCount: number,
  totalCount: number,
  increment = discoveryVisibleIncrement
): number {
  return Math.min(
    Math.max(0, totalCount),
    normalizeVisibleCount(currentVisibleCount) + normalizeVisibleCount(increment)
  );
}

export function getRemainingDiscoveryCount(totalCount: number, visibleCount: number): number {
  return Math.max(0, totalCount - normalizeVisibleCount(visibleCount));
}

export function getDiscoveryResultCountCopy({
  loading,
  totalCount,
  visibleCount,
  dateWindowLabel
}: {
  loading: boolean;
  totalCount: number;
  visibleCount: number;
  dateWindowLabel: string;
}): string {
  if (loading) {
    return "Loading shows";
  }

  const normalizedTotalCount = Math.max(0, totalCount);
  const normalizedVisibleCount = Math.min(
    normalizedTotalCount,
    normalizeVisibleCount(visibleCount)
  );
  const noun = normalizedTotalCount === 1 ? "show" : "shows";

  if (normalizedVisibleCount < normalizedTotalCount) {
    return `Showing ${normalizedVisibleCount} of ${normalizedTotalCount} ${noun} · ${dateWindowLabel}`;
  }

  return `${normalizedTotalCount} ${noun} · ${dateWindowLabel}`;
}

export function getDiscoveryInventoryStatus({
  areaId,
  shows,
  ticketmasterConfigured,
  inventoryError
}: {
  areaId: string;
  shows: Show[];
  ticketmasterConfigured: boolean;
  inventoryError?: string | null;
}): DiscoveryInventoryStatus {
  if (inventoryError) {
    return {
      tone: "warning",
      copy: "Local fallback inventory · Provider refresh failed"
    };
  }

  if (hasPrimaryTicketLinks(shows)) {
    return {
      tone: "live",
      copy: "Live inventory loaded · Primary links available"
    };
  }

  if (areaId === "hudson" && shows.some((show) => show.source === "calendar-feed")) {
    return {
      tone: "local",
      copy: "Local calendar coverage · Broad provider is limited in Hudson"
    };
  }

  if (ticketmasterConfigured) {
    return {
      tone: "local",
      copy: "Local fallback inventory · Live provider returned limited supply"
    };
  }

  return {
    tone: "fallback",
    copy: "Local fallback inventory · Add provider key for live events"
  };
}

function hasPrimaryTicketLinks(shows: Show[]): boolean {
  return shows.some(
    (show) =>
      show.source === "primary-marketplace" &&
      show.ticketOffers.some((offer) => Boolean(getSafeTicketUrl(offer.externalUrl)))
  );
}

function normalizeVisibleCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}
