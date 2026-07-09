import type {
  GalleryAreaId,
  GalleryLogEntry,
  GalleryMedium
} from "../types";
import type { GalleryWalkMode } from "./galleryDiscovery";
import type { GalleryWalkSession } from "./galleryWalkSession";

export type GalleryPersistedLens = "all" | "open-now" | "opening-tonight" | "last-chance";

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
      value.walkMode === "last-chance"
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
      : undefined
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
