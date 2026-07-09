import type { GalleryAreaId, GalleryLogEntry } from "../types";
import type { GalleryWalkMode, GalleryWalkPlan } from "./galleryDiscovery";

export type GalleryWalkStopProgress = "current" | "next" | "visited" | "skipped" | "planned";

export type GalleryWalkSessionAction =
  | "start"
  | "mark-visited"
  | "skip"
  | "advance"
  | "complete"
  | "resume";

export type GalleryWalkSession = {
  id: string;
  areaId: GalleryAreaId;
  mode: GalleryWalkMode;
  neighborhood?: string;
  orderedStopIds: string[];
  currentStopId?: string;
  visitedStopIds: string[];
  skippedStopIds: string[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  status: "active" | "completed";
};

export type GalleryWalkProgress = {
  currentStopId?: string;
  nextStopId?: string;
  remainingStopIds: string[];
  visitedStopIds: string[];
  skippedStopIds: string[];
  completedStopCount: number;
  totalStopCount: number;
  stopProgressById: Record<string, GalleryWalkStopProgress>;
};

export type GalleryWalkRecap = {
  status: GalleryWalkSession["status"];
  totalStopCount: number;
  visitedStopCount: number;
  skippedStopCount: number;
  remainingStopCount: number;
  notedStopCount: number;
  neighborhoods: string[];
  startedAt: string;
  completedAt?: string;
};

function uniqueIds(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function getOrderedStopIds(walkPlan: GalleryWalkPlan): string[] {
  return walkPlan.stops.map((stop) => stop.exhibition.id);
}

function getSessionOrder(session: GalleryWalkSession, walkPlan?: GalleryWalkPlan): string[] {
  const knownStopIds = walkPlan ? new Set(getOrderedStopIds(walkPlan)) : undefined;
  const orderedStopIds = session.orderedStopIds.filter(
    (stopId) => !knownStopIds || knownStopIds.has(stopId)
  );

  if (orderedStopIds.length > 0) {
    return orderedStopIds;
  }

  return walkPlan ? getOrderedStopIds(walkPlan) : session.orderedStopIds;
}

function getCompletedSet(session: GalleryWalkSession): Set<string> {
  return new Set([...session.visitedStopIds, ...session.skippedStopIds]);
}

function getNextOpenStopId(
  session: GalleryWalkSession,
  walkPlan: GalleryWalkPlan | undefined,
  afterStopId?: string
): string | undefined {
  const orderedStopIds = getSessionOrder(session, walkPlan);
  const completedSet = getCompletedSet(session);
  const startIndex = afterStopId ? orderedStopIds.indexOf(afterStopId) + 1 : 0;
  const orderedCandidates =
    startIndex > 0
      ? [...orderedStopIds.slice(startIndex), ...orderedStopIds.slice(0, startIndex)]
      : orderedStopIds;

  return orderedCandidates.find((stopId) => !completedSet.has(stopId));
}

function withUpdatedSession(session: GalleryWalkSession, now: string): GalleryWalkSession {
  const orderedStopIds = getSessionOrder(session);
  const completedSet = getCompletedSet(session);
  const allStopsComplete =
    orderedStopIds.length > 0 && orderedStopIds.every((stopId) => completedSet.has(stopId));

  if (allStopsComplete) {
    return {
      ...session,
      currentStopId: undefined,
      status: "completed",
      completedAt: session.completedAt ?? now,
      updatedAt: now
    };
  }

  return {
    ...session,
    currentStopId:
      session.currentStopId && !completedSet.has(session.currentStopId)
        ? session.currentStopId
        : getNextOpenStopId(session, undefined, session.currentStopId),
    status: "active",
    completedAt: undefined,
    updatedAt: now
  };
}

export function createGalleryWalkSession(walkPlan: GalleryWalkPlan, now: string): GalleryWalkSession {
  const orderedStopIds = getOrderedStopIds(walkPlan);

  return {
    id: `${walkPlan.areaId}-${walkPlan.mode}-${now}`,
    areaId: walkPlan.areaId,
    mode: walkPlan.mode,
    neighborhood: walkPlan.neighborhood,
    orderedStopIds,
    currentStopId: walkPlan.startStopId ?? orderedStopIds[0],
    visitedStopIds: [],
    skippedStopIds: [],
    startedAt: now,
    updatedAt: now,
    status: "active"
  };
}

export function getActiveWalkProgress(
  session: GalleryWalkSession,
  walkPlan?: GalleryWalkPlan
): GalleryWalkProgress {
  const orderedStopIds = getSessionOrder(session, walkPlan);
  const visitedStopIds = uniqueIds(session.visitedStopIds).filter((stopId) =>
    orderedStopIds.includes(stopId)
  );
  const skippedStopIds = uniqueIds(session.skippedStopIds).filter((stopId) =>
    orderedStopIds.includes(stopId)
  );
  const completedSet = new Set([...visitedStopIds, ...skippedStopIds]);
  const currentStopId =
    session.status === "active" && session.currentStopId && !completedSet.has(session.currentStopId)
      ? session.currentStopId
      : session.status === "active"
        ? orderedStopIds.find((stopId) => !completedSet.has(stopId))
        : undefined;
  const currentIndex = currentStopId ? orderedStopIds.indexOf(currentStopId) : -1;
  const remainingStopIds = orderedStopIds.filter((stopId) => !completedSet.has(stopId));
  const nextStopId =
    currentIndex >= 0
      ? orderedStopIds.slice(currentIndex + 1).find((stopId) => !completedSet.has(stopId))
      : undefined;
  const stopProgressById = orderedStopIds.reduce<Record<string, GalleryWalkStopProgress>>(
    (progress, stopId) => {
      if (visitedStopIds.includes(stopId)) {
        progress[stopId] = "visited";
      } else if (skippedStopIds.includes(stopId)) {
        progress[stopId] = "skipped";
      } else if (stopId === currentStopId) {
        progress[stopId] = "current";
      } else if (stopId === nextStopId) {
        progress[stopId] = "next";
      } else {
        progress[stopId] = "planned";
      }

      return progress;
    },
    {}
  );

  return {
    currentStopId,
    nextStopId,
    remainingStopIds,
    visitedStopIds,
    skippedStopIds,
    completedStopCount: completedSet.size,
    totalStopCount: orderedStopIds.length,
    stopProgressById
  };
}

export function markGalleryWalkStopVisited(
  session: GalleryWalkSession,
  stopId: string,
  now: string
): GalleryWalkSession {
  const visitedStopIds = uniqueIds([...session.visitedStopIds, stopId]);
  const skippedStopIds = session.skippedStopIds.filter((candidate) => candidate !== stopId);
  const nextStopId =
    session.currentStopId === stopId
      ? getNextOpenStopId({ ...session, visitedStopIds, skippedStopIds }, undefined, stopId)
      : session.currentStopId;

  return withUpdatedSession(
    {
      ...session,
      currentStopId: nextStopId,
      visitedStopIds,
      skippedStopIds
    },
    now
  );
}

export function skipGalleryWalkStop(
  session: GalleryWalkSession,
  stopId: string,
  now: string
): GalleryWalkSession {
  const skippedStopIds = uniqueIds([...session.skippedStopIds, stopId]);
  const visitedStopIds = session.visitedStopIds.filter((candidate) => candidate !== stopId);
  const nextStopId =
    session.currentStopId === stopId
      ? getNextOpenStopId({ ...session, visitedStopIds, skippedStopIds }, undefined, stopId)
      : session.currentStopId;

  return withUpdatedSession(
    {
      ...session,
      currentStopId: nextStopId,
      visitedStopIds,
      skippedStopIds
    },
    now
  );
}

export function advanceGalleryWalk(
  session: GalleryWalkSession,
  walkPlan: GalleryWalkPlan,
  now: string
): GalleryWalkSession {
  const progress = getActiveWalkProgress(session, walkPlan);

  if (!progress.currentStopId) {
    return completeGalleryWalk(session, now);
  }

  return markGalleryWalkStopVisited(session, progress.currentStopId, now);
}

export function completeGalleryWalk(session: GalleryWalkSession, now: string): GalleryWalkSession {
  return {
    ...session,
    currentStopId: undefined,
    status: "completed",
    completedAt: now,
    updatedAt: now
  };
}

export function getGalleryWalkRecap(
  session: GalleryWalkSession,
  walkPlan: GalleryWalkPlan,
  logEntries: GalleryLogEntry[]
): GalleryWalkRecap {
  const progress = getActiveWalkProgress(session, walkPlan);
  const orderedStopIds = getSessionOrder(session, walkPlan);
  const stopById = new Map(walkPlan.stops.map((stop) => [stop.exhibition.id, stop]));
  const logEntryById = new Map(logEntries.map((entry) => [entry.exhibitionId, entry]));
  const notedStopCount = orderedStopIds.filter((stopId) => {
    const entry = logEntryById.get(stopId);

    return Boolean(entry?.note?.trim());
  }).length;
  const neighborhoods = Array.from(
    new Set(
      orderedStopIds
        .map((stopId) => stopById.get(stopId)?.exhibition.neighborhood)
        .filter((neighborhood): neighborhood is string => Boolean(neighborhood))
    )
  );

  return {
    status: session.status,
    totalStopCount: progress.totalStopCount,
    visitedStopCount: progress.visitedStopIds.length,
    skippedStopCount: progress.skippedStopIds.length,
    remainingStopCount: progress.remainingStopIds.length,
    notedStopCount,
    neighborhoods,
    startedAt: session.startedAt,
    completedAt: session.completedAt
  };
}
