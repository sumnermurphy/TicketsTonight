import type { DiscoverySortMode, Show } from "../types";
import { getDiscoveryPicks } from "./discoveryRanking";

export type DiscoveryResultSection = {
  id: string;
  title: string;
  showCount: number;
  shows: Show[];
};

export type DiscoveryResultSectionOptions = {
  sortMode: DiscoverySortMode;
  referenceNow?: string;
  includeBestPicks?: boolean;
  bestPickLimit?: number;
};

const sortedSectionTitles: Record<Exclude<DiscoverySortMode, "soonest">, string> = {
  cheapest: "Cheapest first",
  nearby: "Nearby first"
};

export function getDiscoveryResultSections(
  shows: Show[],
  options: DiscoveryResultSectionOptions
): DiscoveryResultSection[] {
  if (!shows.length) {
    return [];
  }

  if (options.sortMode !== "soonest") {
    return [
      {
        id: `sorted-${options.sortMode}`,
        title: sortedSectionTitles[options.sortMode],
        showCount: shows.length,
        shows
      }
    ];
  }

  const referenceNow = options.referenceNow ?? new Date().toISOString();
  const referenceDateKey = getDateKey(referenceNow);
  const tomorrowDateKey = addDays(referenceDateKey, 1);
  const sectionsByDate = new Map<string, DiscoveryResultSection>();
  const selectedBestPickIds = new Set<string>();
  const chronologicalShows = [...shows].sort((first, second) =>
    first.startsAt.localeCompare(second.startsAt)
  );
  const sections: DiscoveryResultSection[] = [];

  if (options.includeBestPicks) {
    const bestPicks = getDiscoveryPicks(shows, referenceNow, options.bestPickLimit ?? 4).map(
      (pick) => pick.show
    );

    if (bestPicks.length) {
      for (const show of bestPicks) {
        selectedBestPickIds.add(show.id);
      }

      sections.push({
        id: "best-live-picks",
        title: "Best live picks",
        showCount: bestPicks.length,
        shows: bestPicks
      });
    }
  }

  for (const show of chronologicalShows) {
    if (selectedBestPickIds.has(show.id)) {
      continue;
    }

    const dateKey = getDateKey(show.startsAt);
    const sectionKey = getDateSectionKey(dateKey, referenceDateKey, tomorrowDateKey);
    const existingSection = sectionsByDate.get(sectionKey);

    if (existingSection) {
      existingSection.shows.push(show);
      existingSection.showCount += 1;
      continue;
    }

    sectionsByDate.set(sectionKey, {
      id: sectionKey.startsWith("date-") ? sectionKey : `${sectionKey}-${dateKey}`,
      title: getDateSectionTitle(dateKey, referenceDateKey, tomorrowDateKey),
      showCount: 1,
      shows: [show]
    });
  }

  return [...sections, ...Array.from(sectionsByDate.values())];
}

function getDateSectionKey(
  dateKey: string,
  referenceDateKey: string,
  tomorrowDateKey: string
): string {
  if (dateKey === referenceDateKey) {
    return "date-tonight";
  }

  if (dateKey === tomorrowDateKey) {
    return "date-tomorrow";
  }

  if (isWeekendDate(dateKey) && dateKey <= addDays(referenceDateKey, 7)) {
    return "date-weekend";
  }

  return `date-${dateKey}`;
}

function getDateSectionTitle(
  dateKey: string,
  referenceDateKey: string,
  tomorrowDateKey: string
): string {
  if (dateKey === referenceDateKey) {
    return "Tonight";
  }

  if (dateKey === tomorrowDateKey) {
    return "Tomorrow";
  }

  if (isWeekendDate(dateKey) && dateKey <= addDays(referenceDateKey, 7)) {
    return "This weekend";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

function getDateKey(value: string): string {
  return value.slice(0, 10);
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function isWeekendDate(dateKey: string): boolean {
  const day = new Date(`${dateKey}T12:00:00Z`).getUTCDay();

  return day === 5 || day === 6 || day === 0;
}
