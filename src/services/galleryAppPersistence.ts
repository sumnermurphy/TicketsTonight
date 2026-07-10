import type {
  GalleryAreaId,
  GalleryLogEntry,
  GalleryMedium
} from "../types";
import type { GalleryWalkMode } from "./galleryDiscovery";
import type { GalleryBetaFeedback, GalleryBetaTaskId } from "./galleryBetaReadiness";
import type {
  GalleryPassportBadge,
  GalleryEditableTastePreference,
  GalleryQuizAnswer,
  GalleryTasteFeedback,
  GalleryTastePassport
} from "./galleryTastePassport";
import type { GalleryWalkSession } from "./galleryWalkSession";
import type { GallerySavedWalk } from "./galleryWalkSharing";

export type GalleryPersistedLens = "all" | "open-now" | "opening-tonight" | "last-chance";
export type GalleryFirstRunChoice = "find-walk" | "taste-quiz" | "resume-walk" | "dismissed";

export type GalleryAppPersistedState = {
  version: 1;
  selectedAreaId: GalleryAreaId;
  selectedNeighborhood?: string;
  selectedMedium?: GalleryMedium;
  activeLens: GalleryPersistedLens;
  verifiedOnly: boolean;
  walkMode: GalleryWalkMode;
  alertWindowDays: 3 | 7 | 14;
  logEntries: GalleryLogEntry[];
  savedAlertArtists: string[];
  savedAlertGalleries: string[];
  savedAlertNeighborhoods: string[];
  savedAlertMediums: GalleryMedium[];
  activeWalkSession?: GalleryWalkSession;
  quizAnswers: GalleryQuizAnswer[];
  tastePassport?: GalleryTastePassport;
  earnedBadges: GalleryPassportBadge[];
  completedQuestIds: string[];
  completedWalkSessions: GalleryWalkSession[];
  tasteFeedback: GalleryTasteFeedback[];
  tastePreferences?: GalleryEditableTastePreference;
  savedWalks: GallerySavedWalk[];
  firstRunChoice?: GalleryFirstRunChoice;
  firstRunCompleted: boolean;
  betaCompletedTaskIds: GalleryBetaTaskId[];
  betaFeedback: GalleryBetaFeedback[];
  betaChecklistDismissed: boolean;
};

export type GalleryStorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const galleryPersistenceKey = "ticketsTonight.galleryWalk.v1";
const memoryStore = new Map<string, string>();

const memoryStorage: GalleryStorageAdapter = {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: (key) => {
    memoryStore.delete(key);
  }
};

