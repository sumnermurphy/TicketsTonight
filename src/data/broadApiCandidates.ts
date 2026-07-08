import type { ShowCategory } from "../types";

export type BroadApiCandidateStatus = "adapter-ready" | "research" | "deferred";

export type BroadApiCandidateRole =
  | "ticketed-baseline"
  | "community-events"
  | "price-inventory"
  | "coverage-gap-map"
  | "music-depth";

export type DiscountDiscoveryFit = "direct" | "indirect" | "limited";

export type BroadApiCandidate = {
  id: string;
  label: string;
  priority: number;
  status: BroadApiCandidateStatus;
  roles: BroadApiCandidateRole[];
  categories: ShowCategory[];
  marketIds: string[];
  discountDiscoveryFit: DiscountDiscoveryFit;
  strengths: string[];
  constraints: string[];
  nextStep: string;
};

const allDiscoveryCategories: ShowCategory[] = [
  "concert",
  "dj",
  "dance",
  "ballet",
  "opera",
  "play",
  "theater",
  "comedy",
  "variety"
];

export const broadApiCandidates: BroadApiCandidate[] = [
  {
    id: "ticketmaster-discovery",
    label: "Ticketmaster Discovery",
    priority: 1,
    status: "adapter-ready",
    roles: ["ticketed-baseline", "price-inventory"],
    categories: allDiscoveryCategories,
    marketIds: ["nyc", "la", "hudson"],
    discountDiscoveryFit: "direct",
    strengths: [
      "Existing adapter path in the repo",
      "City, date, venue, category, and ticket-link fields",
      "Useful baseline for ticketed events before local gap filling"
    ],
    constraints: [
      "Needs a public Expo API key at runtime",
      "Coverage can miss smaller local arts rooms and informal events"
    ],
    nextStep: "Run live NYC search with an API key and compare against fixture coverage."
  },
  {
    id: "eventbrite-marketplace",
    label: "Eventbrite",
    priority: 2,
    status: "research",
    roles: ["community-events", "ticketed-baseline"],
    categories: ["concert", "dj", "dance", "play", "theater", "comedy", "variety"],
    marketIds: ["nyc", "la", "hudson"],
    discountDiscoveryFit: "direct",
    strengths: [
      "Good fit for indie producers, comedy, nightlife, classes, and community-scale events",
      "Can add ticket links for events that never reach larger ticket marketplaces"
    ],
    constraints: [
      "API/search access and commercial terms need validation",
      "Taxonomy will need careful normalization to avoid noisy non-performance events"
    ],
    nextStep: "Validate event search access, ticket URL fields, and taxonomy quality in NYC."
  },
  {
    id: "seatgeek-platform",
    label: "SeatGeek",
    priority: 3,
    status: "research",
    roles: ["price-inventory", "ticketed-baseline"],
    categories: ["concert", "dj", "play", "theater", "comedy", "variety"],
    marketIds: ["nyc", "la"],
    discountDiscoveryFit: "direct",
    strengths: [
      "Marketplace-style supply can improve price comparison and ticket-link coverage",
      "Useful secondary validation source for NYC and LA"
    ],
    constraints: [
      "Commercial access and event-category depth need validation",
      "Likely weaker for Hudson and small performing arts venues"
    ],
    nextStep: "Prototype a read-only normalizer after partner/developer access is confirmed."
  },
  {
    id: "predicthq-events",
    label: "PredictHQ Events",
    priority: 4,
    status: "research",
    roles: ["coverage-gap-map"],
    categories: allDiscoveryCategories,
    marketIds: ["nyc", "la", "hudson"],
    discountDiscoveryFit: "indirect",
    strengths: [
      "Broad event visibility can reveal market/category gaps",
      "Good fit for deciding where local calendars or partner feeds are worth the effort"
    ],
    constraints: [
      "Better for event intelligence than consumer checkout",
      "Ticket-link and discount data should not be assumed"
    ],
    nextStep: "Use as a coverage audit source before building more local pipelines."
  },
  {
    id: "bandsintown-music",
    label: "Bandsintown",
    priority: 5,
    status: "research",
    roles: ["music-depth"],
    categories: ["concert", "dj"],
    marketIds: ["nyc", "la", "hudson"],
    discountDiscoveryFit: "limited",
    strengths: [
      "Focused live-music coverage can help concerts and DJ discovery",
      "Useful later for artist-follow and listening-history recommendations"
    ],
    constraints: [
      "Music-only source",
      "Commercial/API access and ticket-link depth need validation"
    ],
    nextStep: "Defer until the baseline event inventory and deal loops are stronger."
  }
];
