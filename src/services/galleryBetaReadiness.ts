import type { GalleryAreaId, GalleryLogEntry } from "../types";
import {
  galleryVisitStatusLabels,
  galleryWalkModeLabels,
  getDaysUntilGalleryCloses,
  getGalleryInventoryTrust,
  type GalleryWalkMode,
  type GalleryWalkPlan
} from "./galleryDiscovery";
import type { GalleryWalkSession } from "./galleryWalkSession";

export type GalleryBetaTaskId =
  | "find-walk"
  | "taste-quiz"
  | "start-route"
  | "swap-stop"
  | "mark-visited"
  | "check-hudson"
  | "send-feedback";

export type GalleryBetaTask = {
  id: GalleryBetaTaskId;
  label: string;
  description: string;
  ctaLabel: string;
  completed: boolean;
};

export type GalleryBetaTaskProgress = {
  tasks: GalleryBetaTask[];
  completedTaskIds: GalleryBetaTaskId[];
  completedCount: number;
  totalCount: number;
  nextTask?: GalleryBetaTask;
  summaryLabel: string;
};

export type GalleryBetaFeedbackKind = "useful" | "confusing" | "broken" | "wish";

export type GalleryBetaFeedback = {
  id: string;
  kind: GalleryBetaFeedbackKind;
  note: string;
  areaId: GalleryAreaId;
  routeMode: GalleryWalkMode;
  neighborhood?: string;
  activeWalkStatus?: GalleryWalkSession["status"];
  currentStopLabel?: string;
  nextStopLabel?: string;
  verifiedCount: number;
  demoReviewCount: number;
  createdAt: string;
};

export type GalleryBetaFeedbackInput = Omit<GalleryBetaFeedback, "id" | "createdAt"> & {
  createdAt?: string;
};

export type GalleryPreviewReadinessSummary = {
  ready: boolean;
  score: number;
  label: string;
  blockers: string[];
  checks: string[];
};

export type GalleryPreviewReadinessInput = {
  nycVerifiedCount: number;
  hudsonVerifiedCount: number;
  hasDesktopScreenshot: boolean;
  hasMobileScreenshot: boolean;
  validationCommands: string[];
};

export type GalleryRouteTimingWarningKind =
  | "closed-stop"
  | "closing-soon"
  | "low-verified-supply"
  | "start-later"
  | "long-walk";

export type GalleryRouteTimingWarning = {
  id: string;
  kind: GalleryRouteTimingWarningKind;
  label: string;
  detail: string;
  severity: "info" | "warn" | "blocker";
};

export type GalleryRouteUsabilityReport = {
  confidence: "strong" | "usable" | "thin" | "needs-review";
  label: string;
  summary: string;
  openStopCount: number;
  verifiedStopCount: number;
  closedStopCount: number;
  closingSoonStopCount: number;
  timingRiskLabel: string;
  bestStartReason: string;
  warnings: GalleryRouteTimingWarning[];
};

export type GalleryRouteUsabilityInput = {
  walkPlan: GalleryWalkPlan;
  referenceNow: string;
};

export type GalleryBetaReviewReportInput = {
  feedback: GalleryBetaFeedback[];
  routeReport: GalleryRouteUsabilityReport;
  areaId: GalleryAreaId;
  routeMode: GalleryWalkMode;
  neighborhood?: string;
  activeWalkStatus?: GalleryWalkSession["status"];
  currentStopLabel?: string;
  nextStopLabel?: string;
  verifiedCount: number;
  demoReviewCount: number;
  previewUrl?: string;
  generatedAt?: string;
};

export type GalleryPersonalizationLearningInput = {
  logEntries: GalleryLogEntry[];
  tasteFeedback: Array<{ kind: string }>;
  completedWalks: GalleryWalkSession[];
  topSignalLabel?: string;
  nextRouteMode?: GalleryWalkMode;
};

export type GalleryPersonalizationLearningSummary = {
  label: string;
  detail: string;
  savedLikeVisitedCount: number;
  skippedOrLessCount: number;
  completedWalkCount: number;
  reasonChips: string[];
};