function getDefaultStorage(): GalleryStorageAdapter {
  const maybeLocalStorage = (globalThis as unknown as { localStorage?: GalleryStorageAdapter })
    .localStorage;

  return maybeLocalStorage ?? memoryStorage;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function sanitizeFirstRunChoice(value: unknown): GalleryFirstRunChoice | undefined {
  return value === "find-walk" ||
    value === "taste-quiz" ||
    value === "resume-walk" ||
    value === "dismissed"
    ? value
    : undefined;
}

function sanitizeState(value: unknown): GalleryAppPersistedState | undefined {
  if (!isObject(value) || value.version !== 1) {
    return undefined;
  }

  return {
    version: 1,
    selectedAreaId:
      value.selectedAreaId === "la" || value.selectedAreaId === "hudson" ? value.selectedAreaId : "nyc",
    selectedNeighborhood:
      typeof value.selectedNeighborhood === "string" ? value.selectedNeighborhood : undefined,
    selectedMedium:
      typeof value.selectedMedium === "string"
        ? (value.selectedMedium as GalleryMedium)
        : undefined,
    activeLens:
      value.activeLens === "open-now" ||
      value.activeLens === "opening-tonight" ||
      value.activeLens === "last-chance"
        ? value.activeLens
        : "all",
    verifiedOnly: value.verifiedOnly === true,
    walkMode:
      value.walkMode === "two-hour" ||
      value.walkMode === "opening-night" ||
      value.walkMode === "last-chance" ||
      value.walkMode === "for-you"
        ? value.walkMode
        : "quick-loop",
    alertWindowDays:
      value.alertWindowDays === 3 || value.alertWindowDays === 7 ? value.alertWindowDays : 14,
    logEntries: Array.isArray(value.logEntries) ? (value.logEntries as GalleryLogEntry[]) : [],
    savedAlertArtists: isStringArray(value.savedAlertArtists) ? value.savedAlertArtists : [],
    savedAlertGalleries: isStringArray(value.savedAlertGalleries) ? value.savedAlertGalleries : [],
    savedAlertNeighborhoods: isStringArray(value.savedAlertNeighborhoods)
      ? value.savedAlertNeighborhoods
      : [],
    savedAlertMediums: Array.isArray(value.savedAlertMediums)
      ? (value.savedAlertMediums as GalleryMedium[])
      : [],
    activeWalkSession: isObject(value.activeWalkSession)
      ? (value.activeWalkSession as GalleryWalkSession)
      : undefined,
    quizAnswers: Array.isArray(value.quizAnswers)
      ? (value.quizAnswers as GalleryQuizAnswer[])
      : [],
    tastePassport: isObject(value.tastePassport)
      ? (value.tastePassport as GalleryTastePassport)
      : undefined,
    earnedBadges: Array.isArray(value.earnedBadges)
      ? (value.earnedBadges as GalleryPassportBadge[])
      : [],
    completedQuestIds: isStringArray(value.completedQuestIds) ? value.completedQuestIds : [],
    completedWalkSessions: Array.isArray(value.completedWalkSessions)
      ? (value.completedWalkSessions as GalleryWalkSession[])
      : [],
    tasteFeedback: Array.isArray(value.tasteFeedback)
      ? (value.tasteFeedback as GalleryTasteFeedback[])
      : [],
    tastePreferences: isObject(value.tastePreferences)
      ? (value.tastePreferences as GalleryEditableTastePreference)
      : undefined,
    savedWalks: Array.isArray(value.savedWalks) ? (value.savedWalks as GallerySavedWalk[]) : [],
    firstRunChoice: sanitizeFirstRunChoice(value.firstRunChoice),
    firstRunCompleted: value.firstRunCompleted === true,
    betaCompletedTaskIds: isStringArray(value.betaCompletedTaskIds)
      ? (value.betaCompletedTaskIds as GalleryBetaTaskId[])
      : [],
    betaFeedback: Array.isArray(value.betaFeedback)
      ? (value.betaFeedback as GalleryBetaFeedback[])
      : [],
    betaChecklistDismissed: value.betaChecklistDismissed === true
  };
}

export function serializeGalleryAppPersistedState(state: GalleryAppPersistedState): string {
  return JSON.stringify(state);
}

export function deserializeGalleryAppPersistedState(
  value: string | null
): GalleryAppPersistedState | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return sanitizeState(JSON.parse(value));
  } catch {
    return undefined;
  }
}

export function readGalleryAppPersistedState(
  storage: GalleryStorageAdapter = getDefaultStorage(),
  key = galleryPersistenceKey
): GalleryAppPersistedState | undefined {
  try {
    return deserializeGalleryAppPersistedState(storage.getItem(key));
  } catch {
    return undefined;
  }
}

export function writeGalleryAppPersistedState(
  state: GalleryAppPersistedState,
  storage: GalleryStorageAdapter = getDefaultStorage(),
  key = galleryPersistenceKey
): void {
  try {
    storage.setItem(key, serializeGalleryAppPersistedState(state));
  } catch {
    memoryStorage.setItem(key, serializeGalleryAppPersistedState(state));
  }
}

export function clearGalleryAppPersistedState(
  storage: GalleryStorageAdapter = getDefaultStorage(),
  key = galleryPersistenceKey
): void {
  try {
    storage.removeItem(key);
  } catch {
    memoryStorage.removeItem(key);
  }
}
