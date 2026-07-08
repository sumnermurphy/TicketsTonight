import type { DiscoverySortMode, Show } from "../types";

export type DiscoveryResultSection = {
  id: string;
  title: string;
  showCount: number;
  shows: Show[];
};

export type DiscoveryResultSectionOptions = {
  sortMode: DiscoverySortMode;
  referenceNow?: string;
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

  const referenceDateKey = getDateKey(options.referenceNow ?? new Date().toISOString());
  const tomorrowDateKey = addDays(referenceDateKey, 1);
  const sectionsByDate = new Map<string, DiscoveryResultSection>();
  const chronologicalShows = [...shows].sort((first, second) =>
    first.startsAt.localeCompare(second.startsAt)
  );

  for (const show of chronologicalShows) {
    const dateKey = getDateKey(show.startsAt);
    const existingSection = sectionsByDate.get(dateKey);

    if (existingSection) {
      existingSection.shows.push(show);
      existingSection.showCount += 1;
      continue;
    }

    sectionsByDate.set(dateKey, {
      id: `date-${dateKey}`,
      title: getDateSectionTitle(dateKey, referenceDateKey, tomorrowDateKey),
      showCount: 1,
      shows: [show]
    });
  }

  return Array.from(sectionsByDate.values());
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