const betaTaskTemplates: Array<Omit<GalleryBetaTask, "completed">> = [
  {
    id: "find-walk",
    label: "Find a walk",
    description: "Start from the Tonight surface and let the app suggest a verified route.",
    ctaLabel: "Find walk"
  },
  {
    id: "taste-quiz",
    label: "Tune taste",
    description: "Answer the visual quiz so For You picks can react to personal signals.",
    ctaLabel: "Taste quiz"
  },
  {
    id: "start-route",
    label: "Start route",
    description: "Turn the suggested route into an active walk session.",
    ctaLabel: "Start"
  },
  {
    id: "swap-stop",
    label: "Swap a stop",
    description: "Replace one route stop with a nearby open verified candidate.",
    ctaLabel: "Swap"
  },
  {
    id: "mark-visited",
    label: "Mark visited",
    description: "Advance the active walk and confirm progress persists.",
    ctaLabel: "Visit"
  },
  {
    id: "check-hudson",
    label: "Check Hudson",
    description: "Confirm Warren Street stays honest as a smaller verified market.",
    ctaLabel: "Hudson"
  },
  {
    id: "send-feedback",
    label: "Send feedback",
    description: "Copy a local beta report with route and trust context.",
    ctaLabel: "Feedback"
  }
];

function uniqueBetaTaskIds(ids: string[] = []): GalleryBetaTaskId[] {
  const validIds = new Set(betaTaskTemplates.map((task) => task.id));

  return Array.from(
    new Set(ids.filter((id): id is GalleryBetaTaskId => validIds.has(id as GalleryBetaTaskId)))
  );
}

export function getGalleryBetaTasks(completedTaskIds: string[] = []): GalleryBetaTaskProgress {
  const completedIds = uniqueBetaTaskIds(completedTaskIds);
  const completedSet = new Set(completedIds);
  const tasks = betaTaskTemplates.map((task) => ({
    ...task,
    completed: completedSet.has(task.id)
  }));
  const nextTask = tasks.find((task) => !task.completed);

  return {
    tasks,
    completedTaskIds: completedIds,
    completedCount: completedIds.length,
    totalCount: tasks.length,
    nextTask,
    summaryLabel: nextTask
      ? `${completedIds.length}/${tasks.length} beta tasks`
      : "Beta checklist complete"
  };
}

export function completeGalleryBetaTask(
  completedTaskIds: string[],
  taskId: GalleryBetaTaskId
): GalleryBetaTaskId[] {
  return uniqueBetaTaskIds([...completedTaskIds, taskId]);
}

export function createGalleryBetaFeedback(
  input: GalleryBetaFeedbackInput,
  now = input.createdAt ?? new Date().toISOString()
): GalleryBetaFeedback {
  return {
    ...input,
    id: `gallery-beta-feedback-${now}-${input.kind}`,
    note: input.note.trim(),
    createdAt: now
  };
}

export function createGalleryBetaFeedbackReport(feedback: GalleryBetaFeedback[]): string {
  if (feedback.length === 0) {
    return "Walker beta feedback\n\nNo local feedback captured yet.";
  }

  return [
    "Walker beta feedback",
    "",
    ...feedback.map((entry, index) =>
      [
        `${index + 1}. ${entry.kind.toUpperCase()} - ${entry.areaId} - ${entry.routeMode}`,
        `   Neighborhood: ${entry.neighborhood ?? "All"}`,
        `   Active walk: ${entry.activeWalkStatus ?? "none"}`,
        `   Trust: ${entry.verifiedCount} verified, ${entry.demoReviewCount} demo/review`,
        `   Note: ${entry.note || "No note"}`,
        `   At: ${entry.createdAt}`
      ].join("\n")
    )
  ].join("\n");
}

