import type { EventProvider } from "../types";
import { CompositeEventProvider, LocalCatalogProvider, PartnerFeedProvider } from "./eventCatalog";
import {
  FetchTicketmasterDiscoveryClient,
  TicketmasterDiscoveryProvider,
  type TicketmasterDiscoveryClient
} from "./ticketmasterProvider";

type PublicDiscoveryEnv = {
  EXPO_PUBLIC_TICKETMASTER_API_KEY?: string;
  EXPO_PUBLIC_TICKETMASTER_DISCOVERY_ENDPOINT?: string;
  EXPO_PUBLIC_TICKETMASTER_RADIUS_MILES?: string;
};

declare const process:
  | {
      env?: PublicDiscoveryEnv;
    }
  | undefined;

export type DiscoveryProviderConfig = {
  ticketmasterApiKey?: string;
  ticketmasterEndpoint?: string;
  ticketmasterRadiusMiles?: number;
  ticketmasterClient?: TicketmasterDiscoveryClient;
  now?: () => Date;
};

export function readPublicDiscoveryConfig(): DiscoveryProviderConfig {
  if (typeof process === "undefined") {
    return {};
  }

  return {
    ticketmasterApiKey: process.env?.EXPO_PUBLIC_TICKETMASTER_API_KEY,
    ticketmasterEndpoint: process.env?.EXPO_PUBLIC_TICKETMASTER_DISCOVERY_ENDPOINT,
    ticketmasterRadiusMiles: parseOptionalNumber(
      process.env?.EXPO_PUBLIC_TICKETMASTER_RADIUS_MILES
    )
  };
}

export function createEventProviders(config: DiscoveryProviderConfig = {}): EventProvider[] {
  const providers: EventProvider[] = [new LocalCatalogProvider(), new PartnerFeedProvider()];
  const apiKey = config.ticketmasterApiKey?.trim();

  if (apiKey) {
    providers.push(
      new TicketmasterDiscoveryProvider({
        apiKey,
        client: config.ticketmasterClient ?? new FetchTicketmasterDiscoveryClient(),
        endpoint: config.ticketmasterEndpoint,
        radiusMiles: config.ticketmasterRadiusMiles,
        now: config.now
      })
    );
  }

  return providers;
}

export function createDefaultEventProvider(config: DiscoveryProviderConfig = {}): EventProvider {
  return new CompositeEventProvider(createEventProviders(config));
}

export const eventProvider = createDefaultEventProvider(readPublicDiscoveryConfig());

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}
