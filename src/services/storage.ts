import type { TicketOrder, UserPreferences } from "../types";

const ORDERS_KEY = "ticketsTonight.orders";
const PREFERENCES_KEY = "ticketsTonight.preferences";

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class MemoryStorageAdapter implements KeyValueStorage {
  private values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

export class BrowserStorageAdapter implements KeyValueStorage {
  async getItem(key: string): Promise<string | null> {
    return getBrowserStorage()?.getItem(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    const storage = getBrowserStorage();

    if (storage) {
      storage.setItem(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    getBrowserStorage()?.removeItem(key);
  }
}

export class AppRepository {
  constructor(private readonly storage: KeyValueStorage) {}

  async loadOrders(): Promise<TicketOrder[]> {
    return readJson<TicketOrder[]>(this.storage, ORDERS_KEY, []);
  }

  async saveOrders(orders: TicketOrder[]): Promise<void> {
    await this.storage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  async loadPreferences(): Promise<UserPreferences | null> {
    return readJson<UserPreferences | null>(this.storage, PREFERENCES_KEY, null);
  }

  async savePreferences(preferences: UserPreferences): Promise<void> {
    await this.storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.storage.removeItem(ORDERS_KEY),
      this.storage.removeItem(PREFERENCES_KEY)
    ]);
  }
}

async function readJson<T>(storage: KeyValueStorage, key: string, fallback: T): Promise<T> {
  const value = await storage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getBrowserStorage(): Storage | undefined {
  if (typeof globalThis === "undefined" || !("localStorage" in globalThis)) {
    return undefined;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export const appRepository = new AppRepository(
  getBrowserStorage() ? new BrowserStorageAdapter() : new MemoryStorageAdapter()
);