export function getGalleryRouteTimingWarnings(
  walkPlan: GalleryWalkPlan,
  referenceNow: string
): GalleryRouteTimingWarning[] {
  const warnings: GalleryRouteTimingWarning[] = [];
  const closedStops = walkPlan.stops.filter((stop) => stop.status === "closed-today");
  const closingSoonStops = walkPlan.stops.filter(
    (stop) => getDaysUntilGalleryCloses(stop.exhibition, referenceNow) <= 3
  );
  const verifiedStops = walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isVerified
  );
  const startStop =
    walkPlan.stops.find((stop) => stop.exhibition.id === walkPlan.startStopId) ?? walkPlan.stops[0];

  if (closedStops.length > 0) {
    const firstClosedStop = closedStops[0];

    warnings.push({
      id: "closed-stop",
      kind: "closed-stop",
      label: "Closed stop risk",
      detail:
        closedStops.length === 1 && firstClosedStop
          ? `${firstClosedStop.exhibition.galleryName} is closed today. Swap it if possible.`
          : `${closedStops.length} stops are closed today. Use swap before starting.`,
      severity: verifiedStops.length >= 3 ? "warn" : "blocker"
    });
  }

  if (closingSoonStops.length > 0) {
    const firstClosingSoonStop = closingSoonStops[0];

    warnings.push({
      id: "closing-soon",
      kind: "closing-soon",
      label: "Closing soon",
      detail:
        closingSoonStops.length === 1 && firstClosingSoonStop
          ? `${firstClosingSoonStop.exhibition.galleryName} is in the last-chance window.`
          : `${closingSoonStops.length} stops are in the last-chance window.`,
      severity: "info"
    });
  }

  if (verifiedStops.length < 3) {
    warnings.push({
      id: "low-verified-supply",
      kind: "low-verified-supply",
      label: "Thin verified route",
      detail:
        verifiedStops.length === 0
          ? "No manually verified stops are available for this route yet."
          : `Only ${verifiedStops.length} manually verified stop${verifiedStops.length === 1 ? "" : "s"} found. The app should say this market is thin.`,
      severity: verifiedStops.length === 0 ? "blocker" : "warn"
    });
  }

  if (startStop && startStop.status !== "open-now") {
    warnings.push({
      id: "start-later",
      kind: "start-later",
      label: "Start later",
      detail: `${startStop.exhibition.galleryName} is ${galleryVisitStatusLabels[startStop.status].toLowerCase()}. Start at the next open stop if you are already out.`,
      severity: "info"
    });
  }

  if (walkPlan.totalMinutes > 135 || walkPlan.totalDistanceMiles > 3.2) {
    warnings.push({
      id: "long-walk",
      kind: "long-walk",
      label: "Long route",
      detail: `${walkPlan.totalMinutes} minutes and ${walkPlan.totalDistanceMiles.toFixed(1)} miles may be better as a transit-assisted route.`,
      severity: "warn"
    });
  }

  return warnings;
}

export function createGalleryRouteUsabilityReport(
  input: GalleryRouteUsabilityInput
): GalleryRouteUsabilityReport {
  const { walkPlan, referenceNow } = input;
  const warnings = getGalleryRouteTimingWarnings(walkPlan, referenceNow);
  const openStopCount = walkPlan.stops.filter((stop) => stop.status === "open-now").length;
  const closedStopCount = walkPlan.stops.filter((stop) => stop.status === "closed-today").length;
  const verifiedStopCount = walkPlan.stops.filter((stop) =>
    getGalleryInventoryTrust(stop.exhibition).isVerified
  ).length;
  const closingSoonStopCount = walkPlan.stops.filter(
    (stop) => getDaysUntilGalleryCloses(stop.exhibition, referenceNow) <= 3
  ).length;
  const blockerCount = warnings.filter((warning) => warning.severity === "blocker").length;
  const confidence =
    blockerCount > 0
      ? "needs-review"
      : verifiedStopCount >= 4 && closedStopCount === 0
        ? "strong"
        : verifiedStopCount >= 3 && closedStopCount <= 1
          ? "usable"
          : "thin";
  const startStop =
    walkPlan.stops.find((stop) => stop.exhibition.id === walkPlan.startStopId) ?? walkPlan.stops[0];
  const bestStartReason = startStop
    ? startStop.status === "open-now"
      ? `${startStop.exhibition.galleryName} is open now and closest to the route start.`
      : `${startStop.exhibition.galleryName} is the planned start, but timing needs a check.`
    : "No route stop is ready yet.";

  return {
    confidence,
    label:
      confidence === "strong"
        ? "Strong real-world route"
        : confidence === "usable"
          ? "Usable with timing checks"
          : confidence === "thin"
            ? "Thin verified route"
            : "Needs review before walking",
    summary:
      confidence === "strong"
        ? `${verifiedStopCount} verified stops, ${openStopCount} open now, no closed stops.`
        : confidence === "usable"
          ? `${verifiedStopCount} verified stops with ${warnings.length} timing note${warnings.length === 1 ? "" : "s"}.`
          : confidence === "thin"
            ? `Only ${verifiedStopCount} verified stop${verifiedStopCount === 1 ? "" : "s"} in this route.`
            : "The route has a blocker, usually closed stops or too little verified supply.",
    openStopCount,
    verifiedStopCount,
    closedStopCount,
    closingSoonStopCount,
    timingRiskLabel:
      warnings.length === 0
        ? "Low timing risk"
        : `${warnings.length} timing note${warnings.length === 1 ? "" : "s"}`,
    bestStartReason,
    warnings
  };
}

