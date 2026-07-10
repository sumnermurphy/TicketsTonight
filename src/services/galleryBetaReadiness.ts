import type { GalleryAreaId } from "../types";
import type { GalleryWalkMode } from "./galleryDiscovery";
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
    return "Gallery beta feedback\n\nNo local feedback captured yet.";
  }

  return [
    "Gallery beta feedback",
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

export function createGalleryPreviewReadinessSummary(
  input: GalleryPreviewReadinessInput
): GalleryPreviewReadinessSummary {
  const blockers = [
    input.nycVerifiedCount >= 50 ? undefined : "NYC verified inventory is below 50.",
    input.hudsonVerifiedCount >= 2 ? undefined : "Hudson verified inventory is below 2.",
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