export function createGalleryBetaReviewReport(input: GalleryBetaReviewReportInput): string {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const routeModeLabel = galleryWalkModeLabels[input.routeMode];
  const feedbackLines =
    input.feedback.length === 0
      ? ["No tester notes captured yet."]
      : input.feedback.map(
          (entry, index) =>
            `${index + 1}. ${entry.kind.toUpperCase()} - ${entry.note || "No note"} (${entry.areaId}, ${entry.routeMode})`
        );

  return [
    "Walker beta review",
    "",
    `Generated: ${generatedAt}`,
    `Preview URL: ${input.previewUrl ?? "Local or Sites preview pending"}`,
    `Market: ${input.areaId.toUpperCase()}${input.neighborhood ? ` - ${input.neighborhood}` : ""}`,
    `Route mode: ${routeModeLabel}`,
    `Active walk: ${input.activeWalkStatus ?? "none"}`,
    `Current stop: ${input.currentStopLabel ?? "none"}`,
    `Next stop: ${input.nextStopLabel ?? "none"}`,
    `Trust: ${input.verifiedCount} verified, ${input.demoReviewCount} demo/review`,
    "",
    "Route usability",
    `${input.routeReport.label}: ${input.routeReport.summary}`,
    `Best start: ${input.routeReport.bestStartReason}`,
    input.routeReport.warnings.length > 0
      ? `Warnings: ${input.routeReport.warnings.map((warning) => warning.label).join(", ")}`
      : "Warnings: none",
    "",
    "Tester notes",
    ...feedbackLines
  ].join("\n");
}

export function getPersonalizationLearningSummary(
  input: GalleryPersonalizationLearningInput
): GalleryPersonalizationLearningSummary {
  const savedLikeVisitedCount =
    input.logEntries.filter((entry) => ["saved", "want-to-see", "visited"].includes(entry.status))
      .length +
    input.tasteFeedback.filter((feedback) => feedback.kind === "more-like-this").length;
  const skippedOrLessCount =
    input.logEntries.filter((entry) => entry.status === "skipped").length +
    input.tasteFeedback.filter((feedback) => feedback.kind === "less-like-this").length;
  const completedWalkCount = input.completedWalks.filter(
    (session) => session.status === "completed"
  ).length;
  const signalCopy = input.topSignalLabel ? ` Strongest signal: ${input.topSignalLabel}.` : "";
  const nextRouteCopy = input.nextRouteMode
    ? ` Next route can shift toward ${galleryWalkModeLabels[input.nextRouteMode]}.`
    : "";

  return {
    label:
      savedLikeVisitedCount + skippedOrLessCount + completedWalkCount > 0
        ? "For You is learning"
        : "For You needs a few taps",
    detail:
      savedLikeVisitedCount + skippedOrLessCount + completedWalkCount > 0
        ? `${savedLikeVisitedCount} positive signals and ${skippedOrLessCount} skip/less signals are tuning picks.${signalCopy}${nextRouteCopy}`
        : "Save, visit, skip, or tap More like this to update recommendations immediately.",
    savedLikeVisitedCount,
    skippedOrLessCount,
    completedWalkCount,
    reasonChips: [
      `${savedLikeVisitedCount} likes/saves/visits`,
      `${skippedOrLessCount} skips/less`,
      `${completedWalkCount} completed walks`
    ]
  };
}

export function createGalleryPreviewReadinessSummary(
  input: GalleryPreviewReadinessInput
): GalleryPreviewReadinessSummary {
  const blockers = [
    input.nycVerifiedCount >= 60 ? undefined : "NYC verified inventory is below 60.",
    input.hudsonVerifiedCount >= 5 ? undefined : "Hudson verified inventory is below 5.",
    input.hasDesktopScreenshot ? undefined : "Desktop PR screenshot is missing.",
    input.hasMobileScreenshot ? undefined : "Mobile PR screenshot is missing.",
    input.validationCommands.includes("npm run typecheck") ? undefined : "Typecheck command is missing.",
    input.validationCommands.includes("npm run test:services")
      ? undefined
      : "Service test command is missing.",
    input.validationCommands.includes("npm run audit:galleries")
      ? undefined
      : "Gallery audit command is missing."
  ].filter((blocker): blocker is string => Boolean(blocker));
  const checks = [
    `${input.nycVerifiedCount} NYC verified`,
    `${input.hudsonVerifiedCount} Hudson verified`,
    input.hasDesktopScreenshot ? "Desktop screenshot ready" : "Desktop screenshot missing",
    input.hasMobileScreenshot ? "Mobile screenshot ready" : "Mobile screenshot missing",
    `${input.validationCommands.length} validation commands listed`
  ];
  const score = Math.max(0, 100 - blockers.length * 14);

  return {
    ready: blockers.length === 0,
    score,
    label: blockers.length === 0 ? "Preview-ready" : "Preview needs review",
    blockers,
    checks
  };
}
